// ============================================
// ITEM USAGE SYSTEM
// ============================================

let equippedItems = []; // Items player has equipped for this game
let usedItems = []; // Items already used in this game

// ----------------------------------------
// Load Equipped Items for Game
// ----------------------------------------
async function loadEquippedItems() {
    if (!currentUser) {
        equippedItems = [];
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('player_items')
            .select('*, items(*)')
            .eq('user_id', currentUser.id)
            .eq('is_equipped', true);
        
        if (error) throw error;
        
        equippedItems = data || [];
        console.log('✅ Loaded equipped items:', equippedItems.length);
        
        // Display equipped items in game
        displayEquippedItems();
        
    } catch (error) {
        console.error('Error loading equipped items:', error);
        equippedItems = [];
    }
}

// ----------------------------------------
// Display Equipped Items in Game
// ----------------------------------------
function displayEquippedItems() {
    const container = document.getElementById('inventory-items');
    if (!container || equippedItems.length === 0) {
        if (container) {
            container.innerHTML = '<p style="color: #888;">Inga föremål utrustade</p>';
        }
        return;
    }
    
    container.innerHTML = '';
    
    equippedItems.forEach((playerItem, index) => {
        const item = playerItem.items;
        const isUsed = usedItems.includes(playerItem.id);
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'loot-item equipped-item';
        if (isUsed) itemDiv.classList.add('used-item');
        
        const rarityEmoji = getRarityEmoji(item.rarity);
        
        itemDiv.innerHTML = `
            <span class="item-name-small">${rarityEmoji} ${item.name}</span>
            ${!isUsed ? '<button class="use-item-btn" onclick="useEquippedItem(' + index + ')">Använd</button>' : '<span class="used-badge">Använd</span>'}
            <div class="tooltip">
                <strong>${item.name}</strong><br>
                ${item.description}<br>
                <span class="tooltip-effect">💫 ${item.effect}</span>
                <span class="tooltip-rarity">${item.rarity}</span>
            </div>
        `;
        
        container.appendChild(itemDiv);
    });
}

// ----------------------------------------
// Use Equipped Item
// ----------------------------------------
async function useEquippedItem(index) {
    if (!game || !game.playerCharacter || !game.playerCharacter.alive) {
        addToLog('❌ Du kan inte använda föremål just nu', 'warning');
        return;
    }
    
    if (index < 0 || index >= equippedItems.length) return;
    
    const playerItem = equippedItems[index];
    const item = playerItem.items;
    
    // Check if already used
    if (usedItems.includes(playerItem.id)) {
        addToLog('❌ Du har redan använt detta föremål', 'warning');
        return;
    }
    
    // Apply item effect
    const effectApplied = applyItemEffect(item);
    
    if (effectApplied) {
        // Mark as used
        usedItems.push(playerItem.id);
        
        // Add to game log
        addToLog(`✨ Du använde ${item.name}!`, 'success');
        
        // Update display
        displayEquippedItems();
        
        // Decrease quantity in database (for consumables)
        if (item.item_type === 'consumable') {
            await decreaseItemQuantity(playerItem.id);
        }
    }
}

// ----------------------------------------
// Apply Item Effect
// ----------------------------------------
function applyItemEffect(item) {
    if (!item || !item.effect) return false;
    
    const effects = item.effect.split(';');
    let effectApplied = false;
    
    effects.forEach(effectStr => {
        const [effectType, value] = effectStr.split(':');
        const effectValue = parseInt(value) || 1;
        
        switch(effectType) {
            case 'heal':
                addToLog(`❤️ Du återställde ${effectValue} hälsa`, 'success');
                effectApplied = true;
                break;
                
            case 'survive_attack':
                game.playerCharacter.itemProtection = (game.playerCharacter.itemProtection || 0) + effectValue;
                addToLog(`🛡️ Du har skydd mot ${effectValue} attack(er)`, 'success');
                effectApplied = true;
                break;
                
            case 'block_attacks':
                game.playerCharacter.itemProtection = (game.playerCharacter.itemProtection || 0) + effectValue;
                addToLog(`🛡️ Du blockerar ${effectValue} attacker`, 'success');
                effectApplied = true;
                break;
                
            case 'reveal_role':
                revealRandomRole();
                effectApplied = true;
                break;
                
            case 'reveal_all_roles':
                revealAllRoles();
                effectApplied = true;
                break;
                
            case 'loot_bonus':
                game.playerCharacter.lootBonus = (game.playerCharacter.lootBonus || 0) + effectValue;
                addToLog(`💰 +${effectValue}% chans för bättre loot`, 'success');
                effectApplied = true;
                break;
                
            case 'escape_danger':
                game.playerCharacter.canEscape = true;
                addToLog('💨 Du kan fly från nästa fara', 'success');
                effectApplied = true;
                break;
                
            case 'instant_flee':
                if (game.phase === 'darkness' || game.phase === 'exploration') {
                    game.playerCharacter.canEscape = true;
                    addToLog('💨 Du kan fly omedelbart!', 'success');
                    effectApplied = true;
                }
                break;
                
            case 'reveal_loot':
                addToLog('🗺️ Nästa loot-location avslöjad', 'success');
                game.playerCharacter.knowsLootLocation = true;
                effectApplied = true;
                break;
                
            case 'secret_loot':
                const secretLoot = randomElement(game.lootPool);
                game.playerCharacter.inventory.push(secretLoot);
                addToLog(`🔓 Du hittade hemligt byte: ${secretLoot.name}`, 'success');
                updateInventory();
                effectApplied = true;
                break;
                
            case 'double_loot':
                game.playerCharacter.doubleLoot = true;
                addToLog('💎 Nästa loot blir dubbelt!', 'success');
                effectApplied = true;
                break;
                
            case 'gold':
                addToLog(`💰 Du fick ${effectValue} guld!`, 'success');
                effectApplied = true;
                break;
                
            case 'revive':
                if (!game.playerCharacter.alive) {
                    game.playerCharacter.alive = true;
                    addToLog('🔥 Phoenix Feather återupplivar dig!', 'success');
                    updatePlayersList();
                } else {
                    game.playerCharacter.hasRevive = true;
                    addToLog('🔥 Om du dör, kommer du återupplivas', 'success');
                }
                effectApplied = true;
                break;
                
            case 'corruption_immunity':
                game.playerCharacter.corruptionImmune = true;
                addToLog('✨ Du är immun mot korruption', 'success');
                effectApplied = true;
                break;
                
            case 'hide_vote':
                game.playerCharacter.hideVote = true;
                addToLog('👻 Din nästa röst blir dold', 'success');
                effectApplied = true;
                break;
                
            case 'instant_escape':
                game.playerCharacter.escaped = true;
                game.playerCharacter.stash = [...game.playerCharacter.inventory];
                addToLog('🚪 Portal Key teleporterar dig ut!', 'success');
                updatePlayersList();
                effectApplied = true;
                break;
                
            case 'darkness_kill':
                if (game.phase === 'darkness') {
                    game.playerCharacter.canDarknessKill = true;
                    addToLog('🗡️ Du kan döda någon i mörkret', 'warning');
                    effectApplied = true;
                } else {
                    addToLog('⚠️ Kan bara användas under mörkerfasen', 'warning');
                }
                break;
                
            case 'extra_loot_slot':
                game.playerCharacter.extraSlots = (game.playerCharacter.extraSlots || 0) + effectValue;
                addToLog(`🎒 +${effectValue} inventarie-plats`, 'success');
                effectApplied = true;
                break;
                
            case 'reveal_darkness':
                if (game.phase === 'darkness') {
                    addToLog('🔦 Facklan avslöjar vad som händer i mörkret...', 'success');
                    // Reveal what happened during darkness
                    effectApplied = true;
                } else {
                    game.playerCharacter.hasTorch = true;
                    addToLog('🔦 Facklan är redo för mörkerfasen', 'success');
                    effectApplied = true;
                }
                break;
                
            case 'attack_power':
                game.playerCharacter.attackPower = (game.playerCharacter.attackPower || 0) + effectValue;
                addToLog(`⚔️ +${effectValue} attackkraft`, 'success');
                effectApplied = true;
                break;
                
            case 'speed_boost':
                game.playerCharacter.speed = (game.playerCharacter.speed || 0) + effectValue;
                addToLog(`⚡ +${effectValue} hastighet`, 'success');
                effectApplied = true;
                break;
                
            default:
                addToLog(`❓ Okänd effekt: ${effectType}`, 'info');
        }
    });
    
    return effectApplied;
}

// ----------------------------------------
// Helper Functions
// ----------------------------------------

function revealRandomRole() {
    const alivePlayers = game.players.filter(p => p.alive && !p.isPlayer);
    if (alivePlayers.length === 0) {
        addToLog('Inga andra spelare kvar att avslöja', 'info');
        return;
    }
    
    const target = randomElement(alivePlayers);
    const roleEmoji = target.role === 'Corrupted' ? '😈' : '😇';
    addToLog(`🔮 ${target.name} är ${roleEmoji} ${target.role}!`, 'success');
}

function revealAllRoles() {
    addToLog('👑 Kronans visdom avslöjar alla roller:', 'success');
    game.players.forEach(p => {
        if (!p.isPlayer && p.alive) {
            const roleEmoji = p.role === 'Corrupted' ? '😈' : '😇';
            addToLog(`  ${p.name}: ${roleEmoji} ${p.role}`, 'info');
        }
    });
}

function getRarityEmoji(rarity) {
    const rarityEmojis = {
        'common': '⚪',
        'uncommon': '🔵',
        'rare': '🟣',
        'legendary': '🟡'
    };
    return rarityEmojis[rarity] || '⚪';
}

async function decreaseItemQuantity(playerItemId) {
    try {
        const playerItem = equippedItems.find(pi => pi.id === playerItemId);
        if (!playerItem) return;
        
        const newQuantity = playerItem.quantity - 1;
        
        if (newQuantity <= 0) {
            // Remove item
            await supabase
                .from('player_items')
                .delete()
                .eq('id', playerItemId);
        } else {
            // Decrease quantity
            await supabase
                .from('player_items')
                .update({ quantity: newQuantity })
                .eq('id', playerItemId);
        }
    } catch (error) {
        console.error('Error decreasing item quantity:', error);
    }
}

// ----------------------------------------
// Reset Items for New Game
// ----------------------------------------
function resetItemsForNewGame() {
    usedItems = [];
    displayEquippedItems();
}

