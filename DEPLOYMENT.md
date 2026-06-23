# MoneyMind v2.0 Deployment Guide

## Quick Start: Deploy Changes Now

Your latest commit includes CI/CD, testing infrastructure, and enhanced assets. To deploy:

```bash
# 1. Verify everything locally
pnpm typecheck    # TypeScript check
pnpm test -- --run  # Run 51 tests
pnpm build        # Production build

# 2. If all pass, push to GitHub
git push origin main

# 3. Vercel automatically deploys
# Monitor at: https://vercel.com/dashboard
```

**Deployment takes 2-3 minutes. Your app goes live automatically.**

---

## Production Checklist

### ✅ Pre-Deployment (COMPLETED)

- [x] React 18 + TypeScript + Vite
- [x] Dark theme with Tailwind CSS + Radix UI
- [x] Local data persistence (localStorage)
- [x] Automatic backup system (daily auto-backup)
- [x] Manual backup/restore functionality
- [x] Data export to Excel
- [x] Schema v2.0 (Transactions, Accounts, CreditCards, Loans)
- [x] GitHub Actions CI/CD (typecheck, build, tests)
- [x] Comprehensive test suite (51 tests)
- [x] Enhanced neon assets (wallet, profile icons)
- [x] Production build verified

### 🟡 Optional Features (READY FOR SETUP)

- [ ] Google Drive sync (requires OAuth configuration)
- [ ] Data migration from v1 to v2 (for existing users)

---

## Deployment Steps

### Step 1: Pre-Deployment Verification

```bash
# Install dependencies
pnpm install

# Run TypeScript check
pnpm typecheck

# Run test suite (51 tests)
pnpm test -- --run

# Build for production
pnpm build

# Test the production build locally
pnpm preview
```

**All must pass with no errors.**

---

### Step 2: Push to GitHub (Automatic Vercel Deployment)

```bash
# 1. Stage all changes
git add .

# 2. Commit with descriptive message
git commit -m "your descriptive commit message"

# 3. Push to main branch
git push origin main
```

**What happens automatically:**
1. GitHub receives the push
2. GitHub Actions CI runs (typecheck → build → tests)
3. All checks pass ✅
4. Vercel detects the push
5. Vercel builds and deploys automatically
6. Your app is live in 2-3 minutes

**Monitor progress:**
- GitHub Actions: Repository → Actions tab
- Vercel Dashboard: https://vercel.com/dashboard

---

### Step 3: Manual Vercel Deployment (Optional)

If you prefer manual deployment:

#### Using Vercel CLI

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login to Vercel account
vercel login

# Deploy to production
vercel --prod
```

#### Using Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select MoneyMind project
3. Click "Redeploy" on latest commit
4. Wait for deployment to complete

---

## Post-Deployment Verification

### 1. Check Deployment Status

```bash
# Via Vercel CLI
vercel status

# Or check dashboard: https://vercel.com/dashboard → Deployments
```

### 2. Test Live Application

Open your production URL and verify:

- ✅ All routes work: `/`, `/today`, `/assets`, `/cards`, `/loans`, `/others`
- ✅ Logo and profile icons display with neon glow
- ✅ Dark theme applied correctly
- ✅ Styling loads (emerald accents, smooth animations)
- ✅ Data persists in localStorage
- ✅ No console errors (F12 → Console)

### 3. Monitor Build Logs

```bash
# GitHub Actions - View CI logs
Repository → Actions → Latest workflow → View details

# Vercel - View build logs
Dashboard → Deployments → [Latest] → Logs
```

Check for:
- ✅ No TypeScript errors
- ✅ No build warnings
- ✅ Final bundle size reasonable
- ✅ All assets included (SVGs, fonts, CSS)

---

## Environment Variables (If Needed Later)
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set production environment variables
vercel env add VITE_GOOGLE_CLIENT_ID
vercel env add VITE_APP_ENV production
```

#### Option C: Manual Deployment
```bash
# Build
npm run build

# Deploy dist/ folder to your hosting
# Vercel automatically detects vercel.json for SPA routing
```

### 3. Environment Variables Setup

#### In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add the following:

| Variable | Value | Scope |
|----------|-------|-------|
| `VITE_GOOGLE_CLIENT_ID` | Your OAuth Client ID | Production |
| `VITE_APP_ENV` | `production` | Production |

**Note:** Keep `GOOGLE_OAUTH_CLIENT_SECRET` only on backend server, never expose to frontend.

---

## Google Drive Sync Setup (Optional)

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project: "MoneyMind"
3. Enable Google Drive API
   - Search for "Google Drive API"
   - Click Enable

### Step 2: Create OAuth 2.0 Credentials
1. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
2. Choose "Web application"
3. Add Authorized redirect URIs:
   - Local: `http://localhost:5173`
   - Production: `https://yourdomain.com`
   - Vercel preview: `https://*.vercel.app`

4. Copy Client ID → Set as `VITE_GOOGLE_CLIENT_ID`

### Step 3: Backend OAuth Handler (For Production)
For production, implement a backend endpoint to securely handle token exchange:

```typescript
// Example: API endpoint /api/auth/google/exchange-code
// POST /api/auth/google/exchange-code
// Body: { code: string }
// Returns: { accessToken, refreshToken, expiresIn }

export async function exchangeCodeForToken(code: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      redirect_uri: process.env.OAUTH_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  
  return response.json();
}
```

---

## Data Migration v1 → v2

If you have existing users on v1, implement migration:

```typescript
// In loadStore() hook
function migrateFromV1() {
  const v1Data = localStorage.getItem("moneymind-data");
  if (!v1Data) return;
  
  const v1 = JSON.parse(v1Data);
  
  // Transform v1 schema to v2
  const v2Store: Store = {
    transactions: v1.transactions.map(tx => ({
      ...tx,
      deleted: false
    })),
    accounts: v1.accounts.map(acc => ({
      ...acc,
      deleted: false
    })),
    creditCards: v1.liabilities?.creditCards?.map(cc => ({
      ...cc,
      deleted: false,
      unbilled: 0
    })) || [],
    loans: v1.liabilities?.loans?.map(loan => ({
      ...loan,
      deleted: false
    })) || [],
    categories: v1.categories || [],
  };
  
  // Save as v2
  localStorage.setItem("moneymind-data-v2", JSON.stringify(v2Store));
  
  // Create auto-backup of v1
  backupService.createBackup(v1, "v1-migration-backup");
  
  return v2Store;
}
```

---

## Production Monitoring

### Recommended Monitoring Setup
1. **Error Tracking:** Sentry.io
2. **Analytics:** Google Analytics or Plausible
3. **Uptime:** Vercel Analytics (built-in)

### Add to index.html for production:
```html
<!-- Example: Sentry Error Tracking -->
<script src="https://browser.sentry-cdn.com/7.x.x/bundle.min.js"></script>
<script>
  Sentry.init({ dsn: 'YOUR_SENTRY_DSN' });
</script>
```

---

## Performance Optimization

### Current Status
- Bundle size: ~575 KB (minified JavaScript)
- CSS: ~100 KB (minified)
- Compression: Enabled (gzip)

### Recommendations for Future
1. **Code Splitting:** Lazy load profile menu, export features
2. **Image Optimization:** Compress any future images
3. **Service Worker:** Cache offline access capability
4. **Database:** Consider IndexedDB for larger datasets

---

## Security Checklist

- [x] HTTPS enabled (automatic on Vercel)
- [x] No API keys in frontend code
- [x] Environment variables for sensitive config
- [x] localStorage for user data only
- [x] Input validation on transactions
- [ ] CSRF protection (add if implementing backend)
- [ ] Rate limiting (if implementing backend)
- [ ] Content Security Policy (recommended)

### Add CSP Header (via vercel.json if needed):
```json
{
  "headers": [
    {
      "key": "Content-Security-Policy",
      "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    }
  ]
}
```

---

## Post-Deployment

1. **Verify HTTPS:** https://yourdomain.com
2. **Test Features:**
   - Create transaction
   - Create backup
   - Export to Excel
   - Try Google Drive sync (if configured)
3. **Check Console:** No TypeScript/runtime errors
4. **Test Mobile:** Responsive design works
5. **Share with Users:** Announce v2.0 release

---

## Rollback Plan

If issues occur after deployment:

1. **Vercel:** Revert to previous deployment
   ```bash
   vercel rollback
   ```

2. **Data Safety:** 
   - All user data in localStorage is client-side only
   - Backups protect against data loss
   - No server-side database to restore

3. **Quick Fix:**
   - Fix bug in code
   - Run `npm run build`
   - Redeploy with `vercel --prod`

---

## Support & Documentation

- **User Guide:** See README.md
- **Development:** See DEV_STATUS.md
- **Issues:** Create GitHub issues for bug reports
- **Feature Requests:** Use GitHub Discussions

---

## Version 2.1 Roadmap (Future)

- [ ] Data sync across devices (authenticated users)
- [ ] Mobile app (React Native)
- [ ] Recurring transactions
- [ ] Budget goals and alerts
- [ ] Investment portfolio tracking
- [ ] OCR for receipt scanning
- [ ] Multi-user accounts (family finance)

---

**Last Updated:** 2024-01-15  
**Version:** 2.0  
**Deployment Ready:** ✅ YES
