-- Enable RLS for site_visits (Fix for missing permissions)
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for anonymous users" ON site_visits
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for anonymous users" ON site_visits
    FOR UPDATE USING (true);

CREATE POLICY "Enable select for anonymous users" ON site_visits
    FOR SELECT USING (true);
