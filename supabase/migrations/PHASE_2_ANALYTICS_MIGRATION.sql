-- Phase 2: Consolidated Analytics Migration
-- Run this file in Supabase SQL Editor to create analytics tables

-- This file contains:
-- 1. player_analytics table - Aggregated player statistics
-- 2. game_analytics table - Per-game analytics
-- 3. RLS policies for both tables
-- 4. Indexes for performance
-- 5. Auto-update timestamp trigger

-- ============================================================================
-- TABLE: player_analytics
-- ============================================================================
-- Stores aggregated analytics for each player (updated after each game)

CREATE TABLE IF NOT EXISTS player_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Core Stats
  total_games INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage
  
  -- Advanced Metrics (from dashboard)
  msi_value DECIMAL(5,2) DEFAULT 0.00, -- Mistake Severity Index (avg moves to collapse)
  pressure_rating INTEGER DEFAULT 0, -- Performance under <10s (0-100)
  conversion_rate DECIMAL(5,2) DEFAULT 0.00, -- Win rate after +1.5 advantage
  punishment_rate DECIMAL(5,2) DEFAULT 0.00, -- Avg moves to punish opponent mistakes
  time_waste_avg DECIMAL(5,2) DEFAULT 0.00, -- Avg seconds wasted per blunder
  opening_survival_rate DECIMAL(5,2) DEFAULT 0.00, -- % of games surviving past move 10
  clutch_factor DECIMAL(5,2) DEFAULT 0.00, -- Win rate in close games (eval ±0.5)
  
  -- Move Quality Stats
  avg_accuracy DECIMAL(5,2) DEFAULT 0.00, -- Overall accuracy percentage
  total_mistakes INTEGER DEFAULT 0,
  total_blunders INTEGER DEFAULT 0,
  total_brilliant_moves INTEGER DEFAULT 0,
  
  -- Time Management
  avg_time_per_move_ms INTEGER DEFAULT 0,
  avg_game_duration_seconds INTEGER DEFAULT 0,
  
  -- Last Updated
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_player_analytics_player_id ON player_analytics(player_id);
CREATE INDEX idx_player_analytics_win_rate ON player_analytics(win_rate DESC);
CREATE INDEX idx_player_analytics_total_games ON player_analytics(total_games DESC);

-- RLS Policies
ALTER TABLE player_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics"
  ON player_analytics FOR SELECT
  USING (auth.uid() = player_id);

CREATE POLICY "Users can insert their own analytics"
  ON player_analytics FOR INSERT
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can update their own analytics"
  ON player_analytics FOR UPDATE
  USING (auth.uid() = player_id);

-- Comments
COMMENT ON TABLE player_analytics IS 'Aggregated analytics for each player, updated after each game';
COMMENT ON COLUMN player_analytics.msi_value IS 'Mistake Severity Index - average moves to collapse after mistake';
COMMENT ON COLUMN player_analytics.pressure_rating IS 'Performance under time pressure (<10s remaining)';
COMMENT ON COLUMN player_analytics.conversion_rate IS 'Win rate when achieving +1.5 advantage';
COMMENT ON COLUMN player_analytics.clutch_factor IS 'Win rate in close games (evaluation ±0.5)';

-- ============================================================================
-- TABLE: game_analytics
-- ============================================================================
-- Per-game analytics calculated after game completion

CREATE TABLE IF NOT EXISTS game_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE UNIQUE NOT NULL,
  player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Move Quality
  accuracy DECIMAL(5,2) DEFAULT 0.00, -- Overall accuracy for this game
  brilliant_moves INTEGER DEFAULT 0,
  great_moves INTEGER DEFAULT 0,
  good_moves INTEGER DEFAULT 0,
  inaccuracies INTEGER DEFAULT 0,
  mistakes INTEGER DEFAULT 0,
  blunders INTEGER DEFAULT 0,
  
  -- Positional Analysis
  avg_centipawn_loss DECIMAL(5,2) DEFAULT 0.00,
  max_advantage_gained DECIMAL(5,2) DEFAULT 0.00,
  max_advantage_lost DECIMAL(5,2) DEFAULT 0.00,
  
  -- Time Pressure
  moves_under_5s INTEGER DEFAULT 0,
  moves_under_10s INTEGER DEFAULT 0,
  time_pressure_mistakes INTEGER DEFAULT 0, -- Mistakes made with <10s
  
  -- Opening Performance
  survived_opening BOOLEAN DEFAULT TRUE, -- Made it past move 10
  opening_mistakes INTEGER DEFAULT 0, -- Mistakes in first 10 moves
  
  -- Endgame
  endgame_accuracy DECIMAL(5,2) DEFAULT 0.00, -- Accuracy in last 10 moves
  
  -- Rating Impact (to be implemented in Phase 3)
  rating_change INTEGER DEFAULT 0, -- +/- rating points from this game
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_game_analytics_game_id ON game_analytics(game_id);
CREATE INDEX idx_game_analytics_player_id ON game_analytics(player_id);
CREATE INDEX idx_game_analytics_created_at ON game_analytics(player_id, created_at DESC);
CREATE INDEX idx_game_analytics_accuracy ON game_analytics(player_id, accuracy DESC);

-- RLS Policies
ALTER TABLE game_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own game analytics"
  ON game_analytics FOR SELECT
  USING (auth.uid() = player_id);

CREATE POLICY "Users can insert their own game analytics"
  ON game_analytics FOR INSERT
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can update their own game analytics"
  ON game_analytics FOR UPDATE
  USING (auth.uid() = player_id);

-- Comments
COMMENT ON TABLE game_analytics IS 'Per-game analytics calculated after game completion';
COMMENT ON COLUMN game_analytics.accuracy IS 'Overall accuracy percentage for this game';
COMMENT ON COLUMN game_analytics.avg_centipawn_loss IS 'Average centipawn loss per move';
COMMENT ON COLUMN game_analytics.survived_opening IS 'Whether player survived past move 10 without major mistakes';
COMMENT ON COLUMN game_analytics.time_pressure_mistakes IS 'Number of mistakes made with less than 10 seconds on clock';

-- ============================================================================
-- FUNCTION: Auto-update player_analytics timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_player_analytics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_player_analytics_timestamp
  BEFORE UPDATE ON player_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_player_analytics_timestamp();

COMMENT ON FUNCTION update_player_analytics_timestamp() IS 'Automatically updates the updated_at timestamp when player_analytics is modified';
