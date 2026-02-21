-- Create the username_reservations table
CREATE TABLE username_reservations (
    username_lower TEXT PRIMARY KEY,
    original_username TEXT NOT NULL,
    visitor_id UUID NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for username_reservations
ALTER TABLE username_reservations ENABLE ROW LEVEL SECURITY;

-- Create the RPC function to atomically claim or extend a username reservation
CREATE OR REPLACE FUNCTION claim_username(p_username TEXT, p_visitor_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_username_lower TEXT;
    v_existing_visitor UUID;
    v_last_used TIMESTAMP WITH TIME ZONE;
BEGIN
    v_username_lower := LOWER(TRIM(p_username));

    -- Check for existing reservation
    SELECT visitor_id, last_used_at 
    INTO v_existing_visitor, v_last_used
    FROM username_reservations
    WHERE username_lower = v_username_lower;

    IF NOT FOUND THEN
        -- Username is completely free, claim it
        INSERT INTO username_reservations (username_lower, original_username, visitor_id, last_used_at)
        VALUES (v_username_lower, TRIM(p_username), p_visitor_id, NOW());
        RETURN TRUE;
    END IF;

    -- Username exists, check if it belongs to the same visitor
    IF v_existing_visitor = p_visitor_id THEN
        -- Yes, simply update last_used_at to extend the 30 days
        UPDATE username_reservations 
        SET last_used_at = NOW(), original_username = TRIM(p_username)
        WHERE username_lower = v_username_lower;
        RETURN TRUE;
    END IF;

    -- Username belongs to someone else. Has it been > 30 days since last use?
    IF v_last_used < NOW() - INTERVAL '30 days' THEN
        -- Yes, previous reservation expired. Claim it for the new visitor.
        UPDATE username_reservations 
        SET visitor_id = p_visitor_id, last_used_at = NOW(), original_username = TRIM(p_username)
        WHERE username_lower = v_username_lower;
        RETURN TRUE;
    END IF;

    -- Username is taken and actively locked
    RETURN FALSE;
END;
$$;
