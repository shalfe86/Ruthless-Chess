-- Migration: Create games table
-- Description: Core table for tracking all chess games played on the platform

CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  opponent_type VARCHAR(20) NOT NULL CHECK (opponent_type IN ('ai', 'human', 'guest')),
  opponent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ai_difficulty INTEGER CHECK (ai_difficulty >= 1 AND ai_difficulty <= 10),
  ai_engine_version VARCHAR(20),
  
  -- Game Configuration
  time_control_initial INTEGER NOT NULL DEFAULT 25,
  time_control_increment INTEGER NOT NULL DEFAULT 1,
  player_color VARCHAR(5) NOT NULL CHECK (player_color IN ('white', 'black')),
  
  -- Game Outcome
  result VARCHAR(20) NOT NULL CHECK (result IN ('win', 'loss', 'draw')),
  result_reason VARCHAR(50) CHECK (result_reason IN ('checkmate', 'timeout', 'resignation', 'stalemate', 'insufficient_material', 'draw_agreement')),
  winner_color VARCHAR(5) CHECK (winner_color IN ('white', 'black')),
  
  -- Game Metadata
  total_moves INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  final_fen TEXT,
  pgn TEXT,
  
  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_games_player_id ON games(player_id);
CREATE INDEX idx_games_created_at ON games(created_at DESC);
CREATE INDEX idx_games_result ON games(player_id, result);
CREATE INDEX idx_games_opponent_type ON games(opponent_type);

-- Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Users can view their own games
CREATE POLICY "Users can view their own games"
  ON games FOR SELECT
  USING (auth.uid() = player_id OR auth.uid() = opponent_id);

-- Users can insert their own games
CREATE POLICY "Users can insert their own games"
  ON games FOR INSERT
  WITH CHECK (auth.uid() = player_id);

-- Users can update their own games
CREATE POLICY "Users can update their own games"
  ON games FOR UPDATE
  USING (auth.uid() = player_id);

-- Comments
COMMENT ON TABLE games IS 'Stores all chess games played on the platform';
COMMENT ON COLUMN games.ai_difficulty IS 'AI difficulty level 1-10, NULL for human games';
COMMENT ON COLUMN games.pgn IS 'Full game in Portable Game Notation format';
