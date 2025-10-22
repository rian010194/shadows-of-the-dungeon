# 🌐 Netlify Deployment Guide

Deploy your Shadow Dungeon game to Netlify for free hosting!

## Prerequisites

- ✅ Code pushed to GitHub (see `GITHUB_SETUP.md`)
- GitHub account
- Netlify account (free - sign up with GitHub)

---

## Method 1: Deploy via Netlify Website (Easiest)

### Step 1: Sign Up / Log In to Netlify

1. Go to [Netlify](https://www.netlify.com/)
2. Click **Sign up** (or **Log in**)
3. Choose **Sign up with GitHub**
4. Authorize Netlify to access your GitHub account

### Step 2: Create New Site

1. Click **Add new site** → **Import an existing project**
2. Choose **Deploy with GitHub**
3. Authorize Netlify if prompted
4. Search for your repository: `shadows-of-the-dungeon`
5. Click on your repository

### Step 3: Configure Build Settings

Since this is a static HTML site, use these settings:

- **Branch to deploy**: `main`
- **Build command**: (leave empty)
- **Publish directory**: `.` (or leave empty)
- **Functions directory**: (leave empty for now)

Click **Deploy site**

### Step 4: Wait for Deployment

- Netlify will deploy your site (takes ~30 seconds)
- You'll get a random URL like: `https://random-name-12345.netlify.app`

### Step 5: Customize Site Name (Optional)

1. Go to **Site settings** → **General** → **Site details**
2. Click **Change site name**
3. Enter: `shadows-of-the-dungeon` (or your preferred name)
4. Your URL becomes: `https://shadows-of-the-dungeon.netlify.app`

---

## Method 2: Deploy via Netlify CLI

### Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Login and Deploy

```bash
# Login to Netlify
netlify login

# Deploy (from your project directory)
netlify deploy

# Follow the prompts:
# - Create & configure a new site
# - Choose your team
# - Site name: shadows-of-the-dungeon
# - Publish directory: . (current directory)

# Deploy to production
netlify deploy --prod
```

---

## Method 3: Drag and Drop (Quick Test)

1. Go to [Netlify Drop](https://app.netlify.com/drop)
2. Drag your entire project folder
3. Get instant deployment!
4. Note: This won't connect to GitHub for auto-updates

---

## ✅ After Deployment

### Your Live URL

```
https://shadows-of-the-dungeon.netlify.app
```

### Enable Continuous Deployment

Already enabled if you used Method 1! Every push to GitHub's `main` branch will auto-deploy.

### Test Your Game

1. Visit your Netlify URL
2. Test all game features
3. Check on mobile devices
4. Share with friends!

---

## 🎯 Optional: Custom Domain

### If you have a custom domain:

1. Go to **Site settings** → **Domain management**
2. Click **Add custom domain**
3. Enter your domain (e.g., `shadowdungeon.com`)
4. Follow DNS configuration instructions
5. Netlify provides free SSL certificate!

---

## 📊 Netlify Features You Get

- ✅ **Free hosting** for static sites
- ✅ **Automatic HTTPS** (SSL certificate)
- ✅ **Global CDN** (fast worldwide)
- ✅ **Automatic deployments** from GitHub
- ✅ **Deploy previews** for pull requests
- ✅ **Custom domains** support
- ✅ **Form handling** (if you add forms)
- ✅ **Serverless functions** (for future backend)

---

## 🔄 Making Updates

### After deployment, any time you update your game:

```bash
# Make your changes
# Commit and push to GitHub
git add .
git commit -m "Add new feature"
git push

# Netlify automatically deploys!
```

Watch deployment status at: https://app.netlify.com

---

## 🐛 Troubleshooting

### Site not loading correctly?

1. Check **Deploy log** in Netlify dashboard
2. Verify all files are in repository
3. Check browser console for errors
4. Clear browser cache

### Assets not loading?

- Ensure all paths in `index.html` are relative
- Check that `style.css` and `main.js` are in root directory

### Need help?

- [Netlify Docs](https://docs.netlify.com/)
- [Netlify Community](https://answers.netlify.com/)

---

## 📝 Update Your README

After deployment, update `README.md` line 40:

```markdown
**Deployed on Netlify**: https://shadows-of-the-dungeon.netlify.app
```

Commit and push this change!

---

**Next Steps**: Proceed to `SUPABASE_SETUP.md` for backend setup (for future multiplayer features)!

