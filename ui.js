// ============================================
// UI MANAGEMENT
// ============================================

// ----------------------------------------
// Show/Hide Screens
// ----------------------------------------
function hideAllScreens() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('menu-screen').style.display = 'none';
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

function showMenuScreen() {
    hideAllScreens();
    document.getElementById('menu-screen').style.display = 'block';
    
    if (currentUser) {
        document.getElementById('username-display').textContent = 
            currentUser.profile?.username || currentUser.email;
        document.getElementById('user-stats').textContent = 
            `Games: ${currentUser.profile?.games_played || 0} | Wins: ${currentUser.profile?.games_won || 0}`;
    }
}

function showMatchmakingScreen() {
    hideAllScreens();
    document.getElementById('matchmaking-screen').style.display = 'block';
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

    signIn(email, password).then(result => {
        if (result.success) {
            showMenuScreen();
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
    
    playerCount.textContent = `${currentLobby.player_count} / ${GAME_CONFIG.MAX_PLAYERS} Players`;
    
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

