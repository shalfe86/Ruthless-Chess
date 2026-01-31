/**
 * Chess Move Analysis System
 * 
 * Analyzes chess games using Stockfish engine to calculate:
 * - Centipawn loss for each move
 * - Move classifications (brilliant, mistake, blunder, etc.)
 * - Overall game accuracy
 */

import { Chess } from 'chess.js';

import { getStockfishEngine } from './stockfish';

export interface MoveAnalysis {
    move: string;                    // Move in SAN format (e.g., "Nf3")
    moveNumber: number;              // Move number in the game
    fen: string;                     // Position before move
    evaluation_before: number;       // Centipawn eval before move
    evaluation_after: number;        // Centipawn eval after move
    centipawn_loss: number;          // CPL for this move
    best_move: string;               // Engine's best move in UCI format
    classification: MoveClassification;
    is_brilliant: boolean;
    is_mistake: boolean;
    is_blunder: boolean;
}

export const MoveClassification = {
    BRILLIANT: 'brilliant',
    GREAT: 'great',
    GOOD: 'good',
    INACCURACY: 'inaccuracy',
    MISTAKE: 'mistake',
    BLUNDER: 'blunder'
} as const;

export type MoveClassification = typeof MoveClassification[keyof typeof MoveClassification];

/**
 * Analyze a complete chess game
 * @param moves - Array of moves in SAN format
 * @param startingFen - Starting position (default: standard starting position)
 * @param onProgress - Progress callback (current move / total moves)
 * @returns Array of move analyses
 */
export async function analyzeGame(
    moves: string[],
    startingFen?: string,
    onProgress?: (current: number, total: number) => void
): Promise<MoveAnalysis[]> {
    const engine = getStockfishEngine();
    await engine.initialize();

    const chess = new Chess(startingFen);
    const analyses: MoveAnalysis[] = [];

    console.log(`🧠 Starting analysis of ${moves.length} moves...`);

    for (let i = 0; i < moves.length; i++) {
        const move = moves[i];
        const fenBefore = chess.fen();

        // Get engine evaluation before move
        const evalBefore = await engine.evaluatePosition(fenBefore, { depth: 15 });

        // Make the move
        const moveObj = chess.move(move);
        if (!moveObj) {
            console.error(`Invalid move: ${move} at position ${i + 1}`);
            continue;
        }

        const fenAfter = chess.fen();

        // Get engine evaluation after move
        const evalAfter = await engine.evaluatePosition(fenAfter, { depth: 15 });

        // Calculate centipawn loss
        const isWhiteMove = fenBefore.split(' ')[1] === 'w';
        const scoreBefore = isWhiteMove ? evalBefore.score : -evalBefore.score;
        const scoreAfter = isWhiteMove ? -evalAfter.score : evalAfter.score;

        // CPL is how much worse the position got
        const centipawnLoss = Math.max(0, scoreBefore - scoreAfter);

        // Classify the move
        const classification = classifyMove(centipawnLoss, scoreBefore, scoreAfter);

        // Create analysis object
        const analysis: MoveAnalysis = {
            move: moveObj.san,
            moveNumber: Math.floor(i / 2) + 1,
            fen: fenBefore,
            evaluation_before: evalBefore.score,
            evaluation_after: evalAfter.score,
            centipawn_loss: centipawnLoss,
            best_move: evalBefore.bestMove,
            classification,
            is_brilliant: classification === MoveClassification.BRILLIANT,
            is_mistake: classification === MoveClassification.MISTAKE,
            is_blunder: classification === MoveClassification.BLUNDER
        };

        analyses.push(analysis);

        // Report progress
        if (onProgress) {
            onProgress(i + 1, moves.length);
        }

        console.log(`🧠 Analyzed move ${i + 1}/${moves.length}: ${moveObj.san} (CPL: ${centipawnLoss}, ${classification})`);
    }

    console.log(`🧠 Analysis complete! Total moves: ${analyses.length}`);
    return analyses;
}

/**
 * Analyze a single move in real-time
 * @param moveSan - The move in SAN format
 * @param fenBefore - Position before the move
 * @param fenAfter - Position after the move
 * @returns Analysis result or null if engine not ready
 */
export async function analyzeSingleMove(
    moveSan: string,
    fenBefore: string,
    fenAfter: string
): Promise<MoveAnalysis | null> {
    try {
        const engine = getStockfishEngine();

        // Ensure engine is initialized (might already be running)
        // We use a small timeout to not block UI if it's busy

        // Get evaluation before (depth 12 is enough for fast live analysis)
        const evalBefore = await engine.evaluatePosition(fenBefore, { depth: 12 });

        // Get evaluation after
        const evalAfter = await engine.evaluatePosition(fenAfter, { depth: 12 });

        // Calculate centipawn loss
        const isWhiteMove = fenBefore.split(' ')[1] === 'w';
        const scoreBefore = isWhiteMove ? evalBefore.score : -evalBefore.score;
        const scoreAfter = isWhiteMove ? -evalAfter.score : evalAfter.score;

        const centipawnLoss = Math.max(0, scoreBefore - scoreAfter);
        const classification = classifyMove(centipawnLoss, scoreBefore, scoreAfter);

        return {
            move: moveSan,
            moveNumber: parseInt(fenBefore.split(' ')[5]) || 0, // Approximate
            fen: fenBefore,
            evaluation_before: evalBefore.score,
            evaluation_after: evalAfter.score,
            centipawn_loss: centipawnLoss,
            best_move: evalBefore.bestMove,
            classification,
            is_brilliant: classification === MoveClassification.BRILLIANT,
            is_mistake: classification === MoveClassification.MISTAKE,
            is_blunder: classification === MoveClassification.BLUNDER
        };
    } catch (error) {
        console.error("Error analyzing single move:", error);
        return null;
    }
}

/**
 * Classify a move based on centipawn loss and position evaluation
 * @param centipawnLoss - Centipawn loss for the move
 * @param evalBefore - Evaluation before move
 * @param evalAfter - Evaluation after move
 * @returns Move classification
 */
export function classifyMove(
    centipawnLoss: number,
    evalBefore: number,
    evalAfter: number
): MoveClassification {
    // Brilliant move: No loss AND significant improvement
    const improvement = evalAfter - evalBefore;
    if (centipawnLoss <= 0 && improvement > 100) {
        return MoveClassification.BRILLIANT;
    }

    // Great move: Very small loss
    if (centipawnLoss <= 10) {
        return MoveClassification.GREAT;
    }

    // Good move: Small loss
    if (centipawnLoss <= 25) {
        return MoveClassification.GOOD;
    }

    // Inaccuracy: Moderate loss
    if (centipawnLoss <= 100) {
        return MoveClassification.INACCURACY;
    }

    // Mistake: Significant loss
    if (centipawnLoss <= 300) {
        return MoveClassification.MISTAKE;
    }

    // Blunder: Major loss
    return MoveClassification.BLUNDER;
}

/**
 * Calculate overall accuracy from move analyses
 * Formula: accuracy = 100 - (average_centipawn_loss / 10)
 * Capped at 0-100% range
 * 
 * @param analyses - Array of move analyses
 * @returns Accuracy percentage (0-100)
 */
export function calculateAccuracy(analyses: MoveAnalysis[]): number {
    if (analyses.length === 0) return 0;

    // Calculate average centipawn loss
    const totalCPL = analyses.reduce((sum, analysis) => sum + analysis.centipawn_loss, 0);
    const avgCPL = totalCPL / analyses.length;

    // Convert to accuracy percentage
    // Lower CPL = higher accuracy
    const accuracy = 100 - (avgCPL / 10);

    // Cap at 0-100 range
    return Math.max(0, Math.min(100, Math.round(accuracy * 10) / 10));
}

/**
 * Calculate accuracy for a specific game phase
 * @param analyses - Array of move analyses
 * @param phase - 'opening' (moves 1-10), 'middlegame' (11-25), 'endgame' (26+)
 * @returns Accuracy percentage for that phase
 */
export function calculatePhaseAccuracy(
    analyses: MoveAnalysis[],
    phase: 'opening' | 'middlegame' | 'endgame'
): number {
    let phaseAnalyses: MoveAnalysis[];

    switch (phase) {
        case 'opening':
            phaseAnalyses = analyses.filter((_, i) => i < 20); // First 10 moves (20 half-moves)
            break;
        case 'middlegame':
            phaseAnalyses = analyses.filter((_, i) => i >= 20 && i < 50); // Moves 11-25
            break;
        case 'endgame':
            phaseAnalyses = analyses.filter((_, i) => i >= 50); // Move 26+
            break;
    }

    return calculateAccuracy(phaseAnalyses);
}

/**
 * Get statistics from move analyses
 * @param analyses - Array of move analyses
 * @returns Statistics object
 */
export function getAnalysisStats(analyses: MoveAnalysis[]) {
    return {
        total_moves: analyses.length,
        brilliant_moves: analyses.filter(a => a.is_brilliant).length,
        great_moves: analyses.filter(a => a.classification === MoveClassification.GREAT).length,
        good_moves: analyses.filter(a => a.classification === MoveClassification.GOOD).length,
        inaccuracies: analyses.filter(a => a.classification === MoveClassification.INACCURACY).length,
        mistakes: analyses.filter(a => a.is_mistake).length,
        blunders: analyses.filter(a => a.is_blunder).length,
        avg_centipawn_loss: analyses.reduce((sum, a) => sum + a.centipawn_loss, 0) / analyses.length,
        accuracy: calculateAccuracy(analyses),
        opening_accuracy: calculatePhaseAccuracy(analyses, 'opening'),
        middlegame_accuracy: calculatePhaseAccuracy(analyses, 'middlegame'),
        endgame_accuracy: calculatePhaseAccuracy(analyses, 'endgame')
    };
}
