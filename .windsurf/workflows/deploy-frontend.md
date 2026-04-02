---
description: Deploy frontend to Netlify
---

# Deploy Frontend to Netlify

This workflow deploys the React frontend to Netlify.

## Prerequisites

1. Netlify CLI installed and authenticated, OR
2. Netlify dashboard access with site connected to Git repository

## Deployment Steps

1. **Verify Frontend Configuration**
   - Ensure `frontend/.nvmrc` exists with `20` (alternative to netlify.toml for Node version)
   - Ensure `frontend/netlify.toml` exists with correct build settings
   - Ensure `frontend/package.json` has Node engine set to `>=20.0.0`
   - Ensure `REACT_APP_BACKEND_URL` is set in Netlify environment variables

2. **Check Build Command**
   - Verify `netlify.toml` has: `command = "npm install --legacy-peer-deps && npm run build"`
   - This handles React 19 peer dependency issues

3. **Deploy to Netlify**

   Option A: Deploy via Netlify CLI (if installed)
   ```bash
   cd frontend
   netlify login
   netlify link
   netlify deploy --prod
   ```

   Option B: Auto-deploy via Git (recommended)
   - Push to your connected Git repository (GitHub/GitLab)
   - Netlify automatically builds and deploys
   - Check deploy logs in Netlify dashboard

   Option C: Manual deploy via Netlify Dashboard
   - Go to https://app.netlify.com
   - Select your site
   - Click "Deploys" → "Trigger deploy"

4. **Verify Deployment**
   - Check that build completes without errors
   - Verify site loads at your Netlify URL
   - Test API calls to Railway backend
   - Confirm CORS is working (no browser console errors)

5. **Environment Variables**
   Ensure these are set in Netlify dashboard:
   - `REACT_APP_BACKEND_URL` = your Railway backend URL
   - `NODE_VERSION` = 20 (or set in netlify.toml)

## Troubleshooting

- If build fails with React version errors: Check `--legacy-peer-deps` flag is in build command
- If API calls fail: Verify `REACT_APP_BACKEND_URL` points to correct Railway URL
- If CORS errors: Check backend CORS origins include your Netlify domain
- If auth fails: Verify cookies are configured with `secure=true, samesite=none` in backend

## Post-Deployment

- Test login/logout flow
- Verify real-time tracking (Socket.IO) connects
- Check all dashboard features work correctly
