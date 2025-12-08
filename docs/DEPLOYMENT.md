# Deployment Guide - MoodyChimp Platform

This document provides comprehensive instructions for deploying the MoodyChimp platform to production.

## Architecture Overview

- **Backend**: Google Cloud Run (Containerized Node.js/Express API)
- **Frontend**: Vercel (React/Vite SPA)
- **Database**: PostgreSQL (Neon Cloud)
- **File Storage**: Cloudinary
- **Source Control**: GitHub

## Prerequisites

1. **Google Cloud Platform Account**
   - Active GCP project
   - Billing enabled
   - Cloud Run API enabled
   - Container Registry API enabled
   - Cloud Build API enabled

2. **Vercel Account**
   - GitHub account connected
   - Vercel CLI (optional, for local testing)

3. **GitHub Repository**
   - Repository connected to your local project
   - Push access configured

4. **Environment Variables**
   - Database connection string (PostgreSQL/Neon)
   - Cloudinary credentials
   - API URLs for production

---

## Part 1: Backend Deployment (Google Cloud Run)

### Step 1: Prepare Google Cloud Project

1. **Create/Select GCP Project**
   ```bash
   gcloud projects create moodychimp-production --name="MoodyChimp Production"
   gcloud config set project moodychimp-production
   ```

2. **Enable Required APIs**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

3. **Set Default Region**
   ```bash
   gcloud config set run/region us-central1
   ```

### Step 2: Configure Environment Variables

1. **Create Secret Manager Secrets (Recommended)**
   ```bash
   # Database URL
   echo -n "your-postgresql-connection-string" | gcloud secrets create database-url --data-file=-
   
   # Cloudinary URL
   echo -n "your-cloudinary-url" | gcloud secrets create cloudinary-url --data-file=-
   ```

2. **Or Set Environment Variables Directly in Cloud Run** (See Step 4)

### Step 3: Build and Deploy Container

#### Option A: Using Cloud Build (Recommended for CI/CD)

1. **Connect GitHub Repository to Cloud Build**
   - Go to Cloud Build > Triggers
   - Click "Create Trigger"
   - Connect your GitHub repository
   - Set trigger configuration:
     - Name: `moodychimp-backend-deploy`
     - Event: Push to branch `main`
     - Configuration: Cloud Build configuration file
     - Location: `backend/cloudbuild.yaml`

2. **Manual Build and Deploy**
   ```bash
   cd backend
   
   # Build the container
   gcloud builds submit --tag gcr.io/PROJECT_ID/moodychimp-backend
   
   # Deploy to Cloud Run
   gcloud run deploy moodychimp-backend \
     --image gcr.io/PROJECT_ID/moodychimp-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars DATABASE_URL="$(gcloud secrets versions access latest --secret=database-url)" \
     --set-env-vars CLOUDINARY_URL="$(gcloud secrets versions access latest --secret=cloudinary-url)" \
     --set-env-vars PORT=8080 \
     --memory 512Mi \
     --cpu 1 \
     --min-instances 0 \
     --max-instances 10
   ```

#### Option B: Using Docker Locally

1. **Build Docker Image**
   ```bash
   cd backend
   docker build -t moodychimp-backend .
   ```

2. **Tag and Push to GCR**
   ```bash
   docker tag moodychimp-backend gcr.io/PROJECT_ID/moodychimp-backend
   docker push gcr.io/PROJECT_ID/moodychimp-backend
   ```

3. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy moodychimp-backend \
     --image gcr.io/PROJECT_ID/moodychimp-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

### Step 4: Configure Cloud Run Service

1. **Set Environment Variables in Cloud Console**
   - Go to Cloud Run > moodychimp-backend > Edit & Deploy New Revision
   - Under "Variables & Secrets", add:
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `CLOUDINARY_URL`: Your Cloudinary URL
     - `PORT`: `8080` (Cloud Run sets this automatically, but good to have)

2. **Configure CORS**
   - The backend already has CORS enabled
   - Update CORS settings if needed to allow your Vercel domain

3. **Get Backend URL**
   - After deployment, note the service URL (e.g., `https://moodychimp-backend-xxxxx-uc.a.run.app`)
   - This will be used as `VITE_API_BASE_URL` in frontend

### Step 5: Test Backend Deployment

```bash
# Test health endpoint
curl https://YOUR-BACKEND-URL/api/status

# Should return: {"status":"ok","message":"Server is running"}
```

---

## Part 2: Frontend Deployment (Vercel)

### Step 1: Connect GitHub Repository to Vercel

1. **Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub

2. **Import Project**
   - Click "Add New Project"
   - Select your GitHub repository
   - Vercel will auto-detect it's a Vite project

### Step 2: Configure Build Settings

Vercel should auto-detect these from `vercel.json`, but verify:

- **Framework Preset**: Vite
- **Root Directory**: `frontend` (if repo is monorepo) or leave blank if frontend is root
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Set Environment Variables

In Vercel project settings, add:

1. **API Base URL**
   - Key: `VITE_API_BASE_URL`
   - Value: Your Cloud Run backend URL (e.g., `https://moodychimp-backend-xxxxx-uc.a.run.app`)
   - Environment: Production, Preview, Development

2. **Other Environment Variables** (if needed)
   - Add any other frontend-specific environment variables

### Step 4: Update Frontend Code for Production API

**Important**: The frontend code currently has hardcoded `localhost:4000` URLs. You have two options:

#### Option A: Use the Config Helper (Recommended)

Update all API calls to use the `config.js` helper:

```javascript
// Before
fetch('http://localhost:4000/api/services')

// After
import { getApiUrl } from './config';
fetch(getApiUrl('api/services'))
```

Files that need updating:
- `frontend/src/App.jsx`
- `frontend/src/NotificationBell.jsx`
- `frontend/src/OrderPage.jsx`
- `frontend/src/AccountPage.jsx`
- `frontend/src/AdminPanel.jsx`
- `frontend/src/achievements.js`
- `frontend/src/Sidebar.jsx`
- `frontend/src/ReviewSection.jsx`
- `frontend/src/Questionnaire.jsx`
- `frontend/src/PasswordVerificationModal.jsx`
- `frontend/src/OrderAIRecommendation.jsx`
- `frontend/src/LoginModal.jsx`
- `frontend/src/BananaGame.jsx`

#### Option B: Use Environment Variable Directly

Replace hardcoded URLs with:
```javascript
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
fetch(`${API_URL}/api/services`)
```

### Step 5: Deploy

1. **Automatic Deployment**
   - Push to `main` branch triggers automatic deployment
   - Vercel will build and deploy automatically

2. **Manual Deployment**
   ```bash
   cd frontend
   npm install -g vercel
   vercel --prod
   ```

### Step 6: Verify Deployment

1. Visit your Vercel deployment URL
2. Check browser console for API errors
3. Test authentication flow
4. Test API connectivity

---

## Part 3: GitHub Integration

### Setting Up GitHub Actions (Optional)

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to Cloud Run

on:
  push:
    branches:
      - main
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - id: 'auth'
        uses: 'google-github-actions/auth@v1'
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: 'Set up Cloud SDK'
        uses: 'google-github-actions/setup-gcloud@v1'
      
      - name: 'Build and Deploy'
        run: |
          cd backend
          gcloud builds submit --tag gcr.io/${{ secrets.GCP_PROJECT_ID }}/moodychimp-backend
          gcloud run deploy moodychimp-backend \
            --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/moodychimp-backend \
            --platform managed \
            --region us-central1 \
            --allow-unauthenticated
```

**Required GitHub Secrets:**
- `GCP_SA_KEY`: Service account JSON key
- `GCP_PROJECT_ID`: Your GCP project ID

---

## Part 4: Environment Variables Reference

### Backend Environment Variables (Cloud Run)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `CLOUDINARY_URL` | Cloudinary connection URL | `cloudinary://key:secret@cloud_name` |
| `PORT` | Server port (Cloud Run sets this) | `8080` |

### Frontend Environment Variables (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `https://moodychimp-backend-xxxxx-uc.a.run.app` |

---

## Part 5: Post-Deployment Checklist

### Backend
- [ ] Backend URL is accessible
- [ ] `/api/status` endpoint returns success
- [ ] Database connection working
- [ ] Cloudinary integration working
- [ ] CORS configured for frontend domain
- [ ] Environment variables set correctly

### Frontend
- [ ] Frontend deployed successfully
- [ ] Environment variables configured
- [ ] API calls use production URL (not localhost)
- [ ] Authentication flow works
- [ ] All API endpoints accessible
- [ ] Images and assets loading correctly

### Integration
- [ ] Frontend can communicate with backend
- [ ] CORS errors resolved
- [ ] HTTPS working for both services
- [ ] Error handling works in production

---

## Part 6: Monitoring and Maintenance

### Google Cloud Run

1. **View Logs**
   ```bash
   gcloud run services logs read moodychimp-backend --region us-central1
   ```

2. **Monitor Metrics**
   - Go to Cloud Run > moodychimp-backend > Metrics
   - Monitor: Request count, Latency, Error rate

3. **Set Up Alerts**
   - Create alerting policies for error rates
   - Set up budget alerts

### Vercel

1. **View Logs**
   - Go to project > Deployments > Click deployment > View Function Logs

2. **Monitor Analytics**
   - Enable Vercel Analytics
   - Monitor page views, performance

---

## Part 7: Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS allows Vercel domain
   - Check `Access-Control-Allow-Origin` headers

2. **Environment Variables Not Working**
   - Vite requires `VITE_` prefix for env vars
   - Rebuild after changing env vars

3. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check database firewall rules
   - Ensure database allows Cloud Run IPs

4. **Build Failures**
   - Check build logs in Vercel/Cloud Build
   - Verify all dependencies in package.json
   - Check Node.js version compatibility

---

## Part 8: Cost Optimization

### Google Cloud Run
- Use min-instances: 0 (scale to zero)
- Set appropriate memory/CPU limits
- Monitor usage and adjust as needed

### Vercel
- Free tier available for personal projects
- Monitor bandwidth usage
- Optimize bundle size

---

## Part 9: Security Best Practices

1. **Never commit secrets**
   - Use environment variables
   - Use Secret Manager for sensitive data

2. **Enable HTTPS**
   - Both Cloud Run and Vercel provide HTTPS by default

3. **Database Security**
   - Use connection pooling
   - Enable SSL for database connections
   - Restrict database access

4. **API Security**
   - Implement rate limiting
   - Add authentication middleware
   - Validate all inputs

---

## Quick Reference Commands

### Backend
```bash
# Build and deploy
cd backend
gcloud builds submit --tag gcr.io/PROJECT_ID/moodychimp-backend
gcloud run deploy moodychimp-backend --image gcr.io/PROJECT_ID/moodychimp-backend

# View logs
gcloud run services logs read moodychimp-backend

# Update environment variables
gcloud run services update moodychimp-backend --update-env-vars KEY=VALUE
```

### Frontend
```bash
# Deploy to Vercel
cd frontend
vercel --prod

# Preview deployment
vercel
```

---

## Support and Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html)

---

**Last Updated**: 2025-01-XX
**Maintained By**: Development Team

