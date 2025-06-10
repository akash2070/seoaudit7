const express = require('express');
const path = require('path');
const fs = require('fs');
const { config } = require('dotenv');

// Load environment variables
config();

const app = express();

// Security headers
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Cache headers for performance
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
  } else if (req.path.endsWith('.html') || req.path === '/') {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.setHeader('ETag', `"${Date.now()}"`);
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
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

// Import and register API routes
async function startServer() {
  try {
    // Dynamically import the compiled routes
    let registerRoutes;
    try {
      const routesModule = require('./dist/routes.js');
      registerRoutes = routesModule.registerRoutes || routesModule.default?.registerRoutes;
    } catch (err) {
      console.error('Failed to load compiled routes, trying direct import:', err.message);
      // Fallback to direct TypeScript compilation
      require('esbuild').buildSync({
        entryPoints: ['server/routes.ts'],
        outdir: 'dist',
        platform: 'node',
        format: 'cjs',
        bundle: true,
        external: ['express', 'axios', 'cheerio', 'dotenv', 'zod']
      });
      const routesModule = require('./dist/routes.js');
      registerRoutes = routesModule.registerRoutes || routesModule.default?.registerRoutes;
    }

    if (!registerRoutes) {
      throw new Error('Could not find registerRoutes function');
    }

    // Register API routes
    const server = await registerRoutes(app);

    // Serve static files from public directory
    const publicPath = path.resolve(__dirname, '..', 'public');
    
    if (fs.existsSync(publicPath)) {
      app.use(express.static(publicPath));
      
      // Fall through to index.html for SPA routes
      app.use("*", (_req, res) => {
        res.sendFile(path.resolve(publicPath, "index.html"));
      });
    } else {
      console.error(`Build directory not found: ${publicPath}`);
      process.exit(1);
    }

    // Error handler
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error(err);
    });

    const port = process.env.PORT || 5000;
    server.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();