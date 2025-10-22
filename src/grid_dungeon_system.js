// ============================================
// GRID-BASED DUNGEON SYSTEM
// ============================================

class GridDungeonRoom {
    constructor(x, y, name, description) {
        this.x = x;
        this.y = y;
        this.id = `${x},${y}`;
        this.name = name;
        this.description = description;
        this.type = 'empty'; // empty, key, portal, boss, monster, treasure, trap, hall
        this.connectedRooms = []; // Array of room IDs
        this.playersInRoom = []; // Array of player IDs
        this.explored = false;
        this.cleared = false;
        this.monster = null;
        this.treasure = null;
        this.directions = {
            north: null,
            south: null,
            east: null,
            west: null
        };
    }
}

class GridDungeon {
    constructor(width = 5, height = 5) {
        this.width = width;
        this.height = height;
        this.rooms = new Map(); // Use Map for 2D grid access
        this.startRoom = null;
        this.keyRoom = null;
        this.portalRoom = null;
        this.bossRoom = null;
        this.currentRound = 1;
        
        this.generateGridDungeon();
    }
    
    generateGridDungeon() {
        // Create grid of rooms
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const room = this.createRoom(x, y);
                this.rooms.set(`${x},${y}`, room);
            }
        }
        
        // Connect adjacent rooms
        this.connectAdjacentRooms();
        
        // Set random starting position
        this.setRandomStart();
        
        // Assign special rooms
        this.assignSpecialRooms();
        
        // Add monsters and content
        this.addMonstersAndContent();
    }
    
    createRoom(x, y) {
        const roomTemplates = [
            { name: "Mörk Hall", desc: "En tom hall med höga tak" },
            { name: "Gamla Biblioteket", desc: "Dammiga bokhyllor täcker väggarna" },
            { name: "Vapenkammaren", desc: "Rostiga vapen hänger på väggarna" },
            { name: "Skattvalvet", desc: "Glimtar av guld lyser i mörkret" },
            { name: "Tortyrkammaren", desc: "Skrämmande verktyg står mot väggarna" },
            { name: "Rituella rummet", desc: "Mystiska symboler täcker golvet" },
            { name: "Tronsalen", desc: "En massiv tron står i rummets mitt" },
            { name: "Kryptan", desc: "Gamla kistor står längs väggarna" },
            { name: "Alkemilaboratoriet", desc: "Bubblande flaskor och konstiga lukter" },
            { name: "Förrådet", desc: "Staplade lådor och utrustning" },
            { name: "Ceremonihallen", desc: "Ett stort rum med högt i tak" },
            { name: "Fängelsehålan", desc: "Gamla celler med rostiga galler" },
            { name: "Korridoren", desc: "En lång mörk korridor" },
            { name: "Väntrummet", desc: "Ett tomt rum med gamla stolar" },
            { name: "Arkivet", desc: "Staplade dokument och pergament" },
            { name: "Köket", desc: "Gamla köksredskap och rostiga kastruller" },
            { name: "Sovrummet", desc: "En säng och en byrå" },
            { name: "Badrummet", desc: "En gammal badkar och spegel" },
            { name: "Källaren", desc: "En mörk källare med fuktiga väggar" },
            { name: "Vindsvåningen", desc: "Ett trångt rum under taket" }
        ];
        
        const template = roomTemplates[Math.floor(Math.random() * roomTemplates.length)];
        return new GridDungeonRoom(x, y, template.name, template.desc);
    }
    
    connectAdjacentRooms() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const room = this.rooms.get(`${x},${y}`);
                if (!room) continue;
                
                // Connect to adjacent rooms
                const directions = [
                    { dx: 0, dy: -1, dir: 'north' },
                    { dx: 0, dy: 1, dir: 'south' },
                    { dx: 1, dy: 0, dir: 'east' },
                    { dx: -1, dy: 0, dir: 'west' }
                ];
                
                directions.forEach(({ dx, dy, dir }) => {
                    const newX = x + dx;
                    const newY = y + dy;
                    
                    if (newX >= 0 && newX < this.width && newY >= 0 && newY < this.height) {
                        const adjacentRoom = this.rooms.get(`${newX},${newY}`);
                        if (adjacentRoom) {
                            room.connectedRooms.push(adjacentRoom.id);
                            room.directions[dir] = adjacentRoom.id;
                        }
                    }
                });
            }
        }
    }
    
    setRandomStart() {
        // Choose a random starting position (not on edges for better gameplay)
        const startX = Math.floor(Math.random() * (this.width - 2)) + 1;
        const startY = Math.floor(Math.random() * (this.height - 2)) + 1;
        
        this.startRoom = this.rooms.get(`${startX},${startY}`);
        this.startRoom.name = "Ingångshallen";
        this.startRoom.description = "Alla äventyrare samlas här vid ingången";
        this.startRoom.type = 'start';
    }
    
    assignSpecialRooms() {
        const availableRooms = Array.from(this.rooms.values())
            .filter(room => room.id !== this.startRoom.id);
        
        // Shuffle available rooms
        const shuffledRooms = this.shuffleArray([...availableRooms]);
        
        // Assign key room
        this.keyRoom = shuffledRooms[0];
        this.keyRoom.type = 'key';
        
        // Assign portal room
        this.portalRoom = shuffledRooms[1];
        this.portalRoom.type = 'portal';
        
        // Assign boss room
        this.bossRoom = shuffledRooms[2];
        this.bossRoom.type = 'boss';
        this.bossRoom.monster = this.createBossMonster();
    }
    
    addMonstersAndContent() {
        const availableRooms = Array.from(this.rooms.values())
            .filter(room => 
                room.id !== this.startRoom.id && 
                room.id !== this.keyRoom.id && 
                room.id !== this.portalRoom.id && 
                room.id !== this.bossRoom.id
            );
        
        // Add monsters to some rooms (about 30% of remaining rooms)
        const monsterCount = Math.floor(availableRooms.length * 0.3);
        const monsterRooms = this.shuffleArray([...availableRooms]).slice(0, monsterCount);
        
        monsterRooms.forEach(room => {
            room.type = 'monster';
            room.monster = this.createSmallMonster();
        });
        
        // Add treasure to some other rooms (about 40% of remaining)
        const remainingRooms = availableRooms.filter(room => !monsterRooms.includes(room));
        const treasureCount = Math.floor(remainingRooms.length * 0.4);
        const treasureRooms = this.shuffleArray([...remainingRooms]).slice(0, treasureCount);
        
        treasureRooms.forEach(room => {
            room.type = 'treasure';
        });
        
        // Add traps to some remaining rooms
        const trapRooms = remainingRooms.filter(room => !treasureRooms.includes(room));
        const trapCount = Math.floor(trapRooms.length * 0.3);
        const selectedTrapRooms = this.shuffleArray([...trapRooms]).slice(0, trapCount);
        
        selectedTrapRooms.forEach(room => {
            room.type = 'trap';
        });
        
        // Remaining rooms stay as 'empty' or 'hall'
        const emptyRooms = remainingRooms.filter(room => 
            !treasureRooms.includes(room) && !selectedTrapRooms.includes(room)
        );
        
        emptyRooms.forEach(room => {
            room.type = Math.random() < 0.5 ? 'empty' : 'hall';
        });
    }
    
    createBossMonster() {
        const bossNames = [
            "Skuggdrakonen",
            "Den Korrupta Kungen", 
            "Mörkrets Väktare",
            "Förbannelsen Själv",
            "Den Gamla Häxmästaren"
        ];
        
        const name = bossNames[Math.floor(Math.random() * bossNames.length)];
        const hp = 80 + Math.floor(Math.random() * 40);
        const damage = 15 + Math.floor(Math.random() * 10);
        
        return {
            name,
            hp,
            maxHp: hp,
            damage,
            isBoss: true,
            alive: true,
            loot: this.generateBossLoot()
        };
    }
    
    createSmallMonster() {
        const monsterNames = [
            "Skuggvarelse", "Rostig Skelett", "Mörk Älva", "Korrupt Gnom",
            "Skräckvarg", "Giftspindel", "Mystisk Varelse", "Förbannad Ande"
        ];
        
        const name = monsterNames[Math.floor(Math.random() * monsterNames.length)];
        const hp = 20 + Math.floor(Math.random() * 20);
        const damage = 5 + Math.floor(Math.random() * 8);
        
        return {
            name,
            hp,
            maxHp: hp,
            damage,
            isBoss: false,
            alive: true,
            loot: this.generateMonsterLoot()
        };
    }
    
    generateBossLoot() {
        const bossLoot = [
            { name: "Drakens Hjärta", value: 500, type: "material" },
            { name: "Kungens Krona", value: 300, type: "accessory" },
            { name: "Mörkrets Klinga", value: 400, type: "weapon" },
            { name: "Förbannelsens Ring", value: 250, type: "accessory" }
        ];
        
        return bossLoot[Math.floor(Math.random() * bossLoot.length)];
    }
    
    generateMonsterLoot() {
        const monsterLoot = [
            { name: "Monsterklon", value: 50, type: "material" },
            { name: "Skuggdamm", value: 30, type: "material" },
            { name: "Gammal Mynt", value: 20, type: "currency" },
            { name: "Mystisk Fragment", value: 40, type: "material" }
        ];
        
        return monsterLoot[Math.floor(Math.random() * monsterLoot.length)];
    }
    
    getRoom(x, y) {
        return this.rooms.get(`${x},${y}`);
    }
    
    getRoomById(id) {
        return this.rooms.get(id);
    }
    
    getAvailableDirections(roomId) {
        const room = this.getRoomById(roomId);
        if (!room) return [];
        
        const directions = [];
        if (room.directions.north) directions.push('north');
        if (room.directions.south) directions.push('south');
        if (room.directions.east) directions.push('east');
        if (room.directions.west) directions.push('west');
        
        return directions;
    }
    
    movePlayer(playerId, direction) {
        const currentRoom = this.getCurrentPlayerRoom(playerId);
        if (!currentRoom) return null;
        
        const targetRoomId = currentRoom.directions[direction];
        if (!targetRoomId) return null;
        
        const targetRoom = this.getRoomById(targetRoomId);
        if (!targetRoom) return null;
        
        // Remove player from current room
        const currentRoomIndex = currentRoom.playersInRoom.indexOf(playerId);
        if (currentRoomIndex > -1) {
            currentRoom.playersInRoom.splice(currentRoomIndex, 1);
        }
        
        // Add player to target room
        targetRoom.playersInRoom.push(playerId);
        targetRoom.explored = true;
        
        return targetRoom;
    }
    
    getCurrentPlayerRoom(playerId) {
        for (const room of this.rooms.values()) {
            if (room.playersInRoom.includes(playerId)) {
                return room;
            }
        }
        return null;
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    // Get dungeon map for display
    getDungeonMap() {
        const map = [];
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                const room = this.getRoom(x, y);
                if (room) {
                    row.push({
                        id: room.id,
                        name: room.name,
                        type: room.type,
                        explored: room.explored,
                        players: room.playersInRoom.length
                    });
                } else {
                    row.push(null);
                }
            }
            map.push(row);
        }
        return map;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GridDungeon, GridDungeonRoom };
}

// Make classes globally available
if (typeof window !== 'undefined') {
    window.GridDungeon = GridDungeon;
    window.GridDungeonRoom = GridDungeonRoom;
}
