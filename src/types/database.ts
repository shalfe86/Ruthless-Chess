// Database types for Ruthless Chess Phase 4 (Frictionless / Sessions)

export interface UserSession {
    id: string;
    username: string;
    wins: number;
    losses: number;
    draws: number;
    started_at: string;
    ended_at: string;
}

export interface Game {
    id: string;
    session_id: string | null;
    username: string;
    difficulty: string;
    status: 'active' | 'completed';
    result: 'win' | 'loss' | 'draw' | null;
    created_at: string;
    ended_at: string | null;
}

export interface PlatformStats {
    games_today: number;
    active_games: number;
    username_percentage: number;
    unique_visitors_today: number;
    avg_time_seconds: number;
}

export interface SiteVisit {
    id: string;
    visitor_id: string;
    started_at: string;
    last_active_at: string;
}

// Insert types
export type UserSessionInsert = Omit<UserSession, 'id' | 'wins' | 'losses' | 'draws' | 'started_at' | 'ended_at'> & {
    id?: string;
    wins?: number;
    losses?: number;
    draws?: number;
    started_at?: string;
    ended_at?: string;
};

export type GameInsert = Omit<Game, 'id' | 'created_at' | 'ended_at'> & {
    id?: string;
    created_at?: string;
    ended_at?: string | null;
};

export type GameUpdate = Partial<Omit<Game, 'id' | 'created_at'>>;

export type UserSessionUpdate = Partial<Omit<UserSession, 'id' | 'started_at'>>;

export type SiteVisitInsert = Omit<SiteVisit, 'id' | 'started_at' | 'last_active_at'> & {
    id?: string;
    started_at?: string;
    last_active_at?: string;
};

export type SiteVisitUpdate = Partial<Omit<SiteVisit, 'id' | 'visitor_id' | 'started_at'>>;
