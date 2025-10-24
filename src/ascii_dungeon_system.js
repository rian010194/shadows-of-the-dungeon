// ============================================
// ASCII DUNGEON VISUALIZATION SYSTEM
// ============================================

// ----------------------------------------
// Assign Random Classes to AI Players
// ----------------------------------------
function assignRandomClassesToAI() {
    const characterClasses = [
        { name: 'Mage', strength: 2, vitality: 3, agility: 2, intelligence: 8 },
        { name: 'Warrior', strength: 8, vitality: 6, agility: 2, intelligence: 2 },
        { name: 'Rogue', strength: 4, vitality: 3, agility: 8, intelligence: 3 },
        { name: 'Seer', strength: 3, vitality: 4, agility: 3, intelligence: 7 }
    ];
    
    game.players.forEach(player => {
        if (player && !player.isPlayer) { // AI players only
            const randomClass = characterClasses[Math.floor(Math.random() * characterClasses.length)];
            player.characterClass = randomClass.name;
            player.strength = randomClass.strength;
            player.vitality = randomClass.vitality;
            player.agility = randomClass.agility;
            player.intelligence = randomClass.intelligence;
            
            console.log(`AI Player ${player.name} assigned class: ${randomClass.name}`);
        }
    });
}

// Global variables for dungeon state
let currentDungeon = null;
let playerCurrentRoom = {}; // Track which room each player is in
let roomEvents = {}; // Track events happening in rooms
let exploredRooms = new Set(); // Track which rooms have been explored

// Corrupted system
let corruptedPlayers = []; // Array to support multiple corrupted players
let nightPhase = false;
let nightTimer = null;
let allPlayersAsleep = false;

// AI system
let aiTimer = null;
let aiInterval = 3000; // 3 seconds between AI action cycles (reduced for testing)
let aiActionDelay = 2000; // 2-7 seconds delay between individual AI actions

// Game timer system
let gameTimer = null;
let dayPhaseStartTime = null;
let dayPhaseDuration = 120000; // 2 minutes in milliseconds
let gameStartTime = null;

// ----------------------------------------
// Initialize ASCII Dungeon
// ----------------------------------------
function startDungeonExploration() {
    const roomCount = 8; // This will be ignored in favor of grid size
    
    // Check if game object exists
    if (typeof game === 'undefined' || !game.players) {
        console.log('❌ Game not initialized properly');
        return;
    }
    
    // Create new grid dungeon (5x5 by default)
    console.log('Creating GridDungeon...');
    if (typeof GridDungeon === 'undefined') {
        console.log('GridDungeon class not found!');
        return;
    }
    currentDungeon = new GridDungeon(5, 5);
    console.log('GridDungeon created:', currentDungeon);
    
    // Give AI players random character classes
    assignRandomClassesToAI();
    
    // Place players in rooms
    console.log('Placing players in rooms...');
    game.players.forEach(player => {
        console.log('Placing player:', player.name);
        
        // All players start in the same room (start room)
        playerCurrentRoom[player.id] = currentDungeon.startRoom.id;
        currentDungeon.startRoom.playersInRoom.push(player.id);
        
        if (!player.isPlayer) {
            console.log(`AI Player ${player.name} placed in room: ${currentDungeon.startRoom.name}`);
        }
        
        // Initialize stamina
        player.currentStamina = calculateStamina(player);
        console.log(`Player ${player.name} stamina initialized: ${player.currentStamina}`);
    });
    
    // Mark start room as explored
    const startRoomId = `${currentDungeon.startRoom.x},${currentDungeon.startRoom.y}`;
    exploredRooms.add(startRoomId);
    
    if (typeof window.updatePhaseTitle === 'function') {
        window.updatePhaseTitle("🗺️ Dungeon Utforskning - Runda " + game.round);
    }
    
    if (typeof window.addToLog === 'function') {
        window.addToLog(`🏰 En mystisk dungeon med ${currentDungeon.width}x${currentDungeon.height} rum materialiseras!`, 'info');
        window.addToLog(`Alla börjar i ${currentDungeon.startRoom.name}`, 'info');
    }
    
    showDungeonInterface();
    
    // Start AI timer
    startAITimer();
    
    // Start game timer
    startGameTimer();
}

// ----------------------------------------
// Show Dungeon Interface
// ----------------------------------------
function showDungeonInterface() {
    console.log('showDungeonInterface called');
    
    // Show the dungeon exploration screen
    document.getElementById('dungeon-exploration-screen').style.display = 'block';
    
    const playerId = game.playerCharacter.id;
    const playerRoomId = playerCurrentRoom[playerId];
    const hasKey = game.playerCharacter.inventory.some(item => item.name === "Dungeon Key");
    
    console.log('Player ID:', playerId, 'Room ID:', playerRoomId);
    
    const roomInfo = getRoomInfo(playerRoomId, hasKey);
    console.log('Room info:', roomInfo);
    
    if (!roomInfo || !roomInfo.room) {
        console.error('❌ Room info not found!');
        addToDungeonLog('❌ Error loading room', 'error');
        return;
    }
    
    // Update dungeon header
    document.getElementById('current-room-name').textContent = roomInfo.room.name;
    document.getElementById('current-room-coords').textContent = `(${roomInfo.room.x},${roomInfo.room.y})`;
    
    // Update core gameplay info
    updateCoreGameplayInfo();
    
    // Update stamina display
    updateStaminaDisplay(game.playerCharacter);
    
    // Update items display
    updatePlayerItemsDisplay();
    
    // Update room players display
    updateRoomPlayersDisplay();
    
    showRoomContent(roomInfo);
    
    // Show all actions after room content
    console.log('Showing all actions...');
    showAllActions(roomInfo.room);
    
    // Show ASCII dungeon map
    console.log('Rendering ASCII dungeon map...');
    updateMinimap();
    
    // Generate dynamic event filters
    generateEventFilters();
}

// ----------------------------------------
// Get Room Information
// ----------------------------------------
function getRoomInfo(roomId, hasKey) {
    const room = currentDungeon.getRoomById(roomId);
    if (!room) return null;
    
    const playersInRoom = getPlayersInRoom(roomId);
    
    return {
        room: room,
        playersInRoom: playersInRoom,
        hasKey: hasKey
    };
}

// ----------------------------------------
// Show Room Content
// ----------------------------------------
function showRoomContent(roomInfo) {
    console.log('showRoomContent called with:', roomInfo);
    if (!roomInfo) {
        console.log('No room info provided');
        return;
    }
    
    const room = roomInfo.room;
    const playersInRoom = roomInfo.playersInRoom;
    const hasKey = roomInfo.hasKey;
    
    console.log('Room:', room);
    console.log('Players in room:', playersInRoom);
    console.log('Has key:', hasKey);
    
    // Clear previous content
    if (typeof window.clearActionButtons === 'function') {
        console.log('Clearing action buttons...');
        window.clearActionButtons();
    } else {
        console.log('clearActionButtons function not found');
    }
    
    // Update minimap
    updateMinimap();
    
    // Update room ASCII view
    updateRoomASCIIView(room);
    
    // Add room description to event log
    addToDungeonLog(`📍 ${room.name}`, 'success');
    addToDungeonLog(room.description, 'info');
    
    
    // Show players in room
    if (playersInRoom.length > 0) {
        const playerNames = playersInRoom.map(id => {
            const player = game.players.find(p => p.id === id);
            return player ? player.name : 'Unknown';
        });
        addToDungeonLog(`👥 I rummet: ${playerNames.join(', ')}`, 'info');
    }
    
    // Don't show actions here, they will be shown by the calling function
    
    // Show room content based on type
    if (room.type === 'monster' && room.monster) {
        showMonsterEncounter(room);
    } else if (room.type === 'treasure' && room.treasure) {
        showTreasureRoom(room);
    } else if (room.type === 'trap') {
        showTrapRoom(room);
    } else if (room.type === 'key') {
        showKeyRoom(room);
    } else if (room.type === 'portal') {
        showPortalRoom(room);
    } else if (room.type === 'boss') {
        showBossRoom(room);
    } else {
        showEmptyRoom(room);
    }
    
    // Don't show room content again here - this causes infinite recursion!
    // showRoomContent is only called once from showDungeonInterface
}

// ----------------------------------------
// Get ASCII Art for Room
// ----------------------------------------
function getRoomASCII(room) {
    const roomTypes = {
        'empty': `┌─────────┐
│         │
│   🚪    │
│  Empty  │
│  Room   │
│         │
└─────────┘`,
        'monster': `┌─────────┐
│         │
│   👹    │
│ Monster │
│  Lair   │
│         │
└─────────┘`,
        'treasure': `┌─────────┐
│         │
│   💰    │
│ Treasure│
│  Vault  │
│         │
└─────────┘`,
        'trap': `┌─────────┐
│         │
│   ⚠️    │
│  Trap   │
│  Room   │
│         │
└─────────┘`,
        'key': `┌─────────┐
│         │
│   🔑    │
│  Key    │
│  Room   │
│         │
└─────────┘`,
        'portal': `┌─────────┐
│         │
│   🌌    │
│ Portal  │
│  Room   │
│         │
└─────────┘`,
        'boss': `┌─────────┐
│         │
│   👑    │
│  Boss   │
│  Lair   │
│         │
└─────────┘`,
        'hall': `┌─────────┐
│         │
│   🏛️    │
│  Hall   │
│         │
│         │
└─────────┘`
    };
    
    return roomTypes[room.type] || roomTypes['empty'];
}

// ----------------------------------------
// Show All Actions (Organized)
// ----------------------------------------
let isShowingActions = false;
function showAllActions(room) {
    try {
        // Guard against multiple simultaneous calls
        if (isShowingActions) {
            console.log('⏳ Already showing actions, skipping...');
            return;
        }
        
        isShowingActions = true;
        
        // Safety timeout to prevent permanent locking (5 seconds)
        const timeout = setTimeout(() => {
            console.warn('⚠️ showAllActions timeout - resetting flag');
            isShowingActions = false;
        }, 5000);
        
        console.log('showAllActions called with room:', room);
        
        const actionButtonsContainer = document.getElementById('dungeon-action-buttons');
        if (!actionButtonsContainer) {
            console.log('❌ dungeon-action-buttons not found');
            clearTimeout(timeout);
            isShowingActions = false;
            return;
        }
        
        // Clear all existing buttons
        actionButtonsContainer.innerHTML = '';
        
        // 1. MOVEMENT ACTIONS (4 buttons in a row)
        showMovementCategory(room);
        
        // 2. ROOM INTERACTION ACTIONS
        showRoomInteractionCategory(room);
        
        // 3. ITEM USAGE ACTIONS
        showItemUsageCategory();
        
        clearTimeout(timeout);
        isShowingActions = false;
    } catch (error) {
        console.error('❌ Error in showAllActions:', error);
        isShowingActions = false;
    }
}

// ----------------------------------------
// Show Movement Category
// ----------------------------------------
function showMovementCategory(room) {
    try {
        console.log('showMovementCategory called with room:', room);
        const movementButtonsContainer = document.getElementById('movement-buttons');
        if (!movementButtonsContainer) return;
        
        // Clear existing movement buttons
        movementButtonsContainer.innerHTML = '';
        
        const directions = getMovementOptions(`${room.x},${room.y}`);
        console.log('Movement directions:', directions);
        const player = game.playerCharacter;
        const movementCost = 10;
    
        if (directions.length > 0) {
            directions.forEach(dir => {
                const directionName = getDirectionName(dir);
                const button = document.createElement('button');
                button.textContent = `${getDirectionArrow(dir)} ${directionName}`;
                button.className = 'action-btn movement-btn';
                
                if (checkStamina(player, movementCost)) {
                    button.onclick = () => moveInDirection(dir);
                } else {
                    button.disabled = true;
                    button.style.opacity = '0.5';
                    button.title = 'Not enough stamina!';
                }
                
                movementButtonsContainer.appendChild(button);
            });
        }
    } catch (error) {
        console.error('❌ Error in showMovementCategory:', error);
    }
}

// ----------------------------------------
// Show Room Interaction Category
// ----------------------------------------
function showRoomInteractionCategory(room) {
    try {
        console.log('showRoomInteractionCategory called with room:', room);
        const actionButtonsContainer = document.getElementById('dungeon-action-buttons');
        if (!actionButtonsContainer) return;
        
        // Add room interaction header
        const interactionHeader = document.createElement('h3');
        interactionHeader.textContent = '🔍 Rum Interaktion';
        interactionHeader.style.color = '#FF9800';
        interactionHeader.style.margin = '0 0 8px 0';
        interactionHeader.style.textAlign = 'center';
        interactionHeader.style.fontSize = '0.9em';
        actionButtonsContainer.appendChild(interactionHeader);
    
    // Create interaction buttons container
    const interactionContainer = document.createElement('div');
    interactionContainer.style.display = 'grid';
    interactionContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
    interactionContainer.style.gap = '5px';
    interactionContainer.style.marginBottom = '15px';
    
    const player = game.playerCharacter;
    
    // Search Room button
    const searchCost = calculateActionCost(5, player);
    const searchButton = document.createElement('button');
    searchButton.textContent = `🔍 Sök rum (${searchCost} stamina)`;
    searchButton.className = 'action-btn search-btn';
    
    if (checkStamina(player, searchCost)) {
        searchButton.onclick = () => searchRoom();
    } else {
        searchButton.disabled = true;
        searchButton.style.opacity = '0.5';
        searchButton.title = 'Not enough stamina!';
    }
    interactionContainer.appendChild(searchButton);
    
    // Rest button
    // Rest functionality removed - players cannot recover stamina by resting
    
    // Interactive objects
    const interactiveObjects = getRoomInteractiveObjects(room);
    if (interactiveObjects.length > 0) {
        interactiveObjects.forEach(obj => {
            const button = document.createElement('button');
            button.textContent = `${obj.icon} Sök ${obj.name}`;
            button.className = 'action-btn interactive-btn';
            button.onclick = () => searchObject(obj);
            interactionContainer.appendChild(button);
        });
    }
    
    actionButtonsContainer.appendChild(interactionContainer);
    } catch (error) {
        console.error('❌ Error in showRoomInteractionCategory:', error);
    }
}

// ----------------------------------------
// Show Item Usage Category
// ----------------------------------------
function showItemUsageCategory() {
    try {
        console.log('showItemUsageCategory called');
        const actionButtonsContainer = document.getElementById('dungeon-action-buttons');
        if (!actionButtonsContainer) return;
        
        const player = game.playerCharacter;
        if (!player) return;
        
        // Get player's inventory items (equipped + found items)
        const inventoryItems = player.inventory || [];
        const usableItems = inventoryItems.filter(item => 
            item.type === 'potion' || item.type === 'scroll' || item.type === 'consumable'
        );
        
        // If no usable items, don't show this category
        if (usableItems.length === 0) {
            console.log('No usable items in inventory');
            return;
        }
        
        // Add item usage header
        const itemHeader = document.createElement('h3');
        itemHeader.textContent = '🎒 Använd Föremål';
        itemHeader.style.color = '#9C27B0';
        itemHeader.style.margin = '0 0 8px 0';
        itemHeader.style.textAlign = 'center';
        itemHeader.style.fontSize = '0.9em';
        actionButtonsContainer.appendChild(itemHeader);
    
        // Create item usage buttons container
        const itemContainer = document.createElement('div');
        itemContainer.style.display = 'grid';
        itemContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
        itemContainer.style.gap = '5px';
        itemContainer.style.marginBottom = '15px';
        
        // Add buttons for each usable item
        usableItems.forEach(item => {
            const button = document.createElement('button');
            button.textContent = `${item.emoji || '📦'} Använd ${item.name}`;
            button.className = 'action-btn interactive-btn';
            button.onclick = () => useItem(item);
            itemContainer.appendChild(button);
        });
        
        actionButtonsContainer.appendChild(itemContainer);
    } catch (error) {
        console.error('❌ Error in showItemUsageCategory:', error);
    }
}

// ----------------------------------------
// Show Movement Options (Deprecated - use showAllActions instead)
// ----------------------------------------
function showMovementOptions(playerId, roomId) {
    // This function is deprecated - all actions are now handled by showAllActions
    return;
}

// ----------------------------------------
// Get Movement Options
// ----------------------------------------
function getMovementOptions(roomId) {
    let room;
    
    // Handle both coordinate strings and room objects
    if (typeof roomId === 'string' && roomId.includes(',')) {
        const [x, y] = roomId.split(',').map(Number);
        room = currentDungeon.getRoom(x, y);
    } else {
        room = currentDungeon.getRoomById(roomId);
    }
    
    if (!room) return [];
    
    const directions = [];
    if (room.directions.north) directions.push('north');
    if (room.directions.south) directions.push('south');
    if (room.directions.east) directions.push('east');
    if (room.directions.west) directions.push('west');
    
    return directions;
}

// ----------------------------------------
// Get Direction Name
// ----------------------------------------
function getDirectionName(direction) {
    const names = {
        'north': 'Norr',
        'south': 'Söder',
        'east': 'Öster',
        'west': 'Väster'
    };
    return names[direction] || direction;
}

// ----------------------------------------
// Get Opposite Direction
// ----------------------------------------
function getOppositeDirection(direction) {
    const oppositeDirections = {
        'north': 'south',
        'south': 'north',
        'east': 'west',
        'west': 'east'
    };
    return getDirectionName(oppositeDirections[direction] || direction);
}

// ----------------------------------------
// Get Direction Arrow
// ----------------------------------------
function getDirectionArrow(direction) {
    const arrows = {
        'north': '⬆️',
        'south': '⬇️',
        'east': '➡️',
        'west': '⬅️'
    };
    return arrows[direction] || '➡️';
}

// ----------------------------------------
// Move in Direction
// ----------------------------------------
function moveInDirection(direction) {
    const playerId = game.playerCharacter.id;
    const currentRoomId = playerCurrentRoom[playerId];
    const room = currentDungeon.getRoomById(currentRoomId);
    
    if (!room || !room.directions[direction]) {
        addToDungeonLog(`❌ Du kan inte gå ${getDirectionName(direction)} härifrån!`, 'warning');
        return;
    }
    
    const newRoomId = room.directions[direction];
    const newRoom = currentDungeon.getRoomById(newRoomId);
    
    if (!newRoom) {
        addToDungeonLog(`❌ Rummet ${getDirectionName(direction)} existerar inte!`, 'warning');
        return;
    }
    
    // Check stamina cost for movement
    const movementCost = 5; // Base movement cost (reduced for better balance)
    const player = game.playerCharacter;
    
    if (!checkStamina(player, movementCost)) {
        addToDungeonLog(`❌ Not enough stamina to move! Need ${movementCost} stamina.`, 'warning');
        return;
    }
    
    // Use stamina
    useStamina(player, movementCost);
    
    // Check if all players are out of stamina after this action
    if (checkAllPlayersAsleep()) {
        startNightPhase();
        return;
    }
    
    // Update UI
    updateMinimap();
    updateRoomASCIIView(newRoom);
    
    // Show all actions for the new room (showRoomContent is NOT called to avoid recursion)
    showAllActions(newRoom);
    
    // Move player
    playerCurrentRoom[playerId] = newRoomId;
    
    // Update room occupancy
    room.playersInRoom = room.playersInRoom.filter(id => id !== playerId);
    newRoom.playersInRoom.push(playerId);
    
    // Mark room as explored (only for human player)
    const roomId = `${newRoom.x},${newRoom.y}`;
    const wasExplored = exploredRooms.has(roomId);
    if (playerId === game.playerCharacter.id) {
        exploredRooms.add(roomId);
    }
    
    // Track action for other players to see
    game.playerCharacter.lastAction = `moved ${getDirectionName(direction)}`;
    
    addToDungeonLog(`🚶 Du går ${getDirectionName(direction)} till ${newRoom.name} (${movementCost} stamina used)`, 'info');
    
    // Add suspicious action if player moves at night or does something unusual
    if (nightPhase && game.playerCharacter.role === 'Corrupted') {
        if (typeof window.addSuspiciousAction === 'function') {
            window.addSuspiciousAction(game.playerCharacter.id, 'night_movement', `moved ${getDirectionName(direction)} during night phase`);
        }
    }
    
    // Show movement to other players in the same room
    const otherPlayersInRoom = room.playersInRoom.filter(id => id !== game.playerCharacter.id);
    
    if (otherPlayersInRoom.length > 0) {
        addToDungeonLog(`👀 Other players see you heading ${getDirectionName(direction)}`, 'info');
    }
    
    // If this is a new room, add discovery message
    if (!wasExplored) {
        addToDungeonLog(`🗺️ Nytt rum upptäckt! (${newRoom.x},${newRoom.y})`, 'success');
    }
    
    // Check for events in adjacent rooms
    checkAdjacentRoomEvents(newRoomId);
    
    // Update dungeon header
    document.getElementById('current-room-name').textContent = newRoom.name;
    document.getElementById('current-room-coords').textContent = `(${newRoom.x},${newRoom.y})`;
    
    // Show new room
    showDungeonInterface();
    
    // Start AI timer if not already running
    if (!aiTimer) {
        startAITimer();
    }
}

// ----------------------------------------
// Game Timer Functions
// ----------------------------------------
function startGameTimer() {
    gameStartTime = Date.now();
    dayPhaseStartTime = Date.now();
    
    // Update timer display every second
    gameTimer = setInterval(() => {
        updateGameTimerDisplay();
        checkDayPhaseTimeout();
    }, 1000);
    
    addToDungeonLog('⏰ Game timer started - 1 minute day phase begins!', 'system');
}

function stopGameTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
}

function updateGameTimerDisplay() {
    const timerElement = document.getElementById('game-timer');
    if (timerElement && gameStartTime) {
        const elapsed = Date.now() - gameStartTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        timerElement.textContent = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

function checkDayPhaseTimeout() {
    if (!nightPhase && dayPhaseStartTime) {
        const elapsed = Date.now() - dayPhaseStartTime;
        if (elapsed >= dayPhaseDuration) {
            addToDungeonLog('⏰ Day phase timeout! Forcing night phase...', 'system');
            startNightPhase();
        }
    }
}

function getCurrentTimestamp() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

// ----------------------------------------
// Add to Dungeon Log
// ----------------------------------------
function addToDungeonLog(message, type = 'info') {
    const dungeonEventLog = document.getElementById('dungeon-event-log');
    if (dungeonEventLog) {
        const entry = document.createElement('div');
        entry.className = `event-entry event-${type}`;
        
        // Add timestamp to the message
        const timestamp = getCurrentTimestamp();
        entry.innerHTML = `<span class="event-timestamp">[${timestamp}]</span> ${message}`;
        
        dungeonEventLog.appendChild(entry);
        
        // Limit to maximum 10 events
        const maxEvents = 10;
        const events = dungeonEventLog.querySelectorAll('.event-entry');
        if (events.length > maxEvents) {
            // Remove the oldest events (first ones)
            for (let i = 0; i < events.length - maxEvents; i++) {
                events[i].remove();
            }
        }
        
        // Auto-scroll to bottom to show newest events
        dungeonEventLog.scrollTop = dungeonEventLog.scrollHeight;
    }
}

// ----------------------------------------
// Update Core Gameplay Info
// ----------------------------------------
function updateCoreGameplayInfo() {
    // Update stamina display for human player only
    const player = game.playerCharacter;
    const currentStamina = player.currentStamina !== undefined ? player.currentStamina : calculateStamina(player);
    const maxStamina = calculateStamina(player);
    document.getElementById('current-stamina').textContent = `⚡ Stamina: ${currentStamina}/${maxStamina}`;
    
    // Update time of day
    const timeIcon = game.timeOfDay === 'night' ? '🌙' : '🌅';
    const timeText = game.timeOfDay === 'night' ? 'Night' : 'Day';
    document.getElementById('time-of-day').textContent = `${timeIcon} ${timeText}`;
    
    // Update corruption status
    const corruptionElement = document.getElementById('corruption-status');
    if (corruptionElement) {
        if (nightPhase && corruptedPlayers.length > 0) {
            const isPlayerCorrupted = corruptedPlayers.some(cp => cp.id === player.id);
            if (isPlayerCorrupted) {
                corruptionElement.textContent = '👹 You are corrupted!';
                corruptionElement.style.color = '#ff0000';
            } else {
                const corruptedNames = corruptedPlayers.map(cp => cp.name).join(', ');
                corruptionElement.textContent = `👹 ${corruptedNames} ${corruptedPlayers.length === 1 ? 'is' : 'are'} corrupted!`;
                corruptionElement.style.color = '#ff0000';
            }
        } else {
            corruptionElement.textContent = '😇 Day Phase';
            corruptionElement.style.color = '#00ff00';
        }
    }
}

// ----------------------------------------
// Calculate Stamina
// ----------------------------------------
function calculateStamina(player) {
    if (!player) return 25; // Default 5 vitality * 5 = 25
    
    // 5 stamina per vitality point
    const vitality = player.vitality || 5;
    const baseStamina = vitality * 5;
    
    return baseStamina;
}

// ----------------------------------------
// Calculate Action Cost
// ----------------------------------------
function calculateActionCost(baseCost, player) {
    if (!player) return baseCost;
    
    const agility = player.agility || 5;
    
    // Agility reduces cost: 1 point of agility = 5% discount (max 50% discount)
    const discount = Math.min(agility * 0.05, 0.5);
    const finalCost = Math.floor(baseCost * (1 - discount));
    
    return Math.max(finalCost, 1); // Minimum cost of 1
}

// ----------------------------------------
// Check Stamina
// ----------------------------------------
function checkStamina(player, actionCost) {
    const currentStamina = player.currentStamina !== undefined ? player.currentStamina : calculateStamina(player);
    return currentStamina >= actionCost;
}

// ----------------------------------------
// Use Stamina
// ----------------------------------------
function useStamina(player, actionCost) {
    if (player.currentStamina === undefined || player.currentStamina === null) {
        player.currentStamina = calculateStamina(player);
    }
    
    const oldStamina = player.currentStamina;
    player.currentStamina = Math.max(0, player.currentStamina - actionCost);
    
    // Debug logging for all players
    console.log(`⚡ ${player.name} stamina: ${oldStamina} → ${player.currentStamina} (cost: ${actionCost})`);
    
    // Check if all players are out of stamina after this action
    if (checkAllPlayersAsleep()) {
        console.log('🌙 All players asleep, starting night phase...');
        startNightPhase();
    }
    
    // Update stamina display (only for human player)
    if (player.isPlayer) {
        updateStaminaDisplay(player);
    }
    
    return player.currentStamina;
}

// ----------------------------------------
// Update Stamina Display
// ----------------------------------------
function updateStaminaDisplay(player) {
    const staminaElement = document.getElementById('current-stamina');
    if (staminaElement) {
        const currentStamina = player.currentStamina !== undefined ? player.currentStamina : calculateStamina(player);
        const maxStamina = calculateStamina(player);
        staminaElement.textContent = `⚡ Stamina: ${currentStamina}/${maxStamina}`;
    }
}

// ----------------------------------------
// Update Player Items Display
// ----------------------------------------
function updatePlayerItemsDisplay() {
    const itemsContainer = document.getElementById('dungeon-player-items');
    if (!itemsContainer || !game.playerCharacter) return;
    
    const items = game.playerCharacter.inventory || [];
    
    itemsContainer.innerHTML = '';
    
    if (items.length === 0) {
        const noItemsDiv = document.createElement('div');
        noItemsDiv.className = 'no-items';
        noItemsDiv.textContent = 'No items yet...';
        itemsContainer.appendChild(noItemsDiv);
        return;
    }
    
    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-display';
        
        const itemName = document.createElement('span');
        itemName.className = 'item-name';
        itemName.textContent = item.name;
        
        const itemEffect = document.createElement('span');
        itemEffect.className = 'item-effect';
        itemEffect.textContent = item.effect;
        
        itemDiv.appendChild(itemName);
        itemDiv.appendChild(itemEffect);
        
        // Add click handler for using items
        itemDiv.onclick = () => useItem(item);
        itemDiv.style.cursor = 'pointer';
        itemDiv.title = `Click to use: ${item.effect}`;
        
        itemsContainer.appendChild(itemDiv);
    });
}

// ----------------------------------------
// Update Room Players Display
// ----------------------------------------
function updateRoomPlayersDisplay() {
    const playersContainer = document.getElementById('dungeon-room-players');
    if (!playersContainer || !game.playerCharacter) return;
    
    const currentRoomId = playerCurrentRoom[game.playerCharacter.id];
    const currentRoom = currentDungeon.getRoomById(currentRoomId);
    
    if (!currentRoom) return;
    
    const playersInRoom = currentRoom.playersInRoom || [];
    const otherPlayers = playersInRoom.filter(playerId => playerId !== game.playerCharacter.id);
    
    playersContainer.innerHTML = '';
    
    if (otherPlayers.length === 0) {
        const noPlayersDiv = document.createElement('div');
        noPlayersDiv.className = 'no-players';
        noPlayersDiv.textContent = 'You are alone in this room...';
        playersContainer.appendChild(noPlayersDiv);
        return;
    }
    
    otherPlayers.forEach(playerId => {
        const player = game.players.find(p => p.id === playerId);
        if (!player) return;
        
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-in-room';
        
        const playerName = document.createElement('span');
        playerName.className = 'player-name';
        playerName.textContent = player.name;
        
        const playerStatus = document.createElement('span');
        playerStatus.className = 'player-status';
        
        // Show player status
        if (player.isDead) {
            playerStatus.textContent = '💀 Dead';
            playerStatus.style.color = '#ff6b6b';
        } else if (player.escaped) {
            playerStatus.textContent = '🚪 Escaped';
            playerStatus.style.color = '#51cf66';
        } else {
            const stamina = player.currentStamina || calculateStamina(player);
            const maxStamina = calculateStamina(player);
            playerStatus.textContent = `⚡ ${stamina}/${maxStamina}`;
        }
        
        playerDiv.appendChild(playerName);
        playerDiv.appendChild(playerStatus);
        
        // Add recent action if available
        if (player.lastAction) {
            const actionSpan = document.createElement('span');
            actionSpan.className = 'player-action';
            actionSpan.textContent = player.lastAction;
            playerDiv.appendChild(actionSpan);
        }
        
        playersContainer.appendChild(playerDiv);
    });
}

// ----------------------------------------
// Check if All Players Are Asleep
// ----------------------------------------
function checkAllPlayersAsleep() {
    const players = game.players || [];
    
    // Check if all players (including human) have insufficient stamina for any action
    // Minimum action cost is 1 stamina (for searching objects)
    const minimumStaminaNeeded = 1;
    
    console.log('🔍 Checking if all players are asleep...');
    
    // Check all players including human player
    const allAsleep = players.every(player => {
        const currentStamina = player.currentStamina !== undefined ? player.currentStamina : calculateStamina(player);
        const isAsleep = currentStamina < minimumStaminaNeeded;
        console.log(`🔍 Player ${player.name}: ${currentStamina} stamina (asleep: ${isAsleep})`);
        return isAsleep;
    });
    
    console.log(`🔍 All players asleep: ${allAsleep}`);
    return allAsleep;
}

// ----------------------------------------
// Start Night Phase
// ----------------------------------------
function startNightPhase() {
    if (nightPhase) return;
    
    nightPhase = true;
    allPlayersAsleep = true;
    
    // Select corrupted players based on player count
    const players = game.players || [];
    corruptedPlayers = []; // Reset corrupted players
    
    if (players.length > 0) {
        const numCorrupted = players.length <= 5 ? 1 : 2; // 1 for 1-5 players, 2 for 6+ players
        
        // Select random corrupted players
        const availablePlayers = [...players]; // Copy array to avoid modifying original
        for (let i = 0; i < numCorrupted && availablePlayers.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availablePlayers.length);
            const corruptedPlayer = availablePlayers.splice(randomIndex, 1)[0];
            corruptedPlayer.currentStamina = calculateStamina(corruptedPlayer); // Full stamina
            corruptedPlayers.push(corruptedPlayer);
        }
    }
    
    // Update UI
    updateCoreGameplayInfo();
    
    // Log night phase
    const corruptedNames = corruptedPlayers.map(p => p.name).join(', ');
    addToDungeonLog(`🌙 Night falls... All players are asleep except the corrupted ones.`, 'warning');
    addToDungeonLog(`👹 ${corruptedNames} ${corruptedPlayers.length === 1 ? 'is' : 'are'} corrupted and ${corruptedPlayers.length === 1 ? 'has' : 'have'} full stamina!`, 'danger');
    
    // Stop AI timer during night phase
    stopAITimer();
    
    // Night phase continues until corrupted player makes a choice
    // No automatic timer - night phase only ends when corrupted player acts
    
    // Show corrupted player actions
    showCorruptedActions();
}

// ----------------------------------------
// End Night Phase
// ----------------------------------------
function endNightPhase() {
    if (!nightPhase) return;
    
    nightPhase = false;
    allPlayersAsleep = false;
    
    // Clear timer
    if (nightTimer) {
        clearTimeout(nightTimer);
        nightTimer = null;
    }
    
    // Don't reset stamina - players should keep their current stamina
    // The night phase is just a special phase, not a stamina reset
    
    // Clear corrupted players
    corruptedPlayers = [];
    
    // Reset day phase timer
    dayPhaseStartTime = Date.now();
    
    // Update UI
    updateCoreGameplayInfo();
    
    // Log day phase
    addToDungeonLog(`🌅 Day breaks... All players wake up with full stamina.`, 'info');
    
    // Start voting phase instead of continuing exploration
    if (typeof window.startVotingPhase === 'function') {
        window.startVotingPhase();
    } else {
        // Fallback - show normal actions
        const currentRoom = currentDungeon.getRoomById(playerCurrentRoom[game.playerCharacter.id]);
        if (currentRoom) {
            showAllActions(currentRoom);
        }
        
        // Restart AI timer
        startAITimer();
    }
}

// ----------------------------------------
// Show Corrupted Player Actions
// ----------------------------------------
function showCorruptedActions() {
    const isPlayerCorrupted = corruptedPlayers.some(cp => cp.id === game.playerCharacter.id);
    if (!isPlayerCorrupted) {
        // Not a corrupted player - show sleep message
        const actionButtons = document.getElementById('dungeon-action-buttons');
        if (actionButtons) {
            actionButtons.innerHTML = '<button class="action-btn" disabled>😴 Sleeping...</button>';
        }
        return;
    }
    
    // Corrupted player actions
    const actionButtons = document.getElementById('dungeon-action-buttons');
    if (!actionButtons) return;
    
    actionButtons.innerHTML = '';
    
    // Movement buttons (free for corrupted)
    const room = getCurrentRoom();
    if (room) {
        const directions = ['north', 'south', 'east', 'west'];
        const directionLabels = {
            'north': '⬆️ North',
            'south': '⬇️ South', 
            'east': '➡️ East',
            'west': '⬅️ West'
        };
        
        directions.forEach(direction => {
            if (room.directions[direction]) {
                const button = document.createElement('button');
                button.textContent = directionLabels[direction];
                button.className = 'action-btn movement-btn';
                button.onclick = () => moveInDirection(direction);
                actionButtons.appendChild(button);
            }
        });
    }
    
    // Murder attempt button
    const murderButton = document.createElement('button');
    murderButton.textContent = '🗡️ Attempt Murder';
    murderButton.className = 'action-btn';
    murderButton.style.background = 'linear-gradient(135deg, #8b0000, #5a0000)';
    murderButton.style.borderColor = '#d4af37';
    murderButton.onclick = () => attemptMurder();
    actionButtons.appendChild(murderButton);
    
    // Search room button
    const searchCost = calculateActionCost(5, corruptedPlayer);
    const searchButton = document.createElement('button');
    searchButton.textContent = `🔍 Search Room (${searchCost} stamina)`;
    searchButton.className = 'action-btn search-btn';
    
    if (checkStamina(corruptedPlayer, searchCost)) {
        searchButton.onclick = () => searchRoom();
    } else {
        searchButton.disabled = true;
        searchButton.style.opacity = '0.5';
    }
    
    actionButtons.appendChild(searchButton);
}

// ----------------------------------------
// Attempt Murder
// ----------------------------------------
function attemptMurder() {
    const isPlayerCorrupted = corruptedPlayers.some(cp => cp.id === game.playerCharacter.id);
    if (!isPlayerCorrupted) return;
    
    const currentRoom = getCurrentRoom();
    if (!currentRoom) return;
    
    // Find other players in the same room (excluding all corrupted players)
    const corruptedPlayerIds = corruptedPlayers.map(cp => cp.id);
    const otherPlayers = currentRoom.playersInRoom.filter(playerId => !corruptedPlayerIds.includes(playerId));
    
    if (otherPlayers.length === 0) {
        addToDungeonLog(`👹 No one to murder in this room...`, 'warning');
        return;
    }
    
    // Select random victim
    const victimId = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
    const victim = game.players.find(p => p.id === victimId);
    
    if (!victim) return;
    
    // Murder attempt (success based on corrupted player's stats)
    const success = Math.random() < 0.7; // 70% success rate for now
    
    if (success) {
        addToDungeonLog(`🗡️ ${game.playerCharacter.name} successfully murders ${victim.name}!`, 'danger');
        // Remove victim from game
        victim.isDead = true;
        currentRoom.playersInRoom = currentRoom.playersInRoom.filter(id => id !== victimId);
        
        // Add evidence of murder
        if (typeof window.addEvidence === 'function') {
            window.addEvidence('murder', `${game.playerCharacter.name} was seen near ${victim.name}'s body`, game.playerCharacter.id);
        }
    } else {
        addToDungeonLog(`🗡️ ${game.playerCharacter.name} attempts to murder ${victim.name} but fails!`, 'warning');
        
        // Add evidence of failed murder attempt
        if (typeof window.addEvidence === 'function') {
            window.addEvidence('failed_murder', `${game.playerCharacter.name} was seen attacking ${victim.name} but failed`, game.playerCharacter.id);
        }
    }
    
    // End night phase after corrupted player action
    endNightPhase();
    
    // Update UI
    updateCoreGameplayInfo();
}

// ----------------------------------------
// AI Player Actions
// ----------------------------------------
function performAIActions() {
    const players = game.players || [];
    const aiPlayers = players.filter(player => 
        player.id !== game.playerCharacter.id && 
        !player.isDead && 
        (player.currentStamina !== undefined ? player.currentStamina : calculateStamina(player)) >= 1
    );
    
    console.log(`🤖 AI Actions: ${aiPlayers.length} AI players with stamina`);
    aiPlayers.forEach(player => {
        const stamina = player.currentStamina !== undefined ? player.currentStamina : calculateStamina(player);
        console.log(`🤖 ${player.name}: ${stamina} stamina`);
    });
    
    // Execute AI actions with staggered delays
    aiPlayers.forEach((player, index) => {
        const delay = index * (aiActionDelay + Math.random() * 5000); // 5-10 seconds + random variation
        
        setTimeout(() => {
            // Double-check conditions before executing
            if (player.isDead || (player.currentStamina || calculateStamina(player)) < 1) return;
            
            console.log(`🤖 ${player.name} taking action...`);
            const action = decideAIAction(player);
            if (action) {
                console.log(`🤖 ${player.name} decided to: ${action.type}`);
                executeAIAction(player, action);
            }
        }, delay);
    });
}

// ----------------------------------------
// Decide AI Action
// ----------------------------------------
function decideAIAction(player) {
    const currentRoomId = playerCurrentRoom[player.id];
    const currentRoom = currentDungeon.getRoomById(currentRoomId);
    if (!currentRoom) return null;
    
    const actions = [];
    
    // Movement options
    const directions = ['north', 'south', 'east', 'west'];
    directions.forEach(direction => {
        if (currentRoom.directions[direction]) {
            const movementCost = 10;
            if (checkStamina(player, movementCost)) {
                actions.push({
                    type: 'move',
                    direction: direction,
                    cost: movementCost
                });
            }
        }
    });
    
    // Search room option
    const searchCost = calculateActionCost(5, player);
    if (checkStamina(player, searchCost)) {
        actions.push({
            type: 'search',
            cost: searchCost
        });
    }
    
    // If no actions available but player has stamina, add a "do nothing" option
    // This ensures AI players use up their stamina by doing something
    if (actions.length === 0 && (player.currentStamina || calculateStamina(player)) > 0) {
        actions.push({
            type: 'wait',
            cost: 1 // Use 1 stamina for waiting
        });
    }
    
    // Rest option (always available)
    // Rest functionality removed - AI cannot rest to recover stamina
    
    // Randomly choose an action
    if (actions.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * actions.length);
    return actions[randomIndex];
}

// ----------------------------------------
// Execute AI Action
// ----------------------------------------
function executeAIAction(player, action) {
    console.log(`🤖 Executing AI action for ${player.name}: ${action.type} (cost: ${action.cost})`);
    switch (action.type) {
        case 'move':
            console.log(`🤖 ${player.name} moving ${action.direction}`);
            executeAIMovement(player, action.direction, action.cost);
            break;
        case 'search':
            console.log(`🤖 ${player.name} searching room`);
            executeAISearch(player, action.cost);
            break;
        case 'wait':
            console.log(`🤖 ${player.name} waiting`);
            executeAIWait(player, action.cost);
            break;
        // Rest functionality removed
    }
}

// ----------------------------------------
// Execute AI Movement
// ----------------------------------------
function executeAIMovement(player, direction, cost) {
    const currentRoomId = playerCurrentRoom[player.id];
    const currentRoom = currentDungeon.getRoomById(currentRoomId);
    
    if (!currentRoom || !currentRoom.directions[direction]) return;
    
    const newRoomId = currentRoom.directions[direction];
    const newRoom = currentDungeon.getRoomById(newRoomId);
    
    if (!newRoom) return;
    
    // Use stamina
    useStamina(player, cost);
    
    // Move player
    playerCurrentRoom[player.id] = newRoomId;
    
    // Update room occupancy
    currentRoom.playersInRoom = currentRoom.playersInRoom.filter(id => id !== player.id);
    newRoom.playersInRoom.push(player.id);
    
    // Mark room as explored (only for human player)
    const roomId = `${newRoom.x},${newRoom.y}`;
    if (player.id === game.playerCharacter.id) {
        exploredRooms.add(roomId);
    }
    
    // Track action for other players to see
    player.lastAction = `moved ${getDirectionName(direction)}`;
    
    // Log AI movement only if human player is in the same room
    const humanPlayerRoom = game.playerCharacter ? playerCurrentRoom[game.playerCharacter.id] : null;
    if (humanPlayerRoom === currentRoomId || humanPlayerRoom === newRoomId) {
        addToDungeonLog(`🤖 ${player.name} moves ${getDirectionName(direction)} to ${newRoom.name}`, 'info');
    }
    
    // Show movement to other players in the same room (both old and new room)
    
    // Show to players in the old room
    if (humanPlayerRoom === currentRoomId) {
        addToDungeonLog(`👀 You see ${player.name} heading ${getDirectionName(direction)}`, 'info');
    }
    
    // Show to players in the new room
    if (humanPlayerRoom === newRoomId) {
        addToDungeonLog(`👀 You see ${player.name} entering from the ${getOppositeDirection(direction)}`, 'info');
    }
    
    // Update room players display if human player is in the same room
    if (game.playerCharacter && playerCurrentRoom[game.playerCharacter.id] === newRoomId) {
        updateRoomPlayersDisplay();
    }
}

// ----------------------------------------
// Execute AI Search
// ----------------------------------------
function executeAISearch(player, cost) {
    useStamina(player, cost);
    
    // Track action for other players to see
    player.lastAction = 'searched the room';
    
    // Simple search result
    const foundItems = Math.random() < 0.3; // 30% chance to find something
    
    // Show search results only if human player is in the same room
    const currentRoomId = playerCurrentRoom[player.id];
    const humanPlayerRoom = game.playerCharacter ? playerCurrentRoom[game.playerCharacter.id] : null;
    
    if (humanPlayerRoom === currentRoomId) {
        if (foundItems) {
            const items = ['gold', 'potion', 'weapon'];
            const item = items[Math.floor(Math.random() * items.length)];
            addToDungeonLog(`🤖 ${player.name} found a ${item}!`, 'success');
        } else {
            addToDungeonLog(`🤖 ${player.name} searches the room but finds nothing.`, 'info');
        }
    }
    
    // Show search action to other players in the same room
    
    if (humanPlayerRoom === currentRoomId) {
        addToDungeonLog(`👀 You see ${player.name} searching around the room`, 'info');
    }
    
    // Update room players display if human player is in the same room
    if (game.playerCharacter && playerCurrentRoom[game.playerCharacter.id] === currentRoomId) {
        updateRoomPlayersDisplay();
    }
}

// ----------------------------------------
// Execute AI Wait
// ----------------------------------------
function executeAIWait(player, cost) {
    useStamina(player, cost);
    
    // Track action for other players to see
    player.lastAction = 'waited and rested';
    
    // Show wait action to other players in the same room
    const currentRoomId = playerCurrentRoom[player.id];
    const humanPlayerRoom = game.playerCharacter ? playerCurrentRoom[game.playerCharacter.id] : null;
    
    if (humanPlayerRoom === currentRoomId) {
        addToDungeonLog(`🤖 ${player.name} waits and rests for a moment`, 'info');
    }
    
    // Update room players display if human player is in the same room
    if (game.playerCharacter && playerCurrentRoom[game.playerCharacter.id] === currentRoomId) {
        updateRoomPlayersDisplay();
    }
}

// ----------------------------------------
// Execute AI Rest - REMOVED
// ----------------------------------------
// Rest functionality has been removed - AI cannot recover stamina by resting

// ----------------------------------------
// Search Room
// ----------------------------------------
function searchRoom() {
    const player = game.playerCharacter;
    const searchCost = calculateActionCost(5, player);
    
    if (!checkStamina(player, searchCost)) {
        addToDungeonLog(`❌ Not enough stamina to search! Need ${searchCost} stamina.`, 'warning');
        return;
    }
    
    // Use stamina
    useStamina(player, searchCost);
    
    // Track action for other players to see
    player.lastAction = 'searched the room';
    
    // If corrupted player is searching, end night phase
    const isPlayerCorrupted = corruptedPlayers.some(cp => cp.id === player.id);
    if (isPlayerCorrupted) {
        endNightPhase();
        return;
    }
    
    // Show search action to other players in the same room
    const currentRoomId = playerCurrentRoom[player.id];
    const currentRoom = currentDungeon.getRoomById(currentRoomId);
    const otherPlayersInRoom = currentRoom ? currentRoom.playersInRoom.filter(id => id !== player.id) : [];
    
    if (otherPlayersInRoom.length > 0) {
        addToDungeonLog(`👀 Other players see you searching around the room`, 'info');
    }
    
    // Check if all players are out of stamina after this action
    if (checkAllPlayersAsleep()) {
        startNightPhase();
        return;
    }
    
    // Search result
    const foundItems = Math.random() < 0.4; // 40% chance to find something
    
    if (foundItems) {
        const items = ['gold', 'potion', 'weapon', 'armor'];
        const item = items[Math.floor(Math.random() * items.length)];
        addToDungeonLog(`🔍 You found a ${item}! (${searchCost} stamina used)`, 'success');
    } else {
        addToDungeonLog(`🔍 You search the room but find nothing. (${searchCost} stamina used)`, 'info');
    }
}

// ----------------------------------------
// Rest - REMOVED
// ----------------------------------------
// Rest functionality has been removed - players cannot recover stamina by resting

// ----------------------------------------
// Start AI Timer
// ----------------------------------------
function startAITimer() {
    if (aiTimer) {
        clearInterval(aiTimer);
    }
    
    aiTimer = setInterval(() => {
        console.log(`🤖 AI Timer tick - Night phase: ${nightPhase}`);
        if (!nightPhase) {
            console.log(`🤖 Calling performAIActions...`);
            performAIActions();
            
            // Check if all players are out of stamina
            if (checkAllPlayersAsleep()) {
                console.log(`🤖 All players asleep, starting night phase...`);
                startNightPhase();
            }
        } else {
            console.log(`🤖 Night phase active, skipping AI actions`);
        }
    }, aiInterval);
}

// ----------------------------------------
// Stop AI Timer
// ----------------------------------------
function stopAITimer() {
    if (aiTimer) {
        clearInterval(aiTimer);
        aiTimer = null;
    }
}

// ----------------------------------------
// Calculate Night Cycles
// ----------------------------------------
function calculateNightCycles(playerCount) {
    // With 8 players: 1 voted out + 1 killed per night = 3 nights max
    // Each night cycle = 1 day + 1 night
    const maxNights = Math.ceil(playerCount / 2);
    return maxNights;
}

// ----------------------------------------
// Check Adjacent Room Events
// ----------------------------------------
function checkAdjacentRoomEvents(roomId) {
    const room = currentDungeon.getRoomById(roomId);
    if (!room) return;
    
    // Check all adjacent rooms for events
    const adjacentRooms = [
        room.directions.north,
        room.directions.south,
        room.directions.east,
        room.directions.west
    ].filter(id => id !== null);
    
    adjacentRooms.forEach(adjacentRoomId => {
        const adjacentRoom = currentDungeon.getRoomById(adjacentRoomId);
        if (adjacentRoom && adjacentRoom.playersInRoom.length > 1) {
            // Multiple players in adjacent room - something might be happening
            checkRoomEvents(adjacentRoom);
        }
    });
}

// ----------------------------------------
// Check Room Events
// ----------------------------------------
function checkRoomEvents(room) {
    const playersInRoom = room.playersInRoom;
    
    if (playersInRoom.length > 1) {
        // Multiple players - check for conflicts
        const playerNames = playersInRoom.map(id => {
            const player = game.players.find(p => p.id === id);
            return player ? player.name : 'Unknown';
        });
        
        if (typeof window.addToLog === 'function') {
            window.addToLog(`\n🔊 Ljud från ${room.name}:`, 'warning');
            window.addToLog(`👥 ${playerNames.join(', ')} är i rummet`, 'info');
        }
        
        // Random event chance
        if (Math.random() < 0.3) {
            triggerRoomEvent(room);
        }
    }
}

// ----------------------------------------
// Trigger Room Event
// ----------------------------------------
function triggerRoomEvent(room) {
    const events = [
        () => {
            if (typeof window.addToLog === 'function') {
                window.addToLog(`⚔️ Ljud av strid hörs från ${room.name}!`, 'warning');
            }
        },
        () => {
            if (typeof window.addToLog === 'function') {
                window.addToLog(`💀 Ett skrik hörs från ${room.name}...`, 'warning');
            }
        },
        () => {
            if (typeof window.addToLog === 'function') {
                window.addToLog(`🔍 Någon utforskar ${room.name}`, 'info');
            }
        },
        () => {
            if (typeof window.addToLog === 'function') {
                window.addToLog(`💰 Ljud av skatter som hittas i ${room.name}`, 'info');
            }
        }
    ];
    
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    randomEvent();
}

// ----------------------------------------
// Render ASCII Dungeon Map
// ----------------------------------------
// ----------------------------------------
// Update Minimap
// ----------------------------------------
function updateMinimap() {
    const minimapContainer = document.getElementById('dungeon-minimap');
    if (!minimapContainer) return;
    
    let minimapHTML = '';
    
    // Create small grid showing only explored rooms
    for (let y = 0; y < currentDungeon.height; y++) {
        let row = '';
        for (let x = 0; x < currentDungeon.width; x++) {
            const room = currentDungeon.getRoom(x, y);
            if (room) {
                const roomId = `${x},${y}`;
                if (exploredRooms.has(roomId)) {
                    const icon = getMinimapIcon(room);
                    row += icon + ' ';
                } else {
                    row += '❓ '; // Unexplored room
                }
            } else {
                row += '  ';
            }
        }
        minimapHTML += row.trim() + '\n';
    }
    
    minimapHTML += '\nLegend: ❓ Unexplored | 👹 Monster | 💰 Loot | 👑 Boss';
    
    minimapContainer.textContent = minimapHTML;
}

// ----------------------------------------
// Update Room ASCII View
// ----------------------------------------
function updateRoomASCIIView(room) {
    const roomContainer = document.getElementById('room-ascii-view');
    if (!roomContainer) return;
    
    const roomASCII = getDetailedRoomASCII(room);
    roomContainer.textContent = roomASCII;
}

// ----------------------------------------
// Get Minimap Icon
// ----------------------------------------
function getMinimapIcon(room) {
    if (room.type === 'boss') return '👑';
    if (room.type === 'monster') return '👹';
    if (room.type === 'treasure') return '💰';
    if (room.type === 'key') return '🔑';
    if (room.type === 'portal') return '🌌';
    if (room.type === 'start') return '🏰';
    return '⬜';
}

// ----------------------------------------
// Get Player Class Icon
// ----------------------------------------
function getPlayerClassIcon(player) {
    if (!player.characterClass) return '👤'; // Default icon
    
    const classIcons = {
        'Mage': '🧙‍♂️',
        'Warrior': '⚔️',
        'Rogue': '🗡️',
        'Seer': '🔮'
    };
    
    return classIcons[player.characterClass] || '👤';
}

// ----------------------------------------
// Get Detailed Room ASCII
// ----------------------------------------
function getDetailedRoomASCII(room) {
    // Get players in this room
    const playersInRoom = room.playersInRoom || [];
    const playerIcons = playersInRoom.map(playerId => {
        const player = game.players.find(p => p.id === playerId);
        if (!player) return '👤 Unknown';
        
        // Get ASCII icon based on character class
        const classIcon = getPlayerClassIcon(player);
        return `${classIcon} ${player.name}`;
    }).join('\n');
    
    const roomTemplates = {
        'empty': `🏠 ${room.name}
${playerIcons}

📚 Bokhylla    🗄️ Byrå    📦 Kista
🕯️ Ljusstake  🪑 Stol     🪟 Fönster`,
        'monster': `👹 ${room.name}
${playerIcons}

⚔️ Svärd      🛡️ Sköld    🗡️ Dolk
🏹 Pilbåge    🪓 Yxa      💀 Skeleton`,
        'treasure': `💰 ${room.name}
${playerIcons}

📦 Skattkista  💎 Diamant  🏆 Pokal
✨ Magisk sten  🪙 Mynt     💰 Guld`,
        'boss': `👑 ${room.name}
${playerIcons}

⚔️ Vapenrack   🛡️ Rustning  🗡️ Svärdsställ
🏹 Pilbåge     🪓 Yxa       👹 Monster`,
        'key': `🔑 ${room.name}
${playerIcons}

📚 Bokhylla    🗄️ Byrå     📦 Kista
🔑 Nyckel     🪑 Stol      ✨ Magi`,
        'portal': `🌌 ${room.name}
${playerIcons}

✨ Magisk portal med pulserande energi
💫 Stjärnor dansar i luften
🌟 Mystisk kraft strömmar genom rummet`
    };
    
    return roomTemplates[room.type] || roomTemplates['empty'];
}

// ----------------------------------------
// Show Interactive Objects (Deprecated - use showAllActions instead)
// ----------------------------------------
function showInteractiveObjects(room) {
    // This function is deprecated - all actions are now handled by showAllActions
    return;
}

// ----------------------------------------
// Search Object
// ----------------------------------------
function searchObject(obj) {
    const player = game.playerCharacter;
    const searchCost = calculateActionCost(5, player); // Base cost 5 stamina
    
    if (!checkStamina(player, searchCost)) {
        addToDungeonLog(`❌ Not enough stamina to search! Need ${searchCost} stamina.`, 'warning');
        return;
    }
    
    // Use stamina
    useStamina(player, searchCost);
    
    // Check if found something
    const found = Math.random() < obj.lootChance;
    
    if (found) {
        const loot = getLootForType(obj.lootType);
        addToDungeonLog(`🔍 You found ${loot.name} in the ${obj.name}! (${searchCost} stamina used)`, 'success');
    } else {
        addToDungeonLog(`🔍 You search the ${obj.name} but find nothing. (${searchCost} stamina used)`, 'info');
    }
    
    // Check if all players are out of stamina after this action
    if (checkAllPlayersAsleep()) {
        startNightPhase();
    }
}

// ----------------------------------------
// Get Loot For Type
// ----------------------------------------
function getLootForType(lootType) {
    const lootTables = {
        'scroll': [
            { name: 'Scroll of Fireball', value: 50 },
            { name: 'Scroll of Healing', value: 30 },
            { name: 'Scroll of Invisibility', value: 80 },
            { name: 'Scroll of Lightning', value: 60 }
        ],
        'weapon': [
            { name: 'Iron Sword', value: 100 },
            { name: 'Steel Dagger', value: 80 },
            { name: 'Magic Staff', value: 150 },
            { name: 'Crossbow', value: 120 }
        ],
        'armor': [
            { name: 'Leather Armor', value: 60 },
            { name: 'Chain Mail', value: 120 },
            { name: 'Plate Armor', value: 200 },
            { name: 'Magic Robe', value: 180 }
        ],
        'gold': [
            { name: 'Gold Coins', value: Math.floor(Math.random() * 50) + 10 },
            { name: 'Silver Coins', value: Math.floor(Math.random() * 30) + 5 },
            { name: 'Copper Coins', value: Math.floor(Math.random() * 20) + 1 }
        ],
        'gem': [
            { name: 'Ruby', value: 200 },
            { name: 'Sapphire', value: 180 },
            { name: 'Emerald', value: 160 },
            { name: 'Diamond', value: 300 }
        ],
        'misc': [
            { name: 'Health Potion', value: 25 },
            { name: 'Mana Potion', value: 30 },
            { name: 'Smoke Bomb', value: 40 },
            { name: 'Lockpick', value: 20 }
        ]
    };
    
    const table = lootTables[lootType] || lootTables['misc'];
    const randomItem = table[Math.floor(Math.random() * table.length)];
    
    return randomItem;
}

// ----------------------------------------
// Get Room Interactive Objects
// ----------------------------------------
function getRoomInteractiveObjects(room) {
    const objects = [];
    
    // Add objects based on room type - fewer, more focused objects
    if (room.type === 'empty') {
        objects.push(
            { icon: '📚', name: 'bokhylla', description: 'En gammal bokhylla med dammiga böcker', lootChance: 0.3, lootType: 'scroll' },
            { icon: '🗄️', name: 'byrå', description: 'En träbyrå med lådor', lootChance: 0.2, lootType: 'misc' },
            { icon: '📦', name: 'kista', description: 'En låst kista', lootChance: 0.4, lootType: 'gold' }
        );
    } else if (room.type === 'monster') {
        objects.push(
            { icon: '⚔️', name: 'vapenrack', description: 'Ett rack med olika vapen', lootChance: 0.5, lootType: 'weapon' },
            { icon: '🛡️', name: 'rustning', description: 'Rustningsdelar på golvet', lootChance: 0.3, lootType: 'armor' },
            { icon: '💀', name: 'skelett', description: 'Ett gammalt skelett', lootChance: 0.2, lootType: 'misc' }
        );
    } else if (room.type === 'treasure') {
        objects.push(
            { icon: '📦', name: 'skattkista', description: 'En guldglänsande skattkista', lootChance: 0.7, lootType: 'gold' },
            { icon: '💎', name: 'diamant', description: 'En glittrande diamant', lootChance: 0.4, lootType: 'gem' },
            { icon: '🏆', name: 'pokal', description: 'En guldpokal', lootChance: 0.3, lootType: 'gold' }
        );
    } else if (room.type === 'boss') {
        objects.push(
            { icon: '⚔️', name: 'vapenrack', description: 'Ett imponerande vapenrack', lootChance: 0.6, lootType: 'weapon' },
            { icon: '🛡️', name: 'rustning', description: 'Mäktig rustning', lootChance: 0.5, lootType: 'armor' },
            { icon: '📦', name: 'skattkista', description: 'En stor skattkista', lootChance: 0.8, lootType: 'gold' }
        );
    }
    
    return objects;
}

// ----------------------------------------
// Console Commands for Interactive Objects
// ----------------------------------------
window.examine = function(objectName) {
    const currentRoom = getCurrentRoom();
    const objects = getRoomInteractiveObjects(currentRoom);
    const obj = objects.find(o => o.name === objectName);
    
    if (obj) {
        addToDungeonLog(`🔍 Du undersöker ${obj.name}: ${obj.description}`, 'info');
    } else {
        addToDungeonLog(`❌ Objektet '${objectName}' finns inte i detta rum`, 'warning');
    }
};

window.use = function(objectName) {
    const currentRoom = getCurrentRoom();
    const objects = getRoomInteractiveObjects(currentRoom);
    const obj = objects.find(o => o.name === objectName);
    
    if (obj) {
        addToDungeonLog(`🔧 Du använder ${obj.name}...`, 'info');
        // Add specific interactions based on object
        if (obj.name === 'bokhylla') {
            addToDungeonLog(`📖 Du hittar en gammal bok med magiska formler!`, 'success');
        } else if (obj.name === 'kista') {
            addToDungeonLog(`🔓 Kistan är låst. Du behöver en nyckel.`, 'warning');
        } else if (obj.name === 'skattkista') {
            addToDungeonLog(`💰 Du öppnar skattkistan och hittar guld!`, 'success');
        }
    } else {
        addToDungeonLog(`❌ Objektet '${objectName}' finns inte i detta rum`, 'warning');
    }
};

window.take = function(objectName) {
    const currentRoom = getCurrentRoom();
    const objects = getRoomInteractiveObjects(currentRoom);
    const obj = objects.find(o => o.name === objectName);
    
    if (obj) {
        addToDungeonLog(`📦 Du tar ${obj.name} och lägger det i din ryggsäck`, 'success');
    } else {
        addToDungeonLog(`❌ Objektet '${objectName}' finns inte i detta rum`, 'warning');
    }
};

// ----------------------------------------
// Get Current Room
// ----------------------------------------
function getCurrentRoom() {
    const playerId = game.playerCharacter.id;
    const roomId = playerCurrentRoom[playerId];
    return currentDungeon.getRoomById(roomId);
}

// ----------------------------------------
// Toggle Dungeon View
// ----------------------------------------
function toggleDungeonView() {
    const minimapView = document.getElementById('minimap-view');
    const roomView = document.getElementById('room-view');
    const minimapBtn = minimapView.querySelector('.toggle-btn');
    const roomBtn = roomView.querySelector('.toggle-btn');
    
    if (minimapView.classList.contains('active')) {
        // Switch to room view
        minimapView.classList.remove('active');
        roomView.classList.add('active');
        minimapBtn.classList.remove('active');
        roomBtn.classList.add('active');
    } else {
        // Switch to minimap view
        roomView.classList.remove('active');
        minimapView.classList.add('active');
        roomBtn.classList.remove('active');
        minimapBtn.classList.add('active');
    }
}

// ----------------------------------------
// Get Room Icon
// ----------------------------------------
function getRoomIcon(room) {
    const playerId = game.playerCharacter.id;
    const isPlayerHere = room.playersInRoom.includes(playerId);
    
    if (isPlayerHere) {
        return '🧙'; // Player icon
    }
    
    const icons = {
        'empty': '🚪',
        'monster': '👹',
        'treasure': '💰',
        'trap': '⚠️',
        'key': '🔑',
        'portal': '🌌',
        'boss': '👑',
        'hall': '🏛️'
    };
    
    return icons[room.type] || '🚪';
}

// ----------------------------------------
// Room Content Handlers
// ----------------------------------------
function showMonsterEncounter(room) {
    if (typeof window.addToLog === 'function') {
        window.addToLog(`\n👹 Ett monster lurar i rummet!`, 'warning');
    }
    if (typeof window.addActionButton === 'function') {
        window.addActionButton('⚔️ Slåss', () => startCombat(room.monster));
        window.addActionButton('🏃 Fly', () => {
            if (typeof window.addToLog === 'function') {
                window.addToLog(`🏃 Du flyr från monstret!`, 'info');
            }
            showAllActions(room);
        });
    }
}

function showTreasureRoom(room) {
    if (typeof window.addToLog === 'function') {
        window.addToLog(`\n💰 Skatter glittrar i rummet!`, 'success');
    }
    if (typeof window.addActionButton === 'function') {
        window.addActionButton('💰 Ta skatter', () => takeTreasure(room.treasure));
    }
}

function showTrapRoom(room) {
    if (typeof window.addToLog === 'function') {
        window.addToLog(`\n⚠️ Du känner att rummet är farligt...`, 'warning');
    }
    if (typeof window.addActionButton === 'function') {
        window.addActionButton('🔍 Undersök', () => {
            if (typeof window.addToLog === 'function') {
                window.addToLog(`🔍 Du hittar en fälla!`, 'warning');
            }
            // Trap logic here
        });
    }
}

function showKeyRoom(room) {
    if (typeof window.addToLog === 'function') {
        window.addToLog(`\n🔑 En nyckel glittrar i rummet!`, 'success');
    }
    if (typeof window.addActionButton === 'function') {
        window.addActionButton('🔑 Ta nyckel', () => takeKey());
    }
}

function showPortalRoom(room) {
    if (typeof window.addToLog === 'function') {
        window.addToLog(`\n🌌 En portal pulserar med energi!`, 'info');
    }
    if (typeof window.addActionButton === 'function') {
        window.addActionButton('🌌 Använd portal', () => {
            if (typeof window.addToLog === 'function') {
                window.addToLog(`🌌 Du transporteras till en annan del av dungeon!`, 'info');
            }
            // Portal logic here
        });
    }
}

function showBossRoom(room) {
    if (typeof window.addToLog === 'function') {
        window.addToLog(`\n👑 En mäktig boss väntar!`, 'warning');
    }
    if (typeof window.addActionButton === 'function') {
        window.addActionButton('⚔️ Slåss mot boss', () => {
            if (typeof window.addToLog === 'function') {
                window.addToLog(`👑 Boss-strid börjar!`, 'warning');
            }
            // Boss fight logic here
        });
    }
}

function showEmptyRoom(room) {
    if (typeof window.addToLog === 'function') {
        window.addToLog(`\n🚪 Ett tomt rum. Inget av intresse här.`, 'info');
    }
}

// ----------------------------------------
// Combat and Item Functions
// ----------------------------------------
function startCombat(monster) {
    if (typeof window.addToLog === 'function') {
        window.addToLog(`⚔️ Strid mot ${monster.name} börjar!`, 'warning');
    }
    // Combat logic here
}

function takeTreasure(treasure) {
    if (typeof window.addToLog === 'function') {
        window.addToLog(`💰 Du hittar ${treasure.name}!`, 'success');
    }
    // Treasure logic here
}

function takeKey() {
    if (typeof window.addToLog === 'function') {
        window.addToLog(`🔑 Du hittar en nyckel!`, 'success');
    }
    // Key logic here
}

// ----------------------------------------
// Use Item From Inventory
// ----------------------------------------
function useItem(item) {
    const player = game.playerCharacter;
    
    console.log('Using item:', item);
    
    if (!item.type) {
        addToDungeonLog(`❌ Unknown item type`, 'warning');
        return;
    }
    
    // Remove item from inventory
    const itemIndex = player.inventory.findIndex(inv => inv.name === item.name);
    if (itemIndex > -1) {
        player.inventory.splice(itemIndex, 1);
    }
    
    // Track action for other players to see
    player.lastAction = `used ${item.name}`;
    
    // Handle different item types
    switch(item.type) {
        case 'potion':
            if (item.name.toLowerCase().includes('helande') || item.name.toLowerCase().includes('healing')) {
                // Healing potion - restore health/stamina
                const staminarRestore = Math.min(calculateStamina(player), (player.currentStamina || 0) + 10);
                player.currentStamina = staminarRestore;
                addToDungeonLog(`🧪 Du använder ${item.name} och återställer 10 stamina!`, 'success');
                updateStaminaDisplay(player);
            } else {
                addToDungeonLog(`🧪 Du använder ${item.name}!`, 'success');
            }
            break;
            
        case 'scroll':
            addToDungeonLog(`📜 Du använder ${item.name} och en magisk effekt sprider sig!`, 'success');
            break;
            
        case 'consumable':
            addToDungeonLog(`📦 Du använder ${item.name}!`, 'success');
            break;
            
        default:
            addToDungeonLog(`Du använder ${item.name}!`, 'info');
    }
    
    // Update items display
    updatePlayerItemsDisplay();
    
    // Update room players display
    updateRoomPlayersDisplay();
    
    // Refresh actions
    const room = currentDungeon.getRoomById(playerCurrentRoom[player.id]);
    if (room) {
        showAllActions(room);
    }
}

// ----------------------------------------
// Get Players in Room
// ----------------------------------------
function getPlayersInRoom(roomId) {
    const room = currentDungeon.getRoomById(roomId);
    return room ? room.playersInRoom : [];
}

// ----------------------------------------
// Leave Dungeon Game
// ----------------------------------------
function leaveDungeonGame() {
    if (confirm('Are you sure you want to leave the dungeon? Any progress will be lost.')) {
        // Stop any active timers
        if (aiTimer) {
            clearInterval(aiTimer);
            aiTimer = null;
        }
        if (nightTimer) {
            clearTimeout(nightTimer);
            nightTimer = null;
        }
        if (gameTimer) {
            clearInterval(gameTimer);
            gameTimer = null;
        }
        
        // Reset game state
        nightPhase = false;
        allPlayersAsleep = false;
        
        // Return to menu
        if (typeof showMenuScreen === 'function') {
            showMenuScreen();
        } else {
            // Fallback - hide dungeon screen and show menu
            document.getElementById('dungeon-exploration-screen').style.display = 'none';
            document.getElementById('menu-screen').style.display = 'block';
        }
    }
}

// ----------------------------------------
// Generate Dynamic Event Filters
// ----------------------------------------
function generateEventFilters() {
    const filterContainer = document.getElementById('event-filters');
    if (!filterContainer) return;
    
    // Clear existing filters
    filterContainer.innerHTML = '';
    
    // Add "All Players" filter
    const allButton = document.createElement('button');
    allButton.className = 'filter-btn active';
    allButton.textContent = 'All Players';
    allButton.onclick = () => filterEvents('all');
    filterContainer.appendChild(allButton);
    
    // Add individual player filters
    const players = game.players || [];
    players.forEach(player => {
        const playerButton = document.createElement('button');
        playerButton.className = 'filter-btn';
        playerButton.textContent = player.name;
        playerButton.onclick = () => filterEvents(player.name);
        filterContainer.appendChild(playerButton);
    });
}

// ----------------------------------------
// Event Filtering
// ----------------------------------------
function filterEvents(filterType) {
    const eventLog = document.getElementById('dungeon-event-log');
    if (!eventLog) return;
    
    const events = eventLog.querySelectorAll('.event-entry');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Update active filter button
    filterButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show/hide events based on filter
    events.forEach(event => {
        const eventText = event.textContent.toLowerCase();
        let shouldShow = false;
        
        if (filterType === 'all') {
            shouldShow = true;
        } else {
            // Filter by specific player name
            shouldShow = eventText.includes(filterType.toLowerCase());
        }
        
        event.style.display = shouldShow ? 'block' : 'none';
    });
}

// ============================================
// EXPORT FUNCTIONS TO WINDOW
// ============================================
window.startDungeonExploration = startDungeonExploration;
    window.showDungeonInterface = showDungeonInterface;
    window.moveInDirection = moveInDirection;
    window.startCombat = startCombat;
    window.takeKey = takeKey;
    window.takeTreasure = takeTreasure;
    window.searchRoom = searchRoom;
    // window.rest = rest; // Rest functionality removed
    window.toggleDungeonView = toggleDungeonView;
    window.searchObject = searchObject;
    window.showAllActions = showAllActions;
    window.useItem = useItem;
    window.updatePlayerItemsDisplay = updatePlayerItemsDisplay;
    window.updateRoomPlayersDisplay = updateRoomPlayersDisplay;
    window.leaveDungeonGame = leaveDungeonGame;
    window.filterEvents = filterEvents;
    window.generateEventFilters = generateEventFilters;
    window.startGameTimer = startGameTimer;
    window.stopGameTimer = stopGameTimer;
