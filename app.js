// ============================================
// APP INITIALIZATION
// ============================================

// This file handles the main app initialization and screen management

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🎮 Shadows of the Dungeon - Initializing...");
    
    // Initialize Supabase
    const supabaseReady = initializeSupabase();
    
    if (!supabaseReady) {
        // Supabase not configured - show offline mode
        console.warn("⚠️ Supabase not configured. Running in offline mode.");
        showOfflineMode();
        return;
    }
    
    // Check for existing session
    const hasSession = await checkSession();
    
    if (hasSession) {
        // User is already logged in
        console.log("✅ User session found");
        showMenuScreen();
    } else {
        // Show auth screen
        showAuthScreen();
    }
    
    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            showMenuScreen();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            showAuthScreen();
        }
    });
});

// ============================================
// OFFLINE MODE (No Supabase)
// ============================================

function showOfflineMode() {
    hideAllScreens();
    document.getElementById('game-screen').style.display = 'block';
    
    // Show original single-player mode
    updatePhaseTitle("⚠️ Offline Mode - Single Player Only");
    addToLog("🏰 Shadows of the Dungeon", "info");
    addToLog("⚠️ Multiplayer requires Supabase configuration", "warning");
    addToLog("Playing in Single Player mode", "info");
    addToLog("", "info");
    addToLog("🎯 Goal: Survive, collect loot, and escape from the dungeon", "success");
    addToLog("⚠️ But beware... some of you are corrupted...", "warning");
    
    showMainButton("Start Game", startGame);
}

// ============================================
// MULTIPLAYER GAME START (with real players + AI)
// ============================================

function startGameMultiplayer(realPlayers, aiCount) {
    clearActionButtons();
    game = new GameState();
    
    // AI names pool
    const aiNames = ["Ari", "Bjorn", "Cira", "Dusk", "Elara", "Finn", "Greta", "Hector"];
    const usedNames = realPlayers.map(p => p.username);
    const availableAiNames = aiNames.filter(name => !usedNames.includes(name));
    
    // Add real players
    realPlayers.forEach((player, index) => {
        const isCurrentPlayer = player.user_id === currentUser.id;
        const gamePlayer = new Player(index + 1, player.username, isCurrentPlayer);
        game.players.push(gamePlayer);
        
        if (isCurrentPlayer) {
            game.playerCharacter = gamePlayer;
        }
    });
    
    // Add AI players
    for (let i = 0; i < aiCount; i++) {
        const aiName = availableAiNames[i] || `AI-${i + 1}`;
        const playerId = realPlayers.length + i + 1;
        game.players.push(new Player(playerId, aiName, false));
    }
    
    const totalPlayers = game.players.length;
    
    // Assign roles (25-30% corrupted)
    const numCorrupted = Math.max(1, Math.floor(totalPlayers * 0.3));
    const shuffled = shuffleArray(game.players);
    
    for (let i = 0; i < numCorrupted; i++) {
        shuffled[i].role = "Corrupted";
    }
    
    game.players.forEach(player => {
        if (!player.role) player.role = "Innocent";
    });
    
    updatePhaseTitle("📜 Start Phase - Dungeon Awakens");
    updateRoundInfo();
    updatePlayersList();
    updateInventory();
    
    clearLog();
    addToLog("🏰 You descend into the dungeon...", "info");
    addToLog(`${totalPlayers} brave adventurers dare to enter the darkness.`, "info");
    addToLog(`${realPlayers.length} real players, ${aiCount} AI companions.`, "info");
    addToLog(`You are ${game.playerCharacter.name}.`, "success");
    addToLog(`Your role: ${game.playerCharacter.role} ${game.playerCharacter.role === "Corrupted" ? "😈" : "😇"}`, 
             game.playerCharacter.role === "Corrupted" ? "warning" : "success");
    
    if (game.playerCharacter.role === "Corrupted") {
        addToLog("🔪 You work in secret against the group. Survive and collect loot.", "warning");
    } else {
        addToLog("⚔️ Find the corrupted and survive to escape with your loot.", "success");
    }
    
    setTimeout(() => {
        showMainButton("Explore the Dungeon", explorationPhase);
    }, 1000);
}

