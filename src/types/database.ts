// Database types for Ruthless Chess
// Auto-generated from Supabase schema

export interface Game {
    id: string;
    player_id: string;
    opponent_type: 'ai' | 'human' | 'guest';
    opponent_id: string | null;
    ai_difficulty: number | null;
    ai_engine_version: string | null;

    // Game Configuration
    time_control_initial: number;
    time_control_increment: number;
    player_color: 'white' | 'black';

    // Game Outcome
    result: 'win' | 'loss' | 'draw';
    result_reason: 'checkmate' | 'timeout' | 'resignation' | 'stalemate' | 'insufficient_material' | 'draw_agreement' | null;
    winner_color: 'white' | 'black' | null;

    // Game Metadata
    total_moves: number;
    duration_seconds: number | null;
    final_fen: string | null;
    pgn: string | null;

    // Analysis Status
    analysis_status: 'pending' | 'analyzing' | 'completed' | 'failed';
    analysis_completed_at: string | null;

    // Opening Detection
    opening_eco: string | null;
    opening_name: string | null;
    opening_variation: string | null;

    // Timestamps
    started_at: string;
    ended_at: string | null;
    created_at: string;
}

export interface Move {
    id: string;
    game_id: string;

    // Move Details
    move_number: number;
    player_color: 'white' | 'black';
    move_san: string;
    move_uci: string;

    // Position State
    fen_before: string;
    fen_after: string;

    // Time Management
    time_spent_ms: number;
    time_remaining_ms: number;

    // Move Quality (Engine Analysis)
    evaluation_before: number | null;
    evaluation_after: number | null;
    centipawn_loss: number | null;
    best_move: string | null;
    classification: 'brilliant' | 'great' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | null;
    is_brilliant: boolean;
    is_mistake: boolean;
    is_blunder: boolean;

    // Move Flags
    is_check: boolean;
    is_checkmate: boolean;
    is_capture: boolean;
    is_castling: boolean;
    is_promotion: boolean;
    is_en_passant: boolean;

    // Timestamps
    created_at: string;
}

export interface PlayerPreferences {
    player_id: string;

    // Board & Pieces
    board_theme: 'classic' | 'modern' | 'wood' | 'marble' | 'neon';
    piece_set: 'standard' | 'modern' | 'classic' | 'neo';

    // Gameplay
    auto_queen_promotion: boolean;
    show_legal_moves: boolean;
    show_coordinates: boolean;
    move_confirmation: boolean;

    // Audio & Visual
    sound_enabled: boolean;
    sound_volume: number;
    animations_enabled: boolean;

    // Notifications
    email_notifications: boolean;
    achievement_notifications: boolean;
    challenge_notifications: boolean;

    // Timestamps
    updated_at: string;
    created_at: string;
}

export interface PlayerAnalytics {
    id: string;
    player_id: string;

    // Core Stats
    total_games: number;
    wins: number;
    losses: number;
    draws: number;
    win_rate: number;

    // Rating System
    elo_rating: number;
    is_rated: boolean;
    global_rank: number | null;
    games_until_rated: number;

    // Advanced Metrics
    msi_value: number;
    pressure_rating: number;
    conversion_rate: number;
    punishment_rate: number;
    time_waste_avg: number;
    opening_survival_rate: number;
    clutch_factor: number;

    // Move Quality Stats
    avg_accuracy: number;
    total_mistakes: number;
    total_blunders: number;
    total_brilliant_moves: number;

    // Time Management
    avg_time_per_move_ms: number;
    avg_game_duration_seconds: number;

    // Timestamps
    updated_at: string;
    created_at: string;
}

export interface GameAnalytics {
    id: string;
    game_id: string;
    player_id: string;

    // Move Quality
    accuracy: number;
    brilliant_moves: number;
    great_moves: number;
    good_moves: number;
    inaccuracies: number;
    mistakes: number;
    blunders: number;

    // Positional Analysis
    avg_centipawn_loss: number;
    max_advantage_gained: number;
    max_advantage_lost: number;

    // Phase-Based Accuracy
    opening_accuracy: number;
    middlegame_accuracy: number;
    endgame_accuracy: number;

    // Time Pressure
    moves_under_5s: number;
    moves_under_10s: number;
    time_pressure_mistakes: number;

    // Opening Performance
    survived_opening: boolean;
    opening_mistakes: number;

    // Rating Impact
    rating_change: number;

    // Timestamps
    created_at: string;
}

export interface RatingHistory {
    id: string;
    player_id: string;
    game_id: string;
    rating_before: number;
    rating_after: number;
    rating_change: number;
    created_at: string;
}

// Insert types (omit auto-generated fields)
export type GameInsert = Omit<Game, 'id' | 'created_at'> & {
    id?: string;
    created_at?: string;
};

export type MoveInsert = Omit<Move, 'id' | 'created_at'> & {
    id?: string;
    created_at?: string;
};

export type PlayerPreferencesInsert = Omit<PlayerPreferences, 'created_at' | 'updated_at'> & {
    created_at?: string;
    updated_at?: string;
};

export type PlayerAnalyticsInsert = Omit<PlayerAnalytics, 'id' | 'created_at' | 'updated_at'> & {
    id?: string;
    created_at?: string;
    updated_at?: string;
};

export type GameAnalyticsInsert = Omit<GameAnalytics, 'id' | 'created_at'> & {
    id?: string;
    created_at?: string;
};

export type RatingHistoryInsert = Omit<RatingHistory, 'id' | 'created_at'> & {
    id?: string;
    created_at?: string;
};

// Update types (all fields optional except ID)
export type GameUpdate = Partial<Omit<Game, 'id' | 'created_at'>>;
export type MoveUpdate = Partial<Omit<Move, 'id' | 'created_at'>>;
export type PlayerPreferencesUpdate = Partial<Omit<PlayerPreferences, 'player_id' | 'created_at'>>;
export type PlayerAnalyticsUpdate = Partial<Omit<PlayerAnalytics, 'id' | 'player_id' | 'created_at'>>;
export type GameAnalyticsUpdate = Partial<Omit<GameAnalytics, 'id' | 'game_id' | 'player_id' | 'created_at'>>;
