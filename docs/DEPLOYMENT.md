# 🚀 Deployment Guide

Complete guide to deploying Shadows of the Dungeon to GitHub and Netlify.

---

## 📋 Prerequisites

- Git installed on your computer
- GitHub account
- Netlify account (free tier works great!)
- Optional: Supabase account (for future multiplayer features)

---

## 🐙 Step 1: Upload to GitHub

### 1.1 Initialize Git Repository

Open terminal/command prompt in your project folder:

```bash
# Navigate to your project folder
cd C:\Users\1\ShadowDungeon

# Initialize git repository
git init

# Add all files
git add .

# Make your first commit
git commit -m "Initial commit: Shadows of the Dungeon v1.0"
```

### 1.2 Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and log in
2. Click the **"+"** icon in top-right → **"New repository"**
3. Repository settings:
   - **Name**: `shadows-of-the-dungeon`
   - **Description**: "A social deception extraction roguelite game"
   - **Public** or Private (your choice)
   - ❌ Don't check "Initialize with README" (we already have one)
4. Click **"Create repository"**

### 1.3 Push to GitHub

GitHub will show you commands. Use these:

```bash
# Add GitHub as remote origin
git remote add origin https://github.com/YOUR_USERNAME/shadows-of-the-dungeon.git

# Push your code
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME`** with your actual GitHub username!

✅ **Your code is now on GitHub!**

---

## 🌐 Step 2: Deploy to Netlify

### Option A: Deploy via GitHub (Recommended)

1. Go to [Netlify.com](https://netlify.com) and sign up/log in
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. Authorize Netlify to access your GitHub
5. Select your repository: `shadows-of-the-dungeon`
6. Build settings:
   - **Branch to deploy**: `main`
   - **Build command**: (leave empty)
   - **Publish directory**: `/` or `.`
7. Click **"Deploy site"**

🎉 **Done!** Netlify will give you a URL like: `random-name-123456.netlify.app`

### Option B: Manual Deploy (Drag & Drop)

1. Go to [Netlify.com](https://netlify.com)
2. Drag your entire project folder onto the Netlify dashboard
3. Wait for upload to complete

✅ **Your game is now live!**

### 2.3 Custom Domain (Optional)

In Netlify dashboard:
1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow instructions to connect your domain

---

## 🗄️ Step 3: Set Up Supabase (For Future Multiplayer)

> **Note**: Current version is single-player. Skip this for now, but here's the setup for when you're ready!

### 3.1 Create Supabase Project

1. Go to [Supabase.com](https://supabase.com) and sign up
2. Click **"New Project"**
3. Fill in:
   - **Name**: Shadows of the Dungeon
   - **Database Password**: (strong password)
   - **Region**: (choose closest to your players)
4. Wait for project to initialize (~2 minutes)

### 3.2 Get API Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`

### 3.3 Add Environment Variables to Netlify

1. In Netlify dashboard → **Site settings** → **Environment variables**
2. Add variables:
   - `SUPABASE_URL` = your project URL
   - `SUPABASE_ANON_KEY` = your anon key
3. Redeploy your site

### 3.4 Database Schema (When Ready for Multiplayer)

```sql
-- Create game rooms table
CREATE TABLE game_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'waiting',
  max_players INTEGER DEFAULT 8,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES game_rooms(id),
  name TEXT NOT NULL,
  role TEXT,
  alive BOOLEAN DEFAULT true,
  escaped BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create game events table
CREATE TABLE game_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES game_rooms(id),
  event_type TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_events;
```

---

## 🔄 Update Your Site

Whenever you make changes:

```bash
# Make your changes to code
# Then commit and push

git add .
git commit -m "Description of changes"
git push origin main
```

Netlify will **automatically rebuild and deploy** your site! 🎉

---

## 🐛 Troubleshooting

### Site won't load
- Check browser console (F12) for errors
- Verify all file paths are correct
- Make sure files are in root directory

### GitHub push fails
```bash
# If you get authentication errors, use Personal Access Token:
# GitHub → Settings → Developer settings → Personal access tokens
# Use token as password when pushing
```

### Netlify build fails
- Check build logs in Netlify dashboard
- Verify all files are included in git
- Make sure `index.html` is in root directory

---

## 📊 Analytics (Optional)

Add to Netlify dashboard → **Site settings** → **Build & deploy** → **Post processing**:
- Enable **Snippet injection** for Google Analytics
- Or use Netlify Analytics (paid feature)

---

## 🎯 Next Steps

1. ✅ Deploy basic version
2. Share your game link with friends!
3. Consider adding:
   - Custom domain
   - Analytics
   - Multiplayer with Supabase
   - SEO optimization

---

**Questions?** Open an issue on GitHub or check:
- [Netlify Docs](https://docs.netlify.com)
- [Supabase Docs](https://supabase.com/docs)
- [GitHub Docs](https://docs.github.com)

Happy deploying! 🚀

