-- ============================================================
-- RUTHLESS CHESS - PHASE 1 DATABASE MIGRATIONS
-- ============================================================
-- This file contains all Phase 1 migrations consolidated for easy execution
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- ============================================================
-- MIGRATION 1: Create games table
-- ============================================================

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
CREATE INDEX IF NOT EXISTS idx_games_player_id ON games(player_id);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_result ON games(player_id, result);
CREATE INDEX IF NOT EXISTS idx_games_opponent_type ON games(opponent_type);

-- Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own games" ON games;
DROP POLICY IF EXISTS "Users can insert their own games" ON games;
DROP POLICY IF EXISTS "Users can update their own games" ON games;

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

-- ============================================================
-- MIGRATION 2: Create moves table
-- ============================================================

CREATE TABLE IF NOT EXISTS moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  
  -- Move Details
  move_number INTEGER NOT NULL CHECK (move_number > 0),
  player_color VARCHAR(5) NOT NULL CHECK (player_color IN ('white', 'black')),
  move_san VARCHAR(10) NOT NULL,
  move_uci VARCHAR(10) NOT NULL,
  
  -- Position State
  fen_before TEXT NOT NULL,
  fen_after TEXT NOT NULL,
  
  -- Time Management
  time_spent_ms INTEGER NOT NULL CHECK (time_spent_ms >= 0),
  time_remaining_ms INTEGER NOT NULL CHECK (time_remaining_ms >= 0),
  
  -- Move Quality (calculated post-game or real-time)
  evaluation_before DECIMAL(5,2),
  evaluation_after DECIMAL(5,2),
  evaluation_loss DECIMAL(5,2),
  move_classification VARCHAR(20) CHECK (move_classification IN ('brilliant', 'great', 'good', 'book', 'inaccuracy', 'mistake', 'blunder')),
  
  -- Move Flags
  is_check BOOLEAN DEFAULT FALSE,
  is_checkmate BOOLEAN DEFAULT FALSE,
  is_capture BOOLEAN DEFAULT FALSE,
  is_castling BOOLEAN DEFAULT FALSE,
  is_promotion BOOLEAN DEFAULT FALSE,
  is_en_passant BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_moves_game_id ON moves(game_id);
CREATE INDEX IF NOT EXISTS idx_moves_game_move_number ON moves(game_id, move_number);
CREATE INDEX IF NOT EXISTS idx_moves_classification ON moves(move_classification);
CREATE INDEX IF NOT EXISTS idx_moves_created_at ON moves(created_at DESC);

-- Row Level Security
ALTER TABLE moves ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view moves from their own games" ON moves;
DROP POLICY IF EXISTS "Users can insert moves for their own games" ON moves;
DROP POLICY IF EXISTS "Users can update moves from their own games" ON moves;

-- Users can view moves from their own games
CREATE POLICY "Users can view moves from their own games"
  ON moves FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = moves.game_id 
      AND (games.player_id = auth.uid() OR games.opponent_id = auth.uid())
    )
  );

-- Users can insert moves for their own games
CREATE POLICY "Users can insert moves for their own games"
  ON moves FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = moves.game_id 
      AND games.player_id = auth.uid()
    )
  );

-- Users can update moves from their own games (for post-game analysis)
CREATE POLICY "Users can update moves from their own games"
  ON moves FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM games 
      WHERE games.id = moves.game_id 
      AND games.player_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE moves IS 'Stores every move made in every game for analysis';
COMMENT ON COLUMN moves.move_san IS 'Standard Algebraic Notation (e.g., Nf3, e4)';
COMMENT ON COLUMN moves.move_uci IS 'Universal Chess Interface format (e.g., e2e4)';
COMMENT ON COLUMN moves.evaluation_loss IS 'Centipawn loss indicating mistake severity';

-- ============================================================
-- MIGRATION 3: Create player_preferences table
-- ============================================================

CREATE TABLE IF NOT EXISTS player_preferences (
  player_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Board & Pieces
  board_theme VARCHAR(50) DEFAULT 'classic' CHECK (board_theme IN ('classic', 'modern', 'wood', 'marble', 'neon')),
  piece_set VARCHAR(50) DEFAULT 'standard' CHECK (piece_set IN ('standard', 'modern', 'classic', 'neo')),
  
  -- Gameplay
  auto_queen_promotion BOOLEAN DEFAULT TRUE,
  show_legal_moves BOOLEAN DEFAULT TRUE,
  show_coordinates BOOLEAN DEFAULT TRUE,
  move_confirmation BOOLEAN DEFAULT FALSE,
  
  -- Audio & Visual
  sound_enabled BOOLEAN DEFAULT TRUE,
  sound_volume INTEGER DEFAULT 50 CHECK (sound_volume >= 0 AND sound_volume <= 100),
  animations_enabled BOOLEAN DEFAULT TRUE,
  
  -- Notifications
  email_notifications BOOLEAN DEFAULT TRUE,
  achievement_notifications BOOLEAN DEFAULT TRUE,
  challenge_notifications BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE player_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own preferences" ON player_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON player_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON player_preferences;

-- Users can view their own preferences
CREATE POLICY "Users can view their own preferences"
  ON player_preferences FOR SELECT
  USING (auth.uid() = player_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own preferences"
  ON player_preferences FOR INSERT
  WITH CHECK (auth.uid() = player_id);

-- Users can update their own preferences
CREATE POLICY "Users can update their own preferences"
  ON player_preferences FOR UPDATE
  USING (auth.uid() = player_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_player_preferences_updated_at ON player_preferences;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_player_preferences_updated_at
  BEFORE UPDATE ON player_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE player_preferences IS 'User customization settings and preferences';
COMMENT ON COLUMN player_preferences.board_theme IS 'Visual theme for the chess board';
COMMENT ON COLUMN player_preferences.piece_set IS 'Chess piece design style';

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- You should now have 3 new tables: games, moves, player_preferences
-- Verify by checking the Table Editor in your Supabase dashboard
-- ============================================================
