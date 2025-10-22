-- ============================================
-- SEED ITEMS FOR SHADOW DUNGEON
-- ============================================
-- Run this after update_schema_stashhub.sql
-- This adds example items with gameplay effects

-- Clear existing items (optional - comment out if you want to keep existing items)
-- DELETE FROM player_items;
-- DELETE FROM items;

-- ============================================
-- STARTER ITEMS (Free, given at character creation)
-- ============================================

INSERT INTO items (name, description, effect, rarity, item_type, price, is_starter, is_purchasable) VALUES
('Rusty Sword', 'En sliten men pålitlig klinga', 'survive_attack:1', 'common', 'weapon', 0, true, false),
('Leather Pouch', 'Håller några extra föremål', 'extra_loot_slot:1', 'common', 'tool', 0, true, false),
('Torch', 'Ger ljus i mörka platser', 'reveal_darkness:1', 'common', 'consumable', 0, true, false)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    effect = EXCLUDED.effect,
    rarity = EXCLUDED.rarity,
    item_type = EXCLUDED.item_type,
    price = EXCLUDED.price,
    is_starter = EXCLUDED.is_starter,
    is_purchasable = EXCLUDED.is_purchasable;

-- ============================================
-- SHOP ITEMS - COMMON (Billiga, grundläggande)
-- ============================================

INSERT INTO items (name, description, effect, rarity, item_type, price, is_starter, is_purchasable) VALUES
('Health Potion', 'Återställer vitalitet', 'heal:50', 'common', 'consumable', 50, false, true),
('Lucky Charm', 'Ger lycka', 'loot_bonus:10', 'common', 'tool', 75, false, true),
('Smoke Bomb', 'Skapar förvirrande rök', 'escape_danger:1', 'common', 'consumable', 60, false, true),
('Rope', 'Användbar i många situationer', 'avoid_trap:1', 'common', 'tool', 40, false, true),
('Bread', 'Enkel föda', 'restore_energy:20', 'common', 'consumable', 25, false, true)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    effect = EXCLUDED.effect,
    rarity = EXCLUDED.rarity,
    item_type = EXCLUDED.item_type,
    price = EXCLUDED.price,
    is_starter = EXCLUDED.is_starter,
    is_purchasable = EXCLUDED.is_purchasable;

-- ============================================
-- SHOP ITEMS - UNCOMMON (Mer kraftfulla)
-- ============================================

INSERT INTO items (name, description, effect, rarity, item_type, price, is_starter, is_purchasable) VALUES
('Silver Dagger', 'Glimmande och vass', 'attack_power:2', 'uncommon', 'weapon', 150, false, true),
('Magic Compass', 'Pekar mot skatter', 'reveal_loot:1', 'uncommon', 'tool', 200, false, true),
('Iron Shield', 'Robust skydd', 'block_attacks:2', 'uncommon', 'armor', 180, false, true),
('Wisdom Scroll', 'Ger insikt', 'reveal_role:1', 'uncommon', 'consumable', 250, false, true),
('Agility Boots', 'Gör dig snabbare', 'speed_boost:2', 'uncommon', 'armor', 175, false, true)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    effect = EXCLUDED.effect,
    rarity = EXCLUDED.rarity,
    item_type = EXCLUDED.item_type,
    price = EXCLUDED.price,
    is_starter = EXCLUDED.is_starter,
    is_purchasable = EXCLUDED.is_purchasable;

-- ============================================
-- SHOP ITEMS - RARE (Kraftfulla och sällsynta)
-- ============================================

INSERT INTO items (name, description, effect, rarity, item_type, price, is_starter, is_purchasable) VALUES
('Enchanted Amulet', 'Pulserar av kraft', 'corruption_immunity:1', 'rare', 'armor', 500, false, true),
('Invisibility Cloak', 'Smält in i skuggorna', 'hide_vote:1', 'rare', 'armor', 600, false, true),
('Master Key', 'Öppnar alla lås', 'secret_loot:1', 'rare', 'tool', 450, false, true),
('Shadow Dagger', 'Dödar i mörkret', 'darkness_kill:1', 'rare', 'weapon', 550, false, true),
('Oracle Stone', 'Visar framtiden', 'predict_event:1', 'rare', 'tool', 500, false, true)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    effect = EXCLUDED.effect,
    rarity = EXCLUDED.rarity,
    item_type = EXCLUDED.item_type,
    price = EXCLUDED.price,
    is_starter = EXCLUDED.is_starter,
    is_purchasable = EXCLUDED.is_purchasable;

-- ============================================
-- SHOP ITEMS - LEGENDARY (Extremt kraftfulla)
-- ============================================

INSERT INTO items (name, description, effect, rarity, item_type, price, is_starter, is_purchasable) VALUES
('Phoenix Feather', 'Brinner av evig eld', 'revive:1', 'legendary', 'consumable', 1500, false, true),
('Crown of Wisdom', 'Ger djup insikt', 'reveal_all_roles:1', 'legendary', 'tool', 2000, false, true),
('Dragon Scale Armor', 'Ogenomträngligt försvar', 'immunity:1', 'legendary', 'armor', 1800, false, true),
('Time Crystal', 'Kontrollerar tiden', 'extra_turn:1', 'legendary', 'tool', 2500, false, true),
('Portal Key', 'Öppnar portalen direkt', 'instant_escape:1', 'legendary', 'tool', 3000, false, true)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    effect = EXCLUDED.effect,
    rarity = EXCLUDED.rarity,
    item_type = EXCLUDED.item_type,
    price = EXCLUDED.price,
    is_starter = EXCLUDED.is_starter,
    is_purchasable = EXCLUDED.is_purchasable;

-- ============================================
-- LOOT ONLY ITEMS (Kan bara hittas, inte köpas)
-- ============================================

INSERT INTO items (name, description, effect, rarity, item_type, price, is_starter, is_purchasable) VALUES
('Ancient Orb', 'Avslöjar en spelares roll', 'reveal_role:1', 'rare', 'treasure', 0, false, false),
('Golden Chalice', 'Värd 100 guld', 'gold:100', 'common', 'treasure', 0, false, false),
('Cursed Amulet', 'Dubbelt byte, avslöja roll', 'double_loot:1;reveal_self:1', 'legendary', 'treasure', 0, false, false),
('Silver Coins', 'Värd 20 guld', 'gold:20', 'common', 'treasure', 0, false, false),
('Magic Scroll', 'Avslöjar händelseinfo', 'reveal_event:1', 'uncommon', 'treasure', 0, false, false),
('Dragon Gem', 'Värd 500 guld', 'gold:500', 'legendary', 'treasure', 0, false, false),
('Blood Stone', 'Markera ett mål', 'mark_target:1', 'rare', 'treasure', 0, false, false),
('Escape Rope', 'Fly från fara omedelbart', 'instant_flee:1', 'uncommon', 'treasure', 0, false, false)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    effect = EXCLUDED.effect,
    rarity = EXCLUDED.rarity,
    item_type = EXCLUDED.item_type,
    price = EXCLUDED.price,
    is_starter = EXCLUDED.is_starter,
    is_purchasable = EXCLUDED.is_purchasable;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
DECLARE
    item_count INT;
BEGIN
    SELECT COUNT(*) INTO item_count FROM items;
    RAISE NOTICE '✅ Items seeded successfully!';
    RAISE NOTICE '📦 Total items in database: %', item_count;
    RAISE NOTICE '🎁 Starter items: 3';
    RAISE NOTICE '🛒 Shop items: 20';
    RAISE NOTICE '💎 Loot-only items: 8';
    RAISE NOTICE '';
    RAISE NOTICE '🎮 Items are ready to be used in game!';
END $$;

