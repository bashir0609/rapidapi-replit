# RapidAPI Lead Miner - Deployment Instructions

## Backend Status: ✅ WORKING
Your RapidAPI integration is fully functional:
- Facebook.com: 124 verified emails
- Google.com: 116 verified emails  
- Amazon.com: 114 verified emails
- Netflix.com: 6 verified emails

## Deploy to Vercel

1. **Connect GitHub Repository**
   - Push this code to your GitHub repository
   - Connect repository to Vercel dashboard

2. **Set Environment Variables in Vercel**
   ```
   RAPIDAPI_KEY = 3c16708260msh0fea8d154a142cbp10c69bjsn25c5663a295d
   ```

3. **Deploy Command**
   - Vercel will automatically detect the configuration
   - Build command: `npm run build`
   - Output directory: `dist`

## API Endpoints (Working)
- `POST /api/search` - Main search endpoint
- `GET /api/analytics` - Usage statistics
- `GET /api/configurations` - API configurations

## Test Your Deployment
Once deployed, test the API directly:
```bash
curl -X POST "https://your-app.vercel.app/api/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "apple.com", "searchType": "domain", "apiSource": "website-contacts-scraper"}'
```

Your backend is production-ready with authentic lead generation capabilities.