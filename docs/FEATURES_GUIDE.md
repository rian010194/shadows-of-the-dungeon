# 🎮 Shadow Dungeon - Features Guide

## ✨ Nya Features

### 1. 🎭 Karaktärsskapande System

När du skapar ett konto får du nu möjlighet att skapa din egen karaktär!

#### Steg 1: Välj Karaktärsnamn
- Ge din karaktär ett unikt namn (2-50 tecken)
- Detta är namnet andra spelare ser i spelet

#### Steg 2: Välj Klass
Välj mellan 4 olika klasser, vardera med unika styrkor:

- **🔮 Magiker** - Hög intelligens och visdom, men svag fysiskt
  - Styrka: 3, Intelligens: 10, Smidighet: 4, Vitalitet: 4, Visdom: 7
  - Startföremål: Magic Compass

- **⚔️ Krigare** - Stark och uthållig kämpare
  - Styrka: 10, Intelligens: 3, Smidighet: 5, Vitalitet: 8, Visdom: 4
  - Startföremål: Iron Shield

- **🗡️ Skuggmästare** - Smidig och listig
  - Styrka: 5, Intelligens: 5, Smidighet: 10, Vitalitet: 5, Visdom: 5
  - Startföremål: Smoke Bomb

- **🔯 Siare** - Vis och insiktsfull
  - Styrka: 4, Intelligens: 7, Smidighet: 4, Vitalitet: 5, Visdom: 10
  - Startföremål: Lucky Charm

#### Steg 3: Fördela Bonuspoäng
- Du får 5 bonuspoäng att fördela fritt
- Anpassa din karaktär efter din spelstil

### 2. 📦 Item System

#### Typ av Items:
- **Weapons** (Vapen) - Ökar attackkraft
- **Armor** (Rustning) - Skyddar mot skada
- **Consumables** (Förbrukningsvaror) - Engångseffekter
- **Tools** (Verktyg) - Speciella förmågor
- **Treasure** (Skatter) - Ger guld eller loot

#### Rariteter:
- ⚪ **Common** - Vanliga items
- 🔵 **Uncommon** - Ovanliga items
- 🟣 **Rare** - Sällsynta items
- 🟡 **Legendary** - Extremt kraftfulla items

#### Hur man använder items:
1. Gå till **🎒 Stash Hub** i menyn
2. Välj **📦 Inventory** tab
3. Klicka **Equip** på upp till 3 items
4. Under spelet, använd items genom att klicka **Använd** knappen

#### Exempel Items:

**Starter Items** (gratis vid karaktärsskapande):
- Rusty Sword - Överlev en attack
- Leather Pouch - +1 inventory slot
- Torch - Avslöj mörker

**Shop Items:**
- Health Potion (50g) - Hela 50 HP
- Silver Dagger (150g) - +2 attack power
- Enchanted Amulet (500g) - Immun mot korruption en gång
- Phoenix Feather (1500g) - Återuppstå efter död
- Crown of Wisdom (2000g) - Se alla spelares roller

### 3. 🗺️ Dungeon Utforskning System

#### Hur det fungerar:
1. **Dungeon Generation** - Vid varje runda genereras en ny dungeon med 6-10 rum
2. **Alla börjar tillsammans** - I Ingångshallen
3. **Fri rörelse** - Välj själv vilket rum du vill utforska
4. **Samarbeta eller splittra** - Du kan gå ensam eller med andra

#### Rumtyper:
- 🔑 **Nyckelrum** - Innehåller portalnyckeln (krävs för att fly)
- 🌀 **Portalrum** - Använd nyckeln här för att fly
- 👹 **Boss-rum** - Ett stort, farligt monster (150 HP, 30 damage)
- ⚔️ **Monster-rum** - Mindre monster (30-60 HP, 10-20 damage)
- 💎 **Skattkammare** - Innehåller 1-3 skattobjekt
- ⚠️ **Fällrum** - Smidighet hjälper dig undvika

#### Karta-funktioner:
- **Guldkant** - Ditt nuvarande rum
- **Grön kant** - Nyckelrum
- **Blå kant** - Portalrum
- **Röd kant** - Boss-rum
- **👥 Ikon** - Antal spelare i rummet
- **🚪 Nummer** - Antal utgångar från rummet

#### Strategier:
- **Splittra upp** - Täck fler rum snabbare
- **Håll ihop** - Säkrare mot monster
- **Använd dina stats** - Styrka för strid, Smidighet för fällor

### 4. 🏰 Multi-Session Support

Nu kan flera spelare vara inloggade samtidigt i olika fönster/enheter!

Varje webbläsarfönster/tab får sin egen session, så du kan:
- Testa med flera konton samtidigt
- Spela från olika enheter
- Utveckla och testa multiplayer lokalt

## 🎯 Spelflöde

1. **Skapa konto** → Välj karaktär
2. **Stash Hub** → Köp och utrusta items
3. **Starta spel** → Single player eller Multiplayer
4. **Utforska dungeon** → Hitta nyckel, besegra monster
5. **Använd items** → Under rundorna för att överleva
6. **Fly genom portal** → Använd nyckeln och säkra ditt byte

## 📊 Stats Påverkar Gameplay

- **💪 Styrka** - Mer skada i strid
- **🧠 Intelligens** - (Framtida: Trollformler, loot identification)
- **⚡ Smidighet** - Högre chans att undvika fällor
- **❤️ Vitalitet** - (Framtida: Mer HP, uthållighet)
- **👁️ Visdom** - (Framtida: Se dolda saker, bättre insikt)

## 🗄️ Databas Setup

För att aktivera alla features, kör dessa SQL-filer i Supabase SQL Editor i ordning:

1. `supabase_schema.sql` - Grundläggande databas
2. `update_schema_stashhub.sql` - Items och quests
3. `character_creation_schema.sql` - Karaktärssystem
4. `seed_items.sql` - Lägg till exempel-items

## 🎨 UX Features

- **Smooth animationer** - Alla UI-element har eleganta övergångar
- **Visuell feedback** - Färgkodade rumtyper och item rariteter
- **Responsiv design** - Fungerar på desktop och mobil
- **Intuitiv navigation** - Tydliga steg och instruktioner
- **Real-time updates** - Kartan och spelarlistor uppdateras live

## 🚀 Tips & Tricks

### För Magiker:
- Använd intelligens för att identifiera bästa items
- Magic Compass hjälper dig hitta skatter
- Undvik direkta strider

### För Krigare:
- Gå först in i monster-rum
- Iron Shield ger extra skydd
- Hög vitalitet = överlev längre

### För Skuggmästare:
- Utforska snabbt tack vare hög smidighet
- Smoke Bomb för att fly från fara
- Perfekt för att hitta nyckeln först

### För Siare:
- Använd visdom för att förutse händelser
- Lucky Charm ger bättre loot
- Hjälp laget med insikter

## 🔧 Felsökning

### Problem: Items visas inte i Stash Hub
**Lösning:** Kör `seed_items.sql` i Supabase

### Problem: Kan inte skapa karaktär
**Lösning:** Kör `character_creation_schema.sql` i Supabase

### Problem: Multi-session fungerar inte
**Lösning:** Kontrollera att `config.js` har uppdaterad `initializeSupabase()` funktion

### Problem: Dungeon genereras inte
**Lösning:** Kontrollera att `dungeon_system.js` är inkluderat i `index.html`

## 📝 Nästa Steg

Möjliga framtida features:
- **Crafting System** - Kombinera items för nya effekter
- **Skill Trees** - Utveckla din karaktär över tid
- **Guild System** - Skapa eller gå med i guilds
- **Leaderboards** - Konkurrera om högsta poäng
- **Seasonal Events** - Speciella dungeons och items
- **PvP Arena** - Kämpa mot andra spelare

---

**Lycka till i dungeonen, äventyrare! 🗡️**

