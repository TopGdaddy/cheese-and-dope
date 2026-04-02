---
description: Full deployment workflow for UrbanLogicx app
---

# Deploy UrbanLogicx Full Application

Complete deployment workflow covering both Railway backend and Netlify frontend.

## Overview

- **Backend**: Python FastAPI + Socket.IO on Railway
- **Frontend**: React 19 on Netlify
- **Database**: MongoDB (MongoDB Atlas or Railway Add-on)

## Prerequisites

- Railway CLI (optional) or Railway Dashboard access
- Netlify CLI (optional) or Netlify Dashboard access
- MongoDB instance URL

## Part 1: Deploy Backend to Railway

### Step 1: Verify Backend Files
Ensure these files exist in `backend/`:
- `Dockerfile` (Python 3.11 slim)
- `runtime.txt` with `python-3.11.9`
- `requirements.txt` (all dependencies)
- `server.py` (configured for production)

### Step 2: Configure Railway Environment Variables

Required variables:
```
MONGO_URL=mongodb+srv://username:password@host/database
DB_NAME=your_database_name
JWT_SECRET=your_random_secret_key
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_admin_password
FRONTEND_URL=https://your-netlify-site.netlify.app
```

### Step 3: Deploy Backend

**Option A: Railway CLI**
```bash
cd backend
railway login
railway link
railway up
```

**Option B: Railway Dashboard**
1. Go to https://railway.app/dashboard
2. Create new project or select existing
3. Deploy from GitHub repo or upload code
4. Railway auto-detects Dockerfile

### Step 4: Verify Backend

Test these endpoints:
```
GET https://<backend-url>/api/health
POST https://<backend-url>/api/auth/login
```

Check logs in Railway dashboard for any startup errors.

## Part 2: Deploy Frontend to Netlify

### Step 1: Verify Frontend Configuration

Required files:
- `frontend/.nvmrc` with `20`
- `frontend/netlify.toml` with build settings
- `frontend/package.json` with Node engine `>=20.0.0`

### Step 2: Configure Netlify Environment Variables

In Netlify dashboard, set:
```
REACT_APP_BACKEND_URL=https://your-railway-backend.railway.app
NODE_VERSION=20
```

### Step 3: Deploy Frontend

**Option A: Git Integration (Recommended)**
1. Push code to GitHub
2. Connect repo in Netlify dashboard
3. Build settings auto-detected from netlify.toml
4. Deploy happens automatically on push

**Option B: Netlify CLI**
```bash
cd frontend
netlify login
netlify link
netlify deploy --prod
```

### Step 4: Verify Frontend

- Check build completes without errors
- Verify site loads at Netlify URL
- Test login flow
- Confirm CORS working (check browser console)

## Troubleshooting

### Backend Issues

| Issue | Solution |
|-------|----------|
| 502 errors | Check PORT env var, verify Dockerfile |
| MongoDB connection fail | Verify MONGO_URL format |
| CORS errors | Add Netlify domain to allowed_origins |
| Auth not working | Check JWT_SECRET, cookie settings |

### Frontend Issues

| Issue | Solution |
|-------|----------|
| Build fails | Check `--legacy-peer-deps` in build command |
| React version errors | Verify Node 20, React 19 compatibility |
| API calls fail | Check REACT_APP_BACKEND_URL |
| CORS errors | Backend must include Netlify origin |

## Post-Deployment Checklist

### Backend Verification
- [ ] Health endpoint responds
- [ ] MongoDB connected
- [ ] Auth endpoints work
- [ ] CORS headers present
- [ ] Socket.IO connects

### Frontend Verification
- [ ] Site loads without errors
- [ ] Login/Register works
- [ ] Auth cookies set correctly
- [ ] API calls succeed
- [ ] Real-time tracking works
- [ ] All dashboard features functional

## Important Notes

1. **CORS**: Backend must include exact Netlify URL in allowed_origins
2. **Cookies**: For cross-site auth, cookies need `secure=true, samesite=none`
3. **Node Version**: Must use Node 20 for React 19 compatibility
4. **Build Command**: Must include `--legacy-peer-deps` for peer dependency issues

## Rollback

If deployment fails:
1. Check Railway/Netlify logs
2. Revert to previous working commit
3. Re-deploy
4. Contact support if platform issues persist
