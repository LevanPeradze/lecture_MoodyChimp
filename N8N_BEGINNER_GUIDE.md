# n8n Beginner's Guide: Setting Up Achievement Reminders

This is a **step-by-step guide for complete beginners**. Follow each step carefully.

## 📋 What You'll Need

1. Your backend server URL (we'll help you find this)
2. An n8n account (free tier works fine)
3. About 10-15 minutes

---

## 🚀 Quick Start (3 Steps!)

**Want the fastest setup?**
1. **Test your endpoint first**: Run `node test-webhook-endpoint.js` (see Part 1.5 below)
2. **Import the workflow**: Use the file `n8n-workflow-achievement-reminder.json` (see Part 3)
3. **Update the URL**: Replace `YOUR_BACKEND_URL_HERE` with your actual backend URL
4. **Activate**: Toggle the "Active" switch

That's it! The detailed steps below are for understanding or troubleshooting.

---

## Part 1: Find Your Backend URL

### Option A: If Your Backend is Running Locally (Development)

If you're testing on your computer:
- **Backend URL**: `http://localhost:4000`
- **Full Webhook URL**: `http://localhost:4000/api/webhook/check-achievements`

⚠️ **Important**: For localhost to work, n8n must be running on the same computer, OR you need to use a service like ngrok to expose your local server.

### Option B: If Your Backend is Deployed (Production)

If your backend is deployed (e.g., on Google Cloud Run, Heroku, etc.):
- Find your backend URL (it looks like: `https://your-backend-name.region.run.app` or similar)
- **Full Webhook URL**: `https://your-backend-url.com/api/webhook/check-achievements`

**How to find it:**
1. Check your deployment platform dashboard
2. Look for "Service URL" or "App URL"
3. Copy that URL

### Part 1.5: Test Your Endpoint First (Recommended!)

**Before setting up n8n, test that your backend endpoint works:**

1. Make sure your backend server is running:
   ```bash
   cd backend
   npm run dev
   ```

2. In a new terminal, run the test script:
   ```bash
   node test-webhook-endpoint.js
   ```

3. If you see `✅ Success!`, your endpoint is working and ready for n8n!

4. If you see an error, fix it before continuing with n8n setup.

**For production backend:**
```bash
node test-webhook-endpoint.js https://your-backend-url.com
```

---

## Part 2: Set Up n8n Account

### Step 1: Sign Up for n8n

1. Go to [n8n.io](https://n8n.io)
2. Click **"Get Started"** or **"Sign Up"**
3. Choose one of these options:
   - **n8n Cloud** (easiest, free tier available) - Recommended for beginners
   - **Self-hosted** (if you want to run it yourself)

### Step 2: Access Your n8n Workspace

1. After signing up, you'll be taken to your n8n workspace
2. You should see a dashboard with workflows

---

## Part 3: Create the Workflow (EASY METHOD - Import Ready-Made Workflow)

### 🎯 EASIEST WAY: Import the Pre-Made Workflow

I've created a ready-to-import workflow file for you! Here's how to use it:

#### Step 1: Get the Workflow File

1. Open the file `n8n-workflow-achievement-reminder.json` in this project
2. Copy ALL the text from that file (Ctrl+A, then Ctrl+C)

#### Step 2: Import into n8n

1. In n8n, click the **"Workflows"** menu (left sidebar)
2. Click the **"+"** button (top right) or **"New Workflow"**
3. Click the **three dots menu** (⋮) in the top right
4. Select **"Import from File"** or **"Import from URL"**
5. If "Import from File":
   - Click **"Choose File"**
   - Select `n8n-workflow-achievement-reminder.json`
6. If "Import from URL":
   - Paste the JSON content
7. Click **"Import"**

#### Step 3: Update the Backend URL

After importing, you need to update the URL:

1. Click on the **"Check Achievements"** node (the second box)
2. In the **"URL"** field, replace `YOUR_BACKEND_URL_HERE` with your actual backend URL:
   - For local: `http://localhost:4000/api/webhook/check-achievements`
   - For production: `https://your-backend-url.com/api/webhook/check-achievements`
3. Click **"Save"** (top right)

#### Step 4: Test the Workflow

1. Click the **"Execute Workflow"** button (top right, play icon ▶️)
2. Wait a few seconds
3. Click on the **"Check Achievements"** node to see the results
4. You should see a response like:
   ```json
   {
     "success": true,
     "message": "Achievement check completed",
     "results": {
       "totalUsers": 5,
       "notificationsSent": 2,
       ...
     }
   }
   ```

#### Step 5: Activate the Workflow

1. Toggle the **"Active"** switch in the top right (it should turn green/blue)
2. The workflow will now run automatically every 5 minutes!

---

## Part 4: Create the Workflow (MANUAL METHOD - Step by Step)

If you prefer to build it yourself, follow these steps:

### Step 1: Create New Workflow

1. In n8n, click **"Workflows"** in the left sidebar
2. Click **"New Workflow"** button (top right)
3. You'll see an empty workflow canvas

### Step 2: Add Schedule Trigger (Runs Every 5 Minutes)

1. Click the **"+"** button in the center (or top left)
2. In the search box, type: **"Schedule Trigger"**
3. Click on **"Schedule Trigger"** when it appears
4. The node will appear on the canvas

**Configure the Schedule:**
1. Click on the **"Schedule Trigger"** node
2. In the right panel, find **"Trigger Times"**
3. Click **"Add Time"**
4. Select **"Every X Minutes"**
5. Enter **5** in the minutes field
6. Click **"Save"** (top right)

### Step 3: Add HTTP Request Node (Calls Your Backend)

1. Click the **"+"** button again (or drag from the Schedule Trigger node)
2. Search for: **"HTTP Request"**
3. Click on **"HTTP Request"** node
4. Connect it to the Schedule Trigger (drag from Schedule Trigger to HTTP Request)

**Configure the HTTP Request:**
1. Click on the **"HTTP Request"** node
2. In the right panel:
   - **Method**: Select **"POST"** from dropdown
   - **URL**: Enter your backend URL:
     - Local: `http://localhost:4000/api/webhook/check-achievements`
     - Production: `https://your-backend-url.com/api/webhook/check-achievements`
   - **Authentication**: Leave as **"None"** (unless you set up WEBHOOK_SECRET)
3. Click **"Save"** (top right)

### Step 4: Test the Workflow

1. Click **"Execute Workflow"** button (top right, play icon ▶️)
2. Wait a few seconds
3. Click on the **"HTTP Request"** node
4. In the right panel, scroll down to see the **"Output"**
5. You should see a response with `"success": true`

### Step 5: Activate the Workflow

1. Toggle the **"Active"** switch in the top right
2. The workflow is now running automatically every 5 minutes!

---

## Part 5: Optional - Add Webhook Security (Recommended for Production)

If you want to secure your webhook (recommended for production):

### Step 1: Add Secret to Backend

1. Open your backend `.env` file
2. Add this line:
   ```
   WEBHOOK_SECRET=your-super-secret-random-string-here-12345
   ```
3. Save the file
4. Restart your backend server

### Step 2: Add Secret to n8n Workflow

1. In n8n, click on the **"HTTP Request"** node
2. In the right panel, scroll to **"Headers"**
3. Click **"Add Header"**
4. Enter:
   - **Name**: `X-Webhook-Secret`
   - **Value**: `your-super-secret-random-string-here-12345` (same as in .env)
5. Click **"Save"**

---

## Part 6: Verify It's Working

### Check 1: n8n Execution Logs

1. In n8n, go to **"Executions"** (left sidebar)
2. You should see executions every 5 minutes
3. Click on an execution to see details
4. Check if it shows `"success": true`

### Check 2: Backend Logs

1. Check your backend server console/terminal
2. You should see logs like:
   ```
   Achievement reminder sent to: user@example.com
   ```

### Check 3: Database Check

1. Check your `notifications` table in the database
2. Look for notifications with title "Achievement Reminder"
3. Check the `users` table - `last_achievement_reminder_sent` should have timestamps

---

## Troubleshooting

### Problem: "Connection refused" or "Cannot connect"

**Solution:**
- If using localhost: Make sure your backend is running (`npm run dev` in backend folder)
- If using localhost with n8n cloud: You need to use ngrok or deploy your backend
- Check the URL is correct (no typos)

### Problem: "401 Unauthorized"

**Solution:**
- You set up WEBHOOK_SECRET but didn't add it to n8n
- Add the header `X-Webhook-Secret` with the correct value
- OR remove WEBHOOK_SECRET from your .env file

### Problem: Workflow not running automatically

**Solution:**
- Make sure the workflow is **Active** (toggle switch in top right should be ON)
- Check the Schedule Trigger is set to "Every 5 minutes"
- Check n8n execution logs for errors

### Problem: No notifications being sent

**Solution:**
- Check if users actually have incomplete achievements
- Check if 5 minutes have passed since last reminder
- Check backend logs for errors
- Verify the endpoint works by testing manually (see below)

---

## Testing the Endpoint Manually

Before setting up n8n, test that your endpoint works:

### Using Browser (Easiest)

1. Install a browser extension like "REST Client" or use Postman
2. Make a POST request to: `http://localhost:4000/api/webhook/check-achievements`
3. You should get a JSON response

### Using Command Line (Windows PowerShell)

```powershell
Invoke-WebRequest -Uri "http://localhost:4000/api/webhook/check-achievements" -Method POST
```

### Using curl (if you have it)

```bash
curl -X POST http://localhost:4000/api/webhook/check-achievements
```

---

## Quick Reference

### Your Backend URL Format

- **Local Development**: `http://localhost:4000/api/webhook/check-achievements`
- **Production**: `https://your-backend-url.com/api/webhook/check-achievements`

### n8n Workflow Structure

```
Schedule Trigger (Every 5 min)
    ↓
HTTP Request (POST to your backend)
```

### What Happens Every 5 Minutes

1. n8n triggers the workflow
2. n8n sends a POST request to your backend
3. Your backend checks all users
4. Your backend sends notifications to users without all achievements
5. Your backend returns a summary to n8n

---

## Need Help?

If you get stuck:
1. Check the error message in n8n execution logs
2. Check your backend server logs
3. Verify your backend URL is correct
4. Make sure your backend server is running
5. Test the endpoint manually first

---

## Next Steps

Once it's working:
- Monitor the execution logs in n8n
- Check your database to see notifications being created
- Adjust the reminder interval if needed (change in both n8n and backend code)
- Consider adding error notifications (email/Slack) if the workflow fails

