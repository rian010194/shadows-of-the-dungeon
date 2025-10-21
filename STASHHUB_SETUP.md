# 🎒 Stash Hub System - Setup Guide

## Overview

The Stash Hub system adds a persistent progression layer to Shadow Dungeon with:
- **Gold Currency** - Earn gold from games, spend it in the shop
- **Item Shop** - Buy permanent items to use in games  
- **Starter Items** - Free items given to new players
- **Loadout System** - Equip up to 3 items to bring into each game
- **Quest System** - Complete quests to earn gold rewards
- **Lobby System** - Create/browse/join lobbies with AI fill

---

## 📝 Database Setup

### Step 1: Run the Schema Update

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `update_schema_stashhub.sql`
5. Click **Run**

This will:
- Add `gold` column to profiles (starting with 100 gold)
- Create `items` table with all available items
- Create `player_items` table for player inventories
- Create `quests` table with available quests
- Create `player_quests` table for tracking progress
- Seed starter items and shop items
- Seed initial quests
- Create helper functions for initialization

### Step 2: Verify Setup

Run this query to verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('items', 'player_items', 'quests', 'player_quests');
```

You should see all 4 tables listed.

---

## 🎮 Features Added

### 1. **Stash Hub Screen**
- Access from main menu via "🎒 Stash Hub" button
- Three tabs: Inventory, Shop, Quests
- Gold balance displayed prominently

### 2. **Inventory System**
- View all owned items
- Equip/unequip items (max 3 equipped)
- Equipped items are brought into games
- Items organized by rarity (common → legendary)

### 3. **Shop System**
- Buy items with gold
- Items sorted by price
- Can't buy duplicates
- Rarity-based visual styling:
  - ⚪ Common (cheapest)
  - 🔵 Uncommon
  - 🟣 Rare  
  - 🟡 Legendary (most expensive)

### 4. **Quest System**
- Multiple quest types: Daily, Achievement, Story
- Track progress automatically after games
- Claim rewards when complete
- Quest types include:
  - Play X games
  - Win X games
  - Collect X loot items
  - Escape X times

### 5. **Lobby Features**
- **Create Lobby** - Make your own lobby, share the ID with friends
- **Browse Lobbies** - See all available lobbies and join
- **Quick Match** - Original matchmaking (auto-join or create)
- **AI Fill** - Empty slots filled with AI players
- **Manual Start** - Host can start game anytime with AI fill

### 6. **Game Integration**
- Equipped items appear in your starting inventory
- Earn 10 gold per item collected
- Stats tracked: games played, won, loot collected, escapes
- Quest progress updated after each game
- "End Game" button to exit early and save progress

---

## 🎯 How It Works

### New Player Flow

1. **Sign Up** → Automatically receive:
   - 100 starting gold
   - 3 starter items (Rusty Sword, Leather Pouch, Torch)
   - All available quests initialized

2. **Visit Stash Hub** → 
   - Equip starter items
   - Browse shop
   - Check quests

3. **Play Game** →
   - Equipped items appear in inventory
   - Collect loot during game
   - Escape or die

4. **Earn Rewards** →
   - 10 gold per item collected
   - Quest progress tracked
   - Stats updated

5. **Complete Quests** →
   - Claim gold rewards
   - Buy better items
   - Equip for next game

### Existing Players

When existing players log in, they'll automatically receive:
- Starter items (if they have none)
- Quest initialization (if they have none)
- Gold starts at 100

---

## 💰 Gold Economy

### Earning Gold
- **Loot Collection**: 10 gold per item
- **Quest Rewards**: 50-1000 gold depending on quest
- **Starting Balance**: 100 gold for new players

### Spending Gold
- **Common Items**: 50-75 gold
- **Uncommon Items**: 150-200 gold
- **Rare Items**: 450-600 gold
- **Legendary Items**: 1500-2000 gold

---

## 🛡️ Item Types

### Starter Items (Free)
- **Rusty Sword** - Basic protection in darkness
- **Leather Pouch** - Carry +1 item
- **Torch** - Reveals nearby threats

### Purchasable Items

**Weapons** ⚔️
- Silver Dagger (uncommon) - Better attack power

**Armor** 🛡️
- Iron Shield (uncommon) - Block 2 attacks
- Enchanted Amulet (rare) - Protect from corruption
- Invisibility Cloak (rare) - Hide from vote
- Dragon Scale Armor (legendary) - Immune to attacks

**Consumables** 🧪
- Health Potion (common) - Survive one attack
- Smoke Bomb (common) - Escape danger
- Phoenix Feather (legendary) - Revive after death

**Tools** 🔧
- Lucky Charm (common) - +10% loot chance
- Magic Compass (uncommon) - Reveals loot location
- Master Key (rare) - Access secret loot
- Crown of Wisdom (legendary) - See all roles

---

## 📋 Quest Examples

### Daily Quests
- **First Steps**: Play 1 game → 50 gold
- **Dungeon Explorer**: Play 3 games → 100 gold
- **Survivor**: Win 1 game → 150 gold

### Achievement Quests
- **Treasure Hunter**: Collect 10 items → 300 gold
- **Veteran Adventurer**: Play 10 games → 500 gold
- **Champion**: Win 5 games → 750 gold
- **Master Escapist**: Escape 10 times → 1000 gold

---

## 🎨 UI Updates

### Menu Screen
- Gold display shows current balance
- "Stash Hub" button (gold gradient style)
- Reorganized multiplayer options

### Game Screen
- "End Game & Return to Menu" button (single player only)
- Shows equipped items in starting inventory
- Gold earned displayed at game end

### Stash Hub Screen
- Tab navigation (Inventory/Shop/Quests)
- Item cards with hover effects
- Rarity-based color coding
- Progress bars for quests

---

## 🔧 Technical Details

### Files Modified
- `index.html` - Added stash hub UI, lobby browser, gold displays
- `style.css` - Added extensive styling for all new features
- `auth.js` - Starter items/quests initialization
- `main.js` - Equipped items integration, end game button
- `ui.js` - Screen management, lobby browser functions
- `matchmaking.js` - Manual lobby creation, browse lobbies

### Files Created
- `stashhub.js` - All stash hub functionality
- `update_schema_stashhub.sql` - Database schema updates
- `STASHHUB_SETUP.md` - This file!

### Database Functions
- `give_starter_items(user_id)` - Gives starter items to user
- `initialize_player_quests(user_id)` - Initializes quest tracking
- `increment_player_count(lobby_id)` - Increases lobby count
- `decrement_player_count(lobby_id)` - Decreases lobby count

---

## 🐛 Troubleshooting

### Items not appearing
- Check if `give_starter_items` function ran successfully
- Verify player_items table has entries for your user_id
- Check browser console for errors

### Quests not tracking
- Ensure `initialize_player_quests` ran
- Verify player_quests table has entries
- Check if quest progress is updating after games

### Gold not updating
- Verify profiles table has `gold` column
- Check if updateUserStats is being called
- Look for errors in browser console

### Equipped items not in game
- Ensure items are marked as `is_equipped = true`
- Check if startGame is loading equipped items
- Verify Supabase query is successful

---

## 🚀 Next Steps

### Potential Enhancements
1. **Daily Shop Rotation** - Different items each day
2. **Item Crafting** - Combine items to create better ones
3. **Trade System** - Trade items with other players
4. **Achievements** - Visual badges for completing challenges
5. **Leaderboards** - Top players by gold, wins, etc.
6. **Item Effects** - Actually implement item effects in gameplay
7. **Seasonal Events** - Limited-time quests and items
8. **Item Tiers** - Upgrade items to higher tiers

### Gameplay Balance
- Monitor gold economy
- Adjust item prices if needed
- Add more quests for variety
- Balance quest difficulty/rewards

---

## ✅ Testing Checklist

- [ ] Run schema update SQL
- [ ] Create new test account
- [ ] Verify starter items received
- [ ] Check quest initialization
- [ ] Play a game and collect items
- [ ] Verify gold earned
- [ ] Buy an item from shop
- [ ] Equip items for next game
- [ ] Verify equipped items appear in game
- [ ] Complete a quest and claim reward
- [ ] Create a lobby
- [ ] Browse lobbies
- [ ] Join a lobby
- [ ] Start game with AI fill
- [ ] Test end game button

---

## 📞 Support

If you encounter issues:
1. Check browser console for JavaScript errors
2. Check Supabase logs for database errors
3. Verify all SQL functions were created
4. Ensure RLS policies are working
5. Test with a fresh account

---

**Enjoy your enhanced Shadow Dungeon experience!** 🎮✨

