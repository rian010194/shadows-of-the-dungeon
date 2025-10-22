# 🗄️ SQL Scripts - Shadow Dungeon

## 📋 **Vilka scripts ska köras?**

### **1. `01_setup_database.sql` - KÖR FÖRST**
- **Vad det gör:** Skapar alla tabeller och säkerhetsinställningar
- **När:** När du sätter upp databasen för första gången
- **Innehåller:**
  - Alla tabeller (profiles, characters, lobbies, items, etc.)
  - Row Level Security (RLS)
  - Indexes för prestanda
  - Realtime subscriptions

### **2. `02_seed_data.sql` - KÖR ANDRA**
- **Vad det gör:** Lägger till karaktärsklasser och items
- **När:** Efter att du kört `01_setup_database.sql`
- **Innehåller:**
  - 4 karaktärsklasser (Mage, Warrior, Rogue, Seer)
  - 20 items (från common till legendary)
  - Starter items för varje klass

### **3. `03_fix_user_accounts.sql` - KÖR TREDJE (om du behöver)**
- **Vad det gör:** Fixar befintliga användarkonton
- **När:** Om du har gamla användare med problem
- **Innehåller:**
  - Lägger till saknade kolumner
  - Migrerar gamla karaktärer
  - Rensar tomma lobbys
  - Fixar specifika användare

## 🚀 **Så här kör du scripts:**

### **För nya databaser:**
```sql
-- 1. Kör i Supabase SQL Editor
\i sql/01_setup_database.sql

-- 2. Kör i Supabase SQL Editor  
\i sql/02_seed_data.sql
```

### **För befintliga databaser med problem:**
```sql
-- 1. Kör i Supabase SQL Editor
\i sql/01_setup_database.sql

-- 2. Kör i Supabase SQL Editor
\i sql/02_seed_data.sql

-- 3. Kör i Supabase SQL Editor (om du har problem)
\i sql/03_fix_user_accounts.sql
```

## ⚠️ **Viktiga noter:**

- **Kör scripts i ordning** - 01, 02, 03
- **Kontrollera resultatet** - Se meddelanden i Supabase
- **Backup innan** - Om du har viktig data
- **Testa efter** - Logga in och testa funktionalitet

## 🔧 **Om du får fel:**

1. **Kontrollera att du är inloggad** i Supabase
2. **Kör scripts en i taget** - inte alla samtidigt
3. **Läs felmeddelandena** - de förklarar vad som är fel
4. **Kontakta support** om problem kvarstår

## 📊 **Vad scripts skapar:**

- **8 tabeller** för hela spelet
- **4 karaktärsklasser** med unika stats
- **20 items** från common till legendary
- **Säkerhet** med Row Level Security
- **Realtime** för live-uppdateringar
- **Indexes** för snabb prestanda

## 🎮 **Efter att scripts körts:**

1. **Logga in** i spelet
2. **Skapa en karaktär** - testa att det fungerar
3. **Testa karaktärsbyten** - skapa flera karaktärer
4. **Testa lobbys** - skapa och joina lobbys
5. **Testa shoppen** - köp items med gold

---

**💡 Tips:** Om du inte är säker på vilka scripts du behöver, kör bara `01_setup_database.sql` och `02_seed_data.sql` först. Lägg till `03_fix_user_accounts.sql` bara om du har problem med befintliga användare.
