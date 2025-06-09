# WebSeoScanner - Professional Website Analysis Tool

A comprehensive full-stack SEO audit application built with React and Express.js, featuring Google PageSpeed Insights integration and detailed website analysis capabilities.

## Features

- **Comprehensive SEO Analysis**: Meta tags, title optimization, H1 tag validation
- **Performance Metrics**: Google PageSpeed Insights integration with Core Web Vitals
- **Link Analysis**: Internal and external link validation and categorization
- **Technical SEO**: Robots.txt checking, security headers analysis
- **Professional Reports**: Detailed scoring system with actionable recommendations
- **Modern UI**: React with Tailwind CSS, responsive design
- **Cloud Ready**: Deployable to Railway, Vercel, Netlify, and other platforms

## Quick Start

### Railway Deployment (Recommended)
1. Push to GitHub repository
2. Connect Railway to your repo
3. Set environment variable: `GOOGLE_PAGESPEED_API_KEY=your_api_key`
4. Deploy automatically

### Local Development
```bash
npm install
npm run dev
```

### Separate Frontend/Backend Deployment
- **Frontend**: Deploy `client/` folder to Vercel/Netlify
- **Backend**: Deploy to Railway/Heroku with `railway-deploy.cjs`

## Environment Variables

```
GOOGLE_PAGESPEED_API_KEY=your_google_api_key
NODE_ENV=production
PORT=5000
```

## API Endpoints

- `POST /api/audit` - Complete SEO audit
- `GET /api/health` - Health check
- `GET /api/speed?url=` - Page speed analysis
- `GET /api/meta?url=` - Meta tags analysis
- `GET /api/links?url=` - Links analysis
- `GET /api/robots?url=` - Robots.txt check
- `GET /api/headers?url=` - Headers analysis

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, Node.js
- **APIs**: Google PageSpeed Insights, Cheerio for web scraping
- **Deployment**: Railway, Vercel, Netlify compatible

## Project Structure

```
webseo-scanner/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types/schemas
├── railway-deploy.cjs # Production server
└── vercel.json      # Frontend deployment config
```

## Deployment Status

Current deployment URL: https://seoaudit4-production.up.railway.app

The application is fully functional with comprehensive SEO analysis capabilities and professional reporting features.