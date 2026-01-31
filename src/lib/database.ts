// Database helper functions for Ruthless Chess
import { supabase } from './supabase';
import type { Game, GameInsert, GameUpdate, Move, MoveInsert, PlayerPreferences, PlayerPreferencesUpdate } from '../types/database';

// ==================== GAMES ====================

export async function createGame(game: GameInsert): Promise<Game | null> {
    const { data, error } = await supabase
        .from('games')
        .insert(game)
        .select()
        .single();

    if (error) {
        console.error('Error creating game:', error);
        return null;
    }

    return data;
}

export async function updateGame(gameId: string, updates: GameUpdate): Promise<Game | null> {
    const { data, error } = await supabase
        .from('games')
        .update(updates)
        .eq('id', gameId)
        .select()
        .single();

    if (error) {
        console.error('Error updating game:', error);
        return null;
    }

    return data;
}

export async function getGame(gameId: string): Promise<Game | null> {
    const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

    if (error) {
        console.error('Error fetching game:', error);
        return null;
    }

    return data;
}

export async function getPlayerGames(playerId: string, limit = 10): Promise<Game[]> {
    const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching player games:', error);
        return [];
    }

    return data || [];
}

// ==================== MOVES ====================

export async function createMove(move: MoveInsert): Promise<Move | null> {
    const { data, error } = await supabase
        .from('moves')
        .insert(move)
        .select()
        .single();

    if (error) {
        console.error('Error creating move:', error);
        return null;
    }

    return data;
}

export async function getGameMoves(gameId: string): Promise<Move[]> {
    const { data, error } = await supabase
        .from('moves')
        .select('*')
        .eq('game_id', gameId)
        .order('move_number', { ascending: true });

    if (error) {
        console.error('Error fetching game moves:', error);
        return [];
    }

    return data || [];
}

export async function updateMove(moveId: string, updates: Partial<Move>): Promise<Move | null> {
    const { data, error } = await supabase
        .from('moves')
        .update(updates)
        .eq('id', moveId)
        .select()
        .single();

    if (error) {
        console.error('Error updating move:', error);
        return null;
    }

    return data;
}

// ==================== PLAYER PREFERENCES ====================

export async function getPlayerPreferences(playerId: string): Promise<PlayerPreferences | null> {
    const { data, error } = await supabase
        .from('player_preferences')
        .select('*')
        .eq('player_id', playerId)
        .single();

    if (error) {
        // If no preferences exist, return default values
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error('Error fetching player preferences:', error);
        return null;
    }

    return data;
}

export async function upsertPlayerPreferences(preferences: PlayerPreferencesUpdate & { player_id: string }): Promise<PlayerPreferences | null> {
    const { data, error } = await supabase
        .from('player_preferences')
        .upsert(preferences)
        .select()
        .single();

    if (error) {
        console.error('Error upserting player preferences:', error);
        return null;
    }

    return data;
}

export async function updatePlayerPreferences(playerId: string, updates: PlayerPreferencesUpdate): Promise<PlayerPreferences | null> {
    const { data, error } = await supabase
        .from('player_preferences')
        .update(updates)
        .eq('player_id', playerId)
        .select()
        .single();

    if (error) {
        console.error('Error updating player preferences:', error);
        return null;
    }

    return data;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Calculate game duration from start and end times
 */
export function calculateGameDuration(startedAt: string, endedAt: string): number {
    const start = new Date(startedAt).getTime();
    const end = new Date(endedAt).getTime();
    return Math.floor((end - start) / 1000); // Return seconds
}

/**
 * Convert chess.js move to database move format
 */
export function formatMoveForDatabase(
    gameId: string,
    moveNumber: number,
    move: any, // chess.js move object
    fenBefore: string,
    fenAfter: string,
    timeSpentMs: number,
    timeRemainingMs: number
): MoveInsert {
    return {
        game_id: gameId,
        move_number: moveNumber,
        player_color: move.color === 'w' ? 'white' : 'black',
        move_san: move.san,
        move_uci: `${move.from}${move.to}${move.promotion || ''}`,
        fen_before: fenBefore,
        fen_after: fenAfter,
        time_spent_ms: timeSpentMs,
        time_remaining_ms: timeRemainingMs,
        is_check: move.san.includes('+'),
        is_checkmate: move.san.includes('#'),
        is_capture: move.captured !== undefined,
        is_castling: move.flags.includes('k') || move.flags.includes('q'),
        is_promotion: move.promotion !== undefined,
        is_en_passant: move.flags.includes('e'),
        evaluation_before: null,
        evaluation_after: null,
        centipawn_loss: null,
        best_move: null,
        classification: null,
        is_brilliant: false,
        is_mistake: false,
        is_blunder: false
    };
}
