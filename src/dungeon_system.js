// ============================================
// DUNGEON EXPLORATION SYSTEM
// ============================================

class DungeonRoom {
    constructor(id, name, description) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.type = 'empty'; // empty, key, portal, boss, monster, treasure, trap
        this.connectedRooms = []; // Array of room IDs
        this.playersInRoom = []; // Array of player IDs
        this.explored = false;
        this.cleared = false; // Monster defeated, trap disarmed, etc.
        this.monster = null;
        this.treasure = null;
    }
}

class Monster {
    constructor(name, hp, damage, loot, isBoss = false) {
        this.name = name;
        this.hp = hp;
        this.maxHp = hp;
        this.damage = damage;
        this.loot = loot;
        this.isBoss = isBoss;
        this.alive = true;
    }
}

class Dungeon {
    constructor(roomCount = 8) {
        this.rooms = [];
        this.startRoomId = 0;
        this.keyRoomId = null;
        this.portalRoomId = null;
        this.bossRoomId = null;
        this.currentRound = 1;
        
        this.generateDungeon(roomCount);
    }
    
    generateDungeon(roomCount) {
        // Ensure roomCount is between 6-10
        roomCount = Math.max(6, Math.min(10, roomCount));
        
        // Room name templates
        const roomNames = [
            { name: "Ingångshallen", desc: "En mörk hall med höga tak" },
            { name: "Gamla biblioteket", desc: "Dammiga bokhyllor täcker väggarna" },
            { name: "Vapenkammaren", desc: "Rostiga vapen hänger på väggarna" },
            { name: "Skattvalvet", desc: "Glimtar av guld lyser i mörkret" },
            { name: "Tortyrkammaren", desc: "Skrämmande verktyg står mot väggarna" },
            { name: "Rituella rummet", desc: "Mystiska symboler täcker golvet" },
            { name: "Tronsalen", desc: "En massiv tron står i rummets mitt" },
            { name: "Kryptan", desc: "Gamla kistor står längs väggarna" },
            { name: "Alkemilaboratoriet", desc: "Bubblande flaskor och konstiga lukter" },
            { name: "Förrådet", desc: "Staplade lådor och utrustning" },
            { name: "Ceremonihallen", desc: "Ett stort rum med högt i tak" },
            { name: "Fängelsehålan", desc: "Gamla celler med rostiga galler" }
        ];
        
        // Shuffle and pick room templates
        const shuffledNames = shuffleArray([...roomNames]).slice(0, roomCount);
        
        // Create rooms
        for (let i = 0; i < roomCount; i++) {
            const template = shuffledNames[i];
            const room = new DungeonRoom(i, template.name, template.desc);
            this.rooms.push(room);
        }
        
        // Set start room (always room 0)
        this.startRoomId = 0;
        this.rooms[0].name = "Ingångshallen";
        this.rooms[0].description = "Alla äventyrare samlas här vid ingången";
        
        // Connect rooms (create a connected graph)
        this.connectRooms(roomCount);
        
        // Assign special rooms (not the start room)
        const specialRoomIds = shuffleArray(Array.from({length: roomCount - 1}, (_, i) => i + 1));
        
        this.keyRoomId = specialRoomIds[0];
        this.rooms[this.keyRoomId].type = 'key';
        
        this.portalRoomId = specialRoomIds[1];
        this.rooms[this.portalRoomId].type = 'portal';
        
        this.bossRoomId = specialRoomIds[2];
        this.rooms[this.bossRoomId].type = 'boss';
        this.rooms[this.bossRoomId].monster = this.createBossMonster();
        
        // Add smaller monsters to some other rooms
        const monsterRoomCount = Math.floor(roomCount / 3);
        for (let i = 3; i < 3 + monsterRoomCount && i < specialRoomIds.length; i++) {
            const roomId = specialRoomIds[i];
            this.rooms[roomId].type = 'monster';
            this.rooms[roomId].monster = this.createSmallMonster();
        }
        
        // Add treasure to remaining rooms
        for (let i = 3 + monsterRoomCount; i < specialRoomIds.length; i++) {
            const roomId = specialRoomIds[i];
            if (this.rooms[roomId].type === 'empty') {
                this.rooms[roomId].type = Math.random() < 0.6 ? 'treasure' : 'trap';
            }
        }
    }
    
    connectRooms(roomCount) {
        // Create a simple connected layout
        // Each room connects to 1-3 other rooms
        
        // First, create a main path to ensure all rooms are reachable
        for (let i = 0; i < roomCount - 1; i++) {
            this.rooms[i].connectedRooms.push(i + 1);
            this.rooms[i + 1].connectedRooms.push(i);
        }
        
        // Add some additional connections for complexity
        const extraConnections = Math.floor(roomCount / 2);
        for (let i = 0; i < extraConnections; i++) {
            const room1 = randomInt(0, roomCount - 1);
            const room2 = randomInt(0, roomCount - 1);
            
            if (room1 !== room2 && 
                !this.rooms[room1].connectedRooms.includes(room2) &&
                this.rooms[room1].connectedRooms.length < 3) {
                this.rooms[room1].connectedRooms.push(room2);
                this.rooms[room2].connectedRooms.push(room1);
            }
        }
    }
    
    createBossMonster() {
        const bossNames = [
            "Skuggdrakonen",
            "Den Korrupta Kungen",
            "Mörkrets Väktare",
            "Förbannelsen Själv",
            "Den Gamla Häxmästaren"
        ];
        
        const bossName = randomElement(bossNames);
        return new Monster(bossName, 150, 30, 3, true);
    }
    
    createSmallMonster() {
        const monsterNames = [
            "Skuggvarg",
            "Korrupt Väktare",
            "Zombie Riddare",
            "Mörkermagi",
            "Skelett Krigare",
            "Grottroll"
        ];
        
        const monsterName = randomElement(monsterNames);
        const hp = randomInt(30, 60);
        const damage = randomInt(10, 20);
        return new Monster(monsterName, hp, damage, 1, false);
    }
    
    getRoom(roomId) {
        return this.rooms[roomId];
    }
    
    movePlayer(playerId, fromRoomId, toRoomId) {
        // Remove from old room
        if (fromRoomId !== null) {
            const fromRoom = this.rooms[fromRoomId];
            fromRoom.playersInRoom = fromRoom.playersInRoom.filter(id => id !== playerId);
        }
        
        // Add to new room
        const toRoom = this.rooms[toRoomId];
        if (!toRoom.playersInRoom.includes(playerId)) {
            toRoom.playersInRoom.push(playerId);
        }
        
        toRoom.explored = true;
    }
    
    getPlayersInRoom(roomId) {
        return this.rooms[roomId].playersInRoom;
    }
    
    getRoomInfo(roomId, hasKey = false) {
        const room = this.rooms[roomId];
        let info = `📍 ${room.name}\n${room.description}\n\n`;
        
        // Show players in room
        if (room.playersInRoom.length > 0) {
            info += `👥 Spelare här: ${room.playersInRoom.length}\n`;
        }
        
        // Show connected rooms
        info += `🚪 Utgångar: ${room.connectedRooms.map(id => this.rooms[id].name).join(', ')}\n\n`;
        
        // Show room content (only if explored)
        if (room.explored || room.playersInRoom.length > 0) {
            switch(room.type) {
                case 'key':
                    if (!room.cleared) {
                        info += `🔑 Du hittar PORTALNYCKELN!`;
                    } else {
                        info += `(Nyckeln har redan tagits)`;
                    }
                    break;
                case 'portal':
                    if (hasKey) {
                        info += `🌀 PORTALEN! Du kan använda nyckeln för att fly!`;
                    } else {
                        info += `🚪 En låst portal. Du behöver nyckeln.`;
                    }
                    break;
                case 'boss':
                    if (room.monster && room.monster.alive) {
                        info += `👹 ${room.monster.name} blockerar vägen! (${room.monster.hp}/${room.monster.maxHp} HP)`;
                    } else {
                        info += `💀 Bossen är besegrad!`;
                    }
                    break;
                case 'monster':
                    if (room.monster && room.monster.alive) {
                        info += `⚔️ ${room.monster.name} attackerar! (${room.monster.hp}/${room.monster.maxHp} HP)`;
                    } else {
                        info += `💀 Monstret är besegrad!`;
                    }
                    break;
                case 'treasure':
                    if (!room.cleared) {
                        info += `💎 Skatter glimmar i rummet!`;
                    } else {
                        info += `(Skatterna har plundrats)`;
                    }
                    break;
                case 'trap':
                    if (!room.cleared) {
                        info += `⚠️ Du känner av fara... en fälla!`;
                    } else {
                        info += `(Fällan har utlösts)`;
                    }
                    break;
                default:
                    info += `Rummet verkar tomt...`;
            }
        } else {
            info += `❓ Du har inte utforskat detta rum än`;
        }
        
        return info;
    }
}

// Global dungeon instance
let currentDungeon = null;
let playerCurrentRoom = {}; // Map of playerId -> roomId
let portalKeyHolder = null; // Player who has the key

// ============================================
// DUNGEON EXPLORATION PHASE
// ============================================

function startDungeonExploration() {
    // Generate dungeon
    const roomCount = randomInt(6, 10);
    currentDungeon = new Dungeon(roomCount);
    
    // Place all players in start room
    playerCurrentRoom = {};
    game.players.forEach(player => {
        if (player.alive) {
            playerCurrentRoom[player.id] = currentDungeon.startRoomId;
            currentDungeon.movePlayer(player.id, null, currentDungeon.startRoomId);
        }
    });
    
    portalKeyHolder = null;
    
    updatePhaseTitle("🗺️ Dungeon Utforskning - Runda " + game.round);
    clearLog();
    addToLog(`🏰 En mystisk dungeon med ${currentDungeon.rooms.length} rum materialiseras!`, 'info');
    addToLog(`Alla börjar i ${currentDungeon.rooms[0].name}`, 'info');
    addToLog(`Mål: Hitta nyckeln, besegra monster, och fly genom portalen!`, 'success');
    addToLog('', 'info');
    
    // Show current room info
    showCurrentRoomInfo();
    
    // Show movement options
    showRoomMovementOptions();
}

function showCurrentRoomInfo() {
    const playerRoomId = playerCurrentRoom[game.playerCharacter.id];
    const hasKey = portalKeyHolder === game.playerCharacter.id;
    const roomInfo = currentDungeon.getRoomInfo(playerRoomId, hasKey);
    
    addToLog(roomInfo, 'info');
    updatePlayersList();
}

function showRoomMovementOptions() {
    clearActionButtons();
    
    const playerRoomId = playerCurrentRoom[game.playerCharacter.id];
    const currentRoom = currentDungeon.getRoom(playerRoomId);
    
    // First, handle current room interactions
    if (currentRoom.type === 'key' && !currentRoom.cleared) {
        showMainButton('🔑 Ta Nyckeln', () => takePortalKey(playerRoomId));
        return;
    }
    
    if (currentRoom.type === 'portal' && portalKeyHolder === game.playerCharacter.id) {
        showMainButton('🌀 Använd Nyckel och Fly', () => escapethroughPortal());
        return;
    }
    
    if (currentRoom.monster && currentRoom.monster.alive) {
        showMainButton(`⚔️ Bekämpa ${currentRoom.monster.name}`, () => fightMonster(playerRoomId));
        return;
    }
    
    if (currentRoom.type === 'treasure' && !currentRoom.cleared) {
        showMainButton('💎 Samla Skatter', () => collectTreasure(playerRoomId));
        return;
    }
    
    if (currentRoom.type === 'trap' && !currentRoom.cleared) {
        showMainButton('⚠️ Försök Undvika Fällan', () => handleTrap(playerRoomId));
        return;
    }
    
    // Show movement options
    const voteButtonsDiv = document.getElementById('vote-buttons');
    voteButtonsDiv.innerHTML = '<h4 style="color: #d4af37; margin-bottom: 15px;">Välj nästa rum:</h4>';
    
    currentRoom.connectedRooms.forEach(connectedRoomId => {
        const connectedRoom = currentDungeon.getRoom(connectedRoomId);
        const playersInRoom = connectedRoom.playersInRoom.length;
        const explored = connectedRoom.explored ? '✓' : '?';
        
        const btn = document.createElement('button');
        btn.className = 'vote-btn';
        btn.textContent = `${explored} ${connectedRoom.name} ${playersInRoom > 0 ? '(👥' + playersInRoom + ')' : ''}`;
        btn.onclick = () => moveToRoom(connectedRoomId);
        voteButtonsDiv.appendChild(btn);
    });
    
    // Option to stay
    const stayBtn = document.createElement('button');
    stayBtn.className = 'vote-btn';
    stayBtn.textContent = '⏸️ Stanna här';
    stayBtn.onclick = () => stayInRoom();
    voteButtonsDiv.appendChild(stayBtn);
}

function moveToRoom(targetRoomId) {
    const playerId = game.playerCharacter.id;
    const currentRoomId = playerCurrentRoom[playerId];
    
    currentDungeon.movePlayer(playerId, currentRoomId, targetRoomId);
    playerCurrentRoom[playerId] = targetRoomId;
    
    const targetRoom = currentDungeon.getRoom(targetRoomId);
    addToLog(`🚶 Du går till ${targetRoom.name}`, 'info');
    
    // AI players make random moves
    aiPlayersMove();
    
    // Update map
    renderDungeonMap();
    
    // Show new room
    setTimeout(() => {
        clearLog();
        showCurrentRoomInfo();
        showRoomMovementOptions();
        renderDungeonMap();
    }, 500);
}

function stayInRoom() {
    addToLog('⏸️ Du stannar i rummet', 'info');
    
    // AI players make random moves
    aiPlayersMove();
    
    renderDungeonMap();
    
    setTimeout(() => {
        clearLog();
        showCurrentRoomInfo();
        showRoomMovementOptions();
        renderDungeonMap();
    }, 500);
}

function aiPlayersMove() {
    game.players.forEach(player => {
        if (!player.isPlayer && player.alive && playerCurrentRoom[player.id] !== undefined) {
            const currentRoomId = playerCurrentRoom[player.id];
            const currentRoom = currentDungeon.getRoom(currentRoomId);
            
            // AI has 70% chance to move
            if (Math.random() < 0.7 && currentRoom.connectedRooms.length > 0) {
                const targetRoomId = randomElement(currentRoom.connectedRooms);
                currentDungeon.movePlayer(player.id, currentRoomId, targetRoomId);
                playerCurrentRoom[player.id] = targetRoomId;
            }
        }
    });
}

function takePortalKey(roomId) {
    const room = currentDungeon.getRoom(roomId);
    room.cleared = true;
    portalKeyHolder = game.playerCharacter.id;
    
    addToLog('🔑 Du tar portalnyckeln!', 'success');
    addToLog('Nu kan du fly genom portalen!', 'success');
    
    setTimeout(() => {
        showRoomMovementOptions();
    }, 1500);
}

function escapeThroughPortal() {
    game.playerCharacter.escaped = true;
    game.playerCharacter.stash = [...game.playerCharacter.inventory];
    
    addToLog('🌀 Du använder nyckeln och flyr genom portalen!', 'success');
    addToLog('✅ Du har säkrat allt ditt byte!', 'success');
    
    updatePlayersList();
    
    setTimeout(() => {
        checkGameEnd();
    }, 2000);
}

function fightMonster(roomId) {
    const room = currentDungeon.getRoom(roomId);
    const monster = room.monster;
    
    if (!monster || !monster.alive) {
        showRoomMovementOptions();
        return;
    }
    
    clearActionButtons();
    addToLog(`⚔️ Strid med ${monster.name}!`, 'warning');
    
    // Calculate player attack (based on stats and items)
    const playerStrength = currentUser.profile?.strength || 5;
    const attackPower = game.playerCharacter.attackPower || 0;
    const playerDamage = randomInt(15, 25) + playerStrength + attackPower;
    
    monster.hp -= playerDamage;
    addToLog(`Du gör ${playerDamage} skada! (${monster.hp}/${monster.maxHp} HP kvar)`, 'info');
    
    if (monster.hp <= 0) {
        monster.alive = false;
        room.cleared = true;
        addToLog(`💀 ${monster.name} är besegrad!`, 'success');
        
        // Give loot
        for (let i = 0; i < monster.loot; i++) {
            const loot = randomElement(game.lootPool);
            game.playerCharacter.inventory.push(loot);
            addToLog(`📦 Du hittar: ${loot.name}`, 'success');
        }
        
        updateInventory();
        
        setTimeout(() => {
            showRoomMovementOptions();
        }, 2000);
    } else {
        // Monster attacks back
        setTimeout(() => {
            const monsterDamage = monster.damage;
            
            // Check for protection
            if (game.playerCharacter.itemProtection && game.playerCharacter.itemProtection > 0) {
                game.playerCharacter.itemProtection--;
                addToLog(`🛡️ Ditt skydd absorberar attacken!`, 'success');
            } else {
                addToLog(`💥 ${monster.name} gör ${monsterDamage} skada!`, 'warning');
                
                // Check if player dies
                if (Math.random() < 0.3) { // 30% chance to die
                    if (game.playerCharacter.hasRevive) {
                        game.playerCharacter.hasRevive = false;
                        addToLog('🔥 Phoenix Feather räddar dig från döden!', 'success');
                    } else {
                        game.playerCharacter.alive = false;
                        addToLog('💀 Du dör i striden...', 'warning');
                        updatePlayersList();
                        setTimeout(checkGameEnd, 2000);
                        return;
                    }
                }
            }
            
            setTimeout(() => {
                showMainButton(`⚔️ Fortsätt Striden`, () => fightMonster(roomId));
            }, 1000);
        }, 1000);
    }
}

function collectTreasure(roomId) {
    const room = currentDungeon.getRoom(roomId);
    room.cleared = true;
    
    const treasureCount = randomInt(1, 3);
    for (let i = 0; i < treasureCount; i++) {
        const loot = randomElement(game.lootPool);
        game.playerCharacter.inventory.push(loot);
        addToLog(`💎 Du hittar: ${loot.name}`, 'success');
    }
    
    updateInventory();
    
    setTimeout(() => {
        showRoomMovementOptions();
    }, 1500);
}

function handleTrap(roomId) {
    const room = currentDungeon.getRoom(roomId);
    room.cleared = true;
    
    // Player stats affect trap avoidance
    const playerAgility = currentUser.profile?.agility || 5;
    const avoidChance = Math.min(0.9, 0.3 + (playerAgility / 50));
    
    if (Math.random() < avoidChance) {
        addToLog('✅ Du undviker fällan skickligt!', 'success');
        // Small reward for avoiding trap
        const loot = randomElement(game.lootPool);
        game.playerCharacter.inventory.push(loot);
        addToLog(`📦 Du hittar något i rummet: ${loot.name}`, 'success');
        updateInventory();
    } else {
        addToLog('💥 Du utlöser fällan!', 'warning');
        
        // Check for protection
        if (game.playerCharacter.itemProtection && game.playerCharacter.itemProtection > 0) {
            game.playerCharacter.itemProtection--;
            addToLog('🛡️ Ditt skydd räddar dig!', 'success');
        } else {
            // Lose some loot or take damage
            if (game.playerCharacter.inventory.length > 0 && Math.random() < 0.5) {
                const lostItem = game.playerCharacter.inventory.pop();
                addToLog(`📦 Du tappar: ${lostItem.name}`, 'warning');
                updateInventory();
            } else {
                addToLog('😵 Du tar skada!', 'warning');
            }
        }
    }
    
    setTimeout(() => {
        showRoomMovementOptions();
    }, 2000);
}

// ============================================
// DUNGEON MAP RENDERING
// ============================================

function renderDungeonMap() {
    const mapContainer = document.getElementById('dungeon-map-container');
    const mapElement = document.getElementById('dungeon-map');
    
    if (!currentDungeon) {
        mapContainer.style.display = 'none';
        return;
    }
    
    mapContainer.style.display = 'block';
    mapElement.innerHTML = '';
    
    const playerRoomId = playerCurrentRoom[game.playerCharacter.id];
    
    currentDungeon.rooms.forEach(room => {
        const roomDiv = document.createElement('div');
        roomDiv.className = 'dungeon-room';
        
        // Add classes based on room state
        if (room.id === playerRoomId) {
            roomDiv.classList.add('current-room');
        }
        if (room.explored) {
            roomDiv.classList.add('explored');
        }
        if (room.type === 'key') {
            roomDiv.classList.add('has-key');
        }
        if (room.type === 'portal') {
            roomDiv.classList.add('has-portal');
        }
        if (room.type === 'boss') {
            roomDiv.classList.add('has-boss');
        }
        
        // Room name
        const nameDiv = document.createElement('div');
        nameDiv.className = 'room-name';
        nameDiv.textContent = room.explored || room.id === 0 ? room.name : '???';
        roomDiv.appendChild(nameDiv);
        
        // Room type icon
        const typeDiv = document.createElement('div');
        typeDiv.className = 'room-type';
        if (room.explored || room.id === playerRoomId) {
            typeDiv.textContent = getRoomTypeIcon(room);
        } else {
            typeDiv.textContent = '❓';
        }
        roomDiv.appendChild(typeDiv);
        
        // Players in room
        if (room.playersInRoom.length > 0) {
            const playersDiv = document.createElement('div');
            playersDiv.className = 'room-players';
            playersDiv.textContent = `👥 ${room.playersInRoom.length}`;
            roomDiv.appendChild(playersDiv);
        }
        
        // Room status
        if (room.explored || room.id === playerRoomId) {
            const statusDiv = document.createElement('div');
            statusDiv.className = 'room-status';
            statusDiv.textContent = getRoomStatus(room);
            roomDiv.appendChild(statusDiv);
        }
        
        // Connections count
        const connectionsDiv = document.createElement('div');
        connectionsDiv.className = 'room-connections';
        connectionsDiv.textContent = `🚪${room.connectedRooms.length}`;
        roomDiv.appendChild(connectionsDiv);
        
        // Click to view room details
        roomDiv.onclick = () => showRoomDetails(room.id);
        
        mapElement.appendChild(roomDiv);
    });
}

function getRoomTypeIcon(room) {
    switch(room.type) {
        case 'key':
            return room.cleared ? '🔓' : '🔑';
        case 'portal':
            return '🌀';
        case 'boss':
            return room.monster && room.monster.alive ? '👹' : '💀';
        case 'monster':
            return room.monster && room.monster.alive ? '⚔️' : '💀';
        case 'treasure':
            return room.cleared ? '📦' : '💎';
        case 'trap':
            return room.cleared ? '✓' : '⚠️';
        default:
            return '·';
    }
}

function getRoomStatus(room) {
    if (room.cleared) return 'Klar';
    if (room.monster && room.monster.alive) return 'Fara!';
    if (room.type === 'treasure') return 'Skatter';
    if (room.type === 'trap') return 'Fälla';
    return '';
}

function showRoomDetails(roomId) {
    const room = currentDungeon.getRoom(roomId);
    const playerRoomId = playerCurrentRoom[game.playerCharacter.id];
    
    if (room.id === playerRoomId) {
        // Already in this room
        return;
    }
    
    if (!room.connectedRooms.includes(playerRoomId) && !room.explored) {
        addToLog('❌ Du kan inte nå det rummet härifrån', 'warning');
        return;
    }
    
    // Show room info
    const hasKey = portalKeyHolder === game.playerCharacter.id;
    const info = currentDungeon.getRoomInfo(roomId, hasKey);
    addToLog(info, 'info');
}

// Replace exploration phase with dungeon exploration
function explorationPhase() {
    clearActionButtons();
    updatePhaseTitle("🗺️ Utforskning - Runda " + game.round);
    
    // Use dungeon system instead
    startDungeonExploration();
    renderDungeonMap();
}

