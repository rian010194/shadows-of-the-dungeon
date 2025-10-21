# ✅ Deployment Checklist

Quick checklist to deploy Shadow Dungeon to production!

## Status

- [x] Git repository initialized
- [x] Initial commit created
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Deployed to Netlify
- [ ] Supabase project created (optional - for future)
- [ ] README updated with live URLs

---

## 🚀 Quick Commands

### 1️⃣ Push to GitHub

**First, create a repository on GitHub:**
- Go to https://github.com/new
- Name: `shadows-of-the-dungeon`
- Don't initialize with README
- Click "Create repository"

**Then run these commands:**

```bash
# Add GitHub remote (replace YOUR_USERNAME!)
git remote add origin https://github.com/YOUR_USERNAME/shadows-of-the-dungeon.git

# Push to GitHub
git push -u origin main
```

### 2️⃣ Deploy to Netlify

**Via Website (Easiest):**
1. Go to https://app.netlify.com/
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub
4. Select your repository
5. Click "Deploy site"

**Your site URL:** `https://random-name.netlify.app`

**Customize URL:** Site settings → Change site name → `shadows-of-the-dungeon`

**New URL:** `https://shadows-of-the-dungeon.netlify.app`

### 3️⃣ Set Up Supabase (Optional)

1. Go to https://supabase.com/
2. Create new project: `shadows-dungeon`
3. Save your API keys (Settings → API)
4. Run SQL from `SUPABASE_SETUP.md` to create tables
5. Add environment variables to Netlify

---

## 📝 After Deployment

### Update README.md

Replace line 40:
```markdown
**Deployed on Netlify**: https://shadows-of-the-dungeon.netlify.app
```

### Commit and Push Update

```bash
git add README.md
git commit -m "Update README with deployment URL"
git push
```

Netlify will auto-deploy!

---

## 🎯 Detailed Guides

- **GitHub Setup**: See `GITHUB_SETUP.md`
- **Netlify Deployment**: See `NETLIFY_SETUP.md`
- **Supabase Backend**: See `SUPABASE_SETUP.md`
- **General Guide**: See `DEPLOYMENT.md`

---

## 🔗 Your URLs

After deployment, you'll have:

```
GitHub Repo:    https://github.com/YOUR_USERNAME/shadows-of-the-dungeon
Live Game:      https://shadows-of-the-dungeon.netlify.app
Supabase:       https://app.supabase.com/project/YOUR_PROJECT_ID
```

---

## ⚡ Quick Deploy Script (Future)

Save this as `deploy.sh` for quick updates:

```bash
#!/bin/bash
git add .
git commit -m "$1"
git push
echo "Deployed! Netlify will update in ~30 seconds"
```

Usage:
```bash
chmod +x deploy.sh
./deploy.sh "Your commit message"
```

---

**Ready? Let's deploy!** 🚀

