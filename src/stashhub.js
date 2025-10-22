// ============================================
// STASH HUB SYSTEM
// ============================================

// Remove local playerGold variable - use currentUser.profile.gold instead
let playerItems = [];
let allItems = [];
let playerQuests = [];
let equippedItems = [];

// ----------------------------------------
// Show Stash Hub
// ----------------------------------------
async function showStashHub() {
    if (!currentUser) {
        addToLog('❌ Please sign in first', 'warning');
        return;
    }

    hideAllScreens();
    document.getElementById('stashhub-screen').style.display = 'block';
    clearLog();
    
    addToLog('🎒 Loading your stash...', 'info');
    
    await loadStashHubData();
    showStashTab('inventory');
}

// ----------------------------------------
// Load Stash Hub Data
// ----------------------------------------
async function loadStashHubData() {
    try {
        // Load player profile (gold)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('gold')
            .eq('id', currentUser.id)
            .single();

        if (profileError) throw profileError;
        
        // Update currentUser profile with latest gold
        if (currentUser && currentUser.profile) {
            currentUser.profile.gold = profile.gold || 0;
        }
        // Update gold display in all parts of the app
        if (typeof updateGoldDisplay === 'function') {
            updateGoldDisplay();
        }

        // Load all items (for shop)
        const { data: items, error: itemsError } = await supabase
            .from('items')
            .select('*')
            .order('price', { ascending: true });

        if (itemsError) throw itemsError;
        allItems = items || [];

        // Load player's items
        const { data: playerItemsData, error: playerItemsError } = await supabase
            .from('player_items')
            .select('*, items(*)')
            .eq('user_id', currentUser.id);

        if (playerItemsError) throw playerItemsError;
        playerItems = playerItemsData || [];

        // Load player's quests
        const { data: questsData, error: questsError } = await supabase
            .from('player_quests')
            .select('*, quests(*)')
            .eq('user_id', currentUser.id);

        if (questsError) throw questsError;
        playerQuests = questsData || [];

        addToLog('✅ Stash loaded successfully!', 'success');

    } catch (error) {
        console.error('Load stash hub error:', error);
        addToLog(`❌ Error loading stash: ${error.message}`, 'warning');
    }
}

// ----------------------------------------
// Update Gold Display - now handled by global function in ui.js

// ----------------------------------------
// Show Stash Tab
// ----------------------------------------
function showStashTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.stash-tab').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }
    
    // Add active class to clicked button
    event?.target?.classList.add('active');
    
    // Load tab content
    switch(tabName) {
        case 'inventory':
            displayInventory();
            break;
        case 'shop':
            displayShop();
            break;
        case 'quests':
            displayQuests();
            break;
    }
}

// ----------------------------------------
// Display Inventory
// ----------------------------------------
function displayInventory() {
    const equippedContainer = document.getElementById('equipped-items');
    const collectionContainer = document.getElementById('collection-items');
    
    equippedContainer.innerHTML = '';
    collectionContainer.innerHTML = '';
    
    if (playerItems.length === 0) {
        collectionContainer.innerHTML = '<p class="empty-message">No items yet. Visit the shop!</p>';
        return;
    }
    
    // Separate equipped and unequipped items
    const equipped = playerItems.filter(item => item.is_equipped);
    const collection = playerItems.filter(item => !item.is_equipped);
    
    // Display equipped items
    if (equipped.length === 0) {
        equippedContainer.innerHTML = '<p class="empty-message">No items equipped. Click items below to equip them!</p>';
    } else {
        equipped.forEach(playerItem => {
            const itemCard = createItemCard(playerItem.items, true, playerItem.quantity);
            equippedContainer.appendChild(itemCard);
        });
    }
    
    // Display collection
    collection.forEach(playerItem => {
        const itemCard = createItemCard(playerItem.items, false, playerItem.quantity);
        collectionContainer.appendChild(itemCard);
    });
}

// ----------------------------------------
// Create Item Card
// ----------------------------------------
function createItemCard(item, isEquipped, quantity = 1) {
    const card = document.createElement('div');
    card.className = `item-card rarity-${item.rarity}`;
    
    const rarityEmoji = {
        'common': '⚪',
        'uncommon': '🔵',
        'rare': '🟣',
        'legendary': '🟡'
    };
    
    const typeEmoji = {
        'weapon': '⚔️',
        'armor': '🛡️',
        'consumable': '🧪',
        'tool': '🔧',
        'treasure': '💎'
    };
    
    card.innerHTML = `
        <div class="item-header">
            <span class="item-emoji">${typeEmoji[item.item_type] || '📦'}</span>
            <span class="item-rarity">${rarityEmoji[item.rarity]}</span>
        </div>
        <div class="item-name">${item.name}</div>
        <div class="item-description">${item.description}</div>
        <div class="item-effect">${item.effect}</div>
        ${quantity > 1 ? `<div class="item-quantity">×${quantity}</div>` : ''}
        ${isEquipped 
            ? '<button class="item-btn equipped" onclick="unequipItem(\'' + item.id + '\')">✓ Equipped</button>'
            : '<button class="item-btn" onclick="equipItem(\'' + item.id + '\')">Equip</button>'}
    `;
    
    return card;
}

// ----------------------------------------
// Equip/Unequip Items
// ----------------------------------------
async function equipItem(itemId) {
    const equippedCount = playerItems.filter(i => i.is_equipped).length;
    
    if (equippedCount >= 3) {
        addToLog('❌ Maximum 3 items can be equipped!', 'warning');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('player_items')
            .update({ is_equipped: true })
            .eq('user_id', currentUser.id)
            .eq('item_id', itemId);
        
        if (error) throw error;
        
        await loadStashHubData();
        displayInventory();
        addToLog('✅ Item equipped!', 'success');
    } catch (error) {
        console.error('Equip error:', error);
        addToLog('❌ Error equipping item', 'warning');
    }
}

async function unequipItem(itemId) {
    try {
        const { error } = await supabase
            .from('player_items')
            .update({ is_equipped: false })
            .eq('user_id', currentUser.id)
            .eq('item_id', itemId);
        
        if (error) throw error;
        
        await loadStashHubData();
        displayInventory();
        addToLog('Item unequipped', 'info');
    } catch (error) {
        console.error('Unequip error:', error);
        addToLog('❌ Error unequipping item', 'warning');
    }
}

// ----------------------------------------
// Display Shop
// ----------------------------------------
function displayShop() {
    const shopContainer = document.getElementById('shop-items');
    shopContainer.innerHTML = '';
    
    const purchasableItems = allItems.filter(item => item.is_purchasable);
    
    if (purchasableItems.length === 0) {
        shopContainer.innerHTML = '<p class="empty-message">Shop is empty. Come back later!</p>';
        return;
    }
    
    purchasableItems.forEach(item => {
        const card = createShopItemCard(item);
        shopContainer.appendChild(card);
    });
}

// ----------------------------------------
// Create Shop Item Card
// ----------------------------------------
function createShopItemCard(item) {
    const card = document.createElement('div');
    card.className = `item-card shop-item rarity-${item.rarity}`;
    
    const rarityEmoji = {
        'common': '⚪',
        'uncommon': '🔵',
        'rare': '🟣',
        'legendary': '🟡'
    };
    
    const typeEmoji = {
        'weapon': '⚔️',
        'armor': '🛡️',
        'consumable': '🧪',
        'tool': '🔧',
        'treasure': '💎'
    };
    
    const owned = playerItems.find(pi => pi.item_id === item.id);
    const canAfford = (currentUser?.profile?.gold || 0) >= item.price;
    
    card.innerHTML = `
        <div class="item-header">
            <span class="item-emoji">${typeEmoji[item.item_type] || '📦'}</span>
            <span class="item-rarity">${rarityEmoji[item.rarity]}</span>
        </div>
        <div class="item-name">${item.name}</div>
        <div class="item-description">${item.description}</div>
        <div class="item-effect">${item.effect}</div>
        <div class="item-price">💰 ${item.price} Gold</div>
        ${owned 
            ? '<button class="item-btn owned" disabled>✓ Owned</button>'
            : `<button class="item-btn ${canAfford ? '' : 'disabled'}" onclick="buyItem('${item.id}', ${item.price})" ${!canAfford ? 'disabled' : ''}>Buy</button>`}
    `;
    
    return card;
}

// ----------------------------------------
// Buy Item
// ----------------------------------------
async function buyItem(itemId, price) {
    if ((currentUser?.profile?.gold || 0) < price) {
        addToLog('❌ Not enough gold!', 'warning');
        return;
    }
    
    try {
        // Deduct gold
        const newGold = (currentUser?.profile?.gold || 0) - price;
        const { error: goldError } = await supabase
            .from('profiles')
            .update({ gold: newGold })
            .eq('id', currentUser.id);
        
        if (goldError) throw goldError;
        
        // Add item to player inventory
        const { error: itemError } = await supabase
            .from('player_items')
            .insert({
                user_id: currentUser.id,
                item_id: itemId,
                quantity: 1
            });
        
        if (itemError) throw itemError;
        
        // Update currentUser profile
        if (currentUser && currentUser.profile) {
            currentUser.profile.gold = newGold;
        }
        // Update gold display in all parts of the app
        if (typeof updateGoldDisplay === 'function') {
            updateGoldDisplay();
        }
        
        await loadStashHubData();
        displayShop();
        
        const item = allItems.find(i => i.id === itemId);
        addToLog(`✅ Purchased ${item.name} for ${price} gold!`, 'success');
        
    } catch (error) {
        console.error('Buy item error:', error);
        addToLog('❌ Error purchasing item', 'warning');
    }
}

// ----------------------------------------
// Display Quests
// ----------------------------------------
function displayQuests() {
    const questsContainer = document.getElementById('active-quests');
    questsContainer.innerHTML = '';
    
    if (playerQuests.length === 0) {
        questsContainer.innerHTML = '<p class="empty-message">No quests available. Check back later!</p>';
        return;
    }
    
    playerQuests.forEach(playerQuest => {
        const questCard = createQuestCard(playerQuest);
        questsContainer.appendChild(questCard);
    });
}

// ----------------------------------------
// Create Quest Card
// ----------------------------------------
function createQuestCard(playerQuest) {
    const quest = playerQuest.quests;
    const card = document.createElement('div');
    card.className = `quest-card ${playerQuest.is_completed ? 'completed' : ''}`;
    
    const progress = Math.min(playerQuest.progress, quest.requirement_amount);
    const progressPercent = (progress / quest.requirement_amount) * 100;
    
    const questTypeEmoji = {
        'daily': '📅',
        'weekly': '📆',
        'achievement': '🏆',
        'story': '📖'
    };
    
    card.innerHTML = `
        <div class="quest-header">
            <span class="quest-type">${questTypeEmoji[quest.quest_type] || '📜'} ${quest.quest_type}</span>
            ${playerQuest.is_completed && !playerQuest.is_claimed ? '<span class="quest-ready">READY!</span>' : ''}
        </div>
        <div class="quest-title">${quest.title}</div>
        <div class="quest-description">${quest.description}</div>
        <div class="quest-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
            </div>
            <span class="progress-text">${progress} / ${quest.requirement_amount}</span>
        </div>
        <div class="quest-reward">💰 Reward: ${quest.reward_gold} Gold</div>
        ${playerQuest.is_completed && !playerQuest.is_claimed 
            ? `<button class="quest-btn claim" onclick="claimQuest('${playerQuest.id}', ${quest.reward_gold})">🎁 Claim Reward</button>`
            : playerQuest.is_claimed 
                ? '<button class="quest-btn claimed" disabled>✓ Claimed</button>'
                : '<button class="quest-btn" disabled>In Progress</button>'}
    `;
    
    return card;
}

// ----------------------------------------
// Claim Quest Reward
// ----------------------------------------
async function claimQuest(playerQuestId, reward) {
    try {
        // Mark quest as claimed
        const { error: questError } = await supabase
            .from('player_quests')
            .update({ is_claimed: true })
            .eq('id', playerQuestId);
        
        if (questError) throw questError;
        
        // Add gold
        const newGold = (currentUser?.profile?.gold || 0) + reward;
        const { error: goldError } = await supabase
            .from('profiles')
            .update({ gold: newGold })
            .eq('id', currentUser.id);
        
        if (goldError) throw goldError;
        
        // Update currentUser profile
        if (currentUser && currentUser.profile) {
            currentUser.profile.gold = newGold;
        }
        // Update gold display in all parts of the app
        if (typeof updateGoldDisplay === 'function') {
            updateGoldDisplay();
        }
        
        await loadStashHubData();
        displayQuests();
        
        addToLog(`✅ Quest completed! Earned ${reward} gold!`, 'success');
        
    } catch (error) {
        console.error('Claim quest error:', error);
        addToLog('❌ Error claiming quest', 'warning');
    }
}

// ----------------------------------------
// Update Quest Progress (called after games)
// ----------------------------------------
async function updateQuestProgress(questType, amount = 1) {
    if (!currentUser) return;
    
    try {
        // Find relevant quests
        const relevantQuests = playerQuests.filter(pq => 
            pq.quests.requirement_type === questType && !pq.is_completed
        );
        
        for (const playerQuest of relevantQuests) {
            const newProgress = playerQuest.progress + amount;
            const isCompleted = newProgress >= playerQuest.quests.requirement_amount;
            
            await supabase
                .from('player_quests')
                .update({ 
                    progress: newProgress,
                    is_completed: isCompleted,
                    completed_at: isCompleted ? new Date().toISOString() : null
                })
                .eq('id', playerQuest.id);
        }
        
    } catch (error) {
        console.error('Update quest progress error:', error);
    }
}

