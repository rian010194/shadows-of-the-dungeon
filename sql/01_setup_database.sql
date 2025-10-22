-- ============================================
-- 01. SETUP DATABASE (Run this FIRST)
-- ============================================
-- This is the main database setup script
-- Run this in Supabase SQL Editor

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
    character_created BOOLEAN DEFAULT false,
    active_character_id UUID,
    gold INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CHARACTER CLASSES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS character_classes (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(50) NOT NULL,
    description TEXT,
    emoji VARCHAR(10),
    base_strength INT DEFAULT 5,
    base_intellect INT DEFAULT 5,
    base_agility INT DEFAULT 5,
    base_vitality INT DEFAULT 5,
    base_wisdom INT DEFAULT 5,
    bonus_points INT DEFAULT 5,
    starter_item_name VARCHAR(100)
);

-- ============================================
-- CHARACTERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    character_name VARCHAR(50) NOT NULL,
    character_class VARCHAR(20) NOT NULL REFERENCES character_classes(id),
    strength INT DEFAULT 5,
    intellect INT DEFAULT 5,
    agility INT DEFAULT 5,
    vitality INT DEFAULT 5,
    wisdom INT DEFAULT 5,
    games_played INT DEFAULT 0,
    games_won INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, character_name)
);

-- ============================================
-- LOBBIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS lobbies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'waiting',
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
    is_ai BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(lobby_id, user_id)
);

-- Add missing columns if they don't exist
ALTER TABLE lobby_players 
ADD COLUMN IF NOT EXISTS is_ai BOOLEAN DEFAULT FALSE;

-- Add missing columns to profiles if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS character_created BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS active_character_id UUID,
ADD COLUMN IF NOT EXISTS gold INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_loot INT DEFAULT 0;

-- Ensure characters table has all required columns
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS character_class VARCHAR(20),
ADD COLUMN IF NOT EXISTS strength INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS intellect INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS agility INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS vitality INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS wisdom INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS games_played INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS games_won INT DEFAULT 0;

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'characters_character_class_fkey' 
        AND table_name = 'characters'
    ) THEN
        ALTER TABLE characters 
        ADD CONSTRAINT characters_character_class_fkey 
        FOREIGN KEY (character_class) REFERENCES character_classes(id);
    END IF;
END $$;

-- ============================================
-- ITEMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    rarity VARCHAR(20) NOT NULL,
    value INT NOT NULL,
    emoji VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns if they don't exist
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS type VARCHAR(50),
ADD COLUMN IF NOT EXISTS rarity VARCHAR(20),
ADD COLUMN IF NOT EXISTS value INT,
ADD COLUMN IF NOT EXISTS emoji VARCHAR(10);

-- ============================================
-- PLAYER ITEMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS player_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- ============================================
-- GAME SESSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lobby_id UUID REFERENCES lobbies(id) ON DELETE CASCADE,
    phase VARCHAR(20),
    round_number INT DEFAULT 1,
    game_data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(character_name);
CREATE INDEX IF NOT EXISTS idx_lobbies_status ON lobbies(status);
CREATE INDEX IF NOT EXISTS idx_lobby_players_lobby ON lobby_players(lobby_id);
CREATE INDEX IF NOT EXISTS idx_lobby_players_user ON lobby_players(user_id);
CREATE INDEX IF NOT EXISTS idx_player_items_user ON player_items(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_lobby ON game_sessions(lobby_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE lobby_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Characters policies
DROP POLICY IF EXISTS "Characters are viewable by everyone" ON characters;
DROP POLICY IF EXISTS "Users can create their own characters" ON characters;
DROP POLICY IF EXISTS "Users can update their own characters" ON characters;
DROP POLICY IF EXISTS "Users can delete their own characters" ON characters;

CREATE POLICY "Characters are viewable by everyone" ON characters FOR SELECT USING (true);
CREATE POLICY "Users can create their own characters" ON characters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own characters" ON characters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own characters" ON characters FOR DELETE USING (auth.uid() = user_id);

-- Lobbies policies
DROP POLICY IF EXISTS "Lobbies are viewable by everyone" ON lobbies;
DROP POLICY IF EXISTS "Authenticated users can create lobbies" ON lobbies;
DROP POLICY IF EXISTS "Host can update their lobby" ON lobbies;

CREATE POLICY "Lobbies are viewable by everyone" ON lobbies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create lobbies" ON lobbies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Host can update their lobby" ON lobbies FOR UPDATE USING (auth.uid() = host_id);

-- Lobby players policies
DROP POLICY IF EXISTS "Lobby players are viewable by everyone" ON lobby_players;
DROP POLICY IF EXISTS "Users can join lobbies" ON lobby_players;
DROP POLICY IF EXISTS "Users can leave lobbies" ON lobby_players;
DROP POLICY IF EXISTS "Allow AI inserts" ON lobby_players;

CREATE POLICY "Lobby players are viewable by everyone" ON lobby_players FOR SELECT USING (true);
CREATE POLICY "Users can join lobbies" ON lobby_players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave lobbies" ON lobby_players FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Allow AI inserts" ON lobby_players FOR INSERT WITH CHECK (user_id IS NULL AND is_ai IS TRUE);

-- Items policies
DROP POLICY IF EXISTS "Items are viewable by everyone" ON items;
CREATE POLICY "Items are viewable by everyone" ON items FOR SELECT USING (true);

-- Player items policies
DROP POLICY IF EXISTS "Users can view their own items" ON player_items;
DROP POLICY IF EXISTS "Users can manage their own items" ON player_items;
CREATE POLICY "Users can view their own items" ON player_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own items" ON player_items FOR ALL USING (auth.uid() = user_id);

-- Game sessions policies
DROP POLICY IF EXISTS "Game sessions are viewable by lobby members" ON game_sessions;
DROP POLICY IF EXISTS "Host can manage game session" ON game_sessions;

CREATE POLICY "Game sessions are viewable by lobby members" ON game_sessions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM lobby_players
        WHERE lobby_players.lobby_id = game_sessions.lobby_id
        AND lobby_players.user_id = auth.uid()
    )
);

CREATE POLICY "Host can manage game session" ON game_sessions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM lobbies
        WHERE lobbies.id = game_sessions.lobby_id
        AND lobbies.host_id = auth.uid()
    )
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION increment_player_count(lobby_id_input UUID, increment INTEGER DEFAULT 1)
RETURNS void AS $$
BEGIN
    UPDATE lobbies
    SET player_count = player_count + increment
    WHERE id = lobby_id_input;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_player_count(lobby_id_input UUID, decrement INTEGER DEFAULT 1)
RETURNS void AS $$
BEGIN
    UPDATE lobbies
    SET player_count = player_count - decrement
    WHERE id = lobby_id_input;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE lobbies;
ALTER PUBLICATION supabase_realtime ADD TABLE lobby_players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE '📊 Tables created: profiles, characters, character_classes, lobbies, lobby_players, items, player_items, game_sessions';
    RAISE NOTICE '🔐 Row Level Security enabled';
    RAISE NOTICE '⚡ Realtime subscriptions configured';
    RAISE NOTICE '';
    RAISE NOTICE '🎮 Next: Run 02_seed_data.sql to add character classes and items';
END $$;
