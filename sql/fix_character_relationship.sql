-- Fix the missing relationship between characters and character_classes
-- Run this in Supabase SQL Editor

-- 1. First, check if character_classes table exists
SELECT 'Character classes table check:' as info;
SELECT COUNT(*) as class_count FROM character_classes;

-- 2. Check if characters table exists
SELECT 'Characters table check:' as info;
SELECT COUNT(*) as character_count FROM characters;

-- 3. Check current foreign key constraints
SELECT 'Current foreign key constraints:' as info;
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'characters';

-- 4. Add the missing foreign key constraint
DO $$ 
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'characters_character_class_fkey' 
        AND table_name = 'characters'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE characters 
        ADD CONSTRAINT characters_character_class_fkey 
        FOREIGN KEY (character_class) REFERENCES character_classes(id);
        
        RAISE NOTICE 'Foreign key constraint added successfully';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- 5. Verify the constraint was added
SELECT 'Verification - Foreign key constraints after fix:' as info;
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'characters';

-- 6. Test the relationship
SELECT 'Test relationship:' as info;
SELECT 
    c.character_name,
    c.character_class,
    cc.display_name as class_name
FROM characters c
LEFT JOIN character_classes cc ON c.character_class = cc.id
LIMIT 5;
