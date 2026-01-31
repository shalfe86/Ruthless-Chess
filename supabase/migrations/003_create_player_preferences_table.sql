-- Migration: Create player_preferences table
-- Description: Store user customization settings for better UX

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

-- Trigger to auto-update updated_at
CREATE TRIGGER update_player_preferences_updated_at
  BEFORE UPDATE ON player_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE player_preferences IS 'User customization settings and preferences';
COMMENT ON COLUMN player_preferences.board_theme IS 'Visual theme for the chess board';
COMMENT ON COLUMN player_preferences.piece_set IS 'Chess piece design style';
