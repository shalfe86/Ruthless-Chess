-- Drop old unused tables
DROP TABLE IF EXISTS rating_history CASCADE;
DROP TABLE IF EXISTS game_analytics CASCADE;
DROP TABLE IF EXISTS player_analytics CASCADE;
DROP TABLE IF EXISTS player_preferences CASCADE;
DROP TABLE IF EXISTS move_analysis CASCADE;
DROP TABLE IF EXISTS moves CASCADE;
DROP TABLE IF EXISTS games CASCADE;

-- Create user_sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for anonymous users" ON user_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for anonymous users" ON user_sessions
    FOR UPDATE USING (true);

CREATE POLICY "Enable select for anonymous users" ON user_sessions
    FOR SELECT USING (true);


-- Create games table
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
    username TEXT NOT NULL DEFAULT 'Anonymous',
    difficulty INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    result TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for games
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for anonymous users" ON games
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for anonymous users" ON games
    FOR UPDATE USING (true);

CREATE POLICY "Enable select for anonymous users" ON games
    FOR SELECT USING (true);


-- Create platform_stats view
CREATE OR REPLACE VIEW platform_stats AS
SELECT 
    (SELECT COUNT(*) FROM games WHERE created_at >= current_date) as games_today,
    (SELECT COUNT(*) FROM games WHERE status = 'active') as active_games,
    (SELECT 
        CASE WHEN COUNT(*) = 0 THEN 0 
        ELSE ROUND((COUNT(*) FILTER (WHERE username != 'Anonymous') * 100.0 / COUNT(*)), 1)
        END 
     FROM games WHERE created_at >= current_date) as username_percentage;
