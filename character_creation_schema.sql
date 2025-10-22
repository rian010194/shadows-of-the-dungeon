-- ============================================
-- CHARACTER CREATION SYSTEM
-- ============================================
-- Run this in Supabase SQL Editor to add character system
-- This should be run AFTER supabase_schema.sql and update_schema_stashhub.sql

-- ============================================
-- ADD CHARACTER FIELDS TO PROFILES
-- ============================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS character_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS character_class VARCHAR(20), -- mage, warrior, rogue, seer
ADD COLUMN IF NOT EXISTS strength INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS intellect INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS agility INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS vitality INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS wisdom INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS character_created BOOLEAN DEFAULT false;

-- ============================================
-- CHARACTER CLASSES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS character_classes (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(50) NOT NULL, -- Swedish name
    description TEXT,
    emoji VARCHAR(10),
    base_strength INT DEFAULT 5,
    base_intellect INT DEFAULT 5,
    base_agility INT DEFAULT 5,
    base_vitality INT DEFAULT 5,
    base_wisdom INT DEFAULT 5,
    bonus_points INT DEFAULT 5, -- Extra points to allocate
    starter_item_name VARCHAR(100) -- Reference to items table by name
);

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
-- FUNCTION TO CREATE CHARACTER
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
    
    -- Check if character name is already taken
    IF EXISTS (SELECT 1 FROM profiles WHERE LOWER(character_name) = LOWER(TRIM(p_character_name)) AND id != p_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Character name already taken');
    END IF;
    
    -- Update profile with character
    UPDATE profiles SET
        character_name = TRIM(p_character_name),
        character_class = p_class_id,
        strength = v_class.base_strength + p_bonus_strength,
        intellect = v_class.base_intellect + p_bonus_intellect,
        agility = v_class.base_agility + p_bonus_agility,
        vitality = v_class.base_vitality + p_bonus_vitality,
        wisdom = v_class.base_wisdom + p_bonus_wisdom,
        character_created = true
    WHERE id = p_user_id;
    
    -- Give class-specific starting item
    IF v_class.starter_item_name IS NOT NULL THEN
        SELECT id INTO v_starter_item_id FROM items WHERE name = v_class.starter_item_name LIMIT 1;
        
        IF v_starter_item_id IS NOT NULL THEN
            INSERT INTO player_items (user_id, item_id, quantity)
            VALUES (p_user_id, v_starter_item_id, 1)
            ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = player_items.quantity + 1;
        END IF;
    END IF;
    
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION TO GET CHARACTER CLASSES
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
    RAISE NOTICE '✅ Character creation system added successfully!';
    RAISE NOTICE '🎭 4 Character classes: Mage, Warrior, Rogue, Seer';
    RAISE NOTICE '📊 5 Stats: Strength, Intellect, Agility, Vitality, Wisdom';
    RAISE NOTICE '🎁 Each class gets a unique starter item';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next: Players can create characters with custom names!';
END $$;

