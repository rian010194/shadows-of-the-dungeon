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
        addToLog('🎁 Starter items added to your stash!', 'success');
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
        } else {
            // Handle 406 (no row) gracefully
            currentUser.profile = currentUser.profile || {};
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
            
            // Ensure starter items and quests are initialized
            await ensurePlayerInitialized();
            
            // Check if character needs to be created
            if (!currentUser.profile.character_created) {
                return 'needs_character';
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
// Ensure Player is Initialized (for existing users)
// ----------------------------------------
async function ensurePlayerInitialized() {
    if (!currentUser) return;
    
    try {
        // Check if user has items
        const { data: items } = await supabase
            .from('player_items')
            .select('id')
            .eq('user_id', currentUser.id)
            .limit(1);
        
        // If no items, give starter items
        if (!items || items.length === 0) {
            await supabase.rpc('give_starter_items', { p_user_id: currentUser.id });
            console.log('✅ Starter items given to existing user');
        }
        
        // Check if user has quests
        const { data: quests } = await supabase
            .from('player_quests')
            .select('id')
            .eq('user_id', currentUser.id)
            .limit(1);
        
        // If no quests, initialize them
        if (!quests || quests.length === 0) {
            await supabase.rpc('initialize_player_quests', { p_user_id: currentUser.id });
            console.log('✅ Quests initialized for existing user');
        }
    } catch (error) {
        console.error('Error ensuring player initialized:', error);
    }
}

// ----------------------------------------
// Get Current User
// ----------------------------------------
function getCurrentUser() {
    return currentUser;
}

// ----------------------------------------
// Update User Stats (After Game)
// ----------------------------------------
async function updateUserStats(won = false, loot = 0, goldEarned = 0, escaped = false) {
    if (!currentUser) return;

    try {
        const currentGold = currentUser.profile.gold || 0;
        
        const { data, error } = await supabase
            .from('profiles')
            .update({
                games_played: currentUser.profile.games_played + 1,
                games_won: currentUser.profile.games_won + (won ? 1 : 0),
                total_loot: (currentUser.profile.total_loot || 0) + loot,
                gold: currentGold + goldEarned
            })
            .eq('id', currentUser.id)
            .select()
            .single();

        if (error) throw error;
        
        currentUser.profile = data;
        
        // Update gold display in all parts of the app
        if (typeof updateGoldDisplay === 'function') {
            updateGoldDisplay();
        }
        
        console.log('✅ Stats updated');
        
        // Update quest progress
        if (typeof updateQuestProgress === 'function') {
            await updateQuestProgress('games_played', 1);
            if (won) await updateQuestProgress('games_won', 1);
            if (loot > 0) await updateQuestProgress('loot_collected', loot);
            if (escaped) await updateQuestProgress('escapes', 1);
        }
        
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

