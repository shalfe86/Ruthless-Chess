-- Create site_visits table to track unique visitors and time on site
CREATE TABLE site_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id UUID NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update platform_stats view to include unique visitors and average time
DROP VIEW platform_stats;
CREATE OR REPLACE VIEW platform_stats AS
SELECT 
    (SELECT COUNT(*) FROM games WHERE created_at >= current_date) as games_today,
    (SELECT COUNT(*) FROM games WHERE status = 'active') as active_games,
    (SELECT 
        CASE WHEN COUNT(*) = 0 THEN 0 
        ELSE ROUND((COUNT(*) FILTER (WHERE username != 'Anonymous') * 100.0 / COUNT(*)), 1)
        END 
     FROM games WHERE created_at >= current_date) as username_percentage,
    (SELECT COUNT(DISTINCT visitor_id) FROM site_visits WHERE started_at >= current_date) as unique_visitors_today,
    (SELECT 
        COALESCE(AVG(EXTRACT(EPOCH FROM (last_active_at - started_at))), 0)
     FROM site_visits WHERE started_at >= current_date) as avg_time_seconds;
