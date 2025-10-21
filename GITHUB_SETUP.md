# 🐙 GitHub Setup Guide

Your code is committed locally! Now let's push it to GitHub.

## Option 1: Using GitHub Website (Recommended)

### Step 1: Create Repository on GitHub

1. Go to [GitHub](https://github.com) and log in
2. Click the **+** icon in the top-right corner
3. Select **New repository**
4. Fill in the details:
   - **Repository name**: `shadows-of-the-dungeon` (or `ShadowDungeon`)
   - **Description**: `A social deception extraction roguelite - browser game`
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **Create repository**

### Step 2: Push Your Code

After creating the repository, GitHub will show you commands. Use these in your terminal:

```bash
# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/shadows-of-the-dungeon.git

# Push your code
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

### Step 3: Verify

Visit your repository URL: `https://github.com/YOUR_USERNAME/shadows-of-the-dungeon`

You should see all your files there!

---

## Option 2: Using GitHub CLI (If you want to install it)

### Install GitHub CLI

Download from: https://cli.github.com/

### Create and Push Repository

```bash
# Login to GitHub
gh auth login

# Create repository and push
gh repo create shadows-of-the-dungeon --public --source=. --remote=origin --push
```

---

## ✅ After Pushing to GitHub

Your repository URL will be:
```
https://github.com/YOUR_USERNAME/shadows-of-the-dungeon
```

Update this in your README.md file where it says:
```bash
git clone https://github.com/YOUR_USERNAME/shadows-of-the-dungeon.git
```

---

## 🔄 Future Git Commands

```bash
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push changes
git push

# Pull latest changes
git pull
```

---

**Next Steps**: Once pushed to GitHub, proceed to `NETLIFY_SETUP.md` for deployment!

