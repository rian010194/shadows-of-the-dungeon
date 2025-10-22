-- ============================================
-- 02. SEED DATA (Run this SECOND)
-- ============================================
-- This script adds character classes and items
-- Run this AFTER 01_setup_database.sql

-- ============================================
-- SEED CHARACTER CLASSES
-- ============================================

INSERT INTO character_classes (id, name, display_name, description, emoji, base_strength, base_intellect, base_agility, base_vitality, base_wisdom, bonus_points, starter_item_name) VALUES
(
    'mage', 
    'Mage', 
    'Magiker',
    'Mästare av mystiska krafter. Hög intelligens och visdom, men svag fysiskt.',
    '🔮',
    3, 10, 4, 4, 7,
    5,
    'Magic Compass'
),
(
    'warrior', 
    'Warrior', 
    'Krigare',
    'Stark och uthållig kämpare. Överlägsen styrka och vitalitet.',
    '⚔️',
    10, 3, 5, 8, 4,
    5,
    'Iron Shield'
),
(
    'rogue', 
    'Rogue', 
    'Skuggmästare',
    'Smidig och listig. Perfekt för att undvika fara och hitta hemligheter.',
    '🗡️',
    5, 5, 10, 5, 5,
    5,
    'Smoke Bomb'
),
(
    'seer', 
    'Seer', 
    'Siare',
    'Vis och insiktsfull. Ser vad andra missar och förstår mysterier.',
    '🔯',
    4, 7, 4, 5, 10,
    5,
    'Lucky Charm'
)
ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    emoji = EXCLUDED.emoji,
    base_strength = EXCLUDED.base_strength,
    base_intellect = EXCLUDED.base_intellect,
    base_agility = EXCLUDED.base_agility,
    base_vitality = EXCLUDED.base_vitality,
    base_wisdom = EXCLUDED.base_wisdom,
    bonus_points = EXCLUDED.bonus_points,
    starter_item_name = EXCLUDED.starter_item_name;

-- ============================================
-- SEED ITEMS
-- ============================================

INSERT INTO items (name, description, type, rarity, value, emoji) VALUES
-- Starter Items
('Magic Compass', 'En kompass som alltid pekar mot fara', 'tool', 'common', 50, '🧭'),
('Iron Shield', 'En tung sköld som ger skydd', 'armor', 'common', 75, '🛡️'),
('Smoke Bomb', 'Skapar rök för att gömma sig', 'tool', 'common', 30, '💨'),
('Lucky Charm', 'En amulett som ger tur', 'accessory', 'common', 25, '🍀'),

-- Common Items
('Health Potion', 'Återställer hälsa', 'consumable', 'common', 20, '🧪'),
('Torch', 'Ger ljus i mörkret', 'tool', 'common', 15, '🔥'),
('Rope', 'Användbar för klättring', 'tool', 'common', 10, '🪢'),
('Lockpick', 'Öppnar lås', 'tool', 'common', 40, '🔓'),

-- Uncommon Items
('Magic Ring', 'Ger magisk kraft', 'accessory', 'uncommon', 100, '💍'),
('Steel Sword', 'En skarp klinga', 'weapon', 'uncommon', 150, '⚔️'),
('Leather Armor', 'Lätt rustning', 'armor', 'uncommon', 120, '🦺'),
('Healing Crystal', 'Kraftfull helande kristall', 'consumable', 'uncommon', 80, '💎'),

-- Rare Items
('Dragon Scale', 'Skal från en drake', 'material', 'rare', 500, '🐉'),
('Ancient Scroll', 'Gammal magisk text', 'tool', 'rare', 300, '📜'),
('Phoenix Feather', 'Fjäder från en fenix', 'material', 'rare', 400, '🪶'),
('Crystal Orb', 'Mystisk kristallkula', 'tool', 'rare', 600, '🔮'),

-- Legendary Items
('Excalibur', 'Den legendariska svärdet', 'weapon', 'legendary', 2000, '🗡️'),
('Dragon Heart', 'Hjärtat från en drake', 'material', 'legendary', 1500, '❤️'),
('Crown of Kings', 'Kronan av kungar', 'accessory', 'legendary', 3000, '👑'),
('Staff of Power', 'Kraftfull trollstav', 'weapon', 'legendary', 2500, '🪄')
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    rarity = EXCLUDED.rarity,
    value = EXCLUDED.value,
    emoji = EXCLUDED.emoji;

-- ============================================
-- CHARACTER CREATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION create_character(
    p_user_id UUID,
    p_character_name VARCHAR(50),
    p_class_id VARCHAR(20),
    p_bonus_strength INT DEFAULT 0,
    p_bonus_intellect INT DEFAULT 0,
    p_bonus_agility INT DEFAULT 0,
    p_bonus_vitality INT DEFAULT 0,
    p_bonus_wisdom INT DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_class RECORD;
    v_total_bonus INT;
    v_starter_item_id UUID;
    v_character_id UUID;
BEGIN
    -- Get class stats
    SELECT * INTO v_class FROM character_classes WHERE id = p_class_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid character class');
    END IF;
    
    -- Validate bonus points
    v_total_bonus := p_bonus_strength + p_bonus_intellect + p_bonus_agility + p_bonus_vitality + p_bonus_wisdom;
    IF v_total_bonus <> v_class.bonus_points THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid bonus point allocation');
    END IF;
    
    -- Validate character name
    IF p_character_name IS NULL OR LENGTH(TRIM(p_character_name)) < 2 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Character name must be at least 2 characters');
    END IF;
    
    -- Check if character name is already taken by this user
    IF EXISTS (SELECT 1 FROM characters WHERE LOWER(character_name) = LOWER(TRIM(p_character_name)) AND user_id = p_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Character name already taken');
    END IF;
    
    -- Check if user has reached character limit (3)
    IF (SELECT COUNT(*) FROM characters WHERE user_id = p_user_id) >= 3 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Maximum 3 characters allowed');
    END IF;
    
    -- Create character in characters table
    INSERT INTO characters (
        user_id,
        character_name,
        character_class,
        strength,
        intellect,
        agility,
        vitality,
        wisdom
    ) VALUES (
        p_user_id,
        TRIM(p_character_name),
        p_class_id,
        v_class.base_strength + p_bonus_strength,
        v_class.base_intellect + p_bonus_intellect,
        v_class.base_agility + p_bonus_agility,
        v_class.base_vitality + p_bonus_vitality,
        v_class.base_wisdom + p_bonus_wisdom
    ) RETURNING id INTO v_character_id;
    
    -- Set as active character if it's the first one
    IF NOT EXISTS (SELECT 1 FROM characters WHERE user_id = p_user_id AND id != v_character_id) THEN
        UPDATE profiles 
        SET 
            active_character_id = v_character_id,
            character_created = true
        WHERE id = p_user_id;
    END IF;
    
    -- Give class-specific starting item
    IF v_class.starter_item_name IS NOT NULL THEN
        SELECT id INTO v_starter_item_id FROM items WHERE name = v_class.starter_item_name LIMIT 1;
        
        IF v_starter_item_id IS NOT NULL THEN
            INSERT INTO player_items (user_id, item_id, quantity)
            VALUES (p_user_id, v_starter_item_id, 1)
            ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = player_items.quantity + 1;
        END IF;
    END IF;
    
    RETURN jsonb_build_object('success', true, 'character_id', v_character_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GET CHARACTER CLASSES FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION get_character_classes()
RETURNS TABLE (
    id VARCHAR(20),
    name VARCHAR(50),
    display_name VARCHAR(50),
    description TEXT,
    emoji VARCHAR(10),
    base_strength INT,
    base_intellect INT,
    base_agility INT,
    base_vitality INT,
    base_wisdom INT,
    bonus_points INT,
    starter_item_name VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.id,
        cc.name,
        cc.display_name,
        cc.description,
        cc.emoji,
        cc.base_strength,
        cc.base_intellect,
        cc.base_agility,
        cc.base_vitality,
        cc.base_wisdom,
        cc.bonus_points,
        cc.starter_item_name
    FROM character_classes cc
    ORDER BY cc.id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Data seeding completed successfully!';
    RAISE NOTICE '🎭 4 Character classes added';
    RAISE NOTICE '🎁 20 Items added (common to legendary)';
    RAISE NOTICE '';
    RAISE NOTICE '🎮 Next: Run 03_fix_user_accounts.sql if you have existing users';
END $$;
