-- ============================================
-- 03. FIX USER ACCOUNTS (Run this THIRD if needed)
-- ============================================
-- This script fixes existing user accounts
-- Only run this if you have existing users with problems

-- ============================================
-- CHECK DATABASE STATUS
-- ============================================

SELECT 
    'Database status check' as step,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN character_created = true THEN 1 END) as users_with_characters,
    COUNT(CASE WHEN active_character_id IS NOT NULL THEN 1 END) as users_with_active_character,
    COUNT(CASE WHEN gold > 0 THEN 1 END) as users_with_gold
FROM profiles;

-- ============================================
-- FIX MISSING COLUMNS
-- ============================================

-- Add missing columns to profiles if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS character_created BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS active_character_id UUID,
ADD COLUMN IF NOT EXISTS gold INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_loot INT DEFAULT 0;

-- ============================================
-- MIGRATE EXISTING CHARACTERS
-- ============================================

-- Migrate characters from profiles to characters table (if they exist)
DO $$ 
BEGIN
    -- Only migrate if profiles table has character data
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'character_name'
        AND table_schema = 'public'
    ) THEN
        -- Insert characters from profiles
        INSERT INTO characters (
            user_id, 
            character_name, 
            character_class, 
            strength, 
            intellect, 
            agility, 
            vitality, 
            wisdom,
            games_played,
            games_won
        )
        SELECT 
            id,
            character_name,
            character_class,
            strength,
            intellect,
            agility,
            vitality,
            wisdom,
            games_played,
            games_won
        FROM profiles 
        WHERE character_name IS NOT NULL 
        AND character_created = true
        ON CONFLICT (user_id, character_name) DO NOTHING;
        
        -- Set active character for users who have characters
        UPDATE profiles 
        SET active_character_id = (
            SELECT id FROM characters 
            WHERE user_id = profiles.id 
            ORDER BY created_at DESC 
            LIMIT 1
        )
        WHERE character_created = true 
        AND active_character_id IS NULL;
        
        RAISE NOTICE 'Migrated existing characters from profiles to characters table';
    ELSE
        RAISE NOTICE 'No existing characters to migrate';
    END IF;
END $$;

-- ============================================
-- FIX SPECIFIC USER (Replace with your email)
-- ============================================

-- Uncomment and modify this section if you need to fix a specific user
/*
DO $$
DECLARE
    user_email TEXT := 'your-email@example.com';
    user_profile_id UUID;
BEGIN
    -- Get user profile ID
    SELECT id INTO user_profile_id FROM profiles WHERE email = user_email;
    
    IF user_profile_id IS NOT NULL THEN
        -- Update basic profile fields
        UPDATE profiles 
        SET 
            gold = COALESCE(gold, 0),
            total_loot = COALESCE(total_loot, 0),
            character_created = COALESCE(character_created, false)
        WHERE id = user_profile_id;
        
        RAISE NOTICE 'Fixed profile for user: %', user_email;
    ELSE
        RAISE NOTICE 'User not found: %', user_email;
    END IF;
END $$;
*/

-- ============================================
-- CLEANUP EMPTY LOBBIES
-- ============================================

-- Remove empty lobbies
DELETE FROM lobbies 
WHERE player_count = 0 
AND status = 'waiting';

-- Remove old waiting lobbies (older than 1 hour)
DELETE FROM lobbies 
WHERE status = 'waiting' 
AND created_at < NOW() - INTERVAL '1 hour';

-- Remove finished lobbies older than 24 hours
DELETE FROM lobbies 
WHERE status = 'finished' 
AND finished_at < NOW() - INTERVAL '24 hours';

-- ============================================
-- FINAL STATUS CHECK
-- ============================================

SELECT 
    'Final status check' as step,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN character_created = true THEN 1 END) as users_with_characters,
    COUNT(CASE WHEN active_character_id IS NOT NULL THEN 1 END) as users_with_active_character,
    COUNT(CASE WHEN gold > 0 THEN 1 END) as users_with_gold
FROM profiles;

-- Show remaining lobbies
SELECT 
    'Remaining lobbies' as step,
    COUNT(*) as total_lobbies,
    COUNT(CASE WHEN player_count = 0 THEN 1 END) as empty_lobbies
FROM lobbies;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ User accounts fixed successfully!';
    RAISE NOTICE '🔧 Missing columns added';
    RAISE NOTICE '🔄 Existing characters migrated';
    RAISE NOTICE '🗑️ Empty lobbies cleaned up';
    RAISE NOTICE '';
    RAISE NOTICE '🎮 Your database is now ready to use!';
END $$;
