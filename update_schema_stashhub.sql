-- ============================================
-- STASH HUB SYSTEM - DATABASE UPDATES
-- ============================================
-- Run this in Supabase SQL Editor to add the stash hub features

-- ============================================
-- ADD GOLD TO PROFILES
-- ============================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gold INT DEFAULT 100; -- Starting gold

-- ============================================
-- ITEMS TABLE (Master list of all items)
-- ============================================

CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    effect VARCHAR(255),
    rarity VARCHAR(20), -- common, uncommon, rare, legendary
    item_type VARCHAR(50), -- weapon, armor, consumable, tool, treasure
    price INT DEFAULT 0, -- Shop price
    is_starter BOOLEAN DEFAULT false, -- Can be given as starter item
    is_purchasable BOOLEAN DEFAULT true, -- Can be bought in shop
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PLAYER ITEMS TABLE (Player's permanent collection)
-- ============================================

CREATE TABLE IF NOT EXISTS player_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1,
    is_equipped BOOLEAN DEFAULT false, -- Equipped for next game
    acquired_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- ============================================
-- QUESTS TABLE (Available quests)
-- ============================================

CREATE TABLE IF NOT EXISTS quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    quest_type VARCHAR(50), -- daily, weekly, achievement, story
    requirement_type VARCHAR(50), -- games_played, games_won, loot_collected, kills, etc.
    requirement_amount INT DEFAULT 1,
    reward_gold INT DEFAULT 0,
    reward_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PLAYER QUESTS TABLE (Player quest progress)
-- ============================================

CREATE TABLE IF NOT EXISTS player_quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
    progress INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    is_claimed BOOLEAN DEFAULT false,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    UNIQUE(user_id, quest_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_player_items_user ON player_items(user_id);
CREATE INDEX IF NOT EXISTS idx_player_items_item ON player_items(item_id);
CREATE INDEX IF NOT EXISTS idx_player_quests_user ON player_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_player_quests_quest ON player_quests(quest_id);
CREATE INDEX IF NOT EXISTS idx_items_purchasable ON items(is_purchasable);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_quests ENABLE ROW LEVEL SECURITY;

-- Items: Everyone can view
CREATE POLICY "Items are viewable by everyone"
    ON items FOR SELECT
    USING (true);

-- Player Items: Users can view and manage their own
CREATE POLICY "Users can view their own items"
    ON player_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own items"
    ON player_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
    ON player_items FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
    ON player_items FOR DELETE
    USING (auth.uid() = user_id);

-- Quests: Everyone can view active quests
CREATE POLICY "Active quests are viewable by everyone"
    ON quests FOR SELECT
    USING (is_active = true);

-- Player Quests: Users can view and manage their own
CREATE POLICY "Users can view their own quest progress"
    ON player_quests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quest progress"
    ON player_quests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quest progress"
    ON player_quests FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- SEED DATA - STARTER ITEMS
-- ============================================

INSERT INTO items (name, description, effect, rarity, item_type, price, is_starter, is_purchasable) VALUES
-- Starter Items (free, given at start)
('Rusty Sword', 'A worn but reliable blade', 'Basic protection in darkness', 'common', 'weapon', 0, true, false),
('Leather Pouch', 'Holds a few extra items', 'Carry +1 item', 'common', 'tool', 0, true, false),
('Torch', 'Provides light in dark places', 'Reveals nearby threats', 'common', 'consumable', 0, true, false),

-- Shop Items - Common (cheap)
('Health Potion', 'Restores vitality', 'Survive one attack', 'common', 'consumable', 50, false, true),
('Lucky Charm', 'Brings good fortune', 'Increased loot chance +10%', 'common', 'tool', 75, false, true),
('Smoke Bomb', 'Creates concealing smoke', 'Escape danger once', 'common', 'consumable', 60, false, true),

-- Shop Items - Uncommon
('Silver Dagger', 'Gleaming and sharp', 'Better attack power', 'uncommon', 'weapon', 150, false, true),
('Magic Compass', 'Points to treasure', 'Reveals one loot location', 'uncommon', 'tool', 200, false, true),
('Iron Shield', 'Sturdy protection', 'Block 2 attacks', 'uncommon', 'armor', 180, false, true),

-- Shop Items - Rare
('Enchanted Amulet', 'Pulses with power', 'Protect from corruption once', 'rare', 'armor', 500, false, true),
('Invisibility Cloak', 'Blend into shadows', 'Hide from one vote', 'rare', 'armor', 600, false, true),
('Master Key', 'Opens any lock', 'Access secret loot room', 'rare', 'tool', 450, false, true),

-- Shop Items - Legendary
('Phoenix Feather', 'Burns with eternal flame', 'Revive once after death', 'legendary', 'consumable', 1500, false, true),
('Crown of Wisdom', 'Grants deep insight', 'See all player roles', 'legendary', 'tool', 2000, false, true),
('Dragon Scale Armor', 'Impenetrable defense', 'Immune to attacks for 1 round', 'legendary', 'armor', 1800, false, true)

ON CONFLICT (name) DO NOTHING;

-- ============================================
-- SEED DATA - QUESTS
-- ============================================

INSERT INTO quests (title, description, quest_type, requirement_type, requirement_amount, reward_gold) VALUES
-- Daily Quests
('First Steps', 'Play your first game', 'daily', 'games_played', 1, 50),
('Dungeon Explorer', 'Play 3 games', 'daily', 'games_played', 3, 100),
('Survivor', 'Win a game', 'daily', 'games_won', 1, 150),

-- Achievement Quests
('Treasure Hunter', 'Collect 10 items total', 'achievement', 'loot_collected', 10, 300),
('Veteran Adventurer', 'Play 10 games', 'achievement', 'games_played', 10, 500),
('Champion', 'Win 5 games', 'achievement', 'games_won', 5, 750),
('Master Escapist', 'Escape the dungeon 10 times', 'achievement', 'escapes', 10, 1000)

ON CONFLICT DO NOTHING;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to give starter items to new players
CREATE OR REPLACE FUNCTION give_starter_items(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Give all starter items to the user
    INSERT INTO player_items (user_id, item_id, quantity)
    SELECT p_user_id, id, 1
    FROM items
    WHERE is_starter = true
    ON CONFLICT (user_id, item_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to initialize starter quests
CREATE OR REPLACE FUNCTION initialize_player_quests(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Add daily and active quests to player
    INSERT INTO player_quests (user_id, quest_id, progress)
    SELECT p_user_id, id, 0
    FROM quests
    WHERE is_active = true
    ON CONFLICT (user_id, quest_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Stash Hub system created successfully!';
    RAISE NOTICE '💰 Gold currency added to profiles';
    RAISE NOTICE '📦 Items and player inventory tables created';
    RAISE NOTICE '🎯 Quest system implemented';
    RAISE NOTICE '🛡️ Starter items and shop items seeded';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next: Run give_starter_items(user_id) for existing users';
END $$;

