# Quick Start Deployment Guide

This is a condensed version of the deployment process. For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Prerequisites Checklist

- [ ] Google Cloud Platform account with billing enabled
- [ ] Vercel account (free tier works)
- [ ] GitHub repository connected
- [ ] PostgreSQL database (Neon Cloud recommended)
- [ ] Cloudinary account

---

## Backend Deployment (5 Steps)

### 1. Enable Google Cloud APIs
```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com
```

### 2. Build and Push Container
```bash
cd backend
gcloud builds submit --tag gcr.io/YOUR-PROJECT-ID/moodychimp-backend
```

### 3. Deploy to Cloud Run
```bash
gcloud run deploy moodychimp-backend \
  --image gcr.io/YOUR-PROJECT-ID/moodychimp-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="your-db-url" \
  --set-env-vars CLOUDINARY_URL="your-cloudinary-url"
```

### 4. Get Backend URL
```bash
gcloud run services describe moodychimp-backend --region us-central1 --format="value(status.url)"
```
**Save this URL** - you'll need it for frontend configuration.

### 5. Test Backend
```bash
curl https://YOUR-BACKEND-URL/api/status
```

---

## Frontend Deployment (4 Steps)

### 1. Update API URLs (IMPORTANT)

Before deploying, you need to update hardcoded `localhost:4000` URLs in the frontend code.

**Option A: Quick Fix** - Update `frontend/src/config.js` and replace all `http://localhost:4000` with your backend URL.

**Option B: Use Config Helper** - Update all fetch calls to use `getApiUrl()` from `config.js`.

Files to update:
- `App.jsx`
- `NotificationBell.jsx`
- `OrderPage.jsx`
- `AccountPage.jsx`
- `AdminPanel.jsx`
- And others (see DEPLOYMENT.md for full list)

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Vite

### 3. Set Environment Variable
In Vercel project settings:
- Key: `VITE_API_BASE_URL`
- Value: Your Cloud Run backend URL (from step 4 above)
- Environment: Production, Preview, Development

### 4. Deploy
- Push to `main` branch (auto-deploys)
- Or click "Deploy" in Vercel dashboard

---

## Post-Deployment

### Verify Everything Works
1. Visit your Vercel URL
2. Open browser console (F12)
3. Check for errors
4. Test login/registration
5. Test API calls

### Common Issues
- **CORS errors**: Update backend CORS to allow Vercel domain
- **API not found**: Verify `VITE_API_BASE_URL` is set correctly
- **Database errors**: Check `DATABASE_URL` in Cloud Run

---

## GitHub Actions (Optional)

If you want automatic deployments on push:

1. **Create Service Account in GCP**
   ```bash
   gcloud iam service-accounts create github-actions
   gcloud projects add-iam-policy-binding YOUR-PROJECT-ID \
     --member="serviceAccount:github-actions@YOUR-PROJECT-ID.iam.gserviceaccount.com" \
     --role="roles/run.admin"
   gcloud iam service-accounts keys create key.json \
     --iam-account=github-actions@YOUR-PROJECT-ID.iam.gserviceaccount.com
   ```

2. **Add GitHub Secrets**
   - Go to GitHub repo > Settings > Secrets
   - Add `GCP_SA_KEY`: Contents of `key.json`
   - Add `GCP_PROJECT_ID`: Your GCP project ID
   - Add `DATABASE_URL`: Your database URL
   - Add `CLOUDINARY_URL`: Your Cloudinary URL

3. **Workflow is already created**
   - File: `.github/workflows/deploy-backend.yml`
   - Pushes to `main` branch will auto-deploy backend

---

## Need Help?

- **Detailed Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Deployment Plan**: See [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md)
- **Environment Variables**: See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)

---

**Estimated Time**: 30-60 minutes for first deployment

