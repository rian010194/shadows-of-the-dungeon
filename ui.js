// ============================================
// UI MANAGEMENT
// ============================================

// ----------------------------------------
// Show/Hide Screens
// ----------------------------------------
function hideAllScreens() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('character-creation-screen').style.display = 'none';
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('stashhub-screen').style.display = 'none';
    document.getElementById('lobby-browser-screen').style.display = 'none';
    document.getElementById('matchmaking-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'none';
}

function showAuthScreen() {
    hideAllScreens();
    document.getElementById('auth-screen').style.display = 'block';
    clearLog();
    addToLog('🏰 Welcome to Shadows of the Dungeon', 'info');
    addToLog('Please sign in or create an account to play', 'info');
}

async function showMenuScreen() {
    hideAllScreens();
    
    // Check if character needs to be created
    if (currentUser && currentUser.profile && !currentUser.profile.character_created) {
        showCharacterCreation();
        return;
    }
    
    document.getElementById('menu-screen').style.display = 'block';
    
    if (currentUser) {
        // Show character name if available
        const displayName = currentUser.profile?.character_name || currentUser.profile?.username || currentUser.email;
        document.getElementById('username-display').textContent = displayName;
        
        // Show class emoji if available
        const classEmojis = {
            'mage': '🔮',
            'warrior': '⚔️',
            'rogue': '🗡️',
            'seer': '🔯'
        };
        const classEmoji = classEmojis[currentUser.profile?.character_class] || '';
        if (classEmoji) {
            document.getElementById('username-display').textContent = `${classEmoji} ${displayName}`;
        }
        
        document.getElementById('user-stats').textContent = 
            `Games: ${currentUser.profile?.games_played || 0} | Wins: ${currentUser.profile?.games_won || 0}`;
        
        // Update gold display
        await refreshPlayerGold();
    }
}

async function refreshPlayerGold() {
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('gold')
            .eq('id', currentUser.id)
            .single();
        
        if (profile) {
            const goldDisplay = document.getElementById('gold-amount');
            if (goldDisplay) {
                goldDisplay.textContent = profile.gold || 0;
            }
        }
    } catch (error) {
        console.error('Error refreshing gold:', error);
    }
}

function showMatchmakingScreen() {
    hideAllScreens();
    document.getElementById('matchmaking-screen').style.display = 'block';
}

function showLobbyBrowserScreen() {
    hideAllScreens();
    document.getElementById('lobby-browser-screen').style.display = 'block';
}

function showGameScreen() {
    hideAllScreens();
    document.getElementById('game-screen').style.display = 'block';
}

// ----------------------------------------
// Auth Screen Handlers
// ----------------------------------------
function handleSignUp() {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const username = document.getElementById('signup-username').value;

    if (!email || !password || !username) {
        addToLog('❌ Please fill in all fields', 'warning');
        return;
    }

    if (password.length < 6) {
        addToLog('❌ Password must be at least 6 characters', 'warning');
        return;
    }

    signUp(email, password, username).then(result => {
        if (result.success) {
            // Clear form
            document.getElementById('signup-email').value = '';
            document.getElementById('signup-password').value = '';
            document.getElementById('signup-username').value = '';
        }
    });
}

function handleSignIn() {
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;

    if (!email || !password) {
        addToLog('❌ Please fill in all fields', 'warning');
        return;
    }

    signIn(email, password).then(async result => {
        if (result.success) {
            // Initialize character system
            await initializeCharacterSystem();
            
            // Check if character needs to be created
            if (!currentUser.profile.character_created) {
                showCharacterCreation();
            } else {
                showMenuScreen();
            }
        }
    });
}

function toggleAuthMode() {
    const signupForm = document.getElementById('signup-form');
    const signinForm = document.getElementById('signin-form');
    
    if (signupForm.style.display === 'none') {
        signupForm.style.display = 'block';
        signinForm.style.display = 'none';
        document.getElementById('toggle-auth-text').textContent = 'Already have an account? Sign In';
    } else {
        signupForm.style.display = 'none';
        signinForm.style.display = 'block';
        document.getElementById('toggle-auth-text').textContent = "Don't have an account? Sign Up";
    }
}

// ----------------------------------------
// Lobby UI Updates
// ----------------------------------------
function updateLobbyUI() {
    if (!currentLobby) return;

    const playersList = document.getElementById('lobby-players-list');
    const playerCount = document.getElementById('lobby-player-count');
    const lobbyCode = document.getElementById('lobby-code-display');
    
    playerCount.textContent = `${currentLobby.player_count} / ${GAME_CONFIG.MAX_PLAYERS} Players`;
    
    // Display lobby ID (first 8 characters for readability)
    if (lobbyCode) {
        lobbyCode.textContent = `Lobby ID: ${currentLobby.id.substring(0, 8)}`;
    }
    
    playersList.innerHTML = '';
    
    if (currentLobby.lobby_players) {
        currentLobby.lobby_players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'lobby-player';
            playerDiv.innerHTML = `
                <span class="lobby-player-name">${player.username}</span>
                ${player.user_id === currentLobby.host_id ? '<span class="host-badge">HOST</span>' : ''}
                ${player.user_id === currentUser.id ? '<span class="you-badge">YOU</span>' : ''}
            `;
            playersList.appendChild(playerDiv);
        });
    }
    
    // Add AI placeholder slots
    const aiCount = GAME_CONFIG.MAX_PLAYERS - currentLobby.player_count;
    for (let i = 0; i < aiCount; i++) {
        const aiDiv = document.createElement('div');
        aiDiv.className = 'lobby-player ai-player';
        aiDiv.innerHTML = `<span class="lobby-player-name">🤖 AI Slot ${i + 1}</span>`;
        playersList.appendChild(aiDiv);
    }
    
    // Show/hide start button (only for host)
    const startBtn = document.getElementById('start-game-btn');
    if (currentLobby.host_id === currentUser.id && currentLobby.player_count >= GAME_CONFIG.MIN_PLAYERS_FOR_START) {
        startBtn.style.display = 'inline-block';
    } else {
        startBtn.style.display = 'none';
    }
}

// ----------------------------------------
// Play Mode Selection
// ----------------------------------------
function selectSinglePlayer() {
    showGameScreen();
    startGame(); // Original single-player game
}

function selectMultiplayer() {
    findGame(); // Start matchmaking
}

// ----------------------------------------
// Handle Sign Out from Menu
// ----------------------------------------
function handleSignOutFromMenu() {
    signOut().then(() => {
        showAuthScreen();
    });
}

// ----------------------------------------
// Lobby Browser Functions
// ----------------------------------------
async function showBrowseLobbies() {
    if (!currentUser) {
        addToLog('❌ Please sign in first', 'warning');
        return;
    }
    
    showLobbyBrowserScreen();
    clearLog();
    addToLog('🔍 Loading available lobbies...', 'info');
    await refreshLobbiesList();
}

async function refreshLobbiesList() {
    try {
        const { data: lobbies, error } = await supabase
            .from('lobbies')
            .select('*, lobby_players(*)')
            .eq('status', 'waiting')
            .lt('player_count', GAME_CONFIG.MAX_PLAYERS)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        const lobbiesContainer = document.getElementById('available-lobbies');
        lobbiesContainer.innerHTML = '';

        if (!lobbies || lobbies.length === 0) {
            lobbiesContainer.innerHTML = '<p class="no-lobbies">No available lobbies. Create one!</p>';
            addToLog('No available lobbies found.', 'info');
            return;
        }

        addToLog(`Found ${lobbies.length} available lobbies!`, 'success');

        lobbies.forEach(lobby => {
            const lobbyDiv = document.createElement('div');
            lobbyDiv.className = 'lobby-card';
            
            const lobbyId = lobby.id.substring(0, 8);
            const playerCount = lobby.player_count;
            const maxPlayers = lobby.max_players;
            const hostName = lobby.lobby_players.find(p => p.user_id === lobby.host_id)?.username || 'Unknown';

            lobbyDiv.innerHTML = `
                <div class="lobby-card-header">
                    <span class="lobby-id">🏰 ${lobbyId}</span>
                    <span class="lobby-host">Host: ${hostName}</span>
                </div>
                <div class="lobby-card-info">
                    <span class="lobby-players">👥 ${playerCount}/${maxPlayers}</span>
                    <button onclick="joinSpecificLobby('${lobby.id}')" class="join-btn">Join Lobby</button>
                </div>
            `;
            
            lobbiesContainer.appendChild(lobbyDiv);
        });

    } catch (error) {
        console.error('Refresh lobbies error:', error);
        addToLog(`❌ Error loading lobbies: ${error.message}`, 'warning');
    }
}

async function joinSpecificLobby(lobbyId) {
    clearLog();
    addToLog(`🔗 Joining lobby...`, 'info');
    showMatchmakingScreen();
    await joinLobby(lobbyId);
}

async function showCreateLobby() {
    if (!currentUser) {
        addToLog('❌ Please sign in first', 'warning');
        return;
    }

    clearLog();
    showMatchmakingScreen();
    addToLog('🏰 Creating your lobby...', 'info');
    
    await createLobbyManual();
}

