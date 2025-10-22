-- Fix character system - run this in Supabase SQL Editor
-- This script fixes the character display and creation issues

-- 1. Ensure character_classes table exists and has data
INSERT INTO character_classes (id, name, display_name, base_strength, base_intellect, base_agility, base_vitality, base_wisdom, bonus_points, starter_item_name)
VALUES 
    ('mage', 'Mage', 'Mage', 3, 8, 4, 5, 7, 5, 'Magic Staff'),
    ('warrior', 'Warrior', 'Warrior', 8, 3, 5, 7, 4, 5, 'Iron Sword'),
    ('rogue', 'Rogue', 'Rogue', 5, 4, 8, 4, 6, 5, 'Dagger'),
    ('seer', 'Seer', 'Seer', 4, 7, 5, 6, 8, 5, 'Crystal Ball')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    base_strength = EXCLUDED.base_strength,
    base_intellect = EXCLUDED.base_intellect,
    base_agility = EXCLUDED.base_agility,
    base_vitality = EXCLUDED.base_vitality,
    base_wisdom = EXCLUDED.base_wisdom,
    bonus_points = EXCLUDED.bonus_points,
    starter_item_name = EXCLUDED.starter_item_name;

-- 2. Ensure characters table has proper structure
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS character_class VARCHAR(20),
ADD COLUMN IF NOT EXISTS strength INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS intellect INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS agility INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS vitality INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS wisdom INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS games_played INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS games_won INT DEFAULT 0;

-- 3. Add foreign key constraint if missing
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

-- 4. Ensure create_character function exists
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
    SELECT id INTO v_starter_item_id 
    FROM items 
    WHERE name = v_class.starter_item_name 
    LIMIT 1;
    
    IF v_starter_item_id IS NOT NULL THEN
        INSERT INTO player_items (user_id, item_id, quantity)
        VALUES (p_user_id, v_starter_item_id, 1);
    END IF;
    
    RETURN jsonb_build_object('success', true, 'character_id', v_character_id);
END;
$$ LANGUAGE plpgsql;

-- 5. Clean up excess characters (keep only 3 most recent per user)
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT p.id, p.email, COUNT(c.id) as char_count
        FROM profiles p
        LEFT JOIN characters c ON p.id = c.user_id
        GROUP BY p.id, p.email
        HAVING COUNT(c.id) > 3
    LOOP
        -- Delete excess characters (keep only the 3 most recent)
        DELETE FROM characters 
        WHERE user_id = user_record.id 
        AND id NOT IN (
            SELECT id 
            FROM characters 
            WHERE user_id = user_record.id 
            ORDER BY created_at DESC 
            LIMIT 3
        );
    END LOOP;
END $$;

-- 6. Test the system
SELECT 'Character system test:' as info;
SELECT 
    p.email,
    COUNT(c.id) as character_count
FROM profiles p
LEFT JOIN characters c ON p.id = c.user_id
GROUP BY p.id, p.email
ORDER BY character_count DESC;
