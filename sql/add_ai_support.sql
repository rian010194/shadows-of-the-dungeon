-- ============================================
-- ADD AI SUPPORT TO LOBBY PLAYERS
-- ============================================

-- Add is_ai column to lobby_players table
ALTER TABLE lobby_players 
ADD COLUMN IF NOT EXISTS is_ai BOOLEAN DEFAULT false;

-- Update the unique constraint to allow multiple AI players
-- (since AI players have null user_id, we need to handle this)
DROP INDEX IF EXISTS idx_lobby_players_lobby_user;

-- Create a new index that handles AI players properly
CREATE INDEX IF NOT EXISTS idx_lobby_players_lobby_user 
ON lobby_players(lobby_id, user_id) 
WHERE user_id IS NOT NULL;

-- Add a comment to explain the AI support
COMMENT ON COLUMN lobby_players.is_ai IS 'True for AI players, false for human players';
COMMENT ON COLUMN lobby_players.user_id IS 'NULL for AI players, user ID for human players';

-- Update RLS policies to allow AI players
-- (AI players don't have user_id, so they need special handling)

-- Allow AI players to be inserted (they have null user_id)
CREATE POLICY IF NOT EXISTS "Allow AI player insertion" 
ON lobby_players FOR INSERT 
WITH CHECK (is_ai = true AND user_id IS NULL);

-- Allow viewing AI players
CREATE POLICY IF NOT EXISTS "Allow viewing AI players" 
ON lobby_players FOR SELECT 
USING (is_ai = true OR user_id = auth.uid());

-- Allow updating AI players (for game state changes)
CREATE POLICY IF NOT EXISTS "Allow updating AI players" 
ON lobby_players FOR UPDATE 
USING (is_ai = true OR user_id = auth.uid());

-- Allow deleting AI players
CREATE POLICY IF NOT EXISTS "Allow deleting AI players" 
ON lobby_players FOR DELETE 
USING (is_ai = true OR user_id = auth.uid());

-- Update the increment_player_count function to handle AI players
CREATE OR REPLACE FUNCTION increment_player_count(lobby_id UUID, increment INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    UPDATE lobbies 
    SET player_count = player_count + increment 
    WHERE id = lobby_id;
END;
$$ LANGUAGE plpgsql;

-- Update the decrement_player_count function
CREATE OR REPLACE FUNCTION decrement_player_count(lobby_id UUID, decrement INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    UPDATE lobbies 
    SET player_count = GREATEST(0, player_count - decrement) 
    WHERE id = lobby_id;
END;
$$ LANGUAGE plpgsql;
