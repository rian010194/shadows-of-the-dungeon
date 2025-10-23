// ============================================
// SHADOWS OF THE DUNGEON - Main Game Logic
// ============================================

// ============================================
// DATA MODELS
// ============================================

class Player {
    constructor(id, name, isPlayer = false) {
        this.id = id;
        this.name = name;
        this.role = null; // "Innocent" or "Corrupted"
        this.alive = true;
        this.inventory = [];
        this.vote = null;
        this.escaped = false;
        this.isPlayer = isPlayer; // True if this is the human player
        this.stash = []; // Escaped loot
        
        // Character class properties
        this.characterClass = null;
        this.strength = 0;
        this.vitality = 0;
        this.agility = 0;
        this.intelligence = 0;
        this.currentStamina = 0;
    }
}

class LootItem {
    constructor(name, effect, rarity) {
        this.name = name;
        this.effect = effect;
        this.rarity = rarity;
    }
}

class GameState {
    constructor() {
        this.phase = "start";
        this.round = 1;
        this.players = [];
        this.lootPool = this.initializeLootPool();
        this.portalUnlocked = false;
        this.eventLog = [];
        this.playerCharacter = null; // Reference to the human player
        this.timeOfDay = "day"; // "day" or "night"
        this.dayNightVotes = {}; // Track votes for day/night cycle
        this.currentDay = 1;
    }

    initializeLootPool() {
        return [
            new LootItem("Ancient Orb", "Reveal a player's role", "rare"),
            new LootItem("Golden Chalice", "Worth 100 gold", "common"),
            new LootItem("Shadow Dagger", "Kill in darkness", "rare"),
            new LootItem("Healing Elixir", "Survive one attack", "uncommon"),
            new LootItem("Cursed Amulet", "Double loot, reveal role", "legendary"),
            new LootItem("Silver Coins", "Worth 20 gold", "common"),
            new LootItem("Magic Scroll", "Reveal event info", "uncommon"),
            new LootItem("Dragon Gem", "Worth 500 gold", "legendary"),
            new LootItem("Rusty Key", "Unknown purpose", "common"),
            new LootItem("Blood Stone", "Mark a target", "rare")
        ];
    }
}

// ============================================
// GLOBAL GAME STATE
// ============================================

let game = new GameState();
let gameTimers = {
    discussion: null,
    voting: null,
    exploration: null
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function addToLog(message, type = "info") {
    const entry = { message, type, timestamp: Date.now() };
    game.eventLog.push(entry);
    updateEventLog();
}

function clearLog() {
    game.eventLog = [];
    updateEventLog();
}

// ============================================
// UI UPDATE FUNCTIONS
// ============================================

function updatePhaseTitle(text) {
    document.getElementById("phase-title").textContent = text;
}

function updateEventLog() {
    const logElement = document.getElementById("event-log");
    logElement.innerHTML = "";
    
    game.eventLog.forEach(entry => {
        const div = document.createElement("div");
        div.className = `event-entry event-${entry.type}`;
        div.textContent = entry.message;
        logElement.appendChild(div);
    });
    
    // Auto-scroll to bottom
    logElement.scrollTop = logElement.scrollHeight;
}

function updatePlayersList() {
    const listElement = document.getElementById("players-list");
    listElement.innerHTML = "";
    
    game.players.forEach(player => {
        const card = document.createElement("div");
        card.className = "player-card";
        
        if (!player.alive) card.classList.add("dead");
        if (player.escaped) card.classList.add("escaped");
        if (player.isPlayer) card.classList.add("you");
        
        let statusText = "✅ Alive";
        if (!player.alive) statusText = "💀 Dead";
        if (player.escaped) statusText = "🚪 Escaped";
        
        let lootText = player.inventory.length > 0 
            ? `📦 ${player.inventory.length} items` 
            : "";
        
        let roleText = "";
        // Only show role if game is over or if it's the player character
        if (game.phase === "result" || player.isPlayer) {
            const roleEmoji = player.role === "Corrupted" ? "😈" : "😇";
            roleText = `<div class="player-role">${roleEmoji} ${player.role}</div>`;
        }
        
        card.innerHTML = `
            <div class="player-name">${player.name} ${player.isPlayer ? "(You)" : ""}</div>
            <div class="player-status">${statusText}</div>
            ${lootText ? `<div class="player-loot">${lootText}</div>` : ""}
            ${roleText}
        `;
        
        listElement.appendChild(card);
    });
}

function updateRoundInfo() {
    document.getElementById("round-number").textContent = game.round;
}

function updateInventory() {
    const inventoryElement = document.getElementById("inventory-items");
    
    if (!game.playerCharacter) {
        inventoryElement.textContent = "No player selected...";
        return;
    }
    
    if (game.playerCharacter.stash.length === 0) {
        inventoryElement.textContent = "No loot yet...";
        return;
    }
    
    inventoryElement.innerHTML = "";
    game.playerCharacter.stash.forEach(item => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "loot-item";
        itemDiv.innerHTML = `
            ${item.name} (${item.rarity})
            <span class="tooltip">
                ${item.effect}
                <span class="tooltip-rarity">${item.rarity.toUpperCase()}</span>
            </span>
        `;
        inventoryElement.appendChild(itemDiv);
    });
}

function showMainButton(text, onClick) {
    const btn = document.getElementById("main-action-btn");
    btn.textContent = text;
    btn.style.display = "inline-block";
    btn.onclick = onClick;
    btn.disabled = false;
}

function hideMainButton() {
    document.getElementById("main-action-btn").style.display = "none";
}

function clearActionButtons() {
    document.getElementById("vote-buttons").innerHTML = "";
    document.getElementById("extraction-buttons").innerHTML = "";
    document.getElementById("darkness-buttons").innerHTML = "";
    hideMainButton();
    
    // Hide chat container when not in dungeon
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
        chatContainer.style.display = 'none';
    }
    
    // Clear any active timers
    if (gameTimers.discussion) {
        clearInterval(gameTimers.discussion);
        gameTimers.discussion = null;
    }
    if (gameTimers.voting) {
        clearInterval(gameTimers.voting);
        gameTimers.voting = null;
    }
    if (gameTimers.exploration) {
        clearInterval(gameTimers.exploration);
        gameTimers.exploration = null;
    }
    
    // Remove timer elements
    const timers = ['discussion-timer', 'voting-timer', 'exploration-timer', 'day-night-timer'];
    timers.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.remove();
    });
}

// ============================================
// GAME PHASES
// ============================================

// ----------------------------------------
// START PHASE
// ----------------------------------------
async function startGame() {
    clearLog();
    clearActionButtons();
    game = new GameState();
    
    // Show end game button for single player
    const endGameBtn = document.getElementById('end-game-btn');
    if (endGameBtn) {
        endGameBtn.style.display = 'inline-block';
    }
    
    // Load equipped items from stash
    let startingItems = [];
    if (currentUser && typeof supabase !== 'undefined') {
        try {
            const { data: equipped } = await supabase
                .from('player_items')
                .select('*, items(*)')
                .eq('user_id', currentUser.id)
                .eq('is_equipped', true);
            
            if (equipped && equipped.length > 0) {
                startingItems = equipped.map(item => new LootItem(
                    item.items.name,
                    item.items.effect,
                    item.items.rarity
                ));
                addToLog(`🎒 You bring ${startingItems.length} items from your stash!`, 'info');
            }
        } catch (error) {
            console.error('Error loading equipped items:', error);
        }
    }
    
    // Create players
    const names = ["Ari", "Bjorn", "Cira", "Dusk", "Elara", "Finn", "Greta", "Hector"];
    const numPlayers = randomInt(5, 8);
    
    for (let i = 0; i < numPlayers; i++) {
        const isPlayer = (i === 0); // First player is the human
        game.players.push(new Player(i + 1, names[i], isPlayer));
    }
    
    game.playerCharacter = game.players[0];
    
    // Give player their equipped items
    if (startingItems.length > 0) {
        game.playerCharacter.inventory.push(...startingItems);
    }
    
    // Assign roles (25-30% corrupted)
    const numCorrupted = Math.max(1, Math.floor(numPlayers * 0.3));
    const shuffled = shuffleArray(game.players);
    
    for (let i = 0; i < numCorrupted; i++) {
        shuffled[i].role = "Corrupted";
    }
    
    game.players.forEach(player => {
        if (!player.role) player.role = "Innocent";
    });
    
    // Ensure player character is not corrupted on first game (tutorial)
    if (game.playerCharacter.role === "Corrupted") {
        // Find an innocent to swap with
        const innocentPlayer = game.players.find(p => p.role === "Innocent" && !p.isPlayer);
        if (innocentPlayer) {
            innocentPlayer.role = "Corrupted";
            game.playerCharacter.role = "Innocent";
            addToLog("🎓 As a new player, you start as Innocent to learn the game!", "info");
        }
    }
    
    updatePhaseTitle("📜 Start Phase - Dungeon Awakens");
    updateRoundInfo();
    updatePlayersList();
    updateInventory();
    
    addToLog("🏰 You descend into the dungeon...", "info");
    addToLog(`${numPlayers} brave adventurers dare to enter the darkness.`, "info");
    addToLog(`You are ${game.playerCharacter.name}.`, "success");
    addToLog(`Your role: ${game.playerCharacter.role} ${game.playerCharacter.role === "Corrupted" ? "😈" : "😇"}`, 
             game.playerCharacter.role === "Corrupted" ? "warning" : "success");
    
    if (game.playerCharacter.role === "Corrupted") {
        addToLog("🔪 You work in secret against the group. Survive and collect loot.", "warning");
    } else {
        addToLog("⚔️ Find the corrupted and survive to escape with your loot.", "success");
    }
    
    setTimeout(() => {
        // Start the new grid dungeon system
        console.log('Attempting to start dungeon exploration...');
        if (typeof startDungeonExploration === 'function') {
            console.log('startDungeonExploration function found, calling it...');
            startDungeonExploration();
        } else {
            console.log('startDungeonExploration function not found, falling back to old system...');
            showMainButton("Börja äventyret", dayNightVotingPhase);
        }
    }, 1000);
}

// ----------------------------------------
// EXPLORATION PHASE
// ----------------------------------------
function explorationPhase() {
    clearActionButtons();
    game.phase = "exploration";
    
    updatePhaseTitle("🔦 Exploration Phase - Seeking Treasures");
    addToLog("─────────────────────────────", "info");
    addToLog("🔦 You spread out through the dungeon searching for treasures...", "info");
    addToLog("⏰ You have 30 seconds to explore...", "info");
    
    updatePlayersList();
    
    // Start exploration timer
    let timeLeft = 30;
    const timerElement = document.createElement('div');
    timerElement.id = 'exploration-timer';
    timerElement.style.cssText = 'text-align: center; font-size: 1.2rem; color: #ffd700; margin: 10px 0; font-weight: bold;';
    document.getElementById('event-log').appendChild(timerElement);
    
    gameTimers.exploration = setInterval(() => {
        timeLeft--;
        timerElement.textContent = `⏰ Exploration Time: ${timeLeft}s`;
        
        if (timeLeft <= 0) {
            clearInterval(gameTimers.exploration);
            timerElement.remove();
            showMainButton("Rösta om nästa fas...", dayNightVotingPhase);
        }
    }, 1000);
    
    // Simulate exploration events for each player
    const alivePlayers = game.players.filter(p => p.alive);
    
    alivePlayers.forEach((player, index) => {
        setTimeout(() => {
            exploreForPlayer(player);
        }, 500 * (index + 1));
    });
}

function exploreForPlayer(player) {
    const events = [
        "hears mysterious whispers from the walls.",
        "finds bloody footsteps on the floor.",
        "feels a cold wind through the corridor.",
        "sees shadows moving in the darkness.",
        "finds ancient inscriptions on the wall."
    ];
    
    const lootChance = 0.35; // 35% chance
    
    if (Math.random() < lootChance) {
        const loot = randomElement(game.lootPool);
        const newLoot = new LootItem(loot.name, loot.effect, loot.rarity);
        player.inventory.push(newLoot);
        
        const emoji = loot.rarity === "legendary" ? "✨" : 
                     loot.rarity === "rare" ? "💎" : 
                     loot.rarity === "uncommon" ? "📿" : "💰";
        
        addToLog(`${emoji} ${player.name} finds a ${loot.name}!`, "success");
    } else {
        const event = randomElement(events);
        addToLog(`👁️ ${player.name} ${event}`, "info");
    }
    
    updatePlayersList();
}

// ----------------------------------------
// DAY/NIGHT VOTING PHASE
// ----------------------------------------
function dayNightVotingPhase() {
    clearActionButtons();
    game.phase = "day_night_voting";
    
    updatePhaseTitle(`🗳️ Runda ${game.round} - Röstning om tid på dygnet`);
    addToLog("─────────────────────────────", "info");
    addToLog(`🌅 Det är för närvarande ${game.timeOfDay === "day" ? "dag" : "natt"} (Dag ${game.currentDay})`, "info");
    addToLog("🗳️ Rösta om vad som ska hända härnäst:", "info");
    addToLog("• 🌅 Fortsätt med dag - Utforska och samla skatter", "info");
    addToLog("• 🌙 Byt till natt - Mörkerfasen börjar", "info");
    
    // Reset votes
    game.dayNightVotes = {};
    
    // Create voting buttons
    const voteContainer = document.getElementById("vote-buttons");
    voteContainer.innerHTML = "<p style='color: #d4af37; margin-bottom: 10px;'>Vad vill du rösta för?</p>";
    
    const dayBtn = document.createElement("button");
    dayBtn.className = "vote-btn";
    dayBtn.textContent = "🌅 Fortsätt Dag";
    dayBtn.onclick = () => castDayNightVote("day");
    voteContainer.appendChild(dayBtn);
    
    const nightBtn = document.createElement("button");
    nightBtn.className = "vote-btn";
    nightBtn.textContent = "🌙 Byt till Natt";
    nightBtn.onclick = () => castDayNightVote("night");
    voteContainer.appendChild(nightBtn);
    
    // Start voting timer
    let votingTime = 30;
    const timerElement = document.createElement('div');
    timerElement.id = 'day-night-timer';
    timerElement.style.cssText = 'text-align: center; font-size: 1.2rem; color: #ffd700; margin: 10px 0; font-weight: bold;';
    document.getElementById('event-log').appendChild(timerElement);
    
    gameTimers.voting = setInterval(() => {
        votingTime--;
        timerElement.textContent = `⏰ Röstningstid: ${votingTime}s`;
        
        if (votingTime <= 0) {
            clearInterval(gameTimers.voting);
            timerElement.remove();
            // Auto-vote for day if no choice made
            if (!game.dayNightVotes[game.playerCharacter.id]) {
                addToLog("⏰ Tiden är slut! Du röstar automatiskt för dag.", "warning");
                castDayNightVote("day");
            }
        }
    }, 1000);
}

function castDayNightVote(vote) {
    if (!game.playerCharacter.alive) {
        addToLog("☠️ Du är död och kan inte rösta.", "warning");
        return;
    }
    
    // Clear voting timer
    if (gameTimers.voting) {
        clearInterval(gameTimers.voting);
        const timerElement = document.getElementById('day-night-timer');
        if (timerElement) timerElement.remove();
    }
    
    game.dayNightVotes[game.playerCharacter.id] = vote;
    
    const voteText = vote === "day" ? "dag" : "natt";
    addToLog(`🗳️ Du röstar för ${voteText}.`, "info");
    
    clearActionButtons();
    
    // Simulate other players voting
    setTimeout(() => {
        simulateDayNightVoting();
    }, 1000);
}

function simulateDayNightVoting() {
    addToLog("🤔 De andra äventyrare röstar...", "info");
    
    const alivePlayers = game.players.filter(p => p.alive);
    
    // AI players vote
    alivePlayers.forEach(player => {
        if (player.isPlayer || game.dayNightVotes[player.id]) return;
        
        // AI voting logic - corrupted prefer night, innocents prefer day
        const vote = player.role === "Corrupted" ? 
            (Math.random() < 0.7 ? "night" : "day") : 
            (Math.random() < 0.6 ? "day" : "night");
        
        game.dayNightVotes[player.id] = vote;
    });
    
    // Count votes
    const dayVotes = Object.values(game.dayNightVotes).filter(v => v === "day").length;
    const nightVotes = Object.values(game.dayNightVotes).filter(v => v === "night").length;
    
    setTimeout(() => {
        addToLog(`📊 Röstresultat: ${dayVotes} för dag, ${nightVotes} för natt`, "info");
        
        if (nightVotes > dayVotes) {
            game.timeOfDay = "night";
            addToLog("🌙 Majoriteten röstar för natt! Mörkret faller...", "warning");
            setTimeout(() => {
                darknessPhase();
            }, 2000);
        } else {
            game.timeOfDay = "day";
            addToLog("🌅 Majoriteten röstar för dag! Fortsätter med utforskning...", "success");
            setTimeout(() => {
                explorationPhase();
            }, 2000);
        }
    }, 2000);
}

// ----------------------------------------
// DARKNESS PHASE
// ----------------------------------------
function darknessPhase() {
    clearActionButtons();
    game.phase = "darkness";
    
    updatePhaseTitle("🌑 Mörkerfas - Skräcken slår till");
    addToLog("─────────────────────────────", "info");
    addToLog("🌑 Mörkret faller över er... facklor slocknar en efter en.", "warning");
    addToLog("💀 Något rör sig i mörkret...", "warning");
    
    // Check if player is corrupted and alive
    if (game.playerCharacter.alive && game.playerCharacter.role === "Corrupted") {
        setTimeout(() => {
            offerCorruptedChoice();
        }, 1500);
    } else {
        setTimeout(() => {
            performDarknessActions();
        }, 1500);
    }
}

function offerCorruptedChoice() {
    const innocentPlayers = game.players.filter(p => p.alive && p.role === "Innocent");
    
    if (innocentPlayers.length === 0) {
        addToLog("👁️ No innocents to attack...", "info");
        setTimeout(() => {
            performDarknessActions();
        }, 1500);
        return;
    }
    
    addToLog("🔪 You are corrupted. Choose your victim...", "warning");
    
    const darknessContainer = document.getElementById("darkness-buttons");
    darknessContainer.innerHTML = "<p style='color: #d4af37; margin-bottom: 10px;'>Choose who to attack:</p>";
    
    innocentPlayers.forEach(player => {
        const btn = document.createElement("button");
        btn.className = "attack-btn";
        btn.textContent = `⚔️ Attack ${player.name}`;
        btn.onclick = () => attackPlayer(player);
        darknessContainer.appendChild(btn);
    });
    
    // Add option to skip
    const skipBtn = document.createElement("button");
    skipBtn.className = "attack-btn";
    skipBtn.textContent = "Skip Attack";
    skipBtn.onclick = () => attackPlayer(null);
    darknessContainer.appendChild(skipBtn);
}

function attackPlayer(target) {
    clearActionButtons();
    
    if (target) {
        // Check if target has protection
        const hasProtection = target.inventory.some(item => item.name === "Healing Elixir");
        
        if (hasProtection) {
            const elixirIndex = target.inventory.findIndex(item => item.name === "Healing Elixir");
            target.inventory.splice(elixirIndex, 1);
            addToLog(`⚔️ You attack ${target.name}, but they survive using a Healing Elixir!`, "warning");
        } else {
            target.alive = false;
            addToLog(`💀 You killed ${target.name} in the darkness!`, "warning");
            
            // Drop loot
            if (target.inventory.length > 0) {
                addToLog(`🎒 Their loot remains on the ground...`, "info");
            }
        }
        
        updatePlayersList();
    } else {
        addToLog("🤔 You choose not to attack this round.", "info");
    }
    
    setTimeout(() => {
        performDarknessActions();
    }, 2000);
}

function performDarknessActions() {
    const corruptedPlayers = game.players.filter(p => p.alive && p.role === "Corrupted" && !p.isPlayer);
    const innocentPlayers = game.players.filter(p => p.alive && p.role === "Innocent");
    
    if (corruptedPlayers.length === 0 || innocentPlayers.length === 0) {
        addToLog("👁️ Nothing happens in the darkness tonight...", "info");
        setTimeout(() => {
            showMainButton("Morning Comes", discussionPhase);
        }, 1500);
        return;
    }
    
    // Other corrupted NPCs have a chance to attack
    let attackHappened = false;
    
    corruptedPlayers.forEach((corrupted, index) => {
        setTimeout(() => {
            const attackChance = 0.5; // 50% chance to attack
            
            if (Math.random() < attackChance && innocentPlayers.some(p => p.alive)) {
                const aliveInnocents = innocentPlayers.filter(p => p.alive);
                const target = randomElement(aliveInnocents);
                
                // Check if target has protection
                const hasProtection = target.inventory.some(item => item.name === "Healing Elixir");
                
                if (hasProtection) {
                    const elixirIndex = target.inventory.findIndex(item => item.name === "Healing Elixir");
                    target.inventory.splice(elixirIndex, 1);
                    addToLog(`⚔️ An attack occurs! But ${target.name} survives thanks to a Healing Elixir!`, "warning");
                } else {
                    target.alive = false;
                    attackHappened = true;
                    
                    // Drop loot
                    const locations = ["the west corridor", "the north chamber", "the cellar", "the tower", "the altar"];
                    if (target.inventory.length > 0) {
                        addToLog(`💀 ${target.name} is found dead in ${randomElement(locations)}.`, "warning");
                        addToLog(`🎒 Their loot remains at the scene...`, "info");
                    } else {
                        addToLog(`💀 ${target.name} is found dead in ${randomElement(locations)}.`, "warning");
                    }
                }
                
                updatePlayersList();
            }
        }, 1000 * index);
    });
    
    setTimeout(() => {
        if (!attackHappened) {
            addToLog("🕯️ You hear screams in the distance, but everyone in the group is alive...", "info");
        }
        
        setTimeout(() => {
            showMainButton("Samla för diskussion", discussionPhase);
        }, 1500);
    }, 1000 * (corruptedPlayers.length + 1));
}

// ----------------------------------------
// DISCUSSION PHASE
// ----------------------------------------
function discussionPhase() {
    clearActionButtons();
    game.phase = "discussion";
    
    const alivePlayers = game.players.filter(p => p.alive);
    
    if (alivePlayers.length <= 1) {
        resultPhase();
        return;
    }
    
    updatePhaseTitle("🗣️ Discussion Phase - Who Lies?");
    addToLog("─────────────────────────────", "info");
    addToLog("🗣️ You gather to discuss what happened...", "info");
    addToLog("🔍 Someone here is corrupted. Discuss and vote to eliminate a suspect.", "warning");
    addToLog("⏰ You have 60 seconds to discuss before voting begins...", "info");
    
    updatePlayersList();
    
    // Start discussion timer
    let discussionTime = 60;
    const timerElement = document.createElement('div');
    timerElement.id = 'discussion-timer';
    timerElement.style.cssText = 'text-align: center; font-size: 1.2rem; color: #ffd700; margin: 10px 0; font-weight: bold;';
    document.getElementById('event-log').appendChild(timerElement);
    
    gameTimers.discussion = setInterval(() => {
        discussionTime--;
        timerElement.textContent = `⏰ Discussion Time: ${discussionTime}s`;
        
        if (discussionTime <= 0) {
            clearInterval(gameTimers.discussion);
            timerElement.remove();
            startVotingPhase();
        }
    }, 1000);
    
    // Add discussion tips
    addToLog("💡 Discussion Tips:", "info");
    addToLog("• Share what you saw during exploration", "info");
    addToLog("• Look for suspicious behavior", "info");
    addToLog("• Consider who might be lying", "info");
    addToLog("• Remember: Corrupted players will try to mislead you", "info");
}

// ----------------------------------------
// VOTING PHASE
// ----------------------------------------
function startVotingPhase() {
    clearActionButtons();
    game.phase = "voting";
    
    updatePhaseTitle("🗳️ Voting Phase - Choose Wisely");
    addToLog("─────────────────────────────", "info");
    addToLog("🗳️ Discussion time is over! Now vote to eliminate a suspect.", "warning");
    addToLog("⏰ You have 30 seconds to vote...", "info");
    
    const alivePlayers = game.players.filter(p => p.alive);
    
    // Create vote buttons
    const voteContainer = document.getElementById("vote-buttons");
    voteContainer.innerHTML = "<p style='color: #d4af37; margin-bottom: 10px;'>Vote for who to eliminate:</p>";
    
    alivePlayers.forEach(player => {
        if (player.id === game.playerCharacter.id && game.playerCharacter.alive) {
            // Can't vote for yourself
            return;
        }
        
        const btn = document.createElement("button");
        btn.className = "vote-btn";
        btn.textContent = `Vote ${player.name}`;
        btn.onclick = () => castVote(player);
        voteContainer.appendChild(btn);
    });
    
    // Add skip vote option
    const skipBtn = document.createElement("button");
    skipBtn.className = "vote-btn";
    skipBtn.textContent = "Skip Vote";
    skipBtn.onclick = () => castVote(null);
    voteContainer.appendChild(skipBtn);
    
    // Start voting timer
    let votingTime = 30;
    const timerElement = document.createElement('div');
    timerElement.id = 'voting-timer';
    timerElement.style.cssText = 'text-align: center; font-size: 1.2rem; color: #ff6b6b; margin: 10px 0; font-weight: bold;';
    document.getElementById('event-log').appendChild(timerElement);
    
    gameTimers.voting = setInterval(() => {
        votingTime--;
        timerElement.textContent = `⏰ Voting Time: ${votingTime}s`;
        
        if (votingTime <= 0) {
            clearInterval(gameTimers.voting);
            timerElement.remove();
            // Auto-skip vote if no choice made
            if (game.playerCharacter.vote === null) {
                addToLog("⏰ Time's up! You automatically skip voting.", "warning");
                castVote(null);
            }
        }
    }, 1000);
}

function castVote(targetPlayer) {
    if (!game.playerCharacter.alive) {
        addToLog("☠️ You are dead and cannot vote.", "warning");
        return;
    }
    
    // Clear voting timer
    if (gameTimers.voting) {
        clearInterval(gameTimers.voting);
        const timerElement = document.getElementById('voting-timer');
        if (timerElement) timerElement.remove();
    }
    
    game.playerCharacter.vote = targetPlayer ? targetPlayer.id : null;
    
    if (targetPlayer) {
        addToLog(`🗳️ You vote for ${targetPlayer.name}.`, "info");
    } else {
        addToLog("🗳️ You choose to skip voting.", "info");
    }
    
    clearActionButtons();
    
    // Simulate other players voting
    setTimeout(() => {
        simulateVoting();
    }, 1000);
}

function simulateVoting() {
    addToLog("🤔 The other adventurers vote...", "info");
    
    const alivePlayers = game.players.filter(p => p.alive);
    
    // AI players vote (with some strategy)
    alivePlayers.forEach(player => {
        if (player.isPlayer || player.vote !== null) return;
        
        const otherPlayers = alivePlayers.filter(p => p.id !== player.id);
        
        if (Math.random() < 0.2) {
            // 20% chance to skip
            player.vote = null;
        } else {
            // Vote for someone
            const target = randomElement(otherPlayers);
            player.vote = target.id;
        }
    });
    
    // Count votes
    const votes = {};
    alivePlayers.forEach(player => {
        if (player.vote !== null) {
            votes[player.vote] = (votes[player.vote] || 0) + 1;
        }
    });
    
    // Find player with most votes
    let maxVotes = 0;
    let eliminatedPlayer = null;
    
    for (const [playerId, voteCount] of Object.entries(votes)) {
        if (voteCount > maxVotes) {
            maxVotes = voteCount;
            eliminatedPlayer = game.players.find(p => p.id === parseInt(playerId));
        }
    }
    
    setTimeout(() => {
        if (eliminatedPlayer && maxVotes > 0) {
            eliminatedPlayer.alive = false;
            addToLog(`⚖️ ${eliminatedPlayer.name} receives ${maxVotes} votes and is eliminated!`, "warning");
            addToLog(`🎭 ${eliminatedPlayer.name} was ${eliminatedPlayer.role}!`, 
                     eliminatedPlayer.role === "Corrupted" ? "success" : "warning");
        } else {
            addToLog("🤷 No one receives enough votes. No one is eliminated.", "info");
        }
        
        updatePlayersList();
        
        // Reset votes
        game.players.forEach(p => p.vote = null);
        
        setTimeout(() => {
            if (!checkWinConditions()) {
                game.currentDay++;
                showMainButton("Nästa dag börjar...", dayNightVotingPhase);
            }
        }, 2000);
    }, 2000);
}

// ----------------------------------------
// EXTRACTION PHASE
// ----------------------------------------
function extractionPhase() {
    clearActionButtons();
    game.phase = "extraction";
    
    const alivePlayers = game.players.filter(p => p.alive && !p.escaped);
    
    if (alivePlayers.length === 0) {
        resultPhase();
        return;
    }
    
    updatePhaseTitle("🚪 Extraction Phase - Flee or Stay?");
    addToLog("─────────────────────────────", "info");
    addToLog("🔮 The portal activates with a blue glow!", "success");
    addToLog("🚪 You have a chance to escape with your loot, or stay for more...", "info");
    
    updatePlayersList();
    
    if (!game.playerCharacter.alive) {
        addToLog("☠️ You are dead and cannot escape.", "warning");
        setTimeout(() => {
            simulateExtractions();
        }, 2000);
        return;
    }
    
    // Create extraction buttons
    const extractContainer = document.getElementById("extraction-buttons");
    extractContainer.innerHTML = "<p style='color: #d4af37; margin-bottom: 10px;'>What do you do?</p>";
    
    const fleeBtn = document.createElement("button");
    fleeBtn.className = "extraction-btn flee";
    fleeBtn.textContent = "🏃 Flee Now!";
    fleeBtn.onclick = () => makeExtractionChoice(true);
    extractContainer.appendChild(fleeBtn);
    
    const stayBtn = document.createElement("button");
    stayBtn.className = "extraction-btn stay";
    stayBtn.textContent = "⏳ Stay Behind";
    stayBtn.onclick = () => makeExtractionChoice(false);
    extractContainer.appendChild(stayBtn);
}

function makeExtractionChoice(shouldFlee) {
    if (!game.playerCharacter.alive) return;
    
    clearActionButtons();
    
    if (shouldFlee) {
        game.playerCharacter.escaped = true;
        // Transfer inventory to stash
        game.playerCharacter.stash.push(...game.playerCharacter.inventory);
        game.playerCharacter.inventory = [];
        
        addToLog(`✨ You run through the portal and escape with your loot!`, "success");
        updateInventory();
    } else {
        addToLog(`⚔️ You choose to stay behind in the dungeon...`, "warning");
    }
    
    updatePlayersList();
    
    setTimeout(() => {
        simulateExtractions();
    }, 1500);
}

function simulateExtractions() {
    addToLog("🎭 The other adventurers make their decisions...", "info");
    
    const alivePlayers = game.players.filter(p => p.alive && !p.escaped && !p.isPlayer);
    
    alivePlayers.forEach((player, index) => {
        setTimeout(() => {
            // Corrupted are more likely to stay, innocents more likely to flee
            const fleeChance = player.role === "Innocent" ? 0.6 : 0.3;
            
            if (Math.random() < fleeChance) {
                player.escaped = true;
                player.stash.push(...player.inventory);
                player.inventory = [];
                addToLog(`🏃 ${player.name} flees through the portal!`, "info");
            } else {
                addToLog(`⚔️ ${player.name} stays behind.`, "info");
            }
            
            updatePlayersList();
        }, 500 * index);
    });
    
    setTimeout(() => {
        const stillInDungeon = game.players.filter(p => p.alive && !p.escaped);
        
        if (stillInDungeon.length > 1) {
            addToLog("🌀 The portal closes. Those who stayed must continue...", "warning");
            game.round++;
            updateRoundInfo();
            
            setTimeout(() => {
                showMainButton("Next Round", explorationPhase);
            }, 2000);
        } else {
            resultPhase();
        }
    }, 500 * (alivePlayers.length + 2));
}

// ----------------------------------------
// RESULT PHASE
// ----------------------------------------
function resultPhase() {
    clearActionButtons();
    game.phase = "result";
    
    updatePhaseTitle("🏆 Result Phase - Game Over");
    addToLog("─────────────────────────────", "info");
    addToLog("📜 THE ADVENTURE IS OVER", "success");
    addToLog("═══════════════════════════", "info");
    
    updatePlayersList();
    updateInventory();
    
    // Show results
    const escaped = game.players.filter(p => p.escaped);
    const dead = game.players.filter(p => !p.alive);
    const trapped = game.players.filter(p => p.alive && !p.escaped);
    
    addToLog(`\n🏃 ${escaped.length} adventurers escaped from the dungeon:`, "success");
    escaped.forEach(p => {
        addToLog(`  • ${p.name} (${p.role}) - ${p.stash.length} items in stash`, "success");
    });
    
    if (dead.length > 0) {
        addToLog(`\n💀 ${dead.length} adventurers died:`, "warning");
        dead.forEach(p => {
            addToLog(`  • ${p.name} (${p.role})`, "warning");
        });
    }
    
    if (trapped.length > 0) {
        addToLog(`\n⚰️ ${trapped.length} adventurers are still trapped:`, "warning");
        trapped.forEach(p => {
            addToLog(`  • ${p.name} (${p.role})`, "warning");
        });
    }
    
    // Determine winner
    addToLog("\n═══════════════════════════", "info");
    const corruptedEscaped = escaped.filter(p => p.role === "Corrupted").length;
    const innocentEscaped = escaped.filter(p => p.role === "Innocent").length;
    
    if (game.playerCharacter.escaped) {
        addToLog("🎉 YOU SURVIVED AND ESCAPED!", "success");
        addToLog(`💰 Your stash: ${game.playerCharacter.stash.length} items`, "success");
    } else if (!game.playerCharacter.alive) {
        addToLog("💀 You died in the dungeon...", "warning");
    } else {
        addToLog("⚰️ You are trapped in the dungeon...", "warning");
    }
    
    addToLog("\n═══════════════════════════", "info");
    
    // Award gold and update stats
    if (currentUser && game.playerCharacter) {
        const lootCount = game.playerCharacter.stash.length;
        const goldEarned = lootCount * 10; // 10 gold per item
        const won = game.playerCharacter.escaped;
        
        if (lootCount > 0) {
            addToLog(`\n💰 You earned ${goldEarned} gold from your loot!`, 'success');
            updateUserStats(won, lootCount, goldEarned, game.playerCharacter.escaped);
        }
    }
    
    setTimeout(() => {
        showMainButton("🔄 Play Again", startGame);
        // Hide end game button
        const endGameBtn = document.getElementById('end-game-btn');
        if (endGameBtn) {
            endGameBtn.style.display = 'none';
        }
    }, 1000);
}

// ----------------------------------------
// WIN CONDITION CHECKS
// ----------------------------------------
function checkWinConditions() {
    const alivePlayers = game.players.filter(p => p.alive && !p.escaped);
    const aliveCorrupted = alivePlayers.filter(p => p.role === "Corrupted");
    const aliveInnocent = alivePlayers.filter(p => p.role === "Innocent");
    
    // If no one alive in dungeon, go to results
    if (alivePlayers.length === 0) {
        setTimeout(resultPhase, 2000);
        return true;
    }
    
    // If only corrupted left
    if (aliveInnocent.length === 0 && aliveCorrupted.length > 0) {
        addToLog("😈 All Innocents are gone! The Corrupted control the dungeon!", "warning");
        setTimeout(resultPhase, 2000);
        return true;
    }
    
    // If only innocents left
    if (aliveCorrupted.length === 0 && aliveInnocent.length > 0) {
        addToLog("😇 All Corrupted are eliminated! The Innocents can flee!", "success");
        setTimeout(extractionPhase, 2000);
        return true;
    }
    
    return false;
}

// ============================================
// END GAME EARLY
// ============================================
function endGameEarly() {
    if (confirm('Are you sure you want to end the game and return to the menu?')) {
        // Save any earned loot/gold
        const lootCount = game.playerCharacter ? game.playerCharacter.stash.length : 0;
        const goldEarned = lootCount * 10; // 10 gold per item
        
        if (currentUser && lootCount > 0) {
            updateUserStats(false, lootCount, goldEarned, game.playerCharacter.escaped);
            addToLog(`💰 You earned ${goldEarned} gold from ${lootCount} items!`, 'success');
        }
        
        // Return to menu
        setTimeout(() => {
            showMenuScreen();
        }, 1000);
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("🎮 Shadows of the Dungeon - Initialized");
    
    // Initial state
    updatePhaseTitle("Welcome to the Dungeon");
    addToLog("🏰 Shadows of the Dungeon", "info");
    addToLog("A social deception extraction roguelite", "info");
    addToLog("", "info");
    addToLog("🎯 Goal: Survive, collect loot, and escape from the dungeon", "success");
    addToLog("⚠️ But beware... some of you are corrupted...", "warning");
    
    showMainButton("Start Game", startGame);
});

