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
        
        // Voting system
        this.votingPhase = false;
        this.votes = {}; // playerId -> targetPlayerId
        this.votingTimer = null;
        this.votingDuration = 30000; // 30 seconds
        
        // Win conditions
        this.gameEnded = false;
        this.winner = null; // "innocent" or "corrupted"
        this.winReason = null;
        
        // Social deduction
        this.accusations = []; // Array of accusation objects
        this.evidence = []; // Array of evidence objects
        this.suspiciousActions = []; // Track suspicious player actions
    }

    initializeLootPool() {
        return [
            new LootItem("Healing Elixir", "heal", "common"),
            new LootItem("Strength Potion", "strength", "common"),
            new LootItem("Speed Elixir", "speed", "common"),
            new LootItem("Magic Scroll", "magic", "rare"),
            new LootItem("Golden Key", "key", "rare"),
            new LootItem("Ancient Artifact", "artifact", "legendary")
        ];
    }
}

// ============================================
// GLOBAL VARIABLES
// ============================================

let game = null;
let gameTimers = {};

// ============================================
// UI FUNCTIONS
// ============================================

function addToLog(message, type = "info") {
    const logElement = document.getElementById('event-log');
    if (logElement) {
        const messageElement = document.createElement('div');
        messageElement.className = `log-message ${type}`;
        messageElement.textContent = message;
        logElement.appendChild(messageElement);
        logElement.scrollTop = logElement.scrollHeight;
    }
}

function clearLog() {
    const logElement = document.getElementById('event-log');
    if (logElement) {
        logElement.innerHTML = '';
    }
}

function updatePhaseTitle(text) {
    const titleElement = document.getElementById('phase-title');
    if (titleElement) {
        titleElement.textContent = text;
    }
}

function showMainButton(text, onClick) {
    const buttonContainer = document.getElementById('action-buttons');
    if (buttonContainer) {
        buttonContainer.innerHTML = '';
        const button = document.createElement('button');
        button.textContent = text;
        button.className = 'action-btn';
        button.onclick = onClick;
        buttonContainer.appendChild(button);
    }
}

function clearActionButtons() {
    const buttonContainer = document.getElementById('action-buttons');
    if (buttonContainer) {
        buttonContainer.innerHTML = '';
    }
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
    
    // Create human player first
    game.playerCharacter = new Player("player", "You", true);
    
    // Load equipped items from stash
    if (window.loadEquippedItems) {
        const equippedItems = await window.loadEquippedItems();
        if (equippedItems && equippedItems.length > 0) {
            const startingItems = equippedItems.map(item => new LootItem(item.name, item.effect, item.rarity));
            game.playerCharacter.inventory = [...startingItems];
            
            // Update player items display if function exists
            if (typeof window.updatePlayerItemsDisplay === 'function') {
                window.updatePlayerItemsDisplay();
            }
            
                addToLog(`🎒 You bring ${startingItems.length} items from your stash!`, 'info');
        } else {
            addToLog(`🎒 You start with no items from your stash.`, 'info');
        }
    }
    
    // Create AI players
    const aiNames = ["Aria", "Bjorn", "Cora", "Dante", "Elena", "Finn", "Greta", "Hugo"];
    const numPlayers = 4; // 1 human + 3 AI
    
    for (let i = 0; i < numPlayers - 1; i++) {
        const aiPlayer = new Player(`ai_${i}`, aiNames[i], false);
        aiPlayer.role = Math.random() < 0.3 ? "Corrupted" : "Innocent";
        game.players.push(aiPlayer);
    }
    
    // Set human player role
    if (game.playerCharacter) {
        game.playerCharacter.role = "Innocent"; // Always start as innocent for single player
            addToLog("🎓 As a new player, you start as Innocent to learn the game!", "info");
        game.players.push(game.playerCharacter);
    }
    
    // Start dungeon exploration
    updatePhaseTitle("📜 Start Phase - Dungeon Awakens");
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
    
    // Start dungeon exploration
    if (typeof window.startDungeonExploration === 'function') {
        window.startDungeonExploration();
    }
}

// ============================================
// VOTING SYSTEM
// ============================================

function startVotingPhase() {
    if (game.votingPhase || game.gameEnded) return;
    
    game.votingPhase = true;
    game.votes = {};
    
    addToLog('🗳️ Voting Phase Begins!', 'info');
    addToLog('Discuss and vote for who you think is corrupted...', 'info');
    addToLog('You have 30 seconds to vote!', 'warning');
    
    // Show voting interface
    showVotingInterface();
    
    // Start voting timer
    game.votingTimer = setTimeout(() => {
        endVotingPhase();
    }, game.votingDuration);
    
    // Update UI to show voting phase
    updatePhaseTitle("🗳️ Voting Phase - Round " + game.round);
}

function showVotingInterface() {
    const actionButtons = document.getElementById('dungeon-action-buttons');
    if (!actionButtons) return;
    
    actionButtons.innerHTML = '';
    
    // Get alive players (excluding self)
    const alivePlayers = game.players.filter(player => 
        player.alive && 
        !player.isDead && 
        player.id !== game.playerCharacter.id
    );
    
    if (alivePlayers.length === 0) {
        addToLog('❌ No one to vote for!', 'warning');
        return;
    }
    
    // Add voting header
    const votingHeader = document.createElement('h3');
    votingHeader.textContent = '🗳️ Vote for Suspected Corrupted Player';
    votingHeader.style.color = '#FF5722';
    votingHeader.style.margin = '0 0 10px 0';
    votingHeader.style.textAlign = 'center';
    actionButtons.appendChild(votingHeader);
    
    // Add vote buttons for each player
    alivePlayers.forEach(player => {
        const voteButton = document.createElement('button');
        voteButton.textContent = `🗳️ Vote for ${player.name}`;
        voteButton.className = 'action-btn vote-btn';
        voteButton.onclick = () => castVote(player.id);
        actionButtons.appendChild(voteButton);
    });
    
    // Add abstain button
    const abstainButton = document.createElement('button');
    abstainButton.textContent = '🤷 Abstain (No Vote)';
    abstainButton.className = 'action-btn abstain-btn';
    abstainButton.onclick = () => castVote(null);
    actionButtons.appendChild(abstainButton);
    
    // Add evidence button
    const evidenceButton = document.createElement('button');
    evidenceButton.textContent = '🔍 View Evidence';
    evidenceButton.className = 'action-btn evidence-btn';
    evidenceButton.onclick = () => showEvidenceInterface();
    actionButtons.appendChild(evidenceButton);
    
    // Add current votes display
    updateVotesDisplay();
}

function castVote(targetPlayerId) {
    if (!game.votingPhase) return;
    
    const playerId = game.playerCharacter.id;
    game.votes[playerId] = targetPlayerId;
    
    if (targetPlayerId) {
        const targetPlayer = game.players.find(p => p.id === targetPlayerId);
        addToLog(`🗳️ You voted for ${targetPlayer.name}`, 'info');
    } else {
        addToLog('🗳️ You abstained from voting', 'info');
    }
    
    updateVotesDisplay();
    
    // Check if all players have voted
    const alivePlayers = game.players.filter(player => player.alive && !player.isDead);
    const votedPlayers = Object.keys(game.votes);
    
    if (votedPlayers.length >= alivePlayers.length) {
        // All players have voted, end voting early
        setTimeout(() => endVotingPhase(), 1000);
    }
}

function updateVotesDisplay() {
    const actionButtons = document.getElementById('dungeon-action-buttons');
    if (!actionButtons || !game.votingPhase) return;
    
    // Remove existing votes display
    const existingDisplay = actionButtons.querySelector('.votes-display');
    if (existingDisplay) {
        existingDisplay.remove();
    }
    
    // Create new votes display
    const votesDisplay = document.createElement('div');
    votesDisplay.className = 'votes-display';
    votesDisplay.style.marginTop = '10px';
    votesDisplay.style.padding = '10px';
    votesDisplay.style.backgroundColor = '#2a2a2a';
    votesDisplay.style.borderRadius = '5px';
    
    let votesText = 'Current Votes: ';
    const voteCounts = {};
    
    // Count votes
    Object.values(game.votes).forEach(targetId => {
        if (targetId) {
            voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
        }
    });
    
    // Display vote counts
    const voteEntries = Object.entries(voteCounts);
    if (voteEntries.length > 0) {
        votesText += voteEntries.map(([playerId, count]) => {
            const player = game.players.find(p => p.id === playerId);
            return `${player.name}: ${count}`;
        }).join(', ');
    } else {
        votesText += 'No votes yet';
    }
    
    votesDisplay.textContent = votesText;
    actionButtons.appendChild(votesDisplay);
}

function endVotingPhase() {
    if (!game.votingPhase) return;
    
    game.votingPhase = false;
    
    if (game.votingTimer) {
        clearTimeout(game.votingTimer);
        game.votingTimer = null;
    }
    
    // Count votes
    const voteCounts = {};
    Object.values(game.votes).forEach(targetId => {
        if (targetId) {
            voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
        }
    });
    
    // Find player with most votes
    let eliminatedPlayer = null;
    let maxVotes = 0;
    let tiedPlayers = [];
    
    Object.entries(voteCounts).forEach(([playerId, count]) => {
        if (count > maxVotes) {
            maxVotes = count;
            eliminatedPlayer = game.players.find(p => p.id === playerId);
            tiedPlayers = [playerId];
        } else if (count === maxVotes) {
            tiedPlayers.push(playerId);
        }
    });
    
    // Handle voting results
    if (eliminatedPlayer && maxVotes > 0) {
        if (tiedPlayers.length > 1) {
            addToLog(`🗳️ Voting tied! No one is eliminated.`, 'warning');
        } else {
            addToLog(`🗳️ ${eliminatedPlayer.name} has been voted out!`, 'danger');
            eliminatedPlayer.alive = false;
            eliminatedPlayer.isDead = true;
            
            // Check if they were corrupted
            if (eliminatedPlayer.role === 'Corrupted') {
                addToLog(`👹 ${eliminatedPlayer.name} was corrupted!`, 'success');
            } else {
                addToLog(`😇 ${eliminatedPlayer.name} was innocent!`, 'warning');
            }
        }
    } else {
        addToLog('🗳️ No one received votes. No elimination.', 'info');
    }
    
    // Check win conditions
    checkWinConditions();
    
    // Clear voting interface
    const actionButtons = document.getElementById('dungeon-action-buttons');
    if (actionButtons) {
        actionButtons.innerHTML = '';
    }
    
    // If game continues, start next day phase
    if (!game.gameEnded) {
        startNextDayPhase();
    }
}

function startNextDayPhase() {
    game.round++;
    game.currentDay++;
    
    // Reset all players' stamina
    game.players.forEach(player => {
        if (player.alive && !player.isDead) {
            player.currentStamina = calculateStamina(player);
        }
    });
    
    // Clear night phase
    if (typeof window.endNightPhase === 'function') {
        window.endNightPhase();
    }
    
    addToLog(`🌅 Day ${game.currentDay} begins!`, 'info');
    addToLog('All players wake up with full stamina.', 'info');
    
    // Update UI
    updatePhaseTitle(`🗺️ Dungeon Exploration - Day ${game.currentDay}`);
    
    // Show normal actions
    if (typeof window.showDungeonInterface === 'function') {
        window.showDungeonInterface();
    }
}

// ============================================
// SOCIAL DEDUCTION MECHANICS
// ============================================

function addEvidence(evidenceType, description, playerId = null) {
    const evidence = {
        id: Date.now() + Math.random(),
        type: evidenceType,
        description: description,
        playerId: playerId,
        timestamp: Date.now(),
        round: game.round
    };
    
    game.evidence.push(evidence);
    
    // Log evidence for players to see
    addToLog(`🔍 Evidence: ${description}`, 'info');
    
    return evidence;
}

function addSuspiciousAction(playerId, action, description) {
    const suspiciousAction = {
        id: Date.now() + Math.random(),
        playerId: playerId,
        action: action,
        description: description,
        timestamp: Date.now(),
        round: game.round
    };
    
    game.suspiciousActions.push(suspiciousAction);
    
    // Log suspicious action
    const player = game.players.find(p => p.id === playerId);
    if (player) {
        addToLog(`⚠️ Suspicious: ${player.name} ${description}`, 'warning');
    }
    
    return suspiciousAction;
}

function makeAccusation(accuserId, accusedId, reason) {
    const accusation = {
        id: Date.now() + Math.random(),
        accuserId: accuserId,
        accusedId: accusedId,
        reason: reason,
        timestamp: Date.now(),
        round: game.round
    };
    
    game.accusations.push(accusation);
    
    // Log accusation
    const accuser = game.players.find(p => p.id === accuserId);
    const accused = game.players.find(p => p.id === accusedId);
    
    if (accuser && accused) {
        addToLog(`🗣️ ${accuser.name} accuses ${accused.name}: "${reason}"`, 'warning');
    }
    
    return accusation;
}

function getEvidenceForPlayer(playerId) {
    return game.evidence.filter(evidence => evidence.playerId === playerId);
}

function getSuspiciousActionsForPlayer(playerId) {
    return game.suspiciousActions.filter(action => action.playerId === playerId);
}

function getAccusationsAgainstPlayer(playerId) {
    return game.accusations.filter(accusation => accusation.accusedId === playerId);
}

function showEvidenceInterface() {
    const actionButtons = document.getElementById('dungeon-action-buttons');
    if (!actionButtons) return;
    
    actionButtons.innerHTML = '';
    
    // Add evidence header
    const evidenceHeader = document.createElement('h3');
    evidenceHeader.textContent = '🔍 Evidence & Accusations';
    evidenceHeader.style.color = '#FF9800';
    evidenceHeader.style.margin = '0 0 10px 0';
    evidenceHeader.style.textAlign = 'center';
    actionButtons.appendChild(evidenceHeader);
    
    // Show all evidence
    if (game.evidence.length > 0) {
        const evidenceContainer = document.createElement('div');
        evidenceContainer.className = 'evidence-container';
        evidenceContainer.style.marginBottom = '15px';
        
        const evidenceTitle = document.createElement('h4');
        evidenceTitle.textContent = '📋 Evidence Found:';
        evidenceTitle.style.color = '#4CAF50';
        evidenceContainer.appendChild(evidenceTitle);
        
        game.evidence.forEach(evidence => {
            const evidenceItem = document.createElement('div');
            evidenceItem.className = 'evidence-item';
            evidenceItem.style.padding = '5px';
            evidenceItem.style.margin = '2px 0';
            evidenceItem.style.backgroundColor = '#2a2a2a';
            evidenceItem.style.borderRadius = '3px';
            evidenceItem.textContent = `• ${evidence.description}`;
            evidenceContainer.appendChild(evidenceItem);
        });
        
        actionButtons.appendChild(evidenceContainer);
    }
    
    // Show suspicious actions
    if (game.suspiciousActions.length > 0) {
        const suspiciousContainer = document.createElement('div');
        suspiciousContainer.className = 'suspicious-container';
        suspiciousContainer.style.marginBottom = '15px';
        
        const suspiciousTitle = document.createElement('h4');
        suspiciousTitle.textContent = '⚠️ Suspicious Actions:';
        suspiciousTitle.style.color = '#FF5722';
        suspiciousContainer.appendChild(suspiciousTitle);
        
        game.suspiciousActions.forEach(action => {
            const actionItem = document.createElement('div');
            actionItem.className = 'suspicious-item';
            actionItem.style.padding = '5px';
            actionItem.style.margin = '2px 0';
            actionItem.style.backgroundColor = '#3a1a1a';
            actionItem.style.borderRadius = '3px';
            actionItem.textContent = `• ${action.description}`;
            suspiciousContainer.appendChild(actionItem);
        });
        
        actionButtons.appendChild(suspiciousContainer);
    }
    
    // Add accusation buttons for each player
    const alivePlayers = game.players.filter(player => 
        player.alive && 
        !player.isDead && 
        player.id !== game.playerCharacter.id
    );
    
    if (alivePlayers.length > 0) {
        const accusationContainer = document.createElement('div');
        accusationContainer.className = 'accusation-container';
        
        const accusationTitle = document.createElement('h4');
        accusationTitle.textContent = '🗣️ Make Accusations:';
        accusationTitle.style.color = '#9C27B0';
        accusationContainer.appendChild(accusationTitle);
        
        alivePlayers.forEach(player => {
            const accusationButton = document.createElement('button');
            accusationButton.textContent = `🗣️ Accuse ${player.name}`;
            accusationButton.className = 'action-btn accusation-btn';
            accusationButton.onclick = () => makePlayerAccusation(player.id);
            accusationContainer.appendChild(accusationButton);
        });
        
        actionButtons.appendChild(accusationContainer);
    }
    
    // Add back to voting button
    const backButton = document.createElement('button');
    backButton.textContent = '🗳️ Back to Voting';
    backButton.className = 'action-btn back-btn';
    backButton.onclick = () => showVotingInterface();
    actionButtons.appendChild(backButton);
}

function makePlayerAccusation(accusedId) {
    const reason = prompt('Why do you suspect this player? (Enter your accusation):');
    if (reason && reason.trim()) {
        makeAccusation(game.playerCharacter.id, accusedId, reason.trim());
        addToLog(`🗣️ You accused ${game.players.find(p => p.id === accusedId).name}: "${reason}"`, 'warning');
    }
}

// ============================================
// WIN CONDITIONS
// ============================================

function checkWinConditions() {
    const alivePlayers = game.players.filter(player => player.alive && !player.isDead);
    const corruptedPlayers = alivePlayers.filter(player => player.role === 'Corrupted');
    const innocentPlayers = alivePlayers.filter(player => player.role === 'Innocent');
    
    // Innocent players win if all corrupted are eliminated
    if (corruptedPlayers.length === 0) {
        endGame('innocent', 'All corrupted players have been eliminated!');
        return;
    }
    
    // Corrupted players win if they equal or outnumber innocent players
    if (corruptedPlayers.length >= innocentPlayers.length) {
        endGame('corrupted', 'Corrupted players outnumber innocent players!');
        return;
    }
    
    // Game continues if neither condition is met
    addToLog(`👥 Remaining: ${innocentPlayers.length} innocent, ${corruptedPlayers.length} corrupted`, 'info');
}

function endGame(winner, reason) {
    game.gameEnded = true;
    game.winner = winner;
    game.winReason = reason;
    
    // Stop all timers
    if (game.votingTimer) {
        clearTimeout(game.votingTimer);
        game.votingTimer = null;
    }
    
    if (typeof window.stopAITimer === 'function') {
        window.stopAITimer();
    }
    
    if (typeof window.stopGameTimer === 'function') {
        window.stopGameTimer();
    }
    
    // Show end game screen
    showEndGameScreen(winner, reason);
}

function showEndGameScreen(winner, reason) {
    // Hide dungeon interface
    const dungeonScreen = document.getElementById('dungeon-exploration-screen');
    if (dungeonScreen) {
        dungeonScreen.style.display = 'none';
    }
    
    // Create end game screen
    const endGameHTML = `
        <div id="end-game-screen" class="screen" style="display: block;">
            <div class="end-game-container">
                <h1>${winner === 'innocent' ? '😇 Innocent Victory!' : '👹 Corrupted Victory!'}</h1>
                <p class="win-reason">${reason}</p>
                
                <div class="game-results">
                    <h3>Final Results</h3>
                    <div class="player-results">
                        ${game.players.map(player => `
                            <div class="player-result ${player.role.toLowerCase()}">
                                <span class="player-name">${player.name}</span>
                                <span class="player-role">${player.role}</span>
                                <span class="player-status">${player.alive ? 'Alive' : 'Eliminated'}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="end-game-actions">
                    <button onclick="returnToMenu()" class="primary-btn">Return to Menu</button>
                    <button onclick="playAgain()" class="secondary-btn">Play Again</button>
                </div>
            </div>
        </div>
    `;
    
    // Add to body
    document.body.insertAdjacentHTML('beforeend', endGameHTML);
    
    // Add to log
    addToLog(`🎮 Game Ended: ${reason}`, winner === 'innocent' ? 'success' : 'warning');
}

function returnToMenu() {
    // Clean up
    const endGameScreen = document.getElementById('end-game-screen');
    if (endGameScreen) {
        endGameScreen.remove();
    }
    
    // Reset game state
    game = null;
    gameTimers = {};
    
    // Return to menu
    if (typeof window.showMenuScreen === 'function') {
        window.showMenuScreen();
    }
}

function playAgain() {
    // Clean up
    const endGameScreen = document.getElementById('end-game-screen');
    if (endGameScreen) {
        endGameScreen.remove();
    }
    
    // Start new game
    startGame();
}

// ============================================
// END GAME EARLY
// ============================================
function endGameEarly() {
    if (confirm('Are you sure you want to end the game and return to the menu?')) {
        // Save any earned loot/gold
        const lootCount = game.playerCharacter ? game.playerCharacter.stash.length : 0;
        const goldEarned = lootCount * 10; // 10 gold per item
        
        if (lootCount > 0) {
            addToLog(`💰 You earned ${goldEarned} gold from ${lootCount} items!`, 'success');
        }
        
        // Clear game state
        game = null;
        gameTimers = {};
        
        // Hide end game button
        const endGameBtn = document.getElementById('end-game-btn');
        if (endGameBtn) {
            endGameBtn.style.display = 'none';
        }
        
        // Return to menu
        if (typeof window.showMenuScreen === 'function') {
            window.showMenuScreen();
        }
    }
}

// ============================================
// INITIALIZATION
// ============================================

// Export functions to window scope
window.startGame = startGame;
window.endGameEarly = endGameEarly;
window.startVotingPhase = startVotingPhase;
window.castVote = castVote;
window.checkWinConditions = checkWinConditions;
window.endGame = endGame;
window.returnToMenu = returnToMenu;
window.playAgain = playAgain;
window.addEvidence = addEvidence;
window.addSuspiciousAction = addSuspiciousAction;
window.makeAccusation = makeAccusation;
window.showEvidenceInterface = showEvidenceInterface;

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