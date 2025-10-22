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
// Create Lobby (for quick match)
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
// Create Lobby Manual (for manual lobby creation)
// ----------------------------------------
async function createLobbyManual() {
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
        addToLog(`✅ Lobby created! Share this ID with friends: ${lobby.id.substring(0, 8)}`, 'success');
        addToLog(`⏳ Waiting for players to join...`, 'info');
        addToLog(`💡 You can start the game anytime with AI filling empty slots!`, 'info');
        
        // Join own lobby
        await joinLobby(lobby.id);
        
        // Don't start matchmaking timeout for manual lobbies
        // Host can start manually whenever they want
        
    } catch (error) {
        console.error('Create lobby error:', error);
        addToLog(`❌ Error creating lobby: ${error.message}`, 'warning');
    }
}

// ----------------------------------------
// Join Lobby
// ----------------------------------------
async function joinLobby(lobbyId, autoStart = true) {
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
        
        // Start matchmaking timeout only if autoStart is true (for quick match)
        if (autoStart) {
            startMatchmakingTimeout();
        }
        
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
            
            // Check if we were removed from the lobby
            if (payload.eventType === 'DELETE' && payload.old.user_id === currentUser.id) {
                addToLog('👋 You were removed from the lobby', 'info');
                cleanupLobbyState();
                showMenuScreen();
                return;
            }
            
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
            } else if (payload.new.host_id !== currentUser.id && currentLobby?.host_id === currentUser.id) {
                // Host has changed - we're no longer host
                addToLog('👑 Host has changed', 'info');
                await refreshLobbyData();
            }
        })
        .on('postgres_changes', {
            event: 'DELETE',
            schema: 'public',
            table: 'lobbies',
            filter: `id=eq.${lobbyId}`
        }, async (payload) => {
            console.log('Lobby deleted:', payload);
            addToLog('🏠 Lobby was deleted by host', 'info');
            cleanupLobbyState();
            showMenuScreen();
        })
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'lobby_players',
            filter: `lobby_id=eq.${lobbyId}`
        }, async (payload) => {
            console.log('New player joined:', payload);
            await refreshLobbyData();
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

        if (error || !lobby) {
            // Lobby no longer exists
            addToLog('🏠 Lobby no longer exists (host left)', 'info');
            cleanupLobbyState();
            showMenuScreen();
            return;
        }

        currentLobby = lobby;
        
        // Check if lobby is full
        if (lobby.player_count >= GAME_CONFIG.MAX_PLAYERS) {
            addToLog('🏠 Lobby is full!', 'info');
        }
        
        // Check if lobby is closed
        if (lobby.status === 'closed') {
            addToLog('🏠 Lobby is closed!', 'warning');
            cleanupLobbyState();
            showMenuScreen();
            return;
        }
        
        // Check if we're still in the lobby
        const isInLobby = lobby.lobby_players.some(p => p.user_id === currentUser.id);
        if (!isInLobby) {
            addToLog('👋 You are no longer in this lobby', 'info');
            cleanupLobbyState();
            showMenuScreen();
            return;
        }
        
        // Check if host has changed
        if (lobby.host_id !== currentUser.id && currentLobby?.host_id === currentUser.id) {
            addToLog('👑 You are no longer the host', 'info');
        }
        
        // Update current lobby reference
        currentLobby = lobby;
        
        updateLobbyUI();
        
    } catch (error) {
        console.error('Refresh lobby error:', error);
        addToLog('❌ Error refreshing lobby data', 'warning');
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
                await startLobbyGame();
            }
        } else {
            addToLog(`❌ Not enough players to start. Need at least ${GAME_CONFIG.MIN_PLAYERS_FOR_START} players.`, 'warning');
            await leaveLobby();
            showMenuScreen();
        }
    }, GAME_CONFIG.MATCHMAKING_TIMEOUT);
}

// ----------------------------------------
// Start Lobby Game (Host initiates)
// ----------------------------------------
async function startLobbyGame() {
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
// Manual Start Game (Host can start anytime with AI fill)
// ----------------------------------------
async function manualStartGame() {
    if (!currentLobby) return;
    
    if (currentLobby.host_id !== currentUser.id) {
        addToLog('❌ Only the host can start the game!', 'warning');
        return;
    }
    
    if (currentLobby.player_count < GAME_CONFIG.MIN_PLAYERS_FOR_START) {
        addToLog(`❌ Need at least ${GAME_CONFIG.MIN_PLAYERS_FOR_START} players to start!`, 'warning');
        return;
    }
    
    const aiCount = GAME_CONFIG.MAX_PLAYERS - currentLobby.player_count;
    addToLog(`🎮 Starting game with ${currentLobby.player_count} players and ${aiCount} AI!`, 'success');
    
    // Clear any existing timeout
    if (matchmakingTimeout) {
        clearTimeout(matchmakingTimeout);
        matchmakingTimeout = null;
    }
    
    await startLobbyGame();
}

// ----------------------------------------
// Leave Lobby
// ----------------------------------------
async function leaveLobby() {
    if (!currentLobby || !currentUser) {
        addToLog('❌ No lobby to leave', 'warning');
        return;
    }

    try {
        // First check if lobby still exists and get current status
        const { data: lobbyCheck, error: checkError } = await supabase
            .from('lobbies')
            .select('id, status, host_id')
            .eq('id', currentLobby.id)
            .single();

        if (checkError || !lobbyCheck) {
            // Lobby doesn't exist anymore (host deleted it)
            addToLog('🏠 Lobby no longer exists (host left)', 'info');
            cleanupLobbyState();
            return;
        }

        // Check if lobby is still in waiting status
        if (lobbyCheck.status !== 'waiting') {
            addToLog('❌ Cannot leave lobby - game has started', 'warning');
            return;
        }

        // Check if we're the host
        const isHost = lobbyCheck.host_id === currentUser.id;
        
        if (isHost) {
            // Host is leaving - need to handle this specially
            await handleHostLeave();
        } else {
            // Regular player leaving
            await handlePlayerLeave();
        }
        
    } catch (error) {
        console.error('Leave lobby error:', error);
        addToLog(`❌ Error leaving lobby: ${error.message}`, 'warning');
        
        // Force cleanup even if there was an error
        cleanupLobbyState();
    }
}

// ----------------------------------------
// Handle Host Leave
// ----------------------------------------
async function handleHostLeave() {
    try {
        // Get remaining players
        const { data: remainingPlayers, error: playersError } = await supabase
            .from('lobby_players')
            .select('user_id, username')
            .eq('lobby_id', currentLobby.id)
            .neq('user_id', currentUser.id);

        if (playersError) throw playersError;

        if (remainingPlayers && remainingPlayers.length > 0) {
            // Transfer host to another player
            const newHost = remainingPlayers[0];
            
            const { error: updateError } = await supabase
                .from('lobbies')
                .update({ host_id: newHost.user_id })
                .eq('id', currentLobby.id);

            if (updateError) throw updateError;
            
            addToLog(`👑 Host transferred to ${newHost.username}`, 'info');
        } else {
            // No other players - delete the lobby
            const { error: deleteError } = await supabase
                .from('lobbies')
                .delete()
                .eq('id', currentLobby.id);

            if (deleteError) throw deleteError;
            
            addToLog('🏠 Lobby deleted (no other players)', 'info');
        }

        // Remove ourselves from lobby
        await removePlayerFromLobby();
        
    } catch (error) {
        console.error('Host leave error:', error);
        addToLog(`❌ Error handling host leave: ${error.message}`, 'warning');
        cleanupLobbyState();
    }
}

// ----------------------------------------
// Handle Regular Player Leave
// ----------------------------------------
async function handlePlayerLeave() {
    try {
        await removePlayerFromLobby();
    } catch (error) {
        console.error('Player leave error:', error);
        addToLog(`❌ Error leaving lobby: ${error.message}`, 'warning');
        cleanupLobbyState();
    }
}

// ----------------------------------------
// Remove Player from Lobby
// ----------------------------------------
async function removePlayerFromLobby() {
    const { error } = await supabase
        .from('lobby_players')
        .delete()
        .eq('lobby_id', currentLobby.id)
        .eq('user_id', currentUser.id);

    if (error) throw error;

    // Decrease player count
    await supabase.rpc('decrement_player_count', { lobby_id: currentLobby.id });

    addToLog('👋 Left lobby', 'info');
    cleanupLobbyState();
}

// ----------------------------------------
// Cleanup Lobby State
// ----------------------------------------
function cleanupLobbyState() {
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
// Add AI Players
// ----------------------------------------
async function addAiPlayers() {
    if (!currentLobby) return;
    
    if (currentLobby.host_id !== currentUser.id) {
        addToLog('❌ Only the host can add AI players!', 'warning');
        return;
    }
    
    const emptySlots = GAME_CONFIG.MAX_PLAYERS - currentLobby.player_count;
    if (emptySlots <= 0) {
        addToLog('❌ No empty slots available!', 'warning');
        return;
    }
    
    try {
        addToLog(`🤖 Adding ${emptySlots} AI player${emptySlots > 1 ? 's' : ''}...`, 'info');
        
        // Create AI players in the lobby_players table
        const aiPlayers = [];
        for (let i = 0; i < emptySlots; i++) {
            aiPlayers.push({
                lobby_id: currentLobby.id,
                user_id: null, // AI players have null user_id
                username: `AI_${i + 1}`,
                ready: true, // AI players are always ready
                is_ai: true
            });
        }
        
        const { error } = await supabase
            .from('lobby_players')
            .insert(aiPlayers);
            
        if (error) throw error;
        
        // Update lobby player count
        await supabase.rpc('increment_player_count', { 
            lobby_id: currentLobby.id, 
            increment: emptySlots 
        });
        
        addToLog(`✅ Added ${emptySlots} AI player${emptySlots > 1 ? 's' : ''}!`, 'success');
        
        // Refresh lobby data
        await refreshLobbyData();
        
    } catch (error) {
        console.error('Add AI players error:', error);
        addToLog(`❌ Error adding AI players: ${error.message}`, 'warning');
    }
}

// ----------------------------------------
// Cancel Matchmaking
// ----------------------------------------
async function cancelMatchmaking() {
    try {
        await leaveLobby();
    } catch (error) {
        console.error('Cancel matchmaking error:', error);
        addToLog('❌ Error leaving lobby', 'warning');
    } finally {
        // Always return to menu, even if leave failed
        showMenuScreen();
    }
}

