# Beginner's Deployment Guide - Step by Step

Welcome! This guide will walk you through deploying your MoodyChimp project from scratch. Don't worry if you're new to this - we'll go through everything step by step.

## 📋 Overview

We'll deploy:
- **Backend** → Google Cloud Run (where your API/server runs)
- **Frontend** → Vercel (where your website runs)

**Estimated Time**: 1-2 hours (first time)

---

## Part 1: Setting Up Accounts (15 minutes)

### Step 1.1: Create Google Cloud Account

1. Go to [cloud.google.com](https://cloud.google.com)
2. Click "Get started for free"
3. Sign in with your Google account
4. Complete the signup process
   - You'll need to provide a credit card (they give $300 free credit, won't charge unless you upgrade)
   - Verify your phone number
5. **Important**: Note your project ID (you'll see it in the top bar)

### Step 1.1b: Enable Billing (REQUIRED)

**⚠️ Important**: Even with free credits, you MUST enable billing to use Cloud Run and other services.

1. Go to [console.cloud.google.com/billing](https://console.cloud.google.com/billing)
2. If you don't have a billing account:
   - Click "Create Account"
   - Fill in your information and payment method
   - **Don't worry** - Google gives $300 free credit!
3. Link billing to your project:
   - Go to [console.cloud.google.com/billing/projects](https://console.cloud.google.com/billing/projects)
   - Find your project and link it to your billing account
4. **See `ENABLE_BILLING.md` for detailed instructions if you get errors**

### Step 1.2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub" (recommended - connects to your GitHub repo)
4. Authorize Vercel to access your GitHub account

### Step 1.3: Verify Your GitHub Repository

1. Make sure your code is pushed to GitHub
2. Go to your repository on GitHub
3. Verify all files are there (especially the `backend` and `frontend` folders)

---

## Part 2: Deploy Backend to Google Cloud Run (30-45 minutes)

### Step 2.1: Install Google Cloud CLI

**For Windows:**
1. Download from: [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)
2. Run the installer
3. Open a new terminal/command prompt
4. Verify installation:
   ```bash
   gcloud --version
   ```

**For Mac:**
```bash
# Install using Homebrew
brew install google-cloud-sdk
```

**For Linux:**
```bash
# Follow instructions at cloud.google.com/sdk/docs/install
```

### Step 2.2: Login to Google Cloud

1. Open terminal/command prompt
2. Run:
   ```bash
   gcloud auth login
   ```
3. A browser window will open - sign in with your Google account
4. Allow access

### Step 2.3: Set Up Your Project

**Important**: Project IDs cannot have spaces! They must be lowercase with hyphens.

1. **Option A: Create a new project**
   ```bash
   gcloud projects create moodychimp-production --name="MoodyChimp Production"
   ```
   This creates:
   - Project ID: `moodychimp-production` (used in commands)
   - Project Name: "MoodyChimp Production" (display name)
   
2. **Option B: Use existing project**
   
   First, find your Project ID:
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Click on the project name in the top bar
   - Copy the **Project ID** (not the name - it will be lowercase with hyphens)
   
   Then set it:
   ```bash
   gcloud config set project YOUR-PROJECT-ID
   ```
   Example: `gcloud config set project moodychimp-production`
   
   **Note**: Use the Project ID (no spaces), not the project name!

3. **Verify it worked**:
   ```bash
   gcloud config get-value project
   ```
   This should show your Project ID.

2. Enable required services:
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

### Step 2.4: Prepare Your Database URL

You need your PostgreSQL database connection string. If you're using Neon:

1. Go to your Neon dashboard
2. Find your connection string (looks like: `postgresql://user:password@host:5432/database`)
3. **Save this somewhere safe** - you'll need it soon

### Step 2.5: Build and Deploy Your Backend

1. Navigate to your project folder:
   ```bash
   cd "C:\Users\dperadze\Downloads\Projects\lecture_MoodyChimp-main\lecture_MoodyChimp-main\backend"
   ```

2. Build the Docker container:
   ```bash
   gcloud builds submit --tag gcr.io/929404577886/moodychimp-backend
   ```
   (Replace `YOUR-PROJECT-ID` with your actual project ID)
   
   **This will take 5-10 minutes the first time** - be patient!

3. Deploy to Cloud Run:
   ```bash
   gcloud run deploy moodychimp-backend \
     --image gcr.io/YOUR-PROJECT-ID/moodychimp-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars DATABASE_URL="YOUR-DATABASE-URL" \
     --set-env-vars CLOUDINARY_URL="YOUR-CLOUDINARY-URL" \
     --memory 512Mi
   ```
   
   Replace:
   - `YOUR-PROJECT-ID` with your project ID
   - `YOUR-DATABASE-URL` with your PostgreSQL connection string
   - `YOUR-CLOUDINARY-URL` with your Cloudinary URL (if you have one)

4. **Wait for deployment** - this takes 2-3 minutes

5. **Copy the URL** - At the end, you'll see something like:
   ```
   Service URL: https://moodychimp-backend-xxxxx-uc.a.run.app
   ```
   **SAVE THIS URL** - you'll need it for the frontend!

### Step 2.6: Test Your Backend

1. Open the URL in your browser and add `/api/status` at the end:
   ```
   https://YOUR-BACKEND-URL/api/status
   ```

2. You should see: `{"status":"ok","message":"Server is running"}`

3. If you see an error, check the logs:
   ```bash
   gcloud run services logs read moodychimp-backend --region us-central1
   ```

---

## Part 3: Deploy Frontend to Vercel (20-30 minutes)

### Step 3.1: Connect Your Repository

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Click "Import Git Repository"
4. Find your `lecture_MoodyChimp` repository
5. Click "Import"

### Step 3.2: Configure Project Settings

Vercel should auto-detect your project, but verify:

1. **Framework Preset**: Should be "Vite" (auto-detected)
2. **Root Directory**: 
   - If your repo has `frontend` folder: Click "Edit" and set to `frontend`
   - If frontend is at root: Leave blank
3. **Build Command**: `npm run build` (should be auto-filled)
4. **Output Directory**: `dist` (should be auto-filled)
5. **Install Command**: `npm install` (should be auto-filled)

### Step 3.3: Set Environment Variable

**This is crucial!**

1. In the project configuration, find "Environment Variables"
2. Click "Add"
3. Add this variable:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: Your backend URL from Step 2.5 (the Cloud Run URL)
     - Example: `https://moodychimp-backend-xxxxx-uc.a.run.app`
   - **Environment**: Select all three (Production, Preview, Development)
4. Click "Save"

### Step 3.4: Deploy

1. Click "Deploy" button at the bottom
2. **Wait 2-3 minutes** for the build to complete
3. You'll see a success message with your website URL!

### Step 3.5: Test Your Frontend

1. Click on the deployment URL (something like `moodychimp.vercel.app`)
2. Your website should load!
3. Open browser console (F12) and check for errors
4. Try logging in or using features to test API connectivity

---

## Part 4: Verify Everything Works (10 minutes)

### Test Checklist

- [ ] Backend health check works (`/api/status`)
- [ ] Frontend loads without errors
- [ ] Can see the homepage
- [ ] Can register a new account
- [ ] Can log in
- [ ] Can browse services
- [ ] No CORS errors in browser console
- [ ] API calls work (check Network tab in browser dev tools)

### Common Issues

**Problem**: "CORS error" in browser console
- **Solution**: Your backend CORS is already configured, but make sure your frontend URL is allowed

**Problem**: "Cannot connect to API"
- **Solution**: 
  1. Check `VITE_API_BASE_URL` is set correctly in Vercel
  2. Make sure backend URL doesn't have trailing slash
  3. Verify backend is running: `gcloud run services list`

**Problem**: "Database connection error"
- **Solution**: 
  1. Check your `DATABASE_URL` in Cloud Run
  2. Make sure database allows connections from Cloud Run IPs
  3. Verify database credentials are correct

---

## Part 5: Making Updates (Future Deployments)

### Update Backend

1. Make your code changes
2. Push to GitHub
3. Rebuild and redeploy:
   ```bash
   cd backend
   gcloud builds submit --tag gcr.io/YOUR-PROJECT-ID/moodychimp-backend
   gcloud run deploy moodychimp-backend --image gcr.io/YOUR-PROJECT-ID/moodychimp-backend --region us-central1
   ```

### Update Frontend

1. Make your code changes
2. Push to GitHub
3. Vercel automatically deploys! (if connected to GitHub)
4. Or manually: Go to Vercel dashboard → Your project → "Redeploy"

---

## Part 6: Viewing Logs (For Debugging)

### Backend Logs

```bash
# View recent logs
gcloud run services logs read moodychimp-backend --region us-central1

# Follow logs in real-time
gcloud run services logs tail moodychimp-backend --region us-central1
```

### Frontend Logs

1. Go to Vercel dashboard
2. Click on your project
3. Click on a deployment
4. Click "Functions" or "Logs" tab

---

## Part 7: Cost Management

### Google Cloud Run

- **Free Tier**: 2 million requests/month free
- **After free tier**: Pay per use (very cheap for small projects)
- **Estimated cost**: $0-5/month for small projects

### Vercel

- **Free Tier**: Unlimited personal projects
- **Perfect for**: Personal projects and small businesses
- **Upgrade needed**: Only if you need team features

---

## Quick Reference Commands

### Backend

```bash
# View all services
gcloud run services list

# View service details
gcloud run services describe moodychimp-backend --region us-central1

# Update environment variable
gcloud run services update moodychimp-backend \
  --update-env-vars DATABASE_URL="new-url" \
  --region us-central1

# View logs
gcloud run services logs read moodychimp-backend --region us-central1
```

### Frontend

- All frontend management is done through Vercel dashboard
- No command line needed!

---

## Getting Help

### If Something Goes Wrong

1. **Check the logs** (see Part 6)
2. **Verify environment variables** are set correctly
3. **Test backend separately** using the `/api/status` endpoint
4. **Check browser console** for frontend errors
5. **Verify database connection** is working

### Resources

- [Google Cloud Run Docs](https://cloud.google.com/run/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

## Summary Checklist

Before you start:
- [ ] Google Cloud account created
- [ ] Vercel account created
- [ ] GitHub repository ready
- [ ] Database connection string ready
- [ ] Cloudinary URL ready (if using)

Deployment steps:
- [ ] Google Cloud CLI installed
- [ ] Backend deployed to Cloud Run
- [ ] Backend URL saved
- [ ] Frontend deployed to Vercel
- [ ] Environment variable set in Vercel
- [ ] Everything tested and working

---

## Congratulations! 🎉

You've successfully deployed your full-stack application! 

Your app is now:
- ✅ Accessible from anywhere in the world
- ✅ Automatically scalable
- ✅ Using HTTPS (secure)
- ✅ Ready for users

**Next Steps:**
- Share your Vercel URL with others
- Monitor usage in both platforms
- Set up custom domain (optional)
- Add monitoring/analytics (optional)

---

**Need help?** Check the troubleshooting section or review the logs. Most issues are related to environment variables or database connections.

**Good luck with your deployment!** 🚀

