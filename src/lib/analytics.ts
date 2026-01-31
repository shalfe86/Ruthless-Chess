// Analytics calculation and management functions
import { supabase } from './supabase';
import type {
    GameAnalytics,
    GameAnalyticsInsert,
    PlayerAnalytics,
    PlayerAnalyticsInsert,
    PlayerAnalyticsUpdate,
    Game
} from '../types/database';

/**
 * Calculate basic game analytics after a game completes
 * For now, this creates placeholder analytics - will be enhanced in Phase 3+
 */
export async function calculateGameAnalytics(gameId: string): Promise<GameAnalytics | null> {
    try {
        // Get the game details
        const { data: game, error: gameError } = await supabase
            .from('games')
            .select('*')
            .eq('id', gameId)
            .single();

        if (gameError || !game) {
            console.error('Error fetching game for analytics:', gameError);
            return null;
        }

        // Get all moves for this game
        const { data: moves, error: movesError } = await supabase
            .from('moves')
            .select('*')
            .eq('game_id', gameId)
            .order('move_number', { ascending: true });

        if (movesError) {
            console.error('Error fetching moves for analytics:', movesError);
            return null;
        }

        // Calculate basic analytics
        const playerMoves = moves?.filter(m => m.player_color === game.player_color) || [];
        const totalMoves = playerMoves.length;

        // Count time pressure moves (< 10 seconds remaining)
        const movesUnder10s = playerMoves.filter(m => m.time_remaining_ms < 10000).length;
        const movesUnder5s = playerMoves.filter(m => m.time_remaining_ms < 5000).length;

        // Determine if survived opening (made it past move 10)
        const survivedOpening = totalMoves >= 10;

        // Accuracy will be calculated by engine analysis
        // Start at 0 and will be updated when analyzeGameWithEngine completes
        const accuracy = 0;

        const analyticsData: GameAnalyticsInsert = {
            game_id: gameId,
            player_id: game.player_id,
            accuracy,
            brilliant_moves: 0,
            great_moves: 0,
            good_moves: 0,
            inaccuracies: 0,
            mistakes: 0,
            blunders: 0,
            avg_centipawn_loss: 0,
            max_advantage_gained: 0,
            max_advantage_lost: 0,
            opening_accuracy: 0,
            middlegame_accuracy: 0,
            endgame_accuracy: 0,
            moves_under_5s: movesUnder5s,
            moves_under_10s: movesUnder10s,
            time_pressure_mistakes: 0,
            survived_opening: survivedOpening,
            opening_mistakes: 0,
            rating_change: 0
        };

        // Insert game analytics
        const { data: analytics, error: insertError } = await supabase
            .from('game_analytics')
            .insert(analyticsData)
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting game analytics:', insertError);
            return null;
        }

        console.log('📊 Game analytics calculated:', analytics.id);
        return analytics;
    } catch (error) {
        console.error('Error calculating game analytics:', error);
        return null;
    }
}

/**
 * Update player analytics by aggregating all their games
 */
export async function updatePlayerAnalytics(playerId: string): Promise<PlayerAnalytics | null> {
    try {
        // Get all games for this player
        const { data: games, error: gamesError } = await supabase
            .from('games')
            .select('*')
            .eq('player_id', playerId)
            .not('ended_at', 'is', null); // Only completed games

        if (gamesError) {
            console.error('Error fetching games for player analytics:', gamesError);
            return null;
        }

        if (!games || games.length === 0) {
            // Initialize analytics for new player
            return await initializePlayerAnalytics(playerId);
        }

        // Calculate core stats
        const totalGames = games.length;
        const wins = games.filter(g => g.result === 'win').length;
        const losses = games.filter(g => g.result === 'loss').length;
        const draws = games.filter(g => g.result === 'draw').length;
        const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

        // Calculate average game duration
        const gamesWithDuration = games.filter(g => g.duration_seconds !== null);
        const avgGameDuration = gamesWithDuration.length > 0
            ? Math.floor(gamesWithDuration.reduce((sum, g) => sum + (g.duration_seconds || 0), 0) / gamesWithDuration.length)
            : 0;

        // Get game analytics for advanced metrics
        const { data: gameAnalytics } = await supabase
            .from('game_analytics')
            .select('*')
            .eq('player_id', playerId);

        const avgAccuracy = gameAnalytics && gameAnalytics.length > 0
            ? gameAnalytics.reduce((sum, ga) => sum + ga.accuracy, 0) / gameAnalytics.length
            : 0;

        const totalMistakes = gameAnalytics?.reduce((sum, ga) => sum + ga.mistakes, 0) || 0;
        const totalBlunders = gameAnalytics?.reduce((sum, ga) => sum + ga.blunders, 0) || 0;
        const totalBrilliant = gameAnalytics?.reduce((sum, ga) => sum + ga.brilliant_moves, 0) || 0;

        // Calculate advanced metrics from game analytics
        const conversionRate = wins > 0 ? (wins / totalGames) * 100 : 0;
        const openingSurvivalRate = gameAnalytics && gameAnalytics.length > 0
            ? (gameAnalytics.filter(ga => ga.survived_opening).length / gameAnalytics.length) * 100
            : 0;

        // Calculate average time per move from all games
        const totalMovesPlayed = games.reduce((sum, g) => sum + g.total_moves, 0);
        const totalTimeSpent = gamesWithDuration.reduce((sum, g) => sum + (g.duration_seconds || 0), 0);
        const avgTimePerMoveMs = totalMovesPlayed > 0 ? (totalTimeSpent * 1000) / totalMovesPlayed : 0;

        // Calculate PRESSURE RATING from time pressure situations
        // Based on moves made under time pressure (< 10 seconds)
        const totalTimePressureMoves = gameAnalytics?.reduce((sum, ga) => sum + ga.moves_under_10s, 0) || 0;
        const timePressureMistakes = gameAnalytics?.reduce((sum, ga) => sum + ga.time_pressure_mistakes, 0) || 0;

        // Pressure rating: How well you perform under time pressure
        // 100% = no mistakes under pressure, 0% = all time pressure moves are mistakes
        let pressureRating = 50; // Default
        if (totalTimePressureMoves > 0) {
            const timePressureAccuracy = ((totalTimePressureMoves - timePressureMistakes) / totalTimePressureMoves) * 100;
            pressureRating = Math.round(timePressureAccuracy);
        }

        // Calculate CLUTCH FACTOR from win rate and conversion rate
        // Clutch = ability to convert winning positions and close out games
        // Higher win rate + higher conversion rate = higher clutch factor
        const clutchFactor = Math.round((winRate + conversionRate) / 2);

        // Calculate MSI (Move Strength Index)
        const msiValue = avgAccuracy > 0 ? calculateMSI({
            avg_accuracy: avgAccuracy,
            conversion_rate: conversionRate,
            clutch_factor: clutchFactor,
            pressure_rating: pressureRating
        } as PlayerAnalytics) : 0;

        const analyticsUpdate: PlayerAnalyticsUpdate = {
            total_games: totalGames,
            wins,
            losses,
            draws,
            win_rate: Number(winRate.toFixed(2)),
            is_rated: totalGames >= 10,
            games_until_rated: Math.max(0, 10 - totalGames),
            avg_accuracy: Number(avgAccuracy.toFixed(2)),
            total_mistakes: totalMistakes,
            total_blunders: totalBlunders,
            total_brilliant_moves: totalBrilliant,
            avg_game_duration_seconds: avgGameDuration,
            msi_value: Number(msiValue.toFixed(2)),
            pressure_rating: pressureRating,
            conversion_rate: Number(conversionRate.toFixed(2)),
            punishment_rate: 0, // Will be calculated from opponent mistakes
            time_waste_avg: 0, // Will be calculated from optimal time usage
            opening_survival_rate: Number(openingSurvivalRate.toFixed(2)),
            clutch_factor: clutchFactor,
            avg_time_per_move_ms: Math.round(avgTimePerMoveMs)
        };

        // Upsert player analytics
        const { data: analytics, error: upsertError } = await supabase
            .from('player_analytics')
            .upsert({
                player_id: playerId,
                ...analyticsUpdate
            }, {
                onConflict: 'player_id'
            })
            .select()
            .single();

        if (upsertError) {
            console.error('Error upserting player analytics:', upsertError);
            return null;
        }

        console.log('📈 Player analytics updated:', analytics.id);
        return analytics;
    } catch (error) {
        console.error('Error updating player analytics:', error);
        return null;
    }
}

/**
 * Initialize player analytics for a new player
 */
export async function initializePlayerAnalytics(playerId: string): Promise<PlayerAnalytics | null> {
    try {
        const initialAnalytics: PlayerAnalyticsInsert = {
            player_id: playerId,
            total_games: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            win_rate: 0,
            elo_rating: 1200,
            is_rated: false,
            global_rank: null,
            games_until_rated: 10,
            msi_value: 0,
            pressure_rating: 0,
            conversion_rate: 0,
            punishment_rate: 0,
            time_waste_avg: 0,
            opening_survival_rate: 0,
            clutch_factor: 0,
            avg_accuracy: 0,
            total_mistakes: 0,
            total_blunders: 0,
            total_brilliant_moves: 0,
            avg_time_per_move_ms: 0,
            avg_game_duration_seconds: 0
        };

        const { data: analytics, error } = await supabase
            .from('player_analytics')
            .insert(initialAnalytics)
            .select()
            .single();

        if (error) {
            console.error('Error initializing player analytics:', error);
            return null;
        }

        console.log('🆕 Player analytics initialized:', analytics.id);
        return analytics;
    } catch (error) {
        console.error('Error initializing player analytics:', error);
        return null;
    }
}

/**
 * Get player analytics
 */
export async function getPlayerAnalytics(playerId: string): Promise<PlayerAnalytics | null> {
    try {
        const { data, error } = await supabase
            .from('player_analytics')
            .select('*')
            .eq('player_id', playerId)
            .single();

        if (error) {
            // If no analytics exist, initialize them
            if (error.code === 'PGRST116') {
                return await initializePlayerAnalytics(playerId);
            }
            console.error('Error fetching player analytics:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error getting player analytics:', error);
        return null;
    }
}

/**
 * Get recent games for a player
 */
export async function getRecentGames(playerId: string, limit: number = 10): Promise<Game[]> {
    try {
        const { data, error } = await supabase
            .from('games')
            .select('*')
            .eq('player_id', playerId)
            .not('ended_at', 'is', null)
            .order('ended_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching recent games:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error getting recent games:', error);
        return [];
    }
}

/**
 * Calculate new ELO rating after a game
 * Uses standard ELO formula with K-factor based on experience
 */
export function calculateEloRating(
    playerRating: number,
    opponentRating: number,
    result: 'win' | 'loss' | 'draw',
    gamesPlayed: number
): number {
    // K-factor: higher for new players, lower for experienced
    const kFactor = gamesPlayed < 30 ? 32 : 24;

    // Expected score based on rating difference
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));

    // Actual score
    const actualScore = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;

    // Calculate new rating
    const newRating = Math.round(playerRating + kFactor * (actualScore - expectedScore));

    return newRating;
}

/**
 * Update player's ELO rating after a game and record in rating history
 */
export async function updatePlayerRating(
    playerId: string,
    gameId: string,
    result: 'win' | 'loss' | 'draw'
): Promise<void> {
    try {
        // Get current player analytics
        const { data: analytics, error: analyticsError } = await supabase
            .from('player_analytics')
            .select('*')
            .eq('player_id', playerId)
            .single();

        if (analyticsError || !analytics) {
            console.error('Error fetching analytics for rating update:', analyticsError);
            return;
        }

        // For AI games, use a fixed opponent rating of 1200 (can be adjusted based on difficulty)
        const opponentRating = 1200;

        // Calculate new rating
        const oldRating = analytics.elo_rating;
        const newRating = calculateEloRating(oldRating, opponentRating, result, analytics.total_games);
        const ratingChange = newRating - oldRating;

        // Update player analytics with new rating
        const isRated = analytics.total_games >= 10;
        const gamesUntilRated = Math.max(0, 10 - analytics.total_games);

        await supabase
            .from('player_analytics')
            .update({
                elo_rating: newRating,
                is_rated: isRated,
                games_until_rated: gamesUntilRated
            })
            .eq('player_id', playerId);

        // Record in rating history
        await supabase
            .from('rating_history')
            .insert({
                player_id: playerId,
                game_id: gameId,
                rating_before: oldRating,
                rating_after: newRating,
                rating_change: ratingChange
            });

        console.log(`Rating updated: ${oldRating} → ${newRating} (${ratingChange > 0 ? '+' : ''}${ratingChange})`);
    } catch (error) {
        console.error('Error updating player rating:', error);
    }
}

/**
 * Get rating history for a player (for rating progression chart)
 */
export async function getRatingHistory(playerId: string): Promise<any[]> {
    try {
        const { data, error } = await supabase
            .from('rating_history')
            .select('*')
            .eq('player_id', playerId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching rating history:', error);
            return [];
        }

        // Format for chart: convert to { name, value } format
        return (data || []).map((entry, index) => ({
            name: `Game ${index + 1}`,
            value: entry.rating_after,
            change: entry.rating_change
        }));
    } catch (error) {
        console.error('Error getting rating history:', error);
        return [];
    }
}

/**
 * Calculate skill breakdown percentages from player analytics
 * 
 * New Model:
 * - Difficulty: Move quality (engine-calculated accuracy, brilliant moves, mistakes)
 * - Speed: Time management efficiency
 * - Pressure: Performance under time pressure and in critical positions
 * - Accuracy: Composite score = (difficulty × 0.5) + (speed × 0.3) + (pressure × 0.2)
 */
export function getSkillBreakdown(analytics: PlayerAnalytics | null): {
    difficulty: number;
    speed: number;
    pressure: number;
    accuracy: number;
} {
    if (!analytics) {
        return { difficulty: 0, speed: 0, pressure: 0, accuracy: 0 };
    }

    // 1. DIFFICULTY (50% weight) - Move Quality
    // Based on engine-calculated accuracy from Stockfish analysis
    // Factors: avg_accuracy, brilliant moves, mistakes, blunders
    const baseAccuracy = analytics.avg_accuracy || 0;

    // Bonus for brilliant moves (up to +10%)
    const brilliantBonus = Math.min(10, (analytics.total_brilliant_moves / Math.max(1, analytics.total_games)) * 2);

    // Penalty for mistakes and blunders (up to -20%)
    const mistakePenalty = Math.min(20,
        ((analytics.total_mistakes + analytics.total_blunders * 2) / Math.max(1, analytics.total_games)) * 2
    );

    const difficulty = Math.max(0, Math.min(100, baseAccuracy + brilliantBonus - mistakePenalty));

    // 2. SPEED (30% weight) - Time Management
    // Based on average time per move and time waste
    const avgTimePerMove = analytics.avg_time_per_move_ms / 1000; // Convert to seconds

    // Optimal time per move is around 5-15 seconds in a 25-second increment game
    // Too fast (< 3s) or too slow (> 20s) reduces score
    let speedScore = 100;

    if (avgTimePerMove < 3) {
        // Moving too fast - likely not thinking enough
        speedScore = 50 + (avgTimePerMove / 3) * 50;
    } else if (avgTimePerMove > 20) {
        // Moving too slow - time management issues
        speedScore = Math.max(0, 100 - ((avgTimePerMove - 20) * 5));
    } else if (avgTimePerMove >= 3 && avgTimePerMove <= 15) {
        // Optimal range - full score
        speedScore = 100;
    } else {
        // Between 15-20s - slight penalty
        speedScore = 100 - ((avgTimePerMove - 15) * 2);
    }

    const speed = Math.max(0, Math.min(100, Math.round(speedScore)));

    // 3. PRESSURE (20% weight) - Clutch Performance
    // Based on clutch_factor and pressure_rating from analytics
    // These will be calculated from time-pressure situations and critical positions
    const clutchScore = analytics.clutch_factor || 50;
    const pressureRating = analytics.pressure_rating || 50;

    const pressure = Math.round((clutchScore + pressureRating) / 2);

    // 4. ACCURACY - Composite Score
    // Weighted combination of all three components
    const accuracy = Math.round(
        (difficulty * 0.5) +
        (speed * 0.3) +
        (pressure * 0.2)
    );

    return {
        difficulty: Math.round(difficulty),
        speed,
        pressure,
        accuracy
    };
}


/**
 * Analyze a game with Stockfish engine and update move-level analysis
 * This runs asynchronously after game completion
 */
export async function analyzeGameWithEngine(gameId: string): Promise<void> {
    try {
        console.log(`🧠 Starting engine analysis for game ${gameId}...`);

        // Update game status to 'analyzing'
        await supabase
            .from('games')
            .update({ analysis_status: 'analyzing' })
            .eq('id', gameId);

        // Get game and moves
        const { data: game, error: gameError } = await supabase
            .from('games')
            .select('*')
            .eq('id', gameId)
            .single();

        if (gameError || !game) {
            throw new Error('Game not found');
        }

        const { data: moves, error: movesError } = await supabase
            .from('moves')
            .select('*')
            .eq('game_id', gameId)
            .order('move_number', { ascending: true });

        if (movesError || !moves) {
            throw new Error('Moves not found');
        }

        // Import analysis functions
        const { analyzeGame } = await import('./moveAnalysis');
        const { detectOpening } = await import('./openings');

        // Get player moves only
        const playerMoves = moves.filter(m => m.player_color === game.player_color);
        const moveSANs = playerMoves.map(m => m.move_san);

        // Analyze the game with Stockfish
        const analyses = await analyzeGame(moveSANs, undefined, (current, total) => {
            console.log(`🧠 Analyzing move ${current}/${total}...`);
        });

        // Update each move with analysis results
        for (let i = 0; i < analyses.length; i++) {
            const analysis = analyses[i];
            const move = playerMoves[i];

            await supabase
                .from('moves')
                .update({
                    evaluation_before: analysis.evaluation_before,
                    evaluation_after: analysis.evaluation_after,
                    centipawn_loss: analysis.centipawn_loss,
                    best_move: analysis.best_move,
                    classification: analysis.classification,
                    is_brilliant: analysis.is_brilliant,
                    is_mistake: analysis.is_mistake,
                    is_blunder: analysis.is_blunder
                })
                .eq('id', move.id);
        }

        // Detect opening
        const opening = detectOpening(moveSANs);
        if (opening) {
            await supabase
                .from('games')
                .update({
                    opening_eco: opening.eco,
                    opening_name: opening.name,
                    opening_variation: opening.variation
                })
                .eq('id', gameId);
        }

        // Update game analytics with engine results
        await updateGameAnalyticsWithEngine(gameId, analyses);

        // Mark analysis as complete
        await supabase
            .from('games')
            .update({
                analysis_status: 'completed',
                analysis_completed_at: new Date().toISOString()
            })
            .eq('id', gameId);

        console.log(`🧠 Engine analysis complete for game ${gameId}`);
    } catch (error) {
        console.error('Error analyzing game with engine:', error);

        // Mark analysis as failed
        await supabase
            .from('games')
            .update({ analysis_status: 'failed' })
            .eq('id', gameId);
    }
}

/**
 * Update game analytics with engine analysis results
 */
export async function updateGameAnalyticsWithEngine(gameId: string, analyses: any[]): Promise<void> {
    try {
        const { getAnalysisStats } = await import('./moveAnalysis');

        // Get statistics from analyses
        const stats = getAnalysisStats(analyses);

        // Update game analytics
        await supabase
            .from('game_analytics')
            .update({
                accuracy: stats.accuracy,
                brilliant_moves: stats.brilliant_moves,
                great_moves: stats.great_moves,
                good_moves: stats.good_moves,
                inaccuracies: stats.inaccuracies,
                mistakes: stats.mistakes,
                blunders: stats.blunders,
                avg_centipawn_loss: stats.avg_centipawn_loss,
                opening_accuracy: stats.opening_accuracy,
                middlegame_accuracy: stats.middlegame_accuracy,
                endgame_accuracy: stats.endgame_accuracy
            })
            .eq('game_id', gameId);

        console.log(`📊 Game analytics updated with engine results for game ${gameId}`);
    } catch (error) {
        console.error('Error updating game analytics with engine:', error);
    }
}

/**
 * Calculate MSI (Move Strength Index) from player analytics
 * Formula: (accuracy × 0.4) + (conversion_rate × 0.3) + (clutch_factor × 0.2) + (opening_accuracy × 0.1)
 */
export function calculateMSI(analytics: PlayerAnalytics): number {
    const accuracy = analytics.avg_accuracy || 0;
    const conversionRate = analytics.conversion_rate || 0;
    const clutchFactor = analytics.clutch_factor || 0;

    // Get average opening accuracy from recent games
    // For now, use avg_accuracy as a proxy
    const openingAccuracy = analytics.avg_accuracy || 0;

    const msi = (accuracy * 0.4) + (conversionRate * 0.3) + (clutchFactor * 0.2) + (openingAccuracy * 0.1);

    return Number(msi.toFixed(2));
}
