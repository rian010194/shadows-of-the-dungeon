// ============================================
// CHARACTER CREATION SYSTEM
// ============================================

let characterClasses = [];
let selectedClass = null;
let characterName = '';
let bonusPoints = 5;
let allocatedStats = {
    strength: 0,
    intellect: 0,
    agility: 0,
    vitality: 0,
    wisdom: 0
};

// ----------------------------------------
// Initialize Character System
// ----------------------------------------
async function initializeCharacterSystem() {
    try {
        // Fetch character classes from database
        const { data, error } = await supabase.rpc('get_character_classes');
        
        if (error) throw error;
        
        characterClasses = data || [];
        console.log('✅ Character classes loaded:', characterClasses.length);
    } catch (error) {
        console.error('Error loading character classes:', error);
        // Fallback to hardcoded classes
        characterClasses = [
            {
                id: 'mage',
                name: 'Mage',
                display_name: 'Magiker',
                description: 'Mästare av mystiska krafter. Hög intelligens och visdom, men svag fysiskt.',
                emoji: '🔮',
                base_strength: 3,
                base_intellect: 10,
                base_agility: 4,
                base_vitality: 4,
                base_wisdom: 7,
                bonus_points: 5
            },
            {
                id: 'warrior',
                name: 'Warrior',
                display_name: 'Krigare',
                description: 'Stark och uthållig kämpare. Överlägsen styrka och vitalitet.',
                emoji: '⚔️',
                base_strength: 10,
                base_intellect: 3,
                base_agility: 5,
                base_vitality: 8,
                base_wisdom: 4,
                bonus_points: 5
            },
            {
                id: 'rogue',
                name: 'Rogue',
                display_name: 'Skuggmästare',
                description: 'Smidig och listig. Perfekt för att undvika fara och hitta hemligheter.',
                emoji: '🗡️',
                base_strength: 5,
                base_intellect: 5,
                base_agility: 10,
                base_vitality: 5,
                base_wisdom: 5,
                bonus_points: 5
            },
            {
                id: 'seer',
                name: 'Seer',
                display_name: 'Siare',
                description: 'Vis och insiktsfull. Ser vad andra missar och förstår mysterier.',
                emoji: '🔯',
                base_strength: 4,
                base_intellect: 7,
                base_agility: 4,
                base_vitality: 5,
                base_wisdom: 10,
                bonus_points: 5
            }
        ];
    }
}

// ----------------------------------------
// Show Character Creation Screen
// ----------------------------------------
function showCharacterCreation() {
    hideAllScreens();
    document.getElementById('character-creation-screen').style.display = 'flex';
    document.getElementById('char-name-step').style.display = 'block';
    document.getElementById('char-class-step').style.display = 'none';
    document.getElementById('char-stats-step').style.display = 'none';
    
    // Clear previous data
    selectedClass = null;
    characterName = '';
    resetBonusStats();
    
    // Focus on name input
    setTimeout(() => {
        document.getElementById('character-name-input').focus();
    }, 100);
}

// ----------------------------------------
// Step 1: Enter Character Name
// ----------------------------------------
function proceedToClassSelection() {
    const nameInput = document.getElementById('character-name-input');
    const name = nameInput.value.trim();
    
    if (name.length < 2) {
        showCharacterError('Karaktärsnamnet måste vara minst 2 bokstäver långt');
        nameInput.focus();
        return;
    }
    
    if (name.length > 50) {
        showCharacterError('Karaktärsnamnet kan inte vara längre än 50 bokstäver');
        nameInput.focus();
        return;
    }
    
    characterName = name;
    
    // Hide name step, show class selection
    document.getElementById('char-name-step').style.display = 'none';
    document.getElementById('char-class-step').style.display = 'block';
    
    renderClassSelection();
}

// ----------------------------------------
// Step 2: Select Class
// ----------------------------------------
function renderClassSelection() {
    const container = document.getElementById('class-selection-grid');
    container.innerHTML = '';
    
    characterClasses.forEach(charClass => {
        const card = document.createElement('div');
        card.className = 'class-card';
        card.dataset.classId = charClass.id;
        
        card.innerHTML = `
            <div class="class-emoji">${charClass.emoji}</div>
            <div class="class-name">${charClass.display_name}</div>
            <div class="class-description">${charClass.description}</div>
            <div class="class-stats">
                <div class="stat-line"><span class="stat-icon">💪</span> Styrka: ${charClass.base_strength}</div>
                <div class="stat-line"><span class="stat-icon">🧠</span> Intelligens: ${charClass.base_intellect}</div>
                <div class="stat-line"><span class="stat-icon">⚡</span> Smidighet: ${charClass.base_agility}</div>
                <div class="stat-line"><span class="stat-icon">❤️</span> Vitalitet: ${charClass.base_vitality}</div>
                <div class="stat-line"><span class="stat-icon">👁️</span> Visdom: ${charClass.base_wisdom}</div>
            </div>
            <div class="class-bonus">+${charClass.bonus_points} bonuspoäng att fördela</div>
        `;
        
        card.onclick = () => selectCharacterClass(charClass.id);
        container.appendChild(card);
    });
}

function selectCharacterClass(classId) {
    const charClass = characterClasses.find(c => c.id === classId);
    if (!charClass) return;
    
    selectedClass = charClass;
    bonusPoints = charClass.bonus_points;
    
    // Visual feedback
    document.querySelectorAll('.class-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.target.closest('.class-card').classList.add('selected');
    
    // Show stat allocation
    setTimeout(() => {
        document.getElementById('char-class-step').style.display = 'none';
        document.getElementById('char-stats-step').style.display = 'block';
        renderStatAllocation();
    }, 300);
}

// ----------------------------------------
// Step 3: Allocate Bonus Stats
// ----------------------------------------
function renderStatAllocation() {
    if (!selectedClass) return;
    
    document.getElementById('selected-class-display').innerHTML = `
        <div class="selected-class-info">
            <span class="class-emoji-large">${selectedClass.emoji}</span>
            <div>
                <div class="class-name-large">${selectedClass.display_name}</div>
                <div class="character-name-display">"${characterName}"</div>
            </div>
        </div>
    `;
    
    resetBonusStats();
    updateStatAllocationUI();
}

function resetBonusStats() {
    allocatedStats = {
        strength: 0,
        intellect: 0,
        agility: 0,
        vitality: 0,
        wisdom: 0
    };
    updateStatAllocationUI();
}

function increaseStat(statName) {
    const remaining = getRemainingPoints();
    if (remaining > 0 && allocatedStats[statName] < 10) {
        allocatedStats[statName]++;
        updateStatAllocationUI();
    }
}

function decreaseStat(statName) {
    if (allocatedStats[statName] > 0) {
        allocatedStats[statName]--;
        updateStatAllocationUI();
    }
}

function getRemainingPoints() {
    const used = Object.values(allocatedStats).reduce((a, b) => a + b, 0);
    return bonusPoints - used;
}

function updateStatAllocationUI() {
    if (!selectedClass) return;
    
    const remaining = getRemainingPoints();
    document.getElementById('points-remaining').textContent = remaining;
    
    // Update each stat display
    const stats = ['strength', 'intellect', 'agility', 'vitality', 'wisdom'];
    stats.forEach(stat => {
        const baseValue = selectedClass[`base_${stat}`];
        const bonusValue = allocatedStats[stat];
        const totalValue = baseValue + bonusValue;
        
        const valueDisplay = document.getElementById(`${stat}-value`);
        if (valueDisplay) {
            if (bonusValue > 0) {
                valueDisplay.innerHTML = `${baseValue} <span class="bonus-stat">+${bonusValue}</span> = ${totalValue}`;
            } else {
                valueDisplay.textContent = baseValue;
            }
        }
        
        // Enable/disable buttons
        const decreaseBtn = document.querySelector(`button[onclick="decreaseStat('${stat}')"]`);
        const increaseBtn = document.querySelector(`button[onclick="increaseStat('${stat}')"]`);
        
        if (decreaseBtn) {
            decreaseBtn.disabled = allocatedStats[stat] === 0;
        }
        
        if (increaseBtn) {
            increaseBtn.disabled = remaining === 0 || allocatedStats[stat] >= 10;
        }
    });
    
    // Enable confirm button only when all points are spent
    const confirmBtn = document.getElementById('confirm-character-btn');
    if (confirmBtn) {
        confirmBtn.disabled = remaining !== 0;
    }
}

// ----------------------------------------
// Confirm Character Creation
// ----------------------------------------
async function confirmCharacterCreation() {
    if (!selectedClass || !characterName) {
        showCharacterError('Något gick fel. Vänligen börja om.');
        return;
    }
    
    const remaining = getRemainingPoints();
    if (remaining !== 0) {
        showCharacterError(`Du måste fördela alla ${bonusPoints} bonuspoäng!`);
        return;
    }
    
    // Disable button to prevent double-click
    const confirmBtn = document.getElementById('confirm-character-btn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Skapar karaktär...';
    
    try {
        const { data, error } = await supabase.rpc('create_character', {
            p_user_id: currentUser.id,
            p_character_name: characterName,
            p_class_id: selectedClass.id,
            p_bonus_strength: allocatedStats.strength,
            p_bonus_intellect: allocatedStats.intellect,
            p_bonus_agility: allocatedStats.agility,
            p_bonus_vitality: allocatedStats.vitality,
            p_bonus_wisdom: allocatedStats.wisdom
        });
        
        if (error) {
            // 409 likely means name already taken or invalid allocation
            const friendly = (error.code === '409' || error.message?.includes('Invalid'))
                ? 'Kunde inte skapa karaktär. Namn upptaget eller ogiltig poängfördelning.'
                : error.message;
            throw new Error(friendly);
        }
        
        if (data && !data.success) {
            throw new Error(data.error || 'Character creation failed');
        }
        
        // Refresh user profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        if (profile) {
            currentUser.profile = profile;
        }
        
        // Show success and go to menu
        addToLog(`✨ Karaktär "${characterName}" (${selectedClass.display_name}) skapad!`, 'success');
        addToLog(`🎁 Du fick en ${selectedClass.starter_item_name} som startföremål!`, 'success');
        
        showMenuScreen();
        
    } catch (error) {
        console.error('Character creation error:', error);
        showCharacterError(error.message || 'Ett fel uppstod vid skapande av karaktär');
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Bekräfta Karaktär';
    }
}

// ----------------------------------------
// Back Navigation
// ----------------------------------------
function backToNameSelection() {
    document.getElementById('char-class-step').style.display = 'none';
    document.getElementById('char-name-step').style.display = 'block';
}

function backToClassSelection() {
    document.getElementById('char-stats-step').style.display = 'none';
    document.getElementById('char-class-step').style.display = 'block';
    selectedClass = null;
    resetBonusStats();
}

// ----------------------------------------
// Error Display
// ----------------------------------------
function showCharacterError(message) {
    const errorDiv = document.getElementById('character-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

// ----------------------------------------
// Check if user needs to create character
// ----------------------------------------
async function checkCharacterCreated() {
    if (!currentUser || !currentUser.profile) return false;
    
    return currentUser.profile.character_created === true;
}

