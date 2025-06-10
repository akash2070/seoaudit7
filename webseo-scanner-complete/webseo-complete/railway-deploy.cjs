const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const axios = require('axios');
const cheerio = require('cheerio');

// Load environment variables
require('dotenv').config();

const app = express();

// Security and performance headers
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (req.path.endsWith('.html') || req.path === '/') {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS configuration for separate frontend deployment
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://vercel.app',
    'https://netlify.app'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.some(allowed => origin && origin.includes(allowed.replace('https://', '').replace('http://', '')))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    service: 'seo-audit-pro-api',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'seo-audit-pro',
    version: '1.0.0',
    endpoints: [
      'POST /api/audit',
      'GET /api/speed',
      'GET /api/meta', 
      'GET /api/links',
      'GET /api/robots',
      'GET /api/headers'
    ]
  });
});

// SEO Audit endpoint
app.post('/api/audit', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`Starting SEO audit for: ${url}`);
    
    // Run all analyses in parallel
    const [metaTags, speedResult, linksResult, robotsResult, headersResult] = await Promise.allSettled([
      analyzeMeta(url),
      analyzeSpeed(url), 
      analyzeLinks(url),
      analyzeRobots(url),
      analyzeHeaders(url)
    ]);

    const results = {
      url,
      timestamp: new Date().toISOString(),
      metaTags: metaTags.status === 'fulfilled' ? metaTags.value : [],
      speed: speedResult.status === 'fulfilled' ? speedResult.value : {},
      links: linksResult.status === 'fulfilled' ? linksResult.value : {},
      robots: robotsResult.status === 'fulfilled' ? robotsResult.value : {},
      headers: headersResult.status === 'fulfilled' ? headersResult.value : {}
    };

    // Calculate scores and recommendations
    results.scores = calculateScores(results);
    results.recommendations = generateRecommendations(results);

    res.json(results);
  } catch (error) {
    console.error('Audit error:', error);
    res.status(500).json({ error: 'Failed to complete audit', message: error.message });
  }
});

// Individual analysis endpoints
app.get('/api/speed', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL parameter required' });
    
    const result = await analyzeSpeed(url);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/meta', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL parameter required' });
    
    const result = await analyzeMeta(url);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/links', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL parameter required' });
    
    const result = await analyzeLinks(url);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/robots', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL parameter required' });
    
    const result = await analyzeRobots(url);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/headers', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL parameter required' });
    
    const result = await analyzeHeaders(url);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analysis functions
async function analyzeMeta(url) {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    
    const metaTags = [];
    
    // Title analysis
    const title = $('title').text();
    metaTags.push(analyzeTitle(title));
    
    // Description analysis  
    const description = $('meta[name="description"]').attr('content') || '';
    metaTags.push(analyzeDescription(description));
    
    // H1 tags
    const h1Tags = [];
    $('h1').each((i, el) => h1Tags.push($(el).text()));
    metaTags.push(analyzeH1Tags(h1Tags));
    
    return metaTags;
  } catch (error) {
    console.error('Meta analysis error:', error.message);
    return [];
  }
}

async function analyzeSpeed(url) {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!apiKey) {
    return { error: 'PageSpeed API key not configured' };
  }

  try {
    const apiUrl = `https://www.googleapis.com/pagespeedinshights/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=mobile`;
    const response = await axios.get(apiUrl, { timeout: 30000 });
    
    const data = response.data;
    const metrics = data.lighthouseResult?.audits;
    
    return {
      performance: data.lighthouseResult?.categories?.performance?.score * 100 || 0,
      fcp: metrics?.['first-contentful-paint']?.displayValue || 'N/A',
      lcp: metrics?.['largest-contentful-paint']?.displayValue || 'N/A', 
      cls: metrics?.['cumulative-layout-shift']?.displayValue || 'N/A',
      fid: metrics?.['max-potential-fid']?.displayValue || 'N/A'
    };
  } catch (error) {
    console.error('Speed analysis error:', error.message);
    return { 
      error: 'Failed to analyze page speed',
      performance: 0,
      fcp: 'N/A',
      lcp: 'N/A',
      cls: 'N/A',
      fid: 'N/A'
    };
  }
}

async function analyzeLinks(url) {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    
    const links = [];
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && text) {
        links.push({ url: href, text, type: href.startsWith('http') ? 'external' : 'internal' });
      }
    });
    
    return {
      total: links.length,
      internal: links.filter(link => link.type === 'internal').length,
      external: links.filter(link => link.type === 'external').length,
      links: links.slice(0, 20)
    };
  } catch (error) {
    console.error('Links analysis error:', error.message);
    return { total: 0, internal: 0, external: 0, links: [] };
  }
}

async function analyzeRobots(url) {
  try {
    const robotsUrl = new URL('/robots.txt', url).toString();
    const response = await axios.get(robotsUrl, { timeout: 5000 });
    
    return {
      exists: true,
      content: response.data,
      size: response.data.length
    };
  } catch (error) {
    return {
      exists: false,
      error: 'robots.txt not found or inaccessible'
    };
  }
}

async function analyzeHeaders(url) {
  try {
    const response = await axios.head(url, { timeout: 5000 });
    const headers = response.headers;
    
    return {
      contentType: headers['content-type'] || 'Not specified',
      server: headers['server'] || 'Not specified',
      cacheControl: headers['cache-control'] || 'Not specified',
      securityHeaders: {
        'strict-transport-security': !!headers['strict-transport-security'],
        'x-frame-options': !!headers['x-frame-options'],
        'x-content-type-options': !!headers['x-content-type-options']
      }
    };
  } catch (error) {
    console.error('Headers analysis error:', error.message);
    return { error: 'Failed to analyze headers' };
  }
}

// Helper functions
function analyzeTitle(title) {
  const length = title.length;
  return {
    type: 'title',
    content: title,
    status: length >= 30 && length <= 60 ? 'good' : length < 30 ? 'too_short' : 'too_long',
    message: length >= 30 && length <= 60 ? 'Title length is optimal' : 
             length < 30 ? 'Title is too short (recommended: 30-60 characters)' : 
             'Title is too long (recommended: 30-60 characters)',
    length
  };
}

function analyzeDescription(description) {
  const length = description.length;
  return {
    type: 'description',
    content: description,
    status: length >= 120 && length <= 160 ? 'good' : length < 120 ? 'too_short' : 'too_long',
    message: length >= 120 && length <= 160 ? 'Description length is optimal' :
             length < 120 ? 'Description is too short (recommended: 120-160 characters)' :
             'Description is too long (recommended: 120-160 characters)',
    length
  };
}

function analyzeH1Tags(h1Tags) {
  return {
    type: 'h1',
    content: h1Tags.join(', '),
    status: h1Tags.length === 1 ? 'good' : h1Tags.length === 0 ? 'missing' : 'multiple',
    message: h1Tags.length === 1 ? 'Perfect: One H1 tag found' :
             h1Tags.length === 0 ? 'Missing H1 tag' :
             `Multiple H1 tags found (${h1Tags.length}). Use only one H1 per page.`,
    count: h1Tags.length
  };
}

function calculateScores(results) {
  let totalScore = 0;
  let maxScore = 0;

  // Title score
  if (results.metaTags.length > 0) {
    const titleTag = results.metaTags.find(tag => tag.type === 'title');
    if (titleTag) {
      maxScore += 25;
      totalScore += titleTag.status === 'good' ? 25 : titleTag.status === 'too_short' ? 15 : 10;
    }

    // Description score
    const descTag = results.metaTags.find(tag => tag.type === 'description');
    if (descTag) {
      maxScore += 25;
      totalScore += descTag.status === 'good' ? 25 : descTag.status === 'too_short' ? 15 : 10;
    }

    // H1 score
    const h1Tag = results.metaTags.find(tag => tag.type === 'h1');
    if (h1Tag) {
      maxScore += 25;
      totalScore += h1Tag.status === 'good' ? 25 : h1Tag.status === 'missing' ? 0 : 15;
    }
  }

  // Performance score
  if (results.speed && results.speed.performance) {
    maxScore += 25;
    totalScore += Math.round(results.speed.performance * 0.25);
  }

  return {
    overall: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
    seo: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
    performance: results.speed?.performance || 0,
    accessibility: 85,
    bestPractices: 90
  };
}

function generateRecommendations(results) {
  const recommendations = [];

  // Title recommendations
  const titleTag = results.metaTags?.find(tag => tag.type === 'title');
  if (titleTag && titleTag.status !== 'good') {
    recommendations.push({
      type: 'seo',
      priority: 'high',
      title: 'Optimize Title Tag',
      description: titleTag.message,
      impact: 'Improves click-through rates and search rankings'
    });
  }

  // Description recommendations
  const descTag = results.metaTags?.find(tag => tag.type === 'description');
  if (descTag && descTag.status !== 'good') {
    recommendations.push({
      type: 'seo',
      priority: 'high',
      title: 'Optimize Meta Description',
      description: descTag.message,
      impact: 'Improves click-through rates from search results'
    });
  }

  // Performance recommendations
  if (results.speed?.performance < 80) {
    recommendations.push({
      type: 'performance',
      priority: 'medium',
      title: 'Improve Page Speed',
      description: 'Your page speed score is below optimal. Consider optimizing images, minifying code, and using a CDN.',
      impact: 'Faster loading improves user experience and search rankings'
    });
  }

  return recommendations;
}

// Serve static files from client/dist after build
const publicPath = path.resolve(__dirname, 'client', 'dist');

if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  
  app.use("*", (req, res) => {
    res.sendFile(path.resolve(publicPath, "index.html"));
  });
} else {
  // Fallback API-only mode if no frontend build found
  app.get('*', (req, res) => {
    res.json({ 
      message: 'WebSeoScanner API Server',
      status: 'running',
      endpoints: [
        'GET /health - Health check',
        'GET /api/health - API health check', 
        'POST /api/audit - Complete SEO audit',
        'GET /api/speed?url= - Page speed analysis',
        'GET /api/meta?url= - Meta tags analysis',
        'GET /api/links?url= - Links analysis',
        'GET /api/robots?url= - Robots.txt check',
        'GET /api/headers?url= - Headers analysis'
      ]
    });
  });
}

// Error handler
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error(err);
});

// Start server
const port = process.env.PORT || 5000;
const server = http.createServer(app);

server.listen(port, '0.0.0.0', () => {
  console.log(`SEO Audit Pro server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});