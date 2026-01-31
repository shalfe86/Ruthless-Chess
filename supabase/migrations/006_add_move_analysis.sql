-- Migration 006: Add Move Analysis and Engine Metrics
-- This migration adds fields for storing Stockfish engine analysis results

-- Add move-level analysis fields to moves table
ALTER TABLE moves
ADD COLUMN IF NOT EXISTS evaluation_before INTEGER,
ADD COLUMN IF NOT EXISTS evaluation_after INTEGER,
ADD COLUMN IF NOT EXISTS centipawn_loss INTEGER,
ADD COLUMN IF NOT EXISTS best_move TEXT,
ADD COLUMN IF NOT EXISTS is_brilliant BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_mistake BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_blunder BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS classification TEXT;

-- Add analysis status tracking to games table
ALTER TABLE games
ADD COLUMN IF NOT EXISTS analysis_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS analysis_completed_at TIMESTAMP WITH TIME ZONE;

-- Add opening detection fields to games table
ALTER TABLE games
ADD COLUMN IF NOT EXISTS opening_eco TEXT,
ADD COLUMN IF NOT EXISTS opening_name TEXT,
ADD COLUMN IF NOT EXISTS opening_variation TEXT;

-- Add engine-based metrics to game_analytics table
-- Note: avg_centipawn_loss already exists, but we're adding phase-based accuracy
ALTER TABLE game_analytics
ADD COLUMN IF NOT EXISTS opening_accuracy NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS middlegame_accuracy NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS endgame_accuracy NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS max_advantage_gained INTEGER,
ADD COLUMN IF NOT EXISTS max_advantage_lost INTEGER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_analysis_status ON games(analysis_status);
CREATE INDEX IF NOT EXISTS idx_moves_classification ON moves(classification) WHERE classification IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_moves_brilliant ON moves(game_id) WHERE is_brilliant = TRUE;
CREATE INDEX IF NOT EXISTS idx_moves_mistakes ON moves(game_id) WHERE is_mistake = TRUE OR is_blunder = TRUE;
CREATE INDEX IF NOT EXISTS idx_games_opening_eco ON games(opening_eco) WHERE opening_eco IS NOT NULL;

-- Add comment to explain analysis_status values
COMMENT ON COLUMN games.analysis_status IS 'Status of engine analysis: pending, analyzing, completed, failed';

-- Update existing games to have pending analysis status
UPDATE games 
SET analysis_status = 'pending' 
WHERE analysis_status IS NULL;

-- Create a function to calculate MSI (Move Strength Index)
CREATE OR REPLACE FUNCTION calculate_msi(
    p_accuracy NUMERIC,
    p_conversion_rate NUMERIC,
    p_clutch_factor NUMERIC,
    p_opening_accuracy NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
    RETURN ROUND(
        (COALESCE(p_accuracy, 0) * 0.4) +
        (COALESCE(p_conversion_rate, 0) * 0.3) +
        (COALESCE(p_clutch_factor, 0) * 0.2) +
        (COALESCE(p_opening_accuracy, 0) * 0.1),
        2
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_msi IS 'Calculate Move Strength Index from accuracy, conversion rate, clutch factor, and opening accuracy';
