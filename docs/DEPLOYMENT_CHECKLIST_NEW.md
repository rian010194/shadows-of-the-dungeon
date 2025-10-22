# ✅ Deployment Checklist - Shadow Dungeon v2.0

## 📋 Pre-Deployment Checklist

### 1. Databas Setup (Supabase)

Kör dessa SQL-filer i följande ordning:

- [ ] `supabase_schema.sql` - Bas schema (profiles, lobbies, etc.)
- [ ] `update_schema_stashhub.sql` - Items, quests, gold system
- [ ] `character_creation_schema.sql` - Karaktärssystem med klasser
- [ ] `seed_items.sql` - Seed 31 exempel-items i databasen

**Verifiera:**
```sql
-- Kontrollera att tabeller finns
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Ska visa: profiles, lobbies, lobby_players, game_sessions, 
--           items, player_items, quests, player_quests, character_classes

-- Kontrollera items
SELECT COUNT(*) FROM items; -- Ska vara ~31 items

-- Kontrollera character classes
SELECT * FROM character_classes; -- Ska visa 4 klasser
```

### 2. Fil Struktur

Verifiera att alla filer finns:

**HTML/CSS:**
- [ ] `index.html` - Uppdaterad med character creation screen och dungeon map
- [ ] `style.css` - Inkluderar character creation och dungeon styles

**JavaScript:**
- [ ] `config.js` - Multi-session support
- [ ] `main.js` - Core game logic
- [ ] `character_creation.js` - Character creation system **[NY]**
- [ ] `auth.js` - Authentication med character check
- [ ] `matchmaking.js` - Multiplayer lobbies
- [ ] `stashhub.js` - Items and quests
- [ ] `item_usage.js` - Item effects under spel **[NY]**
- [ ] `dungeon_system.js` - Dungeon exploration **[NY]**
- [ ] `ui.js` - UI management
- [ ] `app.js` - App initialization

**SQL:**
- [ ] `supabase_schema.sql`
- [ ] `update_schema_stashhub.sql`
- [ ] `character_creation_schema.sql` **[NY]**
- [ ] `seed_items.sql` **[NY]**

### 3. Konfiguration

#### config.js
- [ ] Supabase URL korrekt
- [ ] Supabase anon key korrekt
- [ ] Multi-session support aktiverad (`storageKey` med random ID)

```javascript
// Verifiera att denna finns:
storageKey: 'supabase.auth.token.' + Math.random().toString(36).substring(2, 15)
```

### 4. Supabase Inställningar

#### Row Level Security (RLS)
- [ ] RLS aktiverad på alla tabeller
- [ ] Policies för profiles (select all, update own)
- [ ] Policies för items (select all)
- [ ] Policies för player_items (CRUD own)
- [ ] Policies för character_classes (select all)

#### Realtime
- [ ] Realtime aktiverad för `lobbies`
- [ ] Realtime aktiverad för `lobby_players`
- [ ] Realtime aktiverad för `game_sessions`

#### Authentication
- [ ] Email confirmation: Inaktiverad (för testing) eller Aktiverad (för produktion)
- [ ] Email provider konfigurerad
- [ ] Password requirements: Minst 6 tecken

### 5. Testing Lokal

Testa alla features lokalt:

#### Character Creation
- [ ] Kan skapa konto
- [ ] Character creation screen visas
- [ ] Kan välja namn (2-50 tecken)
- [ ] Kan välja klass (alla 4 synliga)
- [ ] Kan fördela 5 bonuspoäng
- [ ] Character sparas i databas
- [ ] Starter item ges vid skapande

#### Items System
- [ ] Stash Hub öppnas
- [ ] Items visas i shop (sorterade efter rarity)
- [ ] Kan köpa items (gold dras av)
- [ ] Kan equip/unequip items (max 3)
- [ ] Equipped items visas i spel
- [ ] Kan använda items under spel
- [ ] Item effects fungerar (t.ex. skydd, healing)

#### Dungeon System
- [ ] Dungeon genereras (6-10 rum)
- [ ] Alla spelare börjar i samma rum
- [ ] Dungeon map visas visuellt
- [ ] Kan röra sig mellan rum
- [ ] Nyckelrum fungerar (kan ta nyckel)
- [ ] Portalrum fungerar (kan fly med nyckel)
- [ ] Boss-rum fungerar (kan slåss)
- [ ] Monster-rum fungerar
- [ ] Skattkammare fungerar
- [ ] Fäll-rum fungerar (agility check)
- [ ] Stats påverkar gameplay (styrka i strid, smidighet för fällor)

#### Multi-Session
- [ ] Kan öppna 2 fönster
- [ ] Kan logga in med olika konton i varje fönster
- [ ] Båda sessions förblir aktiva
- [ ] Ingen logout i andra fönstret

### 6. Netlify Deployment

#### Build Settings
- Base directory: `/`
- Build command: (ingen behövs för statisk site)
- Publish directory: `/`

#### Environment Variables
Inga behövs (Supabase config är i `config.js`)

#### Files to Deploy
```
/
├── index.html
├── style.css
├── config.js
├── main.js
├── character_creation.js
├── auth.js
├── matchmaking.js
├── stashhub.js
├── item_usage.js
├── dungeon_system.js
├── ui.js
├── app.js
└── _redirects (optional)
```

#### _redirects (optional för SPA)
```
/*    /index.html   200
```

### 7. Post-Deployment Testing

Efter deployment till Netlify:

#### Grundläggande
- [ ] Sidan laddas korrekt
- [ ] Inga console errors
- [ ] Kan skapa konto
- [ ] Kan logga in

#### Character System
- [ ] Character creation fungerar
- [ ] Karaktärsnnamn sparas
- [ ] Klass och stats sparas
- [ ] Starter item ges

#### Multiplayer
- [ ] Kan skapa lobby
- [ ] Kan joina lobby
- [ ] Real-time updates fungerar
- [ ] Spel startar med dungeon

#### Items
- [ ] Kan köpa items
- [ ] Kan equipa items
- [ ] Kan använda items i spel
- [ ] Gold system fungerar

#### Dungeon
- [ ] Dungeon genereras korrekt
- [ ] Kan utforska rum
- [ ] Monster encounters fungerar
- [ ] Portal/nyckel mekanik fungerar

### 8. Performance Check

- [ ] Sidan laddar på < 3 sekunder
- [ ] Dungeon map renderar smidigt
- [ ] Item animations är smooth
- [ ] Inga minnesläckor vid långt spel

### 9. Mobile Testing

- [ ] Responsiv design fungerar
- [ ] Touch events fungerar
- [ ] Dungeon map visas korrekt på mobil
- [ ] Character creation fungerar på mobil

### 10. Security

- [ ] Supabase anon key (inte service key!) används
- [ ] RLS policies skyddar data korrekt
- [ ] Ingen känslig data i localStorage
- [ ] HTTPS aktiverat (Netlify default)

## 🚨 Vanliga Problem

### "Items visas inte"
→ Kör `seed_items.sql` i Supabase

### "Kan inte skapa karaktär"
→ Kör `character_creation_schema.sql` i Supabase

### "RPC function not found"
→ Kontrollera att alla SQL-filer har körts

### "Multi-session loggar ut"
→ Kontrollera `config.js` har random `storageKey`

### "Dungeon genereras inte"
→ Kontrollera att `dungeon_system.js` laddas i `index.html`

## 📊 Success Metrics

När allt fungerar ska du kunna:

1. ✅ Skapa 2 konton i olika fönster samtidigt
2. ✅ Varje konto skapar unik karaktär
3. ✅ Köpa items i Stash Hub
4. ✅ Utrusta 3 items
5. ✅ Starta multiplayer game
6. ✅ Se dungeon karta med 6-10 rum
7. ✅ Utforska rum och slåss mot monster
8. ✅ Använda items under spelet
9. ✅ Hitta nyckeln och fly genom portalen
10. ✅ Båda spelarna kan spela samtidigt

## 🎉 Launch Ready!

När alla checklist items är klara är du redo att launcha!

**URL att dela:** `https://your-site-name.netlify.app`

**Admin tasks:**
- Skapa admin-konto
- Testa alla features en sista gång
- Bjud in beta-testare
- Samla feedback

---

**Lycka till med deploymenten! 🚀**

