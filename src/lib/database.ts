import { supabase } from './supabase';
import type { UserSession, UserSessionInsert, UserSessionUpdate, Game, GameInsert, GameUpdate, PlatformStats, SiteVisit, SiteVisitInsert, SiteVisitUpdate } from '../types/database';

/**
 * Creates a new user session.
 */
export async function createSession(session: UserSessionInsert): Promise<UserSession | null> {
    try {
        const { data, error } = await supabase
            .from('user_sessions')
            .insert(session)
            .select()
            .single();

        if (error) {
            console.error('Error creating session:', error);
            return null;
        }

        return data;
    } catch (e) {
        console.error('Failed to create session:', e);
        return null;
    }
}

/**
 * Updates an existing user session (wins, losses, draws).
 */
export async function updateSession(sessionId: string, updates: UserSessionUpdate): Promise<UserSession | null> {
    try {
        const { data, error } = await supabase
            .from('user_sessions')
            .update({ ...updates, ended_at: new Date().toISOString() })
            .eq('id', sessionId)
            .select()
            .single();

        if (error) {
            console.error('Error updating session:', error);
            return null;
        }

        return data;
    } catch (e) {
        console.error('Failed to update session:', e);
        return null;
    }
}

/**
 * Retrieves a user session by ID.
 */
export async function getSession(sessionId: string): Promise<UserSession | null> {
    try {
        const { data, error } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (error) {
            console.error('Error fetching session:', error);
            return null;
        }

        return data;
    } catch (e) {
        console.error('Failed to fetch session:', e);
        return null;
    }
}

/**
 * Creates a new game.
 */
export async function createGame(game: GameInsert): Promise<Game | null> {
    try {
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
    } catch (e) {
        console.error('Failed to create game:', e);
        return null;
    }
}

/**
 * Updates an existing game.
 */
export async function updateGame(gameId: string, updates: GameUpdate): Promise<Game | null> {
    try {
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
    } catch (e) {
        console.error('Failed to update game:', e);
        return null;
    }
}

/**
 * Fetches the platform aggregate stats from the view.
 */
export async function getPlatformStats(): Promise<PlatformStats | null> {
    try {
        const { data, error } = await supabase
            .from('platform_stats')
            .select('*')
            .single();

        if (error) {
            console.error('Error fetching platform stats:', error);
            return null;
        }

        return data as PlatformStats;
    } catch (e) {
        console.error('Failed to fetch platform stats:', e);
        return null;
    }
}
/**
 * Creates a new site visit.
 */
export async function createVisit(visit: SiteVisitInsert): Promise<SiteVisit | null> {
    try {
        const { data, error } = await supabase
            .from('site_visits')
            .insert(visit)
            .select()
            .single();

        if (error) {
            console.error('Error creating visit:', error);
            return null;
        }

        return data;
    } catch (e) {
        console.error('Failed to create visit:', e);
        return null;
    }
}

/**
 * Updates an existing site visit.
 */
export async function updateVisit(visitId: string, updates: SiteVisitUpdate): Promise<SiteVisit | null> {
    try {
        const { data, error } = await supabase
            .from('site_visits')
            .update(updates)
            .eq('id', visitId)
            .select()
            .single();

        if (error) {
            console.error('Error updating visit:', error);
            return null;
        }

        return data;
    } catch (e) {
        console.error('Failed to update visit:', e);
        return null;
    }
}
