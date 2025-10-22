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
    
    // Always refresh profile data when showing menu
    if (currentUser) {
        await refreshPlayerGold();
    }
    
    // Check if character needs to be created
    if (currentUser && currentUser.profile && currentUser.profile.character_created === false) {
        showCharacterCreation();
        return;
    }
    
    document.getElementById('menu-screen').style.display = 'block';
    
    if (currentUser) {
        // Show username if available
        const displayName = (currentUser.profile && currentUser.profile.username) || currentUser.email;
        document.getElementById('username-display').textContent = displayName;
        
        document.getElementById('user-stats').textContent = 
            `Games: ${currentUser.profile?.games_played || 0} | Wins: ${currentUser.profile?.games_won || 0}`;
        
        // Update gold display
        updateGoldDisplay();
    }
}

async function refreshPlayerGold() {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('gold, character_created, active_character_id')
            .eq('id', currentUser.id)
            .single();
        
        if (error) {
            console.error('Error fetching profile:', error);
            addToLog('❌ Error loading profile data', 'warning');
            return;
        }
        
        if (profile) {
            // Update currentUser profile with all data
            if (currentUser && currentUser.profile) {
                currentUser.profile.gold = profile.gold || 0;
                currentUser.profile.character_created = profile.character_created || false;
                currentUser.profile.active_character_id = profile.active_character_id;
            }
            
            // Update all gold displays
            updateGoldDisplay();
            
            console.log('Profile refreshed:', {
                gold: profile.gold,
                character_created: profile.character_created,
                active_character_id: profile.active_character_id
            });
        }
    } catch (error) {
        console.error('Error refreshing gold:', error);
        addToLog('❌ Error refreshing profile data', 'warning');
    }
}

// ----------------------------------------
// Update Gold Display (Global)
// ----------------------------------------
function updateGoldDisplay() {
    const menuGold = document.getElementById('gold-amount');
    const stashGold = document.getElementById('stashhub-gold');
    const charMgmtGold = document.getElementById('char-mgmt-gold');
    
    const currentGold = currentUser?.profile?.gold || 0;
    
    if (menuGold) menuGold.textContent = currentGold;
    if (stashGold) stashGold.textContent = currentGold;
    if (charMgmtGold) charMgmtGold.textContent = currentGold;
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
            
            // Check if this is an AI player
            const isAi = player.is_ai || player.user_id === null;
            const playerName = isAi ? `🤖 ${player.username}` : player.username;
            
            playerDiv.innerHTML = `
                <span class="lobby-player-name">${playerName}</span>
                ${player.user_id === currentLobby.host_id ? '<span class="host-badge">HOST</span>' : ''}
                ${player.user_id === currentUser.id ? '<span class="you-badge">YOU</span>' : ''}
                ${isAi ? '<span class="ai-badge">AI</span>' : ''}
            `;
            playersList.appendChild(playerDiv);
        });
    }
    
    // Add empty slot placeholders only if there are still empty slots
    const currentPlayerCount = currentLobby.lobby_players ? currentLobby.lobby_players.length : 0;
    const emptySlots = GAME_CONFIG.MAX_PLAYERS - currentPlayerCount;
    
    for (let i = 0; i < emptySlots; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'lobby-player empty-slot';
        emptyDiv.innerHTML = `<span class="lobby-player-name">⚪ Empty Slot ${i + 1}</span>`;
        playersList.appendChild(emptyDiv);
    }
    
    // Show/hide start button and add AI button (only for host)
    const startBtn = document.getElementById('start-game-btn');
    const addAiBtn = document.getElementById('add-ai-btn');
    
    if (currentLobby.host_id === currentUser.id) {
        if (currentLobby.player_count >= GAME_CONFIG.MIN_PLAYERS_FOR_START) {
            startBtn.style.display = 'inline-block';
        } else {
            startBtn.style.display = 'none';
        }
        
        // Show add AI button if there are empty slots
        const currentPlayerCount = currentLobby.lobby_players ? currentLobby.lobby_players.length : 0;
        const emptySlots = GAME_CONFIG.MAX_PLAYERS - currentPlayerCount;
        if (emptySlots > 0) {
            addAiBtn.style.display = 'inline-block';
            addAiBtn.textContent = `🤖 Add ${emptySlots} AI Player${emptySlots > 1 ? 's' : ''}`;
        } else {
            addAiBtn.style.display = 'none';
        }
    } else {
        startBtn.style.display = 'none';
        addAiBtn.style.display = 'none';
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
    updateGoldDisplay();
    
    clearLog();
    addToLog('👤 Loading your characters...', 'info');
    await loadUserCharacters();
}

async function loadUserCharacters() {
    try {
        console.log('Loading characters for user:', currentUser.id);
        
        // First try to load from characters table
        const { data: characters, error } = await supabase
            .from('characters')
            .select('*, character_classes(*)')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        console.log('Characters query result:', { characters, error });
        console.log('Number of characters found:', characters ? characters.length : 0);
        
        if (error) {
            console.log('Characters table error:', error);
            console.log('Error details:', error.message, error.code, error.details);
            // If characters table doesn't exist, try to load from profiles
            const { data: profileCharacters, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();
            
            if (profileError) throw profileError;
            
            // Convert profile to character format if user has a character
            if (profileCharacters && profileCharacters.character_created && profileCharacters.character_name) {
                const character = {
                    id: currentUser.id, // Use user ID as character ID for now
                    character_name: profileCharacters.character_name,
                    character_class: profileCharacters.character_class,
                    strength: profileCharacters.strength || 5,
                    intellect: profileCharacters.intellect || 5,
                    agility: profileCharacters.agility || 5,
                    vitality: profileCharacters.vitality || 5,
                    wisdom: profileCharacters.wisdom || 5,
                    games_played: profileCharacters.games_played || 0,
                    games_won: profileCharacters.games_won || 0,
                    created_at: profileCharacters.created_at,
                    character_classes: {
                        display_name: profileCharacters.character_class
                    }
                };
                
                await displayCharacters([character]);
                return;
            } else {
                await displayCharacters([]);
                return;
            }
        }
        
        await displayCharacters(characters);
        
    } catch (error) {
        console.error('Error loading characters:', error);
        addToLog(`❌ Error loading characters: ${error.message}`, 'warning');
    }
}

// ----------------------------------------
// Display Characters Helper
// ----------------------------------------
async function displayCharacters(characters) {
    console.log('Displaying characters:', characters);
    const characterList = document.getElementById('character-list');
    if (!characterList) return;
    
    if (!characters || characters.length === 0) {
        // Update character counter
        const characterCount = document.getElementById('character-count');
        if (characterCount) {
            characterCount.textContent = '0/3';
        }
        
        characterList.innerHTML = `
            <div class="no-characters">
                <span class="emoji">👤</span>
                <h3>Inga karaktärer än</h3>
                <p>Du har inga karaktärer än. Skapa din första karaktär för att komma igång!</p>
                <button onclick="showCreateNewCharacter()" class="primary-btn" style="margin-top: 15px;">
                    ✨ Skapa Din Första Karaktär
                </button>
            </div>
        `;
        return;
    }
    
    characterList.innerHTML = '';
    
    characters.forEach(character => {
        const charCard = createCharacterCard(character);
        characterList.appendChild(charCard);
    });
    
    // Update character counter
    const characterCount = document.getElementById('character-count');
    if (characterCount) {
        characterCount.textContent = `${characters.length}/3`;
    }
    
    // Update create button state
    const createBtn = document.getElementById('create-character-btn');
    if (createBtn) {
        createBtn.disabled = characters.length >= 3;
        if (characters.length >= 3) {
            createBtn.textContent = 'Max 3 karaktärer';
            createBtn.style.opacity = '0.5';
        } else {
            createBtn.textContent = '✨ Skapa Ny Karaktär';
            createBtn.style.opacity = '1';
        }
    }
    
    addToLog(`✅ Loaded ${characters.length} character(s)`, 'success');
}

function createCharacterCard(character) {
    console.log('Creating character card for:', character);
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
        
        <div class="character-overview">
            <div class="overview-item">
                <span class="overview-label">🎮 Spelade</span>
                <span class="overview-value">${character.games_played || 0}</span>
            </div>
            <div class="overview-item">
                <span class="overview-label">🏆 Vinster</span>
                <span class="overview-value">${character.games_won || 0}</span>
            </div>
            <div class="overview-item">
                <span class="overview-label">📊 Total Stats</span>
                <span class="overview-value">${(character.strength + character.intellect + character.agility + character.vitality + character.wisdom)}</span>
            </div>
            <div class="overview-item">
                <span class="overview-label">⚔️ Quest Status</span>
                <span class="overview-value">🆓 Ledig</span>
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
                <span class="stat-label">🔮 Visdom</span>
                <span class="stat-value">${character.wisdom}</span>
            </div>
        </div>
        
        <div class="character-actions">
            ${!isActive ? `<button class="character-action-btn primary" onclick="setActiveCharacter('${character.id}')">Välj som Aktiv</button>` : '<span class="active-character-badge">✅ Aktiv Karaktär</span>'}
            <button class="character-action-btn" onclick="viewCharacterDetails('${character.id}')">Detaljer</button>
            <button class="character-action-btn danger" onclick="deleteCharacter('${character.id}', '${character.character_name}')">Ta Bort</button>
        </div>
    `;
    
    return card;
}

async function setActiveCharacter(characterId) {
    try {
        console.log('Setting active character:', characterId);
        
        const { error } = await supabase
            .from('profiles')
            .update({ active_character_id: characterId })
            .eq('id', currentUser.id);
        
        if (error) {
            console.error('Error updating active character:', error);
            throw error;
        }
        
        // Update current user profile
        currentUser.profile.active_character_id = characterId;
        
        // Refresh gold from database to ensure consistency
        await refreshPlayerGold();
        
        // Update gold display in all parts of the app
        if (typeof updateGoldDisplay === 'function') {
            updateGoldDisplay();
        }
        
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
        console.log('Deleting character:', characterId, characterName);
        
        // Check if this is the active character
        const isActiveCharacter = currentUser.profile?.active_character_id === characterId;
        
        const { error } = await supabase
            .from('characters')
            .delete()
            .eq('id', characterId)
            .eq('user_id', currentUser.id);
        
        if (error) {
            console.error('Error deleting character:', error);
            throw error;
        }
        
        // If we deleted the active character, clear the active character
        if (isActiveCharacter) {
            const { error: clearError } = await supabase
                .from('profiles')
                .update({ active_character_id: null })
                .eq('id', currentUser.id);
            
            if (clearError) throw clearError;
            
            // Update local profile
            if (currentUser && currentUser.profile) {
                currentUser.profile.active_character_id = null;
            }
            
            addToLog(`✅ Active character "${characterName}" deleted!`, 'success');
        } else {
            addToLog(`✅ Character "${characterName}" deleted!`, 'success');
        }
        
        await loadUserCharacters(); // Refresh the list
        
    } catch (error) {
        console.error('Error deleting character:', error);
        addToLog(`❌ Error: ${error.message}`, 'warning');
    }
}

function viewCharacterDetails(characterId) {
    // Find the character in the current list
    const characterList = document.getElementById('character-list');
    if (!characterList) return;
    
    const characterCards = characterList.querySelectorAll('.character-card');
    let character = null;
    
    for (const card of characterCards) {
        const deleteBtn = card.querySelector(`button[onclick*="deleteCharacter('${characterId}'"]`);
        if (deleteBtn) {
            // Extract character info from the card
            const nameElement = card.querySelector('h3');
            const classElement = card.querySelector('.character-class');
            const statsElements = card.querySelectorAll('.stat-item');
            
            if (nameElement && classElement) {
                const name = nameElement.textContent;
                const className = classElement.textContent;
                
                addToLog(`📊 Character Details: ${name}`, 'info');
                addToLog(`🏷️ Class: ${className}`, 'info');
                
                // Show stats
                statsElements.forEach(stat => {
                    const label = stat.querySelector('.stat-label');
                    const value = stat.querySelector('.stat-value');
                    if (label && value) {
                        addToLog(`${label.textContent}: ${value.textContent}`, 'info');
                    }
                });
                
                addToLog('💡 Use "Välj som Aktiv" to switch to this character', 'info');
            }
            break;
        }
    }
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

