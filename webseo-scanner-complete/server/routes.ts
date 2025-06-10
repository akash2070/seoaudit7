import type { Express } from "express";
import { createServer, type Server } from "http";
import axios from "axios";
import * as cheerio from "cheerio";
import { URL } from "url";
import { auditRequestSchema, type AuditResult, type SpeedResult, type MetaTagItem, type LinksResult, type RobotsResult, type HeadersResult, type Recommendation } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "OK", 
      timestamp: new Date().toISOString(),
      endpoints: [
        "POST /api/audit",
        "GET /api/speed",
        "GET /api/meta", 
        "GET /api/links",
        "GET /api/robots",
        "GET /api/headers"
      ]
    });
  });

  // Robots.txt endpoint
  app.get("/robots.txt", (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(`User-agent: *
Allow: /

# Sitemap
Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Block development/testing paths
Disallow: /test
Disallow: /dev
Disallow: /_*`);
  });

  // Sitemap.xml endpoint
  app.get("/sitemap.xml", (req, res) => {
    res.set('Content-Type', 'application/xml');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
  });

  // POST /api/audit - Comprehensive SEO audit orchestration
  app.post("/api/audit", async (req, res) => {
    try {
      const { url } = auditRequestSchema.parse(req.body);
      
      console.log(`Starting comprehensive audit for: ${url}`);

      // Run all analyses in parallel
      const [speedResult, metaResult, linksResult, robotsResult, headersResult] = await Promise.allSettled([
        analyzeSpeed(url),
        analyzeMeta(url), 
        analyzeLinks(url),
        analyzeRobots(url),
        analyzeHeaders(url)
      ]);

      // Process results
      const results: Partial<AuditResult> = {
        url,
        timestamp: new Date().toISOString()
      };

      const errors: string[] = [];

      if (speedResult.status === "fulfilled") {
        results.speed = speedResult.value;
      } else {
        errors.push(`Speed analysis failed: ${speedResult.reason.message}`);
      }

      if (metaResult.status === "fulfilled") {
        results.meta = { items: metaResult.value };
      } else {
        errors.push(`Meta analysis failed: ${metaResult.reason.message}`);
      }

      if (linksResult.status === "fulfilled") {
        results.links = linksResult.value;
      } else {
        errors.push(`Links analysis failed: ${linksResult.reason.message}`);
      }

      if (robotsResult.status === "fulfilled") {
        results.robots = robotsResult.value;
      } else {
        errors.push(`Robots analysis failed: ${robotsResult.reason.message}`);
      }

      if (headersResult.status === "fulfilled") {
        results.headers = headersResult.value;
      } else {
        errors.push(`Headers analysis failed: ${headersResult.reason.message}`);
      }

      // Calculate overall scores
      results.scores = calculateScores(results);
      
      // Generate recommendations
      results.recommendations = generateRecommendations(results);

      if (errors.length > 0) {
        results.errors = errors;
      }

      res.json(results);

    } catch (error: any) {
      console.error("Audit error:", error);
      res.status(400).json({ error: error.message || "Audit failed" });
    }
  });

  // GET /api/speed - Google PageSpeed Insights analysis
  app.get("/api/speed", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "URL parameter is required" });
      }

      const result = await analyzeSpeed(url);
      res.json(result);
    } catch (error: any) {
      console.error("Speed analysis error:", error);
      res.status(500).json({ error: error.message || "Speed analysis failed" });
    }
  });

  // GET /api/meta - Meta tags extraction and analysis
  app.get("/api/meta", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "URL parameter is required" });
      }

      const result = await analyzeMeta(url);
      res.json({ items: result });
    } catch (error: any) {
      console.error("Meta analysis error:", error);
      res.status(500).json({ error: error.message || "Meta analysis failed" });
    }
  });

  // GET /api/links - Links validation analysis
  app.get("/api/links", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "URL parameter is required" });
      }

      const result = await analyzeLinks(url);
      res.json(result);
    } catch (error: any) {
      console.error("Links analysis error:", error);
      res.status(500).json({ error: error.message || "Links analysis failed" });
    }
  });

  // GET /api/robots - Robots.txt and sitemap analysis
  app.get("/api/robots", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "URL parameter is required" });
      }

      const result = await analyzeRobots(url);
      res.json(result);
    } catch (error: any) {
      console.error("Robots analysis error:", error);
      res.status(500).json({ error: error.message || "Robots analysis failed" });
    }
  });

  // GET /api/headers - HTTP headers analysis
  app.get("/api/headers", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "URL parameter is required" });
      }

      const result = await analyzeHeaders(url);
      res.json(result);
    } catch (error: any) {
      console.error("Headers analysis error:", error);
      res.status(500).json({ error: error.message || "Headers analysis failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Speed analysis using Google PageSpeed Insights API
async function analyzeSpeed(url: string): Promise<SpeedResult> {
  const apiKey = process.env.PAGESPEED_API_KEY;
  
  if (!apiKey) {
    throw new Error("PageSpeed API key not configured");
  }

  const pageSpeedUrl = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
  
  try {
    const [desktopResponse, mobileResponse] = await Promise.allSettled([
      axios.get(pageSpeedUrl, {
        params: {
          url,
          key: apiKey,
          strategy: "desktop",
          category: ["PERFORMANCE", "ACCESSIBILITY", "BEST_PRACTICES", "SEO"]
        },
        timeout: 30000
      }),
      axios.get(pageSpeedUrl, {
        params: {
          url,
          key: apiKey,
          strategy: "mobile", 
          category: ["PERFORMANCE", "ACCESSIBILITY", "BEST_PRACTICES", "SEO"]
        },
        timeout: 30000
      })
    ]);

    const result: SpeedResult = {};

    // Process desktop results
    if (desktopResponse.status === "fulfilled") {
      const lighthouse = desktopResponse.value.data.lighthouseResult;
      result.performance = {
        score: Math.round((lighthouse.categories.performance?.score || 0) * 100),
        strategy: "desktop"
      };
    }

    // Process mobile results  
    if (mobileResponse.status === "fulfilled") {
      const lighthouse = mobileResponse.value.data.lighthouseResult;
      result.mobile = {
        score: Math.round((lighthouse.categories.performance?.score || 0) * 100),
        strategy: "mobile"
      };

      // Extract Core Web Vitals from mobile
      const audits = lighthouse.audits;
      if (audits) {
        result.coreWebVitals = {
          lcp: audits['largest-contentful-paint']?.displayValue || 'N/A',
          fid: audits['max-potential-fid']?.displayValue || 'N/A', 
          cls: audits['cumulative-layout-shift']?.displayValue || 'N/A',
          fcp: audits['first-contentful-paint']?.displayValue || 'N/A',
          si: audits['speed-index']?.displayValue || 'N/A'
        };
      }
    }

    return result;

  } catch (error: any) {
    throw new Error(`PageSpeed analysis failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

// Meta tags analysis using Cheerio
async function analyzeMeta(url: string): Promise<MetaTagItem[]> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEO-Audit-Bot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 15000,
      maxRedirects: 5
    });

    const $ = cheerio.load(response.data);
    const items: MetaTagItem[] = [];

    // Title tag analysis
    const title = $('title').text().trim();
    items.push(analyzeTitle(title));

    // Meta description analysis
    const description = $('meta[name="description"]').attr('content') || '';
    items.push(analyzeDescription(description));

    // Canonical URL
    const canonical = $('link[rel="canonical"]').attr('href') || '';
    items.push(analyzeCanonical(canonical, url));

    // Open Graph tags
    const ogTags = extractOpenGraphTags($);
    items.push(analyzeOpenGraph(ogTags));

    // Twitter Card tags
    const twitterTags = extractTwitterTags($);
    items.push(analyzeTwitterCards(twitterTags));

    // Viewport meta tag
    const viewport = $('meta[name="viewport"]').attr('content') || '';
    items.push(analyzeViewport(viewport));

    // Language declaration
    const lang = $('html').attr('lang') || '';
    items.push(analyzeLanguage(lang));

    // H1 tags
    const h1Tags = $('h1').map((i, el) => $(el).text().trim()).get();
    items.push(analyzeH1Tags(h1Tags));

    return items;

  } catch (error: any) {
    throw new Error(`Meta analysis failed: ${error.message}`);
  }
}

// Links analysis
async function analyzeLinks(url: string): Promise<LinksResult> {
  try {
    const baseUrl = new URL(url);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEO-Audit-Bot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 15000,
      maxRedirects: 5
    });

    const $ = cheerio.load(response.data);
    const allLinks: any[] = [];

    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      
      if (href) {
        allLinks.push({ href, text });
      }
    });

    // Categorize links
    const internal: any[] = [];
    const external: any[] = [];

    allLinks.forEach(link => {
      const href = link.href.trim();
      
      if (!href || href === '#' || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      try {
        let fullUrl;
        if (href.startsWith('//')) {
          fullUrl = new URL(baseUrl.protocol + href);
        } else if (href.startsWith('/') || !href.includes('://')) {
          fullUrl = new URL(href, baseUrl.href);
        } else {
          fullUrl = new URL(href);
        }

        if (fullUrl.hostname === baseUrl.hostname) {
          internal.push({ ...link, fullUrl: fullUrl.href, type: 'internal' });
        } else {
          external.push({ ...link, fullUrl: fullUrl.href, type: 'external' });
        }
      } catch (error) {
        // Invalid URL
      }
    });

    // Sample link checking (check first 10 of each type for performance)
    const checkedInternal = await checkLinksStatus(internal.slice(0, 10));
    const checkedExternal = await checkLinksStatus(external.slice(0, 10));

    return {
      internal: {
        links: checkedInternal,
        working: checkedInternal.filter(l => l.status === 'working').length,
        broken: checkedInternal.filter(l => l.status === 'broken').length,
        status: checkedInternal.some(l => l.status === 'broken') ? 'warning' : 'good'
      },
      external: {
        links: checkedExternal,
        working: checkedExternal.filter(l => l.status === 'working').length,
        broken: checkedExternal.filter(l => l.status === 'broken').length,
        total: external.length,
        status: checkedExternal.some(l => l.status === 'broken') ? 'warning' : 'good'
      }
    };

  } catch (error: any) {
    throw new Error(`Links analysis failed: ${error.message}`);
  }
}

// Robots and sitemap analysis
async function analyzeRobots(url: string): Promise<RobotsResult> {
  try {
    const baseUrl = new URL(url);
    const robotsUrl = new URL('/robots.txt', baseUrl.origin).href;
    const sitemapUrl = new URL('/sitemap.xml', baseUrl.origin).href;

    const [robotsResult, sitemapResult] = await Promise.allSettled([
      checkRobotsTxt(robotsUrl),
      checkSitemap(sitemapUrl)
    ]);

    const robotsTxt = {
      found: false,
      accessible: false,
      size: 0,
      sitemaps: [] as string[]
    };

    if (robotsResult.status === 'fulfilled') {
      Object.assign(robotsTxt, robotsResult.value);
    }

    const sitemap = {
      found: false,
      accessible: false,
      urlCount: 0,
      format: undefined as string | undefined
    };

    if (sitemapResult.status === 'fulfilled') {
      Object.assign(sitemap, sitemapResult.value);
    }

    return { robotsTxt, sitemap };

  } catch (error: any) {
    throw new Error(`Robots analysis failed: ${error.message}`);
  }
}

// Headers analysis
async function analyzeHeaders(url: string): Promise<HeadersResult> {
  try {
    let response;
    try {
      response = await axios.head(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEO-Audit-Bot/1.0)'
        },
        timeout: 15000,
        maxRedirects: 5,
        validateStatus: () => true
      });
    } catch (headError) {
      response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEO-Audit-Bot/1.0)'
        },
        timeout: 15000,
        maxRedirects: 5,
        maxContentLength: 1024,
        validateStatus: () => true
      });
    }

    const headers = response.headers;
    const security = analyzeSecurityHeaders(headers);
    const caching = analyzeCachingHeaders(headers);

    return { security, caching };

  } catch (error: any) {
    throw new Error(`Headers analysis failed: ${error.message}`);
  }
}

// Helper functions for analysis
function analyzeTitle(title: string): MetaTagItem {
  let status: 'good' | 'warning' | 'error' = 'good';
  let description = `Title: "${title}" (${title.length} characters)`;

  if (!title) {
    status = 'error';
    description = 'Missing title tag';
  } else if (title.length < 30) {
    status = 'warning';
    description = `Title too short: "${title}" (${title.length} characters). Recommended: 50-60 characters`;
  } else if (title.length > 60) {
    status = 'warning';
    description = `Title too long: "${title}" (${title.length} characters). May be truncated in search results`;
  }

  return {
    name: 'Title Tag',
    status,
    description,
    value: title,
    length: title.length
  };
}

function analyzeDescription(description: string): MetaTagItem {
  let status: 'good' | 'warning' | 'error' = 'good';
  let desc = `Meta description: "${description}" (${description.length} characters)`;

  if (!description) {
    status = 'error';
    desc = 'Missing meta description';
  } else if (description.length < 120) {
    status = 'warning';
    desc = `Meta description too short: ${description.length} characters. Recommended: 150-160 characters`;
  } else if (description.length > 160) {
    status = 'warning';
    desc = `Meta description too long: ${description.length} characters. May be truncated in search results`;
  }

  return {
    name: 'Meta Description',
    status,
    description: desc,
    value: description,
    length: description.length
  };
}

function analyzeCanonical(canonical: string, url: string): MetaTagItem {
  let status: 'good' | 'warning' | 'error' = 'good';
  let description = 'Canonical URL properly set';

  if (!canonical) {
    status = 'warning';
    description = 'Missing canonical URL - may cause duplicate content issues';
  } else {
    try {
      const canonicalUrl = new URL(canonical, url);
      description = `Canonical URL: ${canonicalUrl.href}`;
    } catch (error) {
      status = 'error';
      description = 'Invalid canonical URL format';
    }
  }

  return {
    name: 'Canonical URL',
    status,
    description,
    value: canonical
  };
}

function extractOpenGraphTags($: cheerio.CheerioAPI): Record<string, string> {
  const ogTags: Record<string, string> = {};
  $('meta[property^="og:"]').each((i, el) => {
    const property = $(el).attr('property');
    const content = $(el).attr('content');
    if (property && content) {
      ogTags[property] = content;
    }
  });
  return ogTags;
}

function analyzeOpenGraph(ogTags: Record<string, string>): MetaTagItem {
  const requiredTags = ['og:title', 'og:description', 'og:image', 'og:url'];
  const missingTags = requiredTags.filter(tag => !ogTags[tag]);
  
  let status: 'good' | 'warning' | 'error' = 'good';
  let description = 'All essential Open Graph tags present';

  if (missingTags.length > 0) {
    status = missingTags.length > 2 ? 'error' : 'warning';
    description = `Missing Open Graph tags: ${missingTags.join(', ')}`;
  }

  return {
    name: 'Open Graph Tags',
    status,
    description,
    value: JSON.stringify(ogTags)
  };
}

function extractTwitterTags($: cheerio.CheerioAPI): Record<string, string> {
  const twitterTags: Record<string, string> = {};
  $('meta[name^="twitter:"]').each((i, el) => {
    const name = $(el).attr('name');
    const content = $(el).attr('content');
    if (name && content) {
      twitterTags[name] = content;
    }
  });
  return twitterTags;
}

function analyzeTwitterCards(twitterTags: Record<string, string>): MetaTagItem {
  const hasCard = twitterTags['twitter:card'];
  
  let status: 'good' | 'warning' | 'error' = 'good';
  let description = 'Twitter Card tags properly configured';

  if (!hasCard) {
    status = 'warning';
    description = 'Missing Twitter Card meta tags';
  } else if (!twitterTags['twitter:title'] || !twitterTags['twitter:description']) {
    status = 'warning';
    description = 'Twitter Card incomplete - missing title or description';
  }

  return {
    name: 'Twitter Cards',
    status,
    description,
    value: JSON.stringify(twitterTags)
  };
}

function analyzeViewport(viewport: string): MetaTagItem {
  let status: 'good' | 'warning' | 'error' = 'good';
  let description = 'Viewport meta tag properly configured';

  if (!viewport) {
    status = 'error';
    description = 'Missing viewport meta tag - required for mobile responsiveness';
  } else if (!viewport.includes('width=device-width')) {
    status = 'warning';
    description = 'Viewport tag should include width=device-width for proper mobile rendering';
  }

  return {
    name: 'Viewport Meta Tag',
    status,
    description,
    value: viewport
  };
}

function analyzeLanguage(lang: string): MetaTagItem {
  return {
    name: 'Language Declaration',
    status: lang ? 'good' : 'warning',
    description: lang ? 
      `Language declared as: ${lang}` : 
      'Missing language declaration in HTML tag',
    value: lang
  };
}

function analyzeH1Tags(h1Tags: string[]): MetaTagItem {
  let status: 'good' | 'warning' | 'error' = 'good';
  let description = 'H1 tag properly used';

  if (h1Tags.length === 0) {
    status = 'error';
    description = 'Missing H1 tag - important for SEO structure';
  } else if (h1Tags.length > 1) {
    status = 'warning';
    description = `Multiple H1 tags found (${h1Tags.length}). Single H1 recommended`;
  } else {
    description = `H1 tag: "${h1Tags[0]}" (${h1Tags[0].length} characters)`;
    if (h1Tags[0].length > 70) {
      status = 'warning';
      description += ' - Consider shorter H1 for better readability';
    }
  }

  return {
    name: 'H1 Tags',
    status,
    description,
    value: h1Tags.join(', ')
  };
}

async function checkLinksStatus(links: any[]): Promise<any[]> {
  const results = await Promise.allSettled(
    links.map(async (link) => {
      try {
        const response = await axios.head(link.fullUrl || link.href, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SEO-Audit-Bot/1.0)'
          },
          timeout: 10000,
          maxRedirects: 5,
          validateStatus: () => true
        });

        const status = response.status >= 400 ? 'broken' : 'working';
        return { ...link, status, statusCode: response.status };
      } catch (error) {
        return { ...link, status: 'broken', statusCode: null, error: (error as any).message };
      }
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return { ...links[index], status: 'broken', error: result.reason.message };
    }
  });
}

async function checkRobotsTxt(robotsUrl: string): Promise<any> {
  try {
    const response = await axios.get(robotsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEO-Audit-Bot/1.0)'
      },
      timeout: 10000,
      maxContentLength: 1024 * 1024,
      validateStatus: () => true
    });

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}`);
    }

    const content = response.data;
    const lines = content.split('\n').map((line: string) => line.trim()).filter((line: string) => line);
    
    const sitemaps: string[] = [];
    lines.forEach((line: string) => {
      const cleanLine = line.split('#')[0].trim();
      if (cleanLine.toLowerCase().startsWith('sitemap:')) {
        const sitemapUrl = cleanLine.substring(8).trim();
        sitemaps.push(sitemapUrl);
      }
    });

    return {
      found: true,
      accessible: true,
      size: content.length,
      sitemaps
    };

  } catch (error) {
    return {
      found: false,
      accessible: false,
      size: 0,
      sitemaps: []
    };
  }
}

async function checkSitemap(sitemapUrl: string): Promise<any> {
  try {
    const response = await axios.get(sitemapUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEO-Audit-Bot/1.0)',
        'Accept': 'application/xml,text/xml,*/*'
      },
      timeout: 15000,
      maxContentLength: 10 * 1024 * 1024,
      validateStatus: () => true
    });

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}`);
    }

    const content = response.data;
    const contentType = response.headers['content-type'] || '';
    
    let format = 'unknown';
    let urlCount = 0;

    if (contentType.includes('xml') || content.includes('<?xml')) {
      format = 'xml';
      const urlMatches = content.match(/<url>/g);
      const locMatches = content.match(/<loc>/g);
      urlCount = Math.max(urlMatches?.length || 0, locMatches?.length || 0);
    } else if (contentType.includes('text') || typeof content === 'string') {
      format = 'text';
      urlCount = content.split('\n').filter((line: string) => 
        line.trim() && line.trim().startsWith('http')
      ).length;
    }

    return {
      found: true,
      accessible: true,
      urlCount,
      format
    };

  } catch (error) {
    return {
      found: false,
      accessible: false,
      urlCount: 0
    };
  }
}

function analyzeSecurityHeaders(headers: Record<string, any>): any[] {
  const securityHeaders = [
    {
      name: 'Strict-Transport-Security',
      header: 'strict-transport-security',
      description: 'Enforces HTTPS connections',
      required: true
    },
    {
      name: 'X-Content-Type-Options',
      header: 'x-content-type-options',
      description: 'Prevents MIME type sniffing',
      required: true,
      expected: 'nosniff'
    },
    {
      name: 'X-Frame-Options',
      header: 'x-frame-options',
      description: 'Prevents clickjacking attacks',
      required: true,
      expected: ['DENY', 'SAMEORIGIN']
    },
    {
      name: 'Content-Security-Policy',
      header: 'content-security-policy',
      description: 'Prevents XSS and data injection',
      required: true
    }
  ];

  return securityHeaders.map(headerDef => {
    const value = headers[headerDef.header] || headers[headerDef.header.toLowerCase()];
    let status: 'good' | 'warning' | 'error' = 'good';
    let description = headerDef.description;

    if (!value) {
      status = headerDef.required ? 'error' : 'warning';
      description = `Missing ${headerDef.name} header`;
    } else {
      if (headerDef.expected) {
        const expectedValues = Array.isArray(headerDef.expected) ? headerDef.expected : [headerDef.expected];
        const hasExpectedValue = expectedValues.some(expected => 
          value.toLowerCase().includes(expected.toLowerCase())
        );
        
        if (!hasExpectedValue) {
          status = 'warning';
          description = `${headerDef.name}: ${value} (consider: ${expectedValues.join(' or ')})`;
        } else {
          description = `${headerDef.name}: ${value}`;
        }
      } else {
        description = `${headerDef.name}: ${value}`;
      }
    }

    return {
      name: headerDef.name,
      status,
      description,
      value: value || undefined
    };
  });
}

function analyzeCachingHeaders(headers: Record<string, any>): any[] {
  const cachingAnalysis = [];

  const cacheControl = headers['cache-control'];
  if (cacheControl) {
    cachingAnalysis.push({
      name: 'Cache-Control',
      status: 'good' as const,
      description: `Cache-Control: ${cacheControl}`,
      value: cacheControl
    });
  } else {
    cachingAnalysis.push({
      name: 'Cache-Control',
      status: 'warning' as const,
      description: 'Missing Cache-Control header',
      value: undefined
    });
  }

  return cachingAnalysis;
}

function calculateScores(results: Partial<AuditResult>): any {
  const scores = {
    overall: 0,
    technical: 0,
    content: 0,
    performance: 0,
    mobile: 0
  };

  // Performance score from PageSpeed
  if (results.speed?.performance?.score) {
    scores.performance = results.speed.performance.score;
    scores.mobile = results.speed.mobile?.score || results.speed.performance.score;
  }

  // Technical score based on headers, robots
  let technicalFactors = 0;
  let technicalScore = 0;

  if (results.robots) {
    technicalFactors++;
    technicalScore += (results.robots.robotsTxt?.found ? 50 : 0) + (results.robots.sitemap?.found ? 50 : 0);
  }

  if (results.headers?.security) {
    technicalFactors++;
    const securityScore = results.headers.security.reduce((acc, header) => {
      return acc + (header.status === 'good' ? 20 : 0);
    }, 0);
    technicalScore += Math.min(securityScore, 100);
  }

  if (technicalFactors > 0) {
    scores.technical = Math.round(technicalScore / technicalFactors);
  }

  // Content score based on meta tags
  if (results.meta?.items) {
    const metaScore = results.meta.items.reduce((acc, item) => {
      return acc + (item.status === 'good' ? 25 : 0);
    }, 0);
    scores.content = Math.min(metaScore, 100);
  }

  // Calculate overall score
  const validScores = Object.values(scores).filter(score => score > 0);
  if (validScores.length > 0) {
    scores.overall = Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
  }

  return scores;
}

function generateRecommendations(results: Partial<AuditResult>): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Meta tag recommendations
  if (results.meta?.items) {
    results.meta.items.forEach(item => {
      if (item.status === 'warning' || item.status === 'error') {
        recommendations.push({
          title: `Improve ${item.name}`,
          description: item.description,
          priority: item.status === 'error' ? 'high' : 'medium',
          category: 'meta'
        });
      }
    });
  }

  // Performance recommendations
  if (results.speed?.performance?.score && results.speed.performance.score < 80) {
    recommendations.push({
      title: 'Improve Page Speed',
      description: 'Optimize images, minify CSS/JS, and enable compression to improve loading speed',
      priority: results.speed.performance.score < 50 ? 'high' : 'medium',
      category: 'performance'
    });
  }

  // Security recommendations
  if (results.headers?.security) {
    results.headers.security.forEach(header => {
      if (header.status === 'warning' || header.status === 'error') {
        recommendations.push({
          title: `Add ${header.name} header`,
          description: header.description,
          priority: 'medium',
          category: 'security'
        });
      }
    });
  }

  // Links recommendations
  if (results.links?.external?.broken && results.links.external.broken > 0) {
    recommendations.push({
      title: 'Fix broken external links',
      description: `${results.links.external.broken} broken external links detected`,
      priority: 'high',
      category: 'links'
    });
  }

  // Robots/Sitemap recommendations
  if (results.robots) {
    if (!results.robots.robotsTxt?.found) {
      recommendations.push({
        title: 'Add robots.txt file',
        description: 'Create a robots.txt file to help search engines crawl your site',
        priority: 'medium',
        category: 'technical'
      });
    }
    if (!results.robots.sitemap?.found) {
      recommendations.push({
        title: 'Add XML sitemap',
        description: 'Create and submit an XML sitemap to help search engines index your pages',
        priority: 'medium',
        category: 'technical'
      });
    }
  }

  return recommendations;
}
