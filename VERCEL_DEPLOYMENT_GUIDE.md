# Vercel Deployment Guide for Smart Bus System

## Overview
This guide walks through deploying your Smart Bus System backend to Vercel.

## ✅ Changes Made for Vercel Compatibility

### 1. **vercel.json** (NEW)
- Configured Vercel to build and deploy your Node.js app
- All routes redirect to `server.js` (serverless function)
- Sets production environment

### 2. **server.js** (UPDATED)
- Added `PORT` listener for local and production
- Exports Express app for Vercel serverless functions
- Health check endpoint at `/api/health`
- Improved CORS with Vercel URL support

### 3. **config/db.js** (UPDATED)
- Added connection pooling settings
  - `connectionLimit: 5` - Vercel's free tier limitation
  - `enableKeepAlive: true` - Prevents connection drops
  - Connection timeout handling
- Initial connection test on startup

### 4. **.env.example** (NEW)
- Template for environment variables
- Copy this to `.env` for local development

### 5. **Controllers** (IMPROVED)
All controllers now have:
- Input validation
- Better error handling with console logs
- Consistent response format
- Timeout handling for external APIs

---

## 🚀 Deployment Steps

### Step 1: Prepare Your Repository
```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Set Up Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Import your `kdrudy17/smart_bus_db` repository

### Step 3: Configure Environment Variables
In Vercel Dashboard → Settings → Environment Variables, add:

```
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
JWT_SECRET=your_secure_secret_key
MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com
MOMO_CONSUMER_KEY=your_key
MOMO_API_USER=your_user
MOMO_API_PASSWORD=your_password
NODE_ENV=production
```

⚠️ **Important**: Never commit `.env` file with real credentials!

### Step 4: Deploy
1. Click "Deploy" in Vercel Dashboard
2. Wait for build to complete
3. Your API will be live at: `https://your-project.vercel.app`

### Step 5: Test Deployment
```bash
# Test health check
curl https://your-project.vercel.app/api/health

# Test API endpoints
curl -X POST https://your-project.vercel.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"123456"}'
```

---

## 📋 API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | User login |
| GET | `/formulas` | Get all bus formulas |
| POST | `/formulas` | Create new formula (admin) |
| POST | `/tickets/buy` | Purchase a ticket |
| GET | `/tickets/my` | Get user's tickets |
| POST | `/scan` | Verify/scan QR code |
| POST | `/payments/pay` | Process payment |
| GET | `/api/health` | Health check |

---

## ⚠️ Known Limitations & Solutions

### 1. **Cold Starts**
- Vercel serverless functions have cold start delays (2-3 seconds first request)
- **Solution**: Health check endpoint helps keep service warm

### 2. **Database Connection Limits**
- Free tier: 5 concurrent connections
- **Solution**: Connection pooling configured in `config/db.js`

### 3. **Request Timeout**
- Vercel limits requests to 60 seconds
- **Solution**: External API calls have 10-second timeouts

### 4. **Memory Limits**
- 1GB total memory per serverless function
- **Solution**: Optimized pooling and response handling

---

## 🔧 Local Development

### Install Dependencies
```bash
npm install
```

### Create .env File
```bash
cp .env.example .env
# Edit .env with your local database credentials
```

### Run Locally
```bash
npm start
# Server runs on http://localhost:3000
```

---

## 📊 Monitoring & Debugging

### View Logs in Vercel
1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments" → Latest → "Logs"

### Check Health Status
```bash
curl https://your-project.vercel.app/api/health
# Response: {"status":"ok"}
```

### Database Connection Issues
If getting database errors:
1. Verify all env vars are correct
2. Check database is accessible from Vercel IP
3. Review connection pool settings in `config/db.js`

---

## 🔒 Security Best Practices

✅ **DO:**
- Use strong `JWT_SECRET` (32+ characters)
- Keep `.env` file in `.gitignore`
- Use HTTPS only (Vercel default)
- Validate all inputs in controllers
- Use environment variables for secrets

❌ **DON'T:**
- Commit credentials to GitHub
- Use weak JWT secrets
- Log sensitive data
- Expose database details in errors

---

## 🐛 Troubleshooting

### "Database connection failed"
- Check `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` env vars
- Ensure database allows connections from Vercel's IPs
- Test connection locally first

### "JWT_SECRET not found"
- Add `JWT_SECRET` to Vercel environment variables
- Restart deployment after adding

### "CORS errors"
- Verify frontend URL is in `allowedOrigins` in `server.js`
- For Netlify: `https://bus-istama.netlify.app`
- Add your Vercel URL: `https://[your-project].vercel.app`

### "Payment API timeouts"
- MoMo API is in sandbox - may be slow
- Check `MOMO_CONSUMER_KEY` and credentials
- Payment status defaults to "PENDING" if check fails

---

## 📞 Support & Resources

- [Vercel Docs](https://vercel.com/docs)
- [Node.js Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Last Updated**: 2026-03-19 09:32:44  
**Status**: Ready for Production ✅