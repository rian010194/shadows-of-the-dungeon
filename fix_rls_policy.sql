-- ============================================
-- FIX: RLS Policy for Profile Creation
-- ============================================

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a more permissive policy that allows authenticated users to create their profile
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Also make sure authenticated users can read all profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies updated! Signup should work now.';
END $$;

