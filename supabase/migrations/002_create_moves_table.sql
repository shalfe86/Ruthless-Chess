-- Migration: Create moves table
-- Description: Stores every move made in every game for detailed analysis

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
CREATE INDEX idx_moves_game_id ON moves(game_id);
CREATE INDEX idx_moves_game_move_number ON moves(game_id, move_number);
CREATE INDEX idx_moves_classification ON moves(move_classification);
CREATE INDEX idx_moves_created_at ON moves(created_at DESC);

-- Row Level Security
ALTER TABLE moves ENABLE ROW LEVEL SECURITY;

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
