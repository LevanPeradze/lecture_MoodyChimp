# Environment Variables Reference

This document lists all environment variables required for the MoodyChimp platform.

## Backend Environment Variables

### Required Variables

#### `DATABASE_URL`
- **Description**: PostgreSQL connection string
- **Format**: `postgresql://username:password@host:port/database?sslmode=require`
- **Example**: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech:5432/moodychimp?sslmode=require`
- **Where to set**: Google Cloud Run (Secrets Manager or Environment Variables)
- **Source**: Neon Cloud or your PostgreSQL provider

#### `CLOUDINARY_URL`
- **Description**: Cloudinary connection URL for image uploads
- **Format**: `cloudinary://api_key:api_secret@cloud_name`
- **Example**: `cloudinary://942843772345576:cTIVy64rftIJhE5BNTlNRpRcVS4@dtewb8gij`
- **Where to set**: Google Cloud Run (Secrets Manager or Environment Variables)
- **Source**: Cloudinary dashboard

#### `PORT`
- **Description**: Server port (Cloud Run sets this automatically)
- **Default**: `8080` (Cloud Run default)
- **Where to set**: Google Cloud Run (optional, Cloud Run handles this)
- **Note**: Cloud Run automatically sets PORT to 8080, but you can explicitly set it

### Optional Variables

#### `NODE_ENV`
- **Description**: Node.js environment
- **Values**: `production`, `development`, `test`
- **Default**: `production` (in Dockerfile)
- **Where to set**: Google Cloud Run

---

## Frontend Environment Variables

### Required Variables

#### `VITE_API_BASE_URL`
- **Description**: Backend API base URL (without trailing slash)
- **Format**: Full URL without path
- **Development Example**: `http://localhost:4000`
- **Production Example**: `https://moodychimp-backend-xxxxx-uc.a.run.app`
- **Where to set**: Vercel project settings
- **Important**: Must start with `VITE_` prefix for Vite to expose it

---

## Setting Environment Variables

### Google Cloud Run

#### Method 1: Using Cloud Console
1. Go to Cloud Run > Your Service > Edit & Deploy New Revision
2. Under "Variables & Secrets", click "Add Variable"
3. Enter variable name and value
4. Click "Deploy"

#### Method 2: Using Secret Manager (Recommended for sensitive data)
```bash
# Create secret
echo -n "your-secret-value" | gcloud secrets create secret-name --data-file=-

# Use in Cloud Run
gcloud run services update SERVICE_NAME \
  --update-secrets SECRET_NAME=secret-name:latest
```

#### Method 3: Using gcloud CLI
```bash
gcloud run services update moodychimp-backend \
  --update-env-vars DATABASE_URL="your-db-url" \
  --update-env-vars CLOUDINARY_URL="your-cloudinary-url"
```

### Vercel

#### Method 1: Using Vercel Dashboard
1. Go to your project > Settings > Environment Variables
2. Add variable:
   - Key: `VITE_API_BASE_URL`
   - Value: Your backend URL
   - Environment: Production, Preview, Development (select all)
3. Save

#### Method 2: Using Vercel CLI
```bash
vercel env add VITE_API_BASE_URL production
# Enter value when prompted
```

#### Method 3: Using vercel.json (Not Recommended)
You can add environment variables in `vercel.json`, but it's better to use the dashboard for security.

---

## Environment Variable Templates

### Backend (.env file for local development)
```env
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
PORT=4000
NODE_ENV=development
```

### Frontend (.env file for local development)
```env
VITE_API_BASE_URL=http://localhost:4000
```

**Note**: Never commit `.env` files to git. They are already in `.gitignore`.

---

## Security Best Practices

1. **Never commit secrets to git**
   - Use `.gitignore` to exclude `.env` files
   - Use environment variables in production

2. **Use Secret Manager for sensitive data**
   - Google Cloud Secret Manager for backend
   - Vercel environment variables for frontend

3. **Rotate secrets regularly**
   - Update database passwords periodically
   - Regenerate API keys when compromised

4. **Limit access**
   - Only grant access to necessary team members
   - Use IAM roles appropriately

5. **Monitor secret usage**
   - Review who has access
   - Audit secret access logs

---

## Troubleshooting

### Backend: Environment variables not loading
- Verify variables are set in Cloud Run
- Check Cloud Run logs for errors
- Ensure variable names match exactly (case-sensitive)
- Restart the service after updating variables

### Frontend: Environment variables not working
- Vite requires `VITE_` prefix
- Rebuild after changing variables: `npm run build`
- Check browser console for undefined values
- Verify variables are set in Vercel dashboard

### Common Issues
- **Variable undefined**: Check spelling and prefix
- **Connection errors**: Verify URLs are correct
- **CORS errors**: Check backend CORS configuration allows frontend domain

---

## Quick Reference

### Backend (Cloud Run)
```bash
# View current environment variables
gcloud run services describe moodychimp-backend --region us-central1 --format="value(spec.template.spec.containers[0].env)"

# Update environment variable
gcloud run services update moodychimp-backend \
  --update-env-vars KEY=VALUE \
  --region us-central1
```

### Frontend (Vercel)
```bash
# List environment variables
vercel env ls

# Add environment variable
vercel env add VITE_API_BASE_URL
```

---

**Last Updated**: 2025-01-XX

