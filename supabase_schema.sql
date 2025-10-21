-- ============================================
-- SUPABASE DATABASE SCHEMA
-- Shadow Dungeon Multiplayer Setup
-- ============================================

-- Run this in Supabase SQL Editor after creating your project
-- Dashboard → SQL Editor → New Query → Paste this → Run

-- ============================================
-- ENABLE EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    games_played INT DEFAULT 0,
    games_won INT DEFAULT 0,
    total_loot INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- LOBBIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS lobbies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'waiting', -- waiting, started, finished
    player_count INT DEFAULT 0,
    max_players INT DEFAULT 8,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    finished_at TIMESTAMP
);

-- ============================================
-- LOBBY PLAYERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS lobby_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lobby_id UUID REFERENCES lobbies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    ready BOOLEAN DEFAULT false,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(lobby_id, user_id)
);

-- ============================================
-- GAME SESSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lobby_id UUID REFERENCES lobbies(id) ON DELETE CASCADE,
    phase VARCHAR(20), -- exploration, darkness, discussion, vote, extraction, result
    round_number INT DEFAULT 1,
    game_data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_lobbies_status ON lobbies(status);
CREATE INDEX IF NOT EXISTS idx_lobbies_created ON lobbies(created_at);
CREATE INDEX IF NOT EXISTS idx_lobby_players_lobby ON lobby_players(lobby_id);
CREATE INDEX IF NOT EXISTS idx_lobby_players_user ON lobby_players(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_lobby ON game_sessions(lobby_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to increment player count
CREATE OR REPLACE FUNCTION increment_player_count(lobby_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE lobbies
    SET player_count = player_count + 1
    WHERE id = lobby_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement player count
CREATE OR REPLACE FUNCTION decrement_player_count(lobby_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE lobbies
    SET player_count = GREATEST(0, player_count - 1)
    WHERE id = lobby_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE lobby_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Lobbies: Everyone can view and create lobbies
CREATE POLICY "Lobbies are viewable by everyone"
    ON lobbies FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create lobbies"
    ON lobbies FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Host can update their lobby"
    ON lobbies FOR UPDATE
    USING (auth.uid() = host_id);

-- Lobby Players: Everyone can view, users can join/leave
CREATE POLICY "Lobby players are viewable by everyone"
    ON lobby_players FOR SELECT
    USING (true);

CREATE POLICY "Users can join lobbies"
    ON lobby_players FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave lobbies"
    ON lobby_players FOR DELETE
    USING (auth.uid() = user_id);

-- Game Sessions: Everyone in lobby can view, host can update
CREATE POLICY "Game sessions are viewable by lobby members"
    ON game_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM lobby_players
            WHERE lobby_players.lobby_id = game_sessions.lobby_id
            AND lobby_players.user_id = auth.uid()
        )
    );

CREATE POLICY "Host can manage game session"
    ON game_sessions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM lobbies
            WHERE lobbies.id = game_sessions.lobby_id
            AND lobbies.host_id = auth.uid()
        )
    );

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for tables that need it
ALTER PUBLICATION supabase_realtime ADD TABLE lobbies;
ALTER PUBLICATION supabase_realtime ADD TABLE lobby_players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;

-- ============================================
-- CLEANUP FUNCTION (Optional)
-- ============================================

-- Function to clean up old lobbies
CREATE OR REPLACE FUNCTION cleanup_old_lobbies()
RETURNS VOID AS $$
BEGIN
    DELETE FROM lobbies
    WHERE status = 'finished'
    AND finished_at < NOW() - INTERVAL '24 hours';
    
    DELETE FROM lobbies
    WHERE status = 'waiting'
    AND created_at < NOW() - INTERVAL '1 hour'
    AND player_count = 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Shadow Dungeon database schema created successfully!';
    RAISE NOTICE '📊 Tables: profiles, lobbies, lobby_players, game_sessions';
    RAISE NOTICE '🔐 Row Level Security enabled';
    RAISE NOTICE '⚡ Realtime subscriptions configured';
    RAISE NOTICE '';
    RAISE NOTICE '🎮 Next steps:';
    RAISE NOTICE '1. Update config.js with your Supabase URL and anon key';
    RAISE NOTICE '2. Deploy to Netlify';
    RAISE NOTICE '3. Test signup and matchmaking!';
END $$;

