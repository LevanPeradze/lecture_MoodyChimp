# Fix: Setting Google Cloud Project ID

## The Problem

You tried:
```bash
gcloud config set project MoodyChimp Production
```

This doesn't work because:
1. Project names can have spaces, but project IDs cannot
2. The command expects a **project ID**, not a project name
3. Project IDs look like: `moodychimp-production-123456` (lowercase, with hyphens)

## Solution: Find Your Project ID

### Method 1: From Google Cloud Console (Easiest)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Look at the top bar - you'll see your project name
3. Click on it - a dropdown will show your **Project ID** (the one without spaces)
4. Copy that Project ID

### Method 2: Using gcloud Command

If you have gcloud installed, run:
```bash
gcloud projects list
```

This will show you all your projects with their IDs. Look for the one you want to use.

### Method 3: Create a New Project with Specific ID

If you haven't created a project yet, create one with a specific ID:

```bash
gcloud projects create moodychimp-production --name="MoodyChimp Production"
```

This creates:
- **Project ID**: `moodychimp-production` (what you use in commands)
- **Project Name**: "MoodyChimp Production" (display name)

## Then Set the Project

Once you have your Project ID, use it like this:

```bash
gcloud config set project moodychimp-production
```

**Note**: No quotes needed, and use the exact Project ID (usually lowercase with hyphens).

## Verify It Worked

Check your current project:
```bash
gcloud config get-value project
```

This should show your Project ID.

## Common Project ID Format

Project IDs typically look like:
- `moodychimp-production`
- `moodychimp-123456`
- `my-project-abc123`

They are:
- ✅ Lowercase
- ✅ Use hyphens (not spaces)
- ✅ Can have numbers
- ❌ Cannot have spaces
- ❌ Cannot have uppercase (usually)

## If You Don't Have a Project Yet

Create one:

```bash
# Create project with specific ID
gcloud projects create moodychimp-production --name="MoodyChimp Production"

# Set it as active
gcloud config set project moodychimp-production
```

## Next Steps

After setting your project, continue with:
1. Enable required APIs
2. Build and deploy your backend

See `BEGINNER_DEPLOYMENT_GUIDE.md` for the full process.

