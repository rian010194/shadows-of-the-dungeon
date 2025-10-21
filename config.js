// ============================================
// SUPABASE CONFIGURATION
// ============================================

// IMPORTANT: Replace these with your actual Supabase credentials
// Get them from: https://app.supabase.com/project/_/settings/api

const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL', // e.g., 'https://xxxxxxxxxxxxx.supabase.co'
    anonKey: 'YOUR_SUPABASE_ANON_KEY' // Your anon/public key
};

// Initialize Supabase client (will be set after Supabase loads)
let supabase = null;

// Initialize Supabase when script loads
function initializeSupabase() {
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('✅ Supabase initialized');
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

