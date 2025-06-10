# SEO Audit Pro

A professional full-stack SEO audit tool that provides comprehensive website performance analysis with advanced reporting capabilities.

![SEO Audit Pro](https://img.shields.io/badge/SEO-Audit%20Pro-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Express](https://img.shields.io/badge/Express.js-404D59?logo=express)

## Features

### 🚀 Performance Analysis
- **Google PageSpeed Insights Integration**: Real-time performance scoring
- **Core Web Vitals**: LCP, FID, CLS measurements
- **Mobile & Desktop Analysis**: Comprehensive device-specific metrics
- **Performance Recommendations**: Actionable optimization suggestions

### 🔍 SEO Optimization
- **Meta Tag Analysis**: Title, description, canonical, viewport validation
- **Open Graph & Twitter Cards**: Social media optimization check
- **Heading Structure**: H1-H6 hierarchy analysis
- **Robots.txt Validation**: Crawling directives verification
- **Sitemap Detection**: XML sitemap presence and accessibility

### 🔗 Technical SEO
- **Link Analysis**: Internal/external link validation
- **HTTP Headers**: Security and caching headers analysis
- **Status Code Verification**: Broken link detection
- **SSL Certificate**: HTTPS implementation check

### 📊 Reporting
- **Professional PDF Reports**: Detailed multi-page analysis
- **Executive Summary**: Key metrics and recommendations
- **Technical Details**: In-depth findings and solutions
- **Score Tracking**: Overall SEO health scoring

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **UI Components**: Radix UI, Shadcn/ui
- **API Integration**: Google PageSpeed Insights
- **PDF Generation**: jsPDF with custom formatting
- **Web Scraping**: Cheerio for HTML analysis

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google PageSpeed Insights API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/seo-audit-pro.git
cd seo-audit-pro
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
```bash
cp .env.example .env
```

Edit `.env` and add your Google PageSpeed Insights API key:
```env
PAGESPEED_API_KEY=your_google_api_key_here
NODE_ENV=development
PORT=5000
```

4. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## API Key Setup

### Getting Google PageSpeed Insights API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the PageSpeed Insights API
4. Create credentials (API Key)
5. Add the key to your `.env` file

## Deployment

### Frontend Deployment (Vercel)

1. **Deploy to Vercel**
```bash
npm install -g vercel
vercel --prod
```

2. **Configure environment variables** in Vercel dashboard:
   - Add your API keys and configuration

### Backend Deployment (Railway)

1. **Deploy to Railway**
```bash
npm install -g @railway/cli
railway login
railway deploy
```

2. **Set environment variables**:
   - `PAGESPEED_API_KEY`: Your Google API key
   - `NODE_ENV`: production
   - `PORT`: 5000

### Alternative Deployment Options

- **Netlify**: Frontend hosting with serverless functions
- **Heroku**: Full-stack deployment
- **DigitalOcean**: App platform deployment
- **AWS**: EC2 or Lambda deployment

## Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Utilities
npm run check        # TypeScript type checking
npm run preview      # Preview production build
```

## Project Structure

```
seo-audit-pro/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Route pages
│   │   ├── lib/           # Utilities and API
│   │   └── hooks/         # Custom React hooks
│   └── index.html
├── server/                # Express backend
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   └── storage.ts         # Data management
├── shared/                # Shared types and schemas
│   └── schema.ts
├── dist/                  # Production builds
├── vercel.json           # Vercel deployment config
├── railway.toml          # Railway deployment config
└── package.json
```

## API Endpoints

### Core Endpoints
- `POST /api/audit` - Complete SEO audit
- `POST /api/speed` - PageSpeed analysis
- `POST /api/meta` - Meta tags analysis
- `POST /api/links` - Link validation
- `POST /api/robots` - Robots.txt check
- `POST /api/headers` - HTTP headers analysis

### Example Request
```javascript
const response = await fetch('/api/audit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://example.com'
  })
});

const auditResults = await response.json();
```

## Features in Detail

### Performance Analysis
- **Real-time Metrics**: Live performance data from Google PageSpeed
- **Core Web Vitals**: Industry-standard performance indicators
- **Optimization Tips**: Specific recommendations for improvement

### SEO Health Check
- **Meta Tag Validation**: Comprehensive meta data analysis
- **Content Structure**: Heading hierarchy and content organization
- **Technical SEO**: Robots.txt, sitemaps, and crawlability

### Security & Headers
- **HTTPS Verification**: SSL certificate validation
- **Security Headers**: CSP, HSTS, X-Frame-Options analysis
- **Caching Headers**: Performance optimization headers

### Professional Reporting
- **PDF Generation**: Detailed, branded reports
- **Executive Summary**: High-level insights for stakeholders
- **Technical Details**: Developer-focused recommendations

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: Full API documentation available
- **Issues**: Report bugs via GitHub issues
- **Feature Requests**: Submit enhancement proposals

## Roadmap

- [ ] Multi-site dashboard
- [ ] Historical trend analysis
- [ ] Competitive analysis
- [ ] WordPress plugin
- [ ] API rate limiting
- [ ] Advanced caching

---

Built with ❤️ for the SEO community