-- Consolidated Migration for Phase 2 Rating System
-- Execute this in Supabase SQL Editor

-- Add rating fields to player_analytics
ALTER TABLE player_analytics
ADD COLUMN IF NOT EXISTS elo_rating INTEGER DEFAULT 1200,
ADD COLUMN IF NOT EXISTS is_rated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS global_rank INTEGER,
ADD COLUMN IF NOT EXISTS games_until_rated INTEGER DEFAULT 10;

-- Create rating_history table to track rating changes over time
CREATE TABLE IF NOT EXISTS rating_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    rating_before INTEGER NOT NULL,
    rating_after INTEGER NOT NULL,
    rating_change INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on rating_history
ALTER TABLE rating_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own rating history" ON rating_history;
DROP POLICY IF EXISTS "System can insert rating history" ON rating_history;

-- RLS Policy: Users can view their own rating history
CREATE POLICY "Users can view own rating history"
    ON rating_history FOR SELECT
    USING (auth.uid() = player_id);

-- RLS Policy: System can insert rating history (via service role)
CREATE POLICY "System can insert rating history"
    ON rating_history FOR INSERT
    WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rating_history_player ON rating_history(player_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rating_history_game ON rating_history(game_id);
CREATE INDEX IF NOT EXISTS idx_player_analytics_elo ON player_analytics(elo_rating DESC) WHERE is_rated = TRUE;

-- Function to update global ranks (called after rating updates)
CREATE OR REPLACE FUNCTION update_global_ranks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update global ranks based on ELO rating
    WITH ranked_players AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (ORDER BY elo_rating DESC) as rank
        FROM player_analytics
        WHERE is_rated = TRUE
    )
    UPDATE player_analytics pa
    SET global_rank = rp.rank
    FROM ranked_players rp
    WHERE pa.id = rp.id;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_ranks_after_analytics_change ON player_analytics;

-- Trigger to update global ranks after player_analytics changes
CREATE OR REPLACE FUNCTION trigger_update_global_ranks()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only update ranks if rating changed or is_rated changed
    IF (TG_OP = 'UPDATE' AND (OLD.elo_rating != NEW.elo_rating OR OLD.is_rated != NEW.is_rated))
       OR TG_OP = 'INSERT' THEN
        PERFORM update_global_ranks();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_ranks_after_analytics_change
AFTER INSERT OR UPDATE ON player_analytics
FOR EACH ROW
EXECUTE FUNCTION trigger_update_global_ranks();
