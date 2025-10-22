# 🎮 Shadow Dungeon

En multiplayer dungeon crawler med karaktärsskapande, items och strategisk utforskning!

## 📁 Projektstruktur

```
ShadowDungeon/
├── src/                    # JavaScript källkod
│   ├── app.js             # App initialization
│   ├── auth.js            # Authentication system
│   ├── character_creation.js  # Character creation system
│   ├── config.js          # Supabase configuration
│   ├── dungeon_system.js  # Dungeon exploration
│   ├── item_usage.js      # Item effects in game
│   ├── main.js            # Core game logic
│   ├── matchmaking.js     # Multiplayer lobbies
│   ├── stashhub.js        # Items and quests
│   └── ui.js              # UI management
├── sql/                   # Database scripts
│   ├── supabase_schema.sql        # Base database schema
│   ├── update_schema_stashhub.sql # Items and quests
│   ├── character_creation_schema.sql # Character system
│   ├── seed_items_fixed.sql       # Example items (FIXED)
│   └── [other SQL files]          # Various fixes and utilities
├── docs/                  # Documentation
│   ├── FEATURES_GUIDE.md          # Complete features guide
│   ├── DEPLOYMENT_CHECKLIST_NEW.md # Deployment guide
│   └── [other .md files]          # Various documentation
├── index.html             # Main HTML file
├── style.css              # All styles
└── README.md              # This file
```

## 🚀 Snabbstart

### 1. Database Setup
Kör dessa SQL-filer i Supabase SQL Editor (i ordning):

1. `sql/supabase_schema.sql` - Base schema
2. `sql/update_schema_stashhub.sql` - Items and quests
3. `sql/character_creation_schema.sql` - Character system
4. `sql/seed_items_fixed.sql` - Example items ⭐ **FIXED VERSION**

### 2. Configuration
Uppdatera `src/config.js` med dina Supabase credentials.

### 3. Deploy
Deploya till Netlify eller kör lokalt.

## ✨ Features

- 🎭 **Character Creation** - 4 klasser med stats
- 📦 **Item System** - 31+ items med in-game effects
- 🗺️ **Dungeon Exploration** - Dynamic 6-10 room dungeons
- ⚔️ **Monster Encounters** - Boss fights och mindre monster
- 🔐 **Key/Portal System** - Hitta nyckeln och fly
- 🌐 **Multi-Session** - Flera spelare samtidigt
- 📊 **Stats Matter** - Styrka, smidighet etc. påverkar gameplay

## 🐛 Felsökning

### "Foreign key constraint" error
Använd `sql/seed_items_fixed.sql` istället för den gamla versionen.

### "Items visas inte"
Kontrollera att du körde `seed_items_fixed.sql`.

### "Character creation fungerar inte"
Kontrollera att du körde `character_creation_schema.sql`.

## 📖 Dokumentation

- `docs/FEATURES_GUIDE.md` - Komplett guide för alla features
- `docs/DEPLOYMENT_CHECKLIST_NEW.md` - Deployment guide

## 🎯 Nästa Steg

1. Kör SQL-filerna i rätt ordning
2. Testa character creation
3. Testa items system
4. Testa dungeon exploration
5. Deploya till Netlify

---

**Lycka till i dungeonen! 🗡️**
