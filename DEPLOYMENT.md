# Deployment Guide - RapidAPI Lead Miner

## GitHub Setup

### 1. Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `rapidapi-lead-miner` or your preferred name
3. Make it public or private (your choice)
4. Don't initialize with README (we have one already)

### 2. Push Code to GitHub

Run these commands in your project directory:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - RapidAPI Lead Miner platform"

# Add your GitHub repository as origin
git remote add origin https://github.com/yourusername/rapidapi-lead-miner.git

# Push to GitHub
git push -u origin main
```

## Vercel Deployment

### 1. Connect to Vercel

1. Go to [Vercel](https://vercel.com)
2. Sign up/login with your GitHub account
3. Click "New Project"
4. Import your `leadminer` repository

### 2. Configure Build Settings

Vercel will auto-detect your project. Verify these settings:

- **Framework Preset**: Other
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Add Environment Variables

In Vercel dashboard, go to your project → Settings → Environment Variables:

Add these variables:
- **Key**: `RAPIDAPI_KEY`
- **Value**: Your RapidAPI key (e.g., `3c16708260msh0fea8d154a142cbp10c69bjsn25c5663a295d`)
- **Environment**: All (Production, Preview, Development)

### 4. Deploy

Click "Deploy" - Vercel will:
1. Clone your repository
2. Install dependencies
3. Build your application
4. Deploy to a `.vercel.app` domain

## Post-Deployment

### 1. Test Your Application

Your app will be available at: `https://your-project-name.vercel.app`

Test these features:
- Single domain search
- CSV bulk upload
- API settings configuration
- Export functionality

### 2. Custom Domain (Optional)

In Vercel dashboard:
1. Go to Settings → Domains
2. Add your custom domain
3. Configure DNS settings as instructed

### 3. Monitor Performance

- Check Vercel Analytics for usage stats
- Monitor API quota usage
- Review function logs for errors

## Troubleshooting

### Common Issues

**Build Errors:**
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation

**API Errors:**
- Confirm `RAPIDAPI_KEY` is set correctly
- Test API endpoints in development first
- Check RapidAPI dashboard for quota limits

**Database Issues:**
- Application uses in-memory storage by default
- For persistent data, configure PostgreSQL connection

### Environment Variables

Required for production:
```
RAPIDAPI_KEY=your_api_key_here
NODE_ENV=production
```

### Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test locally first with `npm run build && npm start`
4. Contact support if needed

## Success Indicators

Your deployment is successful when:
- ✅ Build completes without errors
- ✅ App loads at your Vercel URL
- ✅ Search functionality works
- ✅ CSV upload processes correctly
- ✅ API settings can be configured
- ✅ Results export properly

Your RapidAPI Lead Miner platform is now live and ready for production use!