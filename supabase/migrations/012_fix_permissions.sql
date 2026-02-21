-- Fix permissions for site_visits and username_reservations

-- 1. Grant table access to anon and authenticated roles
GRANT ALL ON TABLE site_visits TO anon, authenticated;
GRANT ALL ON TABLE username_reservations TO anon, authenticated;

-- 2. Grant execute on the RPC function
GRANT EXECUTE ON FUNCTION claim_username TO anon, authenticated;

-- 3. Add missing RLS policies for username_reservations
DO $$
BEGIN
    -- Only create if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'username_reservations' AND policyname = 'Enable insert for anonymous users'
    ) THEN
        CREATE POLICY "Enable insert for anonymous users" ON username_reservations FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'username_reservations' AND policyname = 'Enable update for anonymous users'
    ) THEN
        CREATE POLICY "Enable update for anonymous users" ON username_reservations FOR UPDATE USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'username_reservations' AND policyname = 'Enable select for anonymous users'
    ) THEN
        CREATE POLICY "Enable select for anonymous users" ON username_reservations FOR SELECT USING (true);
    END IF;
END
$$;
