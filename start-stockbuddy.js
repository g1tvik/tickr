#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting StockBuddy - Complete Development Environment\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Check if required directories exist
const backendPath = path.join(__dirname, 'auth-backend');
const frontendPath = path.join(__dirname, 'stockbuddy');

if (!fs.existsSync(backendPath)) {
  log('❌ Backend directory not found!', 'red');
  log('Make sure the auth-backend folder exists in the project root.', 'yellow');
  process.exit(1);
}

if (!fs.existsSync(frontendPath)) {
  log('❌ Frontend directory not found!', 'red');
  log('Make sure the stockbuddy folder exists in the project root.', 'yellow');
  process.exit(1);
}

// Check if package.json files exist
const backendPackageJson = path.join(backendPath, 'package.json');
const frontendPackageJson = path.join(frontendPath, 'package.json');

if (!fs.existsSync(backendPackageJson)) {
  log('❌ Backend package.json not found!', 'red');
  log('Make sure to run "npm install" in the auth-backend directory.', 'yellow');
  process.exit(1);
}

if (!fs.existsSync(frontendPackageJson)) {
  log('❌ Frontend package.json not found!', 'red');
  log('Make sure to run "npm install" in the stockbuddy directory.', 'yellow');
  process.exit(1);
}

// Function to start a service
function startService(name, command, args, cwd, port) {
  return new Promise((resolve, reject) => {
    log(`📦 Starting ${name}...`, 'cyan');
    
    const service = spawn(command, args, {
      cwd: cwd,
      stdio: 'pipe',
      shell: true
    });

    let output = '';
    let errorOutput = '';

    service.stdout.on('data', (data) => {
      const message = data.toString();
      output += message;
      
      // Check for successful startup indicators
      if (name === 'Backend' && message.includes('Server running on port')) {
        log(`✅ ${name} is running on port ${port}`, 'green');
        resolve(service);
      } else if (name === 'Frontend' && (message.includes('Local:') || message.includes('localhost:'))) {
        log(`✅ ${name} is running on port ${port}`, 'green');
        resolve(service);
      }
      
      // Log output with service prefix
      message.split('\n').forEach(line => {
        if (line.trim()) {
          log(`[${name}] ${line}`, name === 'Backend' ? 'blue' : 'magenta');
        }
      });
    });

    service.stderr.on('data', (data) => {
      const message = data.toString();
      errorOutput += message;
      
      // Log errors with service prefix
      message.split('\n').forEach(line => {
        if (line.trim()) {
          log(`[${name} ERROR] ${line}`, 'red');
        }
      });
    });

    service.on('error', (error) => {
      log(`❌ Failed to start ${name}: ${error.message}`, 'red');
      reject(error);
    });

    service.on('close', (code) => {
      if (code !== 0) {
        log(`❌ ${name} stopped with code ${code}`, 'red');
        reject(new Error(`${name} stopped with code ${code}`));
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!service.killed) {
        log(`⏰ ${name} startup timeout - service may still be starting`, 'yellow');
        resolve(service);
      }
    }, 30000);
  });
}

// Main startup function
async function startStockBuddy() {
  try {
    log('🔧 Checking dependencies...', 'yellow');
    
    // Check if node_modules exist
    const backendNodeModules = path.join(backendPath, 'node_modules');
    const frontendNodeModules = path.join(frontendPath, 'node_modules');
    
    if (!fs.existsSync(backendNodeModules)) {
      log('📦 Installing backend dependencies...', 'yellow');
      await new Promise((resolve, reject) => {
        const install = spawn('npm', ['install'], { cwd: backendPath, stdio: 'inherit' });
        install.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error('Backend npm install failed'));
        });
      });
    }
    
    if (!fs.existsSync(frontendNodeModules)) {
      log('📦 Installing frontend dependencies...', 'yellow');
      await new Promise((resolve, reject) => {
        const install = spawn('npm', ['install'], { cwd: frontendPath, stdio: 'inherit' });
        install.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error('Frontend npm install failed'));
        });
      });
    }
    
    log('✅ Dependencies are ready!', 'green');
    
    // Start both services
    log('🚀 Launching services...', 'bright');
    
    const backend = await startService('Backend', 'npm', ['start'], backendPath, 5001);
    const frontend = await startService('Frontend', 'npm', ['run', 'dev'], frontendPath, 5173);
    
    log('\n🎉 StockBuddy is starting up!', 'green');
    log('📱 Frontend: http://localhost:5173', 'cyan');
    log('🔧 Backend: http://localhost:5001', 'cyan');
    log('\n💡 Tips:', 'yellow');
    log('• The frontend may take a moment to fully load', 'yellow');
    log('• Check the console for any error messages', 'yellow');
    log('• Press Ctrl+C to stop both services', 'yellow');
    
    // Handle graceful shutdown
    const shutdown = () => {
      log('\n🛑 Shutting down StockBuddy...', 'yellow');
      backend.kill('SIGINT');
      frontend.kill('SIGINT');
      
      setTimeout(() => {
        log('👋 Goodbye!', 'green');
        process.exit(0);
      }, 2000);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
  } catch (error) {
    log(`❌ Failed to start StockBuddy: ${error.message}`, 'red');
    log('\n🔧 Troubleshooting:', 'yellow');
    log('1. Make sure Node.js is installed', 'yellow');
    log('2. Check that ports 5001 and 5173 are available', 'yellow');
    log('3. Try running "npm install" in both auth-backend and stockbuddy directories', 'yellow');
    log('4. Check the console output above for specific errors', 'yellow');
    process.exit(1);
  }
}

// Start the application
startStockBuddy(); 