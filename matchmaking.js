// ============================================
// MATCHMAKING SYSTEM
// ============================================

let currentLobby = null;
let matchmakingChannel = null;
let matchmakingTimeout = null;

// ----------------------------------------
// Find or Create Game
// ----------------------------------------
async function findGame() {
    if (!currentUser) {
        addToLog('❌ Please sign in first', 'warning');
        return;
    }

    try {
        showMatchmakingScreen();
        addToLog('🔍 Searching for game...', 'info');

        // First, try to find an existing waiting lobby
        const { data: existingLobbies, error: findError } = await supabase
            .from('lobbies')
            .select('*, lobby_players(*)')
            .eq('status', 'waiting')
            .lt('player_count', GAME_CONFIG.MAX_PLAYERS)
            .order('created_at', { ascending: true })
            .limit(1);

        if (findError) throw findError;

        if (existingLobbies && existingLobbies.length > 0) {
            // Join existing lobby
            const lobby = existingLobbies[0];
            await joinLobby(lobby.id);
        } else {
            // Create new lobby
            await createLobby();
        }
    } catch (error) {
        console.error('Find game error:', error);
        addToLog(`❌ Error finding game: ${error.message}`, 'warning');
        showMenuScreen();
    }
}

// ----------------------------------------
// Create Lobby
// ----------------------------------------
async function createLobby() {
    try {
        const { data: lobby, error } = await supabase
            .from('lobbies')
            .insert([
                {
                    host_id: currentUser.id,
                    status: 'waiting',
                    player_count: 0,
                    max_players: GAME_CONFIG.MAX_PLAYERS
                }
            ])
            .select()
            .single();

        if (error) throw error;

        currentLobby = lobby;
        addToLog(`✅ Game lobby created! Lobby ID: ${lobby.id.substring(0, 8)}`, 'success');
        
        // Join own lobby
        await joinLobby(lobby.id);
        
    } catch (error) {
        console.error('Create lobby error:', error);
        addToLog(`❌ Error creating lobby: ${error.message}`, 'warning');
    }
}

// ----------------------------------------
// Join Lobby
// ----------------------------------------
async function joinLobby(lobbyId) {
    try {
        // Add player to lobby
        const { data: player, error: playerError } = await supabase
            .from('lobby_players')
            .insert([
                {
                    lobby_id: lobbyId,
                    user_id: currentUser.id,
                    username: currentUser.profile?.username || currentUser.email,
                    ready: false
                }
            ])
            .select()
            .single();

        if (playerError) throw playerError;

        // Update lobby player count
        const { data: lobby, error: lobbyError } = await supabase
            .rpc('increment_player_count', { lobby_id: lobbyId });

        // Get full lobby data
        const { data: fullLobby, error: fetchError } = await supabase
            .from('lobbies')
            .select('*, lobby_players(*)')
            .eq('id', lobbyId)
            .single();

        if (fetchError) throw fetchError;

        currentLobby = fullLobby;
        
        addToLog(`✅ Joined lobby! Players: ${fullLobby.player_count}/${GAME_CONFIG.MAX_PLAYERS}`, 'success');
        
        // Subscribe to lobby updates
        subscribeToLobby(lobbyId);
        
        // Update UI
        updateLobbyUI();
        
        // Start matchmaking timeout
        startMatchmakingTimeout();
        
    } catch (error) {
        console.error('Join lobby error:', error);
        addToLog(`❌ Error joining lobby: ${error.message}`, 'warning');
    }
}

// ----------------------------------------
// Subscribe to Lobby Updates
// ----------------------------------------
function subscribeToLobby(lobbyId) {
    // Unsubscribe from previous channel if exists
    if (matchmakingChannel) {
        supabase.removeChannel(matchmakingChannel);
    }

    // Subscribe to lobby changes
    matchmakingChannel = supabase
        .channel(`lobby:${lobbyId}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'lobby_players',
            filter: `lobby_id=eq.${lobbyId}`
        }, async (payload) => {
            console.log('Lobby update:', payload);
            await refreshLobbyData();
        })
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'lobbies',
            filter: `id=eq.${lobbyId}`
        }, async (payload) => {
            console.log('Lobby status update:', payload);
            
            if (payload.new.status === 'started') {
                // Game is starting!
                clearTimeout(matchmakingTimeout);
                await startMultiplayerGame();
            }
        })
        .subscribe();
}

// ----------------------------------------
// Refresh Lobby Data
// ----------------------------------------
async function refreshLobbyData() {
    if (!currentLobby) return;

    try {
        const { data: lobby, error } = await supabase
            .from('lobbies')
            .select('*, lobby_players(*)')
            .eq('id', currentLobby.id)
            .single();

        if (error) throw error;

        currentLobby = lobby;
        updateLobbyUI();
        
    } catch (error) {
        console.error('Refresh lobby error:', error);
    }
}

// ----------------------------------------
// Start Matchmaking Timeout
// ----------------------------------------
function startMatchmakingTimeout() {
    // Clear existing timeout
    if (matchmakingTimeout) {
        clearTimeout(matchmakingTimeout);
    }

    matchmakingTimeout = setTimeout(async () => {
        if (!currentLobby) return;

        const realPlayerCount = currentLobby.player_count;
        
        if (realPlayerCount >= GAME_CONFIG.MIN_PLAYERS_FOR_START) {
            // We have enough players to start, fill rest with AI
            const aiCount = GAME_CONFIG.MAX_PLAYERS - realPlayerCount;
            
            addToLog(`⏰ Matchmaking timeout! Starting with ${realPlayerCount} players and ${aiCount} AI.`, 'info');
            
            // Only host can start the game
            if (currentLobby.host_id === currentUser.id) {
                await startGame();
            }
        } else {
            addToLog(`❌ Not enough players to start. Need at least ${GAME_CONFIG.MIN_PLAYERS_FOR_START} players.`, 'warning');
            await leaveLobby();
            showMenuScreen();
        }
    }, GAME_CONFIG.MATCHMAKING_TIMEOUT);
}

// ----------------------------------------
// Start Game
// ----------------------------------------
async function startGame() {
    if (!currentLobby) return;
    
    try {
        // Update lobby status
        const { error } = await supabase
            .from('lobbies')
            .update({ status: 'started', started_at: new Date().toISOString() })
            .eq('id', currentLobby.id);

        if (error) throw error;

        addToLog('🎮 Game starting!', 'success');
        
    } catch (error) {
        console.error('Start game error:', error);
        addToLog(`❌ Error starting game: ${error.message}`, 'warning');
    }
}

// ----------------------------------------
// Leave Lobby
// ----------------------------------------
async function leaveLobby() {
    if (!currentLobby || !currentUser) return;

    try {
        // Remove player from lobby
        const { error } = await supabase
            .from('lobby_players')
            .delete()
            .eq('lobby_id', currentLobby.id)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        // Decrease player count
        await supabase.rpc('decrement_player_count', { lobby_id: currentLobby.id });

        // Unsubscribe
        if (matchmakingChannel) {
            supabase.removeChannel(matchmakingChannel);
            matchmakingChannel = null;
        }

        // Clear timeout
        if (matchmakingTimeout) {
            clearTimeout(matchmakingTimeout);
            matchmakingTimeout = null;
        }

        currentLobby = null;
        addToLog('👋 Left lobby', 'info');
        
    } catch (error) {
        console.error('Leave lobby error:', error);
    }
}

// ----------------------------------------
// Start Multiplayer Game
// ----------------------------------------
async function startMultiplayerGame() {
    clearLog();
    hideAllScreens();
    document.getElementById('game-screen').style.display = 'block';
    
    // Get all players in lobby
    const realPlayers = currentLobby.lobby_players;
    const aiCount = GAME_CONFIG.MAX_PLAYERS - realPlayers.length;
    
    addToLog(`🎮 Starting game with ${realPlayers.length} players and ${aiCount} AI!`, 'success');
    
    // Initialize game with multiplayer data
    startGameMultiplayer(realPlayers, aiCount);
}

// ----------------------------------------
// Cancel Matchmaking
// ----------------------------------------
async function cancelMatchmaking() {
    await leaveLobby();
    showMenuScreen();
}

