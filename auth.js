// ============================================
// AUTHENTICATION SYSTEM
// ============================================

let currentUser = null;

// ----------------------------------------
// Sign Up
// ----------------------------------------
async function signUp(email, password, username) {
    try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username
                }
            }
        });

        if (authError) throw authError;

        // Create profile in database
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([
                {
                    id: authData.user.id,
                    username: username,
                    email: email,
                    games_played: 0,
                    games_won: 0
                }
            ]);

        if (profileError) throw profileError;

        addToLog('✅ Account created successfully! Please check your email to verify.', 'success');
        return { success: true, user: authData.user };
    } catch (error) {
        console.error('Signup error:', error);
        addToLog(`❌ Signup failed: ${error.message}`, 'warning');
        return { success: false, error: error.message };
    }
}

// ----------------------------------------
// Sign In
// ----------------------------------------
async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        currentUser = data.user;
        
        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profile) {
            currentUser.profile = profile;
        }

        addToLog(`✅ Welcome back, ${currentUser.profile?.username || currentUser.email}!`, 'success');
        return { success: true, user: currentUser };
    } catch (error) {
        console.error('Login error:', error);
        addToLog(`❌ Login failed: ${error.message}`, 'warning');
        return { success: false, error: error.message };
    }
}

// ----------------------------------------
// Sign Out
// ----------------------------------------
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        currentUser = null;
        addToLog('👋 Signed out successfully', 'info');
        showAuthScreen();
        return { success: true };
    } catch (error) {
        console.error('Signout error:', error);
        return { success: false, error: error.message };
    }
}

// ----------------------------------------
// Check Session
// ----------------------------------------
async function checkSession() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            currentUser = session.user;
            
            // Get profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            
            if (profile) {
                currentUser.profile = profile;
            }
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Session check error:', error);
        return false;
    }
}

// ----------------------------------------
// Get Current User
// ----------------------------------------
function getCurrentUser() {
    return currentUser;
}

// ----------------------------------------
// Update User Stats
// ----------------------------------------
async function updateUserStats(won = false, loot = 0) {
    if (!currentUser) return;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .update({
                games_played: currentUser.profile.games_played + 1,
                games_won: currentUser.profile.games_won + (won ? 1 : 0),
                total_loot: (currentUser.profile.total_loot || 0) + loot
            })
            .eq('id', currentUser.id)
            .select()
            .single();

        if (error) throw error;
        
        currentUser.profile = data;
        console.log('✅ Stats updated');
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

