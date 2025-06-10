const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function buildAndStart() {
  console.log('Starting WebSeoScanner deployment...');
  
  // Check if client directory exists
  const clientPath = path.join(__dirname, 'client');
  if (!fs.existsSync(clientPath)) {
    console.error('Client directory not found');
    process.exit(1);
  }
  
  // Build client
  console.log('Building client...');
  const buildProcess = spawn('npm', ['install'], { 
    cwd: clientPath, 
    stdio: 'inherit',
    shell: true 
  });
  
  buildProcess.on('close', (code) => {
    if (code !== 0) {
      console.error('Client install failed');
      process.exit(1);
    }
    
    // Run client build
    const buildClientProcess = spawn('npm', ['run', 'build'], { 
      cwd: clientPath, 
      stdio: 'inherit',
      shell: true 
    });
    
    buildClientProcess.on('close', (buildCode) => {
      if (buildCode !== 0) {
        console.error('Client build failed');
        process.exit(1);
      }
      
      // Start server
      console.log('Starting server...');
      require('./railway-deploy.cjs');
    });
  });
}

buildAndStart().catch(console.error);