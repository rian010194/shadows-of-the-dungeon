# 📋 TODO - Shadows of the Dungeon

## 🎯 Current Sprint

### High Priority
- [ ] Test complete game loop (all phases working correctly)
- [ ] Verify AI behavior in all phases
- [ ] Ensure item collection and inventory display works
- [ ] Test voting mechanics
- [ ] Validate extraction phase logic
- [ ] Check darkness phase (corrupted player actions)

### Medium Priority
- [ ] Add win/loss conditions display
- [ ] Implement game over screen with statistics
- [ ] Add restart game functionality
- [ ] Create help/tutorial section
- [ ] Improve mobile responsiveness
- [ ] Add sound effects toggle
- [ ] Implement background music

### Low Priority
- [ ] Polish UI animations
- [ ] Add particle effects for loot collection
- [ ] Create custom favicon
- [ ] Improve item tooltip styling
- [ ] Add loading screen

---

## 🚀 Deployment

- [ ] Update README with actual Netlify URL
- [ ] Test deployed version on Netlify
- [ ] Configure custom domain (if applicable)
- [ ] Add social media preview images
- [ ] Create screenshots for README
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices

---

## 🐛 Bug Fixes

- [ ] Check for edge cases in voting (ties, all dead players)
- [ ] Validate item effect logic
- [ ] Test extraction with different player counts
- [ ] Ensure round counter increments correctly
- [ ] Fix any console errors or warnings

---

## ✨ Feature Enhancements (Short-term)

### Gameplay
- [ ] Implement actual item effects (not just collection)
  - [ ] Ancient Orb - reveal role functionality
  - [ ] Shadow Dagger - corrupted kill ability
  - [ ] Healing Elixir - protection mechanic
  - [ ] Cursed Amulet - double loot + reveal
  - [ ] Blood Stone - target marking
  - [ ] Magic Scroll - reveal event info
  - [ ] Rusty Key - unlock secret areas

### UI/UX
- [ ] Add player avatars or icons
- [ ] Show player stats (gold collected, kills, etc.)
- [ ] Add animation for phase transitions
- [ ] Display game history/log
- [ ] Add settings menu
  - [ ] Difficulty settings
  - [ ] Number of AI players
  - [ ] Game speed options

### Content
- [ ] Add more item types
- [ ] Create different dungeon levels/maps
- [ ] Add random events during exploration
- [ ] Implement boss encounters
- [ ] Add achievement system

---

## 🔮 Future Roadmap

### Phase 1: Multiplayer Foundation (Supabase)
- [ ] Set up Supabase project
- [ ] Create database schema
  - [ ] Rooms/Lobbies table
  - [ ] Players table
  - [ ] Game state table
  - [ ] Chat messages table
- [ ] Implement real-time subscriptions
- [ ] Create lobby system
  - [ ] Room creation
  - [ ] Room joining
  - [ ] Player ready status
  - [ ] Host controls
- [ ] Sync game state across players
- [ ] Add chat functionality
- [ ] Implement leaderboards
- [ ] Add player profiles

### Phase 2: Graphics Enhancement (Phaser.js)
- [ ] Set up Phaser.js integration
- [ ] Design dungeon tileset
- [ ] Create character sprites
- [ ] Implement 2D dungeon visualization
- [ ] Add fog of war system
- [ ] Create character animations
  - [ ] Walking
  - [ ] Attacking
  - [ ] Collecting items
  - [ ] Death animations
- [ ] Add particle systems
- [ ] Create lighting effects

### Phase 3: Gameplay Expansion
- [ ] Add new roles
  - [ ] Detective (can investigate players)
  - [ ] Jester (wins if voted out)
  - [ ] Traitor (appears innocent but corrupted)
  - [ ] Healer (can revive players)
  - [ ] Merchant (can trade items)
- [ ] Implement voice chat (proximity-based)
- [ ] Create multiple dungeon types
  - [ ] Crypts
  - [ ] Catacombs
  - [ ] Dragon's Lair
  - [ ] Cursed Library
- [ ] Add seasonal events
- [ ] Create campaign mode
- [ ] Add custom game modes

---

## 📚 Documentation

- [ ] Write detailed game rules
- [ ] Create strategy guide
- [ ] Document all item effects
- [ ] Add code comments for complex logic
- [ ] Create API documentation (for future backend)
- [ ] Write contributing guidelines
- [ ] Add changelog

---

## 🧪 Testing

- [ ] Write unit tests for core game logic
- [ ] Test all edge cases
- [ ] Performance testing
- [ ] Accessibility testing
- [ ] Browser compatibility testing
- [ ] Mobile device testing
- [ ] Load testing (for multiplayer)

---

## 🎨 Polish

- [ ] Create game trailer video
- [ ] Design promotional materials
- [ ] Add Easter eggs
- [ ] Improve death animations
- [ ] Add victory/defeat cinematics
- [ ] Create lore/backstory
- [ ] Add flavor text for items and events

---

## 📝 Notes

- Keep vanilla JS for core single-player
- Supabase integration should be optional (fallback to local play)
- Phaser.js should be progressive enhancement
- Maintain fast load times
- Ensure accessibility (keyboard navigation, screen readers)

---

**Last Updated:** October 21, 2025

