# 🚀 n8n Quick Start - 5 Minutes to Set Up!

## Step 1: Test Your Backend (30 seconds)

```bash
# Make sure backend is running first
cd backend
npm run dev

# In another terminal, test the endpoint
node test-webhook-endpoint.js
```

If you see ✅ Success, continue! If not, check the error message.

---

## Step 2: Sign Up for n8n (2 minutes)

1. Go to [n8n.io](https://n8n.io) and sign up (free tier works!)
2. You'll be taken to your workspace

---

## Step 3: Import the Workflow (1 minute)

1. In n8n, click **"Workflows"** → **"New Workflow"**
2. Click the **three dots (⋮)** menu → **"Import from File"**
3. Select the file: `n8n-workflow-achievement-reminder.json`
4. Click **"Import"**

---

## Step 4: Update the URL (30 seconds)

1. Click on the **"Check Achievements"** node
2. In the **"URL"** field, replace `YOUR_BACKEND_URL_HERE` with:
   - **Local**: `http://localhost:4000/api/webhook/check-achievements`
   - **Production**: `https://your-backend-url.com/api/webhook/check-achievements`
3. Click **"Save"**

---

## Step 5: Test & Activate (1 minute)

1. Click **"Execute Workflow"** (play button ▶️)
2. Wait a few seconds
3. Click the **"Check Achievements"** node to see results
4. If you see `"success": true`, it's working!
5. Toggle **"Active"** switch ON (top right)

---

## ✅ Done!

Your workflow will now run every 5 minutes automatically!

---

## Need More Help?

- **Detailed guide**: See `N8N_BEGINNER_GUIDE.md`
- **Troubleshooting**: Check the beginner guide's troubleshooting section
- **Test endpoint**: Run `node test-webhook-endpoint.js` again

---

## What Happens Now?

Every 5 minutes:
1. n8n calls your backend
2. Your backend checks all users
3. Users without all achievements get a notification
4. You can see results in n8n execution logs

---

## Files You Have:

- ✅ `n8n-workflow-achievement-reminder.json` - Ready to import!
- ✅ `test-webhook-endpoint.js` - Test your backend first
- ✅ `N8N_BEGINNER_GUIDE.md` - Detailed step-by-step guide
- ✅ `N8N_WEBHOOK_SETUP.md` - Technical reference

