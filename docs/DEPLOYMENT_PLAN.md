# Deployment Plan - MoodyChimp Platform

This document serves as a reference plan for deploying the MoodyChimp platform. Use this as a checklist and reference guide.

## Overview

**Target Architecture:**
- Backend: Google Cloud Run (Containerized)
- Frontend: Vercel (Serverless)
- Database: PostgreSQL (Neon Cloud)
- File Storage: Cloudinary
- CI/CD: GitHub Actions (Optional)

---

## Phase 1: Pre-Deployment Preparation

### 1.1 Code Preparation
- [x] Create Dockerfile for backend
- [x] Create .dockerignore
- [x] Create vercel.json for frontend
- [x] Create API configuration helper (config.js)
- [ ] Update all hardcoded API URLs to use config helper
- [ ] Test local builds
- [ ] Verify all dependencies are in package.json

### 1.2 Environment Variables Audit
- [ ] List all required environment variables
- [ ] Document default values
- [ ] Create .env.example files
- [ ] Verify no secrets in code

### 1.3 Database Preparation
- [ ] Ensure production database is set up
- [ ] Run migrations if needed
- [ ] Test database connectivity
- [ ] Backup database schema

### 1.4 Third-Party Services
- [ ] Cloudinary account configured
- [ ] Cloudinary credentials ready
- [ ] Test Cloudinary upload functionality

---

## Phase 2: Backend Deployment (Google Cloud Run)

### 2.1 Google Cloud Setup
- [ ] Create/Select GCP project
- [ ] Enable billing
- [ ] Enable required APIs:
  - [ ] Cloud Run API
  - [ ] Cloud Build API
  - [ ] Container Registry API
- [ ] Install gcloud CLI locally
- [ ] Authenticate gcloud CLI

### 2.2 Container Configuration
- [x] Dockerfile created
- [x] .dockerignore created
- [ ] Test Docker build locally
- [ ] Verify container runs locally
- [ ] Test with production environment variables

### 2.3 Secret Management
- [ ] Create Secret Manager secrets:
  - [ ] database-url
  - [ ] cloudinary-url
- [ ] Or prepare environment variables for direct injection

### 2.4 Initial Deployment
- [ ] Build container image
- [ ] Push to Container Registry
- [ ] Deploy to Cloud Run
- [ ] Configure environment variables
- [ ] Set memory/CPU limits
- [ ] Configure scaling settings
- [ ] Enable public access (if needed)

### 2.5 Post-Deployment Verification
- [ ] Test /api/status endpoint
- [ ] Verify database connection
- [ ] Test API endpoints
- [ ] Check Cloud Run logs
- [ ] Verify CORS configuration
- [ ] Note backend URL for frontend config

---

## Phase 3: Frontend Deployment (Vercel)

### 3.1 Vercel Account Setup
- [ ] Create Vercel account
- [ ] Connect GitHub account
- [ ] Install Vercel CLI (optional)

### 3.2 Code Updates Required
- [ ] Update App.jsx API calls
- [ ] Update NotificationBell.jsx API calls
- [ ] Update OrderPage.jsx API calls
- [ ] Update AccountPage.jsx API calls
- [ ] Update AdminPanel.jsx API calls
- [ ] Update achievements.js API calls
- [ ] Update Sidebar.jsx API calls
- [ ] Update ReviewSection.jsx API calls
- [ ] Update Questionnaire.jsx API calls
- [ ] Update PasswordVerificationModal.jsx API calls
- [ ] Update OrderAIRecommendation.jsx API calls
- [ ] Update LoginModal.jsx API calls
- [ ] Update BananaGame.jsx API calls

**Alternative**: Create a global API utility that all components can use.

### 3.3 Vercel Project Configuration
- [ ] Import GitHub repository
- [ ] Configure root directory (if monorepo)
- [ ] Verify build settings
- [ ] Set environment variables:
  - [ ] VITE_API_BASE_URL (backend URL)

### 3.4 Deployment
- [ ] Initial deployment
- [ ] Verify build succeeds
- [ ] Check deployment logs
- [ ] Test deployed application

### 3.5 Post-Deployment Verification
- [ ] Frontend loads correctly
- [ ] API calls work (check browser console)
- [ ] Authentication flow works
- [ ] All pages accessible
- [ ] Images/assets load
- [ ] No CORS errors

---

## Phase 4: Integration Testing

### 4.1 End-to-End Testing
- [ ] User registration
- [ ] User login
- [ ] Service browsing
- [ ] Course enrollment
- [ ] File uploads (if applicable)
- [ ] Notifications
- [ ] Bookmarks
- [ ] Reviews

### 4.2 Performance Testing
- [ ] Page load times
- [ ] API response times
- [ ] Image loading
- [ ] Database query performance

### 4.3 Error Handling
- [ ] Network errors handled
- [ ] API errors displayed
- [ ] 404 pages
- [ ] Error logging

---

## Phase 5: CI/CD Setup (Optional)

### 5.1 GitHub Actions for Backend
- [ ] Create workflow file
- [ ] Set up GCP authentication
- [ ] Configure build trigger
- [ ] Test automatic deployment

### 5.2 Vercel Automatic Deployments
- [ ] Verify GitHub integration
- [ ] Test push-to-deploy
- [ ] Configure preview deployments
- [ ] Set up branch protection

---

## Phase 6: Monitoring and Maintenance

### 6.1 Monitoring Setup
- [ ] Cloud Run metrics dashboard
- [ ] Vercel analytics
- [ ] Error tracking (optional)
- [ ] Uptime monitoring

### 6.2 Logging
- [ ] Cloud Run logs accessible
- [ ] Vercel function logs accessible
- [ ] Error log aggregation
- [ ] Log retention policy

### 6.3 Alerts
- [ ] High error rate alerts
- [ ] Downtime alerts
- [ ] Performance degradation alerts
- [ ] Cost alerts

---

## Phase 7: Documentation

### 7.1 Deployment Documentation
- [x] Create DEPLOYMENT.md
- [x] Create DEPLOYMENT_PLAN.md
- [ ] Document environment variables
- [ ] Create troubleshooting guide
- [ ] Document rollback procedures

### 7.2 Runbooks
- [ ] How to update backend
- [ ] How to update frontend
- [ ] How to rollback
- [ ] How to update environment variables
- [ ] How to view logs
- [ ] How to debug issues

---

## Phase 8: Security Hardening

### 8.1 Backend Security
- [ ] Environment variables secured
- [ ] Database credentials secured
- [ ] API rate limiting (if needed)
- [ ] Input validation
- [ ] SQL injection prevention verified

### 8.2 Frontend Security
- [ ] No secrets in frontend code
- [ ] HTTPS enforced
- [ ] Content Security Policy (if needed)
- [ ] XSS prevention verified

### 8.3 Infrastructure Security
- [ ] Cloud Run IAM configured
- [ ] Vercel project access controlled
- [ ] GitHub repository access controlled
- [ ] Secrets rotation plan

---

## Phase 9: Cost Optimization

### 9.1 Cloud Run Optimization
- [ ] Set min-instances to 0
- [ ] Configure appropriate memory/CPU
- [ ] Monitor usage
- [ ] Set budget alerts

### 9.2 Vercel Optimization
- [ ] Optimize bundle size
- [ ] Enable caching
- [ ] Monitor bandwidth
- [ ] Use appropriate plan

---

## Phase 10: Go-Live Checklist

### Final Pre-Launch
- [ ] All tests passing
- [ ] All environment variables set
- [ ] Database backed up
- [ ] Monitoring active
- [ ] Error tracking active
- [ ] Documentation complete
- [ ] Team trained on deployment process

### Launch Day
- [ ] Deploy backend
- [ ] Verify backend health
- [ ] Deploy frontend
- [ ] Verify frontend health
- [ ] Run smoke tests
- [ ] Monitor for issues
- [ ] Announce launch

### Post-Launch
- [ ] Monitor for 24 hours
- [ ] Collect user feedback
- [ ] Address any issues
- [ ] Document lessons learned

---

## Rollback Procedures

### Backend Rollback
```bash
# List revisions
gcloud run revisions list --service moodychimp-backend --region us-central1

# Rollback to previous revision
gcloud run services update-traffic moodychimp-backend \
  --to-revisions REVISION_NAME=100 \
  --region us-central1
```

### Frontend Rollback
- Go to Vercel dashboard
- Select previous deployment
- Click "Promote to Production"

---

## Emergency Contacts

- **GCP Support**: [Add contact]
- **Vercel Support**: [Add contact]
- **Database Support**: [Add contact]
- **On-Call Engineer**: [Add contact]

---

## Notes and Considerations

### Known Issues
- Frontend has hardcoded localhost URLs - needs update before production
- Consider implementing API client library for better maintainability

### Future Improvements
- Implement API versioning
- Add comprehensive error tracking (Sentry, etc.)
- Set up automated testing in CI/CD
- Implement feature flags
- Add performance monitoring (New Relic, etc.)

---

**Document Version**: 1.0
**Last Updated**: 2025-01-XX
**Next Review**: [Set date]

