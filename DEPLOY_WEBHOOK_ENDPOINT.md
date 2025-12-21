# 🚀 Deploy the Webhook Endpoint to Google Cloud

Your webhook endpoint exists in the code but needs to be deployed to Google Cloud Run.

## Quick Deploy (Choose One Method)

### Method 1: Automatic Deploy via Git (Easiest - If you have GitHub Actions set up)

1. **Commit and push your changes:**
   ```bash
   git add backend/src/server.js
   git commit -m "Add achievement reminder webhook endpoint"
   git push origin main
   ```

2. **Wait for GitHub Actions to deploy** (check Actions tab in GitHub)
   - This will automatically build and deploy to Cloud Run
   - Takes about 5-10 minutes

3. **Test the endpoint:**
   ```bash
   node test-webhook-endpoint.js https://moodychimp-backend-929404577886.us-central1.run.app
   ```

### Method 2: Manual Deploy via Google Cloud Console

1. **Open Google Cloud Shell** (or use your local terminal with gcloud installed)

2. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

3. **Build the container:**
   ```bash
   gcloud builds submit --tag gcr.io/929404577886/moodychimp-backend
   ```
   ⏱️ This takes 5-10 minutes

4. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy moodychimp-backend \
     --image gcr.io/929404577886/moodychimp-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --memory 512Mi \
     --cpu 1
   ```

5. **Test the endpoint:**
   ```bash
   node test-webhook-endpoint.js https://moodychimp-backend-929404577886.us-central1.run.app
   ```

### Method 3: Deploy via Cloud Build (If you have triggers set up)

1. **Trigger a build** from Cloud Build console
2. Or push to your repository if triggers are configured

---

## Verify Deployment

After deploying, test these URLs:

### 1. Root URL (should work now):
```
https://moodychimp-backend-929404577886.us-central1.run.app/
```
Should return: `{"ok": true, "message": "MoodyChimp Backend API", ...}`

### 2. Status Endpoint:
```
https://moodychimp-backend-929404577886.us-central1.run.app/api/status
```
Should return: `{"ok": true, ...}`

### 3. Webhook Endpoint (the important one):
```bash
node test-webhook-endpoint.js https://moodychimp-backend-929404577886.us-central1.run.app
```
Should return: `{"success": true, "message": "Achievement check completed", ...}`

---

## Troubleshooting

### If deployment fails:

1. **Check Cloud Build logs:**
   - Go to Cloud Build > History
   - Click on the failed build to see errors

2. **Check Cloud Run logs:**
   - Go to Cloud Run > moodychimp-backend > Logs
   - Look for errors

3. **Verify environment variables:**
   - Make sure `DATABASE_URL` and `CLOUDINARY_URL` are set in Cloud Run

### If endpoint still returns 404:

1. **Wait a few minutes** - deployment can take time to propagate
2. **Check the deployed code:**
   - Verify `server.js` has the webhook endpoint
   - Check Cloud Run logs for startup errors
3. **Redeploy** if needed

---

## After Successful Deployment

Once the endpoint works:

1. ✅ Test it: `node test-webhook-endpoint.js https://moodychimp-backend-929404577886.us-central1.run.app`
2. ✅ Set up n8n workflow (see `N8N_QUICK_START.md`)
3. ✅ Use this URL in n8n: `https://moodychimp-backend-929404577886.us-central1.run.app/api/webhook/check-achievements`

---

## Quick Reference

**Your Backend URL:**
```
https://moodychimp-backend-929404577886.us-central1.run.app
```

**Webhook Endpoint:**
```
https://moodychimp-backend-929404577886.us-central1.run.app/api/webhook/check-achievements
```

**Project ID:** `929404577886`

**Region:** `us-central1`

