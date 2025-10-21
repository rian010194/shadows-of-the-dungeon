# 🔥 Supabase Setup Guide

Set up Supabase backend for future multiplayer features!

## 📌 Note

Your current game is single-player and doesn't need a backend yet. This guide prepares you for Phase 2 (multiplayer) mentioned in your roadmap.

---

## Prerequisites

- Email address for Supabase account
- Your game deployed on Netlify (for CORS configuration)

---

## Step 1: Create Supabase Account

1. Go to [Supabase](https://supabase.com/)
2. Click **Start your project**
3. Sign up with GitHub, Google, or Email
4. Verify your email

---

## Step 2: Create New Project

1. Click **New Project**
2. Choose your organization (or create one)
3. Fill in project details:
   - **Name**: `shadows-dungeon`
   - **Database Password**: (generate a strong password - SAVE THIS!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is perfect for development
4. Click **Create new project**
5. Wait 1-2 minutes for setup

---

## Step 3: Save Your Credentials

Once created, go to **Settings** → **API**

You'll need these values later:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon/public key: eyJhbGc....(long string)
service_role key: eyJhbGc....(long string) [KEEP SECRET!]
```

**⚠️ IMPORTANT**: Never commit `service_role` key to GitHub! Only use it server-side.

---

## Step 4: Create Database Schema

For multiplayer features, you'll need these tables:

### Go to SQL Editor in Supabase Dashboard

Copy and run this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms/Lobbies Table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(6) UNIQUE NOT NULL,
    host_id UUID,
    status VARCHAR(20) DEFAULT 'waiting', -- waiting, in_progress, finished
    max_players INT DEFAULT 8,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    settings JSONB DEFAULT '{}'::jsonb
);

-- Players Table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    role VARCHAR(20), -- innocent, corrupted
    is_alive BOOLEAN DEFAULT true,
    is_ready BOOLEAN DEFAULT false,
    is_host BOOLEAN DEFAULT false,
    gold INT DEFAULT 0,
    inventory JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Game State Table
CREATE TABLE game_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    phase VARCHAR(20), -- exploration, darkness, discussion, vote, extraction
    round_number INT DEFAULT 1,
    state_data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Leaderboard Table
CREATE TABLE leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL,
    games_played INT DEFAULT 0,
    games_won INT DEFAULT 0,
    total_gold INT DEFAULT 0,
    total_kills INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_rooms_code ON rooms(room_code);
CREATE INDEX idx_players_room ON players(room_id);
CREATE INDEX idx_game_states_room ON game_states(room_id);
CREATE INDEX idx_chat_room ON chat_messages(room_id);
```

Click **Run** to create all tables.

---

## Step 5: Enable Row Level Security (RLS)

For security, enable RLS on all tables:

```sql
-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Example policies (you'll need to customize based on your auth)
-- For now, allow all operations (adjust later with auth)
CREATE POLICY "Allow all operations on rooms" ON rooms
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on players" ON players
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on game_states" ON game_states
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on chat" ON chat_messages
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on leaderboard" ON leaderboard
    FOR ALL USING (true);
```

---

## Step 6: Install Supabase Client (For Future Use)

When you're ready to add multiplayer, you'll use:

### Via CDN (Add to index.html)

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  const SUPABASE_URL = 'YOUR_PROJECT_URL'
  const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
</script>
```

### Via NPM (If using a build system)

```bash
npm install @supabase/supabase-js
```

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_PROJECT_URL',
  'YOUR_ANON_KEY'
)
```

---

## Step 7: Environment Variables (Future)

Create a `.env` file (and add to `.gitignore`):

```env
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc....
```

Update `.gitignore`:
```
.env
.env.local
```

---

## 🎮 Example Multiplayer Features

### Real-time Room Updates

```javascript
// Subscribe to room changes
const roomSubscription = supabase
  .channel('room-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'rooms' },
    (payload) => {
      console.log('Room updated!', payload)
      // Update UI
    }
  )
  .subscribe()
```

### Create a Game Room

```javascript
async function createRoom(hostUsername) {
  // Generate random room code
  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
  
  // Create room
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({
      room_code: roomCode,
      status: 'waiting'
    })
    .select()
    .single()
  
  if (roomError) {
    console.error('Error creating room:', roomError)
    return null
  }
  
  // Add host as player
  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert({
      room_id: room.id,
      username: hostUsername,
      is_host: true,
      is_ready: true
    })
    .select()
    .single()
  
  return { room, player }
}
```

### Join a Room

```javascript
async function joinRoom(roomCode, username) {
  // Find room
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('room_code', roomCode)
    .eq('status', 'waiting')
    .single()
  
  if (roomError || !room) {
    console.error('Room not found or already started')
    return null
  }
  
  // Add player
  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert({
      room_id: room.id,
      username: username
    })
    .select()
    .single()
  
  return { room, player }
}
```

### Send Chat Message

```javascript
async function sendMessage(roomId, playerId, message) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      room_id: roomId,
      player_id: playerId,
      message: message
    })
  
  return !error
}
```

---

## 📊 Supabase Dashboard Features

### Table Editor
- View and edit data directly
- Test queries

### SQL Editor
- Run custom SQL queries
- Create functions and triggers

### Database
- View schema
- Manage migrations
- Check performance

### Authentication (Future)
- Add user authentication
- Social logins (Google, GitHub, etc.)
- Email/password auth

### Storage (Future)
- Store player avatars
- Upload custom maps
- Store game assets

---

## 🔐 Security Best Practices

1. **Never expose** `service_role` key in frontend
2. **Use RLS policies** to protect data
3. **Implement authentication** before going live with multiplayer
4. **Validate all inputs** on the backend
5. **Rate limit** API calls to prevent abuse

---

## 📝 Environment Configuration

### For Netlify Deployment

1. Go to Netlify dashboard
2. **Site settings** → **Environment variables**
3. Add:
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_ANON_KEY`: Your anon key

Access in code:
```javascript
const supabaseUrl = import.meta.env.SUPABASE_URL || 'fallback-url'
const supabaseKey = import.meta.env.SUPABASE_ANON_KEY || 'fallback-key'
```

---

## 🧪 Testing Your Setup

Run this in browser console on your deployed site:

```javascript
const supabase = window.supabase.createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_ANON_KEY'
)

// Test connection
supabase.from('rooms').select('*').then(console.log)
```

---

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

---

## 🎯 Next Steps

1. ✅ Keep Supabase project ready
2. Focus on polishing single-player game
3. When ready for multiplayer:
   - Install Supabase client
   - Implement lobby system
   - Add real-time game state sync
   - Add chat functionality
4. Test thoroughly with friends
5. Launch multiplayer mode!

---

## 💰 Pricing (Free Tier Limits)

- **Database**: 500 MB
- **File Storage**: 1 GB
- **Bandwidth**: 2 GB
- **Realtime**: 200 concurrent connections
- **Auth**: Unlimited users

Perfect for development and testing!

---

**You're all set!** Supabase is ready for when you implement multiplayer features. 🎮

