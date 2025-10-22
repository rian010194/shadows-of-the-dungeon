# 🚀 Push to GitHub - Quick Guide

## Step 1: Create GitHub Repository

1. Go to: **https://github.com/new**
2. Fill in:
   - **Repository name**: `shadows-of-the-dungeon`
   - **Description**: `A multiplayer social deception extraction roguelite game`
   - **Public** (recommended) or Private
   - ❌ **DO NOT** check "Initialize with README" (we already have files!)
3. Click **"Create repository"**

## Step 2: Push Your Code

After creating the repository, GitHub will show you commands. 

### If GitHub shows you commands, use those!

Or copy these commands (replace `YOUR_USERNAME` with your actual GitHub username):

```powershell
# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/shadows-of-the-dungeon.git

# Push to GitHub
git push -u origin main
```

### Example (if your username is "johndoe"):
```powershell
git remote add origin https://github.com/johndoe/shadows-of-the-dungeon.git
git push -u origin main
```

## Step 3: Enter Credentials

When prompted:
- **Username**: Your GitHub username
- **Password**: Use a **Personal Access Token** (not your password!)

### How to create a Personal Access Token:

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: "ShadowDungeon"
4. Check scopes: `repo` (full control of private repositories)
5. Click "Generate token"
6. **COPY THE TOKEN** (you won't see it again!)
7. Use this token as your password when pushing

## ✅ Verification

After pushing, visit:
```
https://github.com/YOUR_USERNAME/shadows-of-the-dungeon
```

You should see all your files!

## 🔄 Future Updates

After the initial push, updating is easy:

```powershell
git add .
git commit -m "Your commit message"
git push
```

---

**Ready?** Create the repository on GitHub, then run the commands above!

