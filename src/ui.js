// ============================================
// UI MANAGEMENT
// ============================================

// ----------------------------------------
// Show/Hide Screens
// ----------------------------------------
function hideAllScreens() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('character-creation-screen').style.display = 'none';
    document.getElementById('character-management-screen').style.display = 'none';
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
    if (currentUser && currentUser.profile && currentUser.profile.character_created === false) {
        showCharacterCreation();
        return;
    }
    
    document.getElementById('menu-screen').style.display = 'block';
    
    if (currentUser) {
        // Show character name if available
        const displayName = (currentUser.profile && (currentUser.profile.character_name || currentUser.profile.username)) || currentUser.email;
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

// ----------------------------------------
// Character Management Functions
// ----------------------------------------
async function showCharacterManagement() {
    if (!currentUser) {
        addToLog('❌ Please sign in first', 'warning');
        return;
    }
    
    hideAllScreens();
    document.getElementById('character-management-screen').style.display = 'block';
    
    // Update gold display
    await refreshPlayerGold();
    const goldDisplay = document.getElementById('char-mgmt-gold');
    if (goldDisplay) {
        goldDisplay.textContent = currentUser.profile?.gold || 0;
    }
    
    clearLog();
    addToLog('👤 Loading your characters...', 'info');
    await loadUserCharacters();
}

async function loadUserCharacters() {
    try {
        const { data: characters, error } = await supabase
            .from('characters')
            .select('*, character_classes(*)')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const characterList = document.getElementById('character-list');
        if (!characterList) return;
        
        if (!characters || characters.length === 0) {
            characterList.innerHTML = `
                <div class="no-characters">
                    <span class="emoji">👤</span>
                    Du har inga karaktärer än. Skapa din första karaktär!
                </div>
            `;
            return;
        }
        
        characterList.innerHTML = '';
        
        characters.forEach(character => {
            const charCard = createCharacterCard(character);
            characterList.appendChild(charCard);
        });
        
        // Update create button state
        const createBtn = document.getElementById('create-character-btn');
        if (createBtn) {
            createBtn.disabled = characters.length >= 3;
            if (characters.length >= 3) {
                createBtn.textContent = 'Max 3 karaktärer';
                createBtn.style.opacity = '0.5';
            }
        }
        
        addToLog(`✅ Loaded ${characters.length} character(s)`, 'success');
        
    } catch (error) {
        console.error('Error loading characters:', error);
        addToLog(`❌ Error loading characters: ${error.message}`, 'warning');
    }
}

function createCharacterCard(character) {
    const card = document.createElement('div');
    card.className = 'character-card';
    
    // Check if this is the active character
    const isActive = currentUser.profile?.active_character_id === character.id;
    if (isActive) {
        card.classList.add('active');
    }
    
    const classEmojis = {
        'mage': '🔮',
        'warrior': '⚔️',
        'rogue': '🗡️',
        'seer': '🔯'
    };
    
    const classEmoji = classEmojis[character.character_class] || '👤';
    const className = character.character_classes?.display_name || character.character_class;
    
    card.innerHTML = `
        <div class="character-header">
            <div class="character-emoji">${classEmoji}</div>
            <div class="character-info">
                <h3>${character.character_name}</h3>
                <p class="character-class">${className}</p>
            </div>
        </div>
        
        <div class="character-stats">
            <div class="stat-item">
                <span class="stat-label">💪 Styrka</span>
                <span class="stat-value">${character.strength}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">🧠 Intelligens</span>
                <span class="stat-value">${character.intellect}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">⚡ Smidighet</span>
                <span class="stat-value">${character.agility}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">❤️ Vitalitet</span>
                <span class="stat-value">${character.vitality}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">👁️ Visdom</span>
                <span class="stat-value">${character.wisdom}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">🎮 Spelade</span>
                <span class="stat-value">${character.games_played || 0}</span>
            </div>
        </div>
        
        <div class="character-actions">
            ${!isActive ? `<button class="character-action-btn primary" onclick="setActiveCharacter(${character.id})">Välj som Aktiv</button>` : ''}
            <button class="character-action-btn" onclick="viewCharacterDetails(${character.id})">Detaljer</button>
            <button class="character-action-btn danger" onclick="deleteCharacter(${character.id}, '${character.character_name}')">Ta Bort</button>
        </div>
    `;
    
    return card;
}

async function setActiveCharacter(characterId) {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ active_character_id: characterId })
            .eq('id', currentUser.id);
        
        if (error) throw error;
        
        // Update current user profile
        currentUser.profile.active_character_id = characterId;
        
        addToLog('✅ Active character updated!', 'success');
        await loadUserCharacters(); // Refresh the list
        
    } catch (error) {
        console.error('Error setting active character:', error);
        addToLog(`❌ Error: ${error.message}`, 'warning');
    }
}

async function deleteCharacter(characterId, characterName) {
    if (!confirm(`Är du säker på att du vill ta bort karaktären "${characterName}"? Detta kan inte ångras.`)) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('characters')
            .delete()
            .eq('id', characterId)
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        
        addToLog(`✅ Character "${characterName}" deleted!`, 'success');
        await loadUserCharacters(); // Refresh the list
        
    } catch (error) {
        console.error('Error deleting character:', error);
        addToLog(`❌ Error: ${error.message}`, 'warning');
    }
}

function viewCharacterDetails(characterId) {
    // For now, just show a message. Could be expanded to show detailed stats, equipment, etc.
    addToLog('📊 Character details view - Coming soon!', 'info');
}

function showCreateNewCharacter() {
    // Check character limit
    const createBtn = document.getElementById('create-character-btn');
    if (createBtn && createBtn.disabled) {
        addToLog('❌ You already have the maximum of 3 characters!', 'warning');
        return;
    }
    
    // Go to character creation
    showCharacterCreation();
}

