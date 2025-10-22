-- Test script to create a character and check if it works
-- Run this in Supabase SQL Editor to test character creation

-- First, let's see what users exist
SELECT 'Existing users:' as info;
SELECT id, email, character_created, active_character_id 
FROM profiles 
LIMIT 5;

-- Test creating a character (replace with your actual user ID)
-- You can get your user ID from the profiles table above
DO $$
DECLARE
    test_user_id UUID;
    result JSONB;
BEGIN
    -- Get the first user ID for testing
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No users found in profiles table';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testing character creation for user: %', test_user_id;
    
    -- Test the create_character function
    SELECT create_character(
        test_user_id,
        'Test Character ' || extract(epoch from now()),
        'mage',
        0, 0, 0, 0, 0
    ) INTO result;
    
    RAISE NOTICE 'Character creation result: %', result;
    
    -- Check if character was created
    IF (result->>'success')::boolean THEN
        RAISE NOTICE 'Character created successfully!';
        
        -- Show the created character
        SELECT 'Created character:' as info;
        SELECT c.*, cc.display_name as class_name
        FROM characters c
        JOIN character_classes cc ON c.character_class = cc.id
        WHERE c.user_id = test_user_id
        ORDER BY c.created_at DESC
        LIMIT 1;
    ELSE
        RAISE NOTICE 'Character creation failed: %', result->>'error';
    END IF;
END $$;

-- Check all characters for the test user
SELECT 'All characters for test user:' as info;
SELECT c.*, cc.display_name as class_name
FROM characters c
JOIN character_classes cc ON c.character_class = cc.id
WHERE c.user_id = (SELECT id FROM profiles LIMIT 1)
ORDER BY c.created_at DESC;
