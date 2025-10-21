# 🚀 Complete Deployment Guide - Step by Step

This guide will walk you through deploying Shadow Dungeon with multiplayer support.

---

## ✅ Prerequisites

- [x] Code committed locally
- [ ] GitHub account
- [ ] Netlify account (free)
- [ ] Supabase account (free)

---

## 📋 STEP 1: Push to GitHub

### 1.1 Create GitHub Repository

1. Go to: https://github.com/new
2. Fill in:
   - **Name**: `shadows-of-the-dungeon`
   - **Description**: `A multiplayer social deception extraction roguelite game`
   - **Public** or Private
   - ❌ **DO NOT** check "Initialize with README"
3. Click **"Create repository"**

### 1.2 Push Your Code

Replace `YOUR_USERNAME` with your actual GitHub username:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/shadows-of-the-dungeon.git
git push -u origin main
```

When prompted for password, use a **Personal Access Token**:
- Get one here: https://github.com/settings/tokens
- Select scope: `repo`

### 1.3 Verify

Visit: `https://github.com/YOUR_USERNAME/shadows-of-the-dungeon`

You should see all your files!

---

## 🗄️ STEP 2: Set Up Supabase

### 2.1 Create Supabase Project

1. Go to: https://supabase.com/
2. Click **"New Project"**
3. Fill in:
   - **Name**: `shadow-dungeon`
   - **Database Password**: Create a strong password and **SAVE IT**!
   - **Region**: Choose closest to your location
   - **Plan**: Free
4. Click **"Create new project"**
5. Wait ~2 minutes for setup

### 2.2 Run SQL Schema

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open the file `supabase_schema.sql` in your project
4. Copy ALL the SQL code
5. Paste into Supabase SQL Editor
6. Click **"Run"**
7. Wait for success message: ✅ "Shadow Dungeon database schema created successfully!"

### 2.3 Get API Credentials

1. Go to **Settings** → **API** (gear icon in sidebar)
2. Copy these values (you'll need them later):
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (long string)

### 2.4 Update config.js

1. Open `config.js` in your project
2. Replace the placeholder values:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://xxxxxxxxxxxxx.supabase.co', // Your Project URL
    anonKey: 'eyJhbGc...' // Your anon public key
};
```

3. Save the file
4. Commit and push:

```powershell
git add config.js
git commit -m "Add Supabase credentials"
git push
```

---

## 🌐 STEP 3: Deploy to Netlify

### 3.1 Sign Up / Log In

1. Go to: https://app.netlify.com/
2. Click **"Sign up"** or **"Log in"**
3. Choose **"Sign up with GitHub"**
4. Authorize Netlify

### 3.2 Create New Site

1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **"Deploy with GitHub"**
3. Authorize Netlify to access your GitHub (if prompted)
4. Select your repository: `shadows-of-the-dungeon`

### 3.3 Configure Build Settings

- **Branch to deploy**: `main`
- **Build command**: (leave empty)
- **Publish directory**: `.` or `/` (current directory)
- Click **"Deploy site"**

### 3.4 Wait for Deployment

- Netlify will deploy your site (~30 seconds)
- You'll get a URL like: `https://random-name-12345.netlify.app`

### 3.5 Customize Site Name (Optional)

1. Go to **Site settings** → **General** → **Site details**
2. Click **"Change site name"**
3. Enter: `shadows-of-the-dungeon`
4. Your new URL: `https://shadows-of-the-dungeon.netlify.app`

---

## 🎮 STEP 4: Test Your Game!

### 4.1 Visit Your Live Site

Go to: `https://shadows-of-the-dungeon.netlify.app` (or your custom name)

### 4.2 Create Test Accounts

1. Click **"Sign Up"**
2. Create an account:
   - Username: TestPlayer1
   - Email: test1@example.com
   - Password: test123
3. Check your email and verify (if required)

### 4.3 Test Single Player

1. After logging in, click **"Single Player"**
2. Play through a game to ensure it works

### 4.4 Test Multiplayer (Optional - with friend)

1. Share your site URL with a friend
2. Both create accounts
3. Both click **"Find Multiplayer Game"**
4. You should be matched together!
5. If not enough players, AI will fill the slots after 30 seconds

---

## 🔧 STEP 5: Update README

Update your `README.md` with the live URL:

```markdown
## 🌐 Live Demo

**Play Now**: https://shadows-of-the-dungeon.netlify.app
**GitHub**: https://github.com/YOUR_USERNAME/shadows-of-the-dungeon
```

Commit and push:

```powershell
git add README.md
git commit -m "Update README with live deployment URLs"
git push
```

Netlify will auto-deploy!

---

## ✅ Deployment Checklist

- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Supabase project created
- [ ] SQL schema executed
- [ ] Supabase credentials added to config.js
- [ ] Deployed to Netlify
- [ ] Site is accessible
- [ ] Account creation works
- [ ] Single player works
- [ ] Matchmaking works
- [ ] README updated

---

## 🐛 Troubleshooting

### "Supabase not configured" error

- Check that `config.js` has correct URL and anon key
- Make sure you committed and pushed the changes
- Netlify auto-deploys on push

### Can't create account

- Check browser console (F12) for errors
- Verify Supabase project is running
- Check SQL schema was executed successfully

### Matchmaking not working

- Check Supabase dashboard → Table Editor → `lobbies` table
- Verify realtime subscriptions are enabled
- Check browser console for connection errors

### Players not syncing

- This feature requires additional implementation
- Current version fills with AI after timeout
- Real-time game state sync is in roadmap

---

## 🎯 What's Working

✅ **Authentication**: Sign up, sign in, sign out
✅ **Matchmaking**: Find game, create lobby, join lobby
✅ **AI Fill**: Auto-fills with AI if < 8 players after 30 seconds
✅ **Single Player**: Original game mode works offline
✅ **Profile Stats**: Games played and wins tracked

## 🚧 Future Enhancements

- Real-time game state sync during gameplay
- In-game chat
- Spectator mode
- Custom lobbies with room codes
- Friend system
- Rankings/leaderboard

---

## 📝 Making Updates

Whenever you make changes:

```powershell
# Make your changes
# Then:
git add .
git commit -m "Description of changes"
git push

# Netlify automatically deploys!
```

---

## 🎉 You're Done!

Your game is now live with:
- ✅ Multiplayer matchmaking
- ✅ User authentication
- ✅ Cloud database
- ✅ Global CDN
- ✅ Auto-deployment

Share it with friends and enjoy!

**Live URL**: https://shadows-of-the-dungeon.netlify.app

---

## 📚 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [Netlify Docs](https://docs.netlify.com/)
- [GitHub Docs](https://docs.github.com/)

Happy gaming! 🎮⚔️

