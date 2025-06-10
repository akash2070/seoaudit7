# SEO Audit Pro - Deployment Guide

## Project Structure

```
seo-audit-pro/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # App pages
│   │   └── lib/           # Utilities
│   └── index.html
├── server/                 # Express backend
│   ├── index.ts           # Development server
│   ├── routes.ts          # API routes
│   ├── railway-server.js  # Production server (Railway)
│   └── vite.ts           # Vite configuration
├── shared/                # Shared types/schemas
└── package.json
```

## Deployment Options

### 1. Railway (Full-Stack)
- Deploy both frontend and backend together
- Uses `server/railway-server.js` for production
- Configuration: `railway.toml`

### 2. Vercel (Frontend) + Railway (Backend)
- Frontend: Deploy `client/` folder to Vercel
- Backend: Deploy to Railway separately
- Configuration: `vercel.json` for frontend

### 3. Netlify (Frontend) + Any Backend Service
- Frontend: Deploy `client/` folder to Netlify
- Backend: Deploy to your preferred service

## Environment Variables

Required for all deployments:
```
GOOGLE_PAGESPEED_API_KEY=your_api_key_here
NODE_ENV=production
PORT=5000
```

## File Naming Conventions

- ✅ `client/` - Clear frontend directory
- ✅ `server/` - Clear backend directory  
- ✅ `shared/` - Shared code between frontend/backend
- ✅ Production servers have descriptive names (`railway-server.js`)
- ✅ All configuration files are at root level

This structure ensures no confusion for cloud services during deployment.