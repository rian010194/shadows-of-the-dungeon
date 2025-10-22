// ============================================
// SUPABASE CONFIGURATION
// ============================================

// IMPORTANT: Replace these with your actual Supabase credentials
// Get them from: https://app.supabase.com/project/_/settings/api

const SUPABASE_CONFIG = {
    url: 'https://wzytbeemdgigxalvvogi.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6eXRiZWVtZGdpZ3hhbHZ2b2dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTc0MTAsImV4cCI6MjA3NjYzMzQxMH0.KK9l329q0xYrInO6tk0WzjUk0PTfyO3YoV20z7arpBs'
};

// Initialize Supabase client (will be set after Supabase loads)
let supabase = null;

// Initialize Supabase when script loads
function initializeSupabase() {
    if (typeof window.supabase !== 'undefined') {
        // Configure Supabase with persistSession option to allow multiple sessions
        supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                flowType: 'pkce',
                // Allow multiple tabs/windows with different sessions
                storageKey: 'supabase.auth.token.' + Math.random().toString(36).substring(2, 15)
            }
        });
        console.log('✅ Supabase initialized (multi-session support enabled)');
        return true;
    } else {
        console.error('❌ Supabase library not loaded');
        return false;
    }
}

// ============================================
// GAME CONFIGURATION
// ============================================

const GAME_CONFIG = {
    MAX_PLAYERS: 8,
    MIN_PLAYERS_FOR_START: 2, // Minimum real players to start
    MATCHMAKING_TIMEOUT: 30000, // 30 seconds before filling with AI
    CORRUPTED_RATIO: 0.3, // 30% of players are corrupted
};

