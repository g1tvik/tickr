#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Check if script is being called with arguments (from .bat file)
const args = process.argv.slice(2);
const isCalledFromBat = args.length > 0 || process.env.TICKR_FROM_BAT === 'true';

if (!isCalledFromBat) {
  console.log('🚀 Starting tickr - Complete Development Environment\n');
}

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
      if (name === 'Backend' && (message.includes('Server running on port') || message.includes('StockBuddy API running on port'))) {
        log(`✅ ${name} is running on port ${port}`, 'green');
        resolve(service);
      } else if (name === 'Frontend' && (message.includes('Local:') || message.includes('localhost:') || message.includes('ready in') || message.includes('VITE v'))) {
        // Extract the actual port from the output
        const portMatch = message.match(/localhost:(\d+)/);
        const actualPort = portMatch ? portMatch[1] : port;
        log(`✅ ${name} is running on port ${actualPort}`, 'green');
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

    // Timeout after 60 seconds (increased from 30)
    setTimeout(() => {
      if (!service.killed) {
        log(`⏰ ${name} startup timeout - service may still be starting`, 'yellow');
        resolve(service);
      }
    }, 60000);
  });
}

// Function to ask user if they want to restart
async function askForRestart() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    log('\n🔄 Would you like to restart tickr? (y/n)', 'yellow');
    rl.question('', (answer) => {
      rl.close();
      resolve(answer.toLowerCase().includes('y'));
    });
  });
}

// Function to show restart menu
async function showRestartMenu() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    log('\n🔄 tickr Services Stopped', 'yellow');
    log('What would you like to do?', 'cyan');
    log('1. Restart tickr', 'cyan');
    log('2. Exit', 'cyan');
    log('Enter your choice (1 or 2):', 'yellow');
    
    rl.question('', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Function to show main menu
async function showMainMenu() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    log('\n========================================', 'cyan');
    log('    tickr Development Environment', 'bright');
    log('========================================', 'cyan');
    log('Choose an option:', 'yellow');
    log('1. Start Both Services (Full)', 'cyan');
    log('2. Start Backend Only', 'cyan');
    log('3. Start Frontend Only', 'cyan');
    log('4. Quick Restart (Stop and restart both)', 'cyan');
    log('5. Check Status', 'cyan');
    log('6. Exit', 'cyan');
    log('Enter your choice (1-6):', 'yellow');
    
    rl.question('', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Function to start just backend
async function startBackendOnly() {
  try {
    log('🔧 Checking backend dependencies...', 'yellow');
    
    const backendNodeModules = path.join(backendPath, 'node_modules');
    
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
    
    log('✅ Backend dependencies are ready!', 'green');
    log('🚀 Starting backend only...', 'bright');
    
    const backend = await startService('Backend', 'npm', ['start'], backendPath, 5001);
    
    log('\n🎉 Backend is running!', 'green');
    log('🔧 Backend: http://localhost:5001', 'cyan');
    log('\n💡 Tips:', 'yellow');
    log('• Press Ctrl+C to stop the backend', 'yellow');
    log('• You can restart or start frontend later', 'yellow');
    
    // Handle graceful shutdown
    const shutdown = () => {
      log('\n🛑 Stopping backend...', 'yellow');
      backend.kill('SIGINT');
      setTimeout(() => {
        log('👋 Backend stopped!', 'green');
        process.exit(0);
      }, 2000);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
  } catch (error) {
    log(`❌ Failed to start backend: ${error.message}`, 'red');
    log('\n🔧 Troubleshooting:', 'yellow');
    log('1. Make sure Node.js is installed', 'yellow');
    log('2. Check that port 5001 is available', 'yellow');
    log('3. Try running "npm install" in the auth-backend directory', 'yellow');
    process.exit(1);
  }
}

// Function to start just frontend
async function startFrontendOnly() {
  try {
    log('🔧 Checking frontend dependencies...', 'yellow');
    
    const frontendNodeModules = path.join(frontendPath, 'node_modules');
    
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
    
    log('✅ Frontend dependencies are ready!', 'green');
    log('🚀 Starting frontend only...', 'bright');
    
    const frontend = await startService('Frontend', 'npm', ['run', 'dev'], frontendPath, 5173);
    
    log('\n🎉 Frontend is running!', 'green');
    log('📱 Frontend: http://localhost:5173', 'cyan');
    log('\n💡 Tips:', 'yellow');
    log('• Press Ctrl+C to stop the frontend', 'yellow');
    log('• You can restart or start backend later', 'yellow');
    log('• Note: Some features may not work without backend', 'yellow');
    
    // Handle graceful shutdown
    const shutdown = () => {
      log('\n🛑 Stopping frontend...', 'yellow');
      frontend.kill('SIGINT');
      setTimeout(() => {
        log('👋 Frontend stopped!', 'green');
        process.exit(0);
      }, 2000);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
  } catch (error) {
    log(`❌ Failed to start frontend: ${error.message}`, 'red');
    log('\n🔧 Troubleshooting:', 'yellow');
    log('1. Make sure Node.js is installed', 'yellow');
    log('2. Check that port 5173 is available', 'yellow');
    log('3. Try running "npm install" in the stockbuddy directory', 'yellow');
    process.exit(1);
  }
}

// Function to check status and return to menu
async function checkStatusAndReturn() {
  const axios = require('axios');
  
  log('🔍 Checking StockBuddy Services Status...\n', 'cyan');
  
  async function checkService(name, url, timeout = 5000) {
    try {
      const response = await axios.get(url, { timeout });
      log(`✅ ${name} is running (${response.status})`, 'green');
      return true;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        log(`❌ ${name} is not running (connection refused)`, 'red');
      } else if (error.code === 'ETIMEDOUT') {
        log(`⏰ ${name} is not responding (timeout)`, 'yellow');
      } else {
        log(`❌ ${name} error: ${error.message}`, 'red');
      }
      return false;
    }
  }
  
  const backendRunning = await checkService('Backend API', 'http://localhost:5001');
  const frontendRunning = await checkService('Frontend App', 'http://localhost:5173');
  
  log('\n📊 Summary:', 'cyan');
  if (backendRunning && frontendRunning) {
    log('🎉 All services are running!', 'green');
    log('📱 Frontend: http://localhost:5173', 'cyan');
    log('🔧 Backend: http://localhost:5001', 'cyan');
  } else if (backendRunning) {
    log('✅ Backend is running, Frontend is not', 'yellow');
    log('🔧 Backend: http://localhost:5001', 'cyan');
  } else if (frontendRunning) {
    log('✅ Frontend is running, Backend is not', 'yellow');
    log('📱 Frontend: http://localhost:5173', 'cyan');
  } else {
    log('⚠️ No services are running', 'red');
  }
  
  // Return to main menu
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    log('\nPress Enter to return to main menu...', 'yellow');
    rl.question('', () => {
      rl.close();
      resolve();
    });
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
    
    log('\n🎉 tickr is starting up!', 'green');
    log('📱 Frontend: http://localhost:5173', 'cyan');
    log('🔧 Backend: http://localhost:5001', 'cyan');
    log('\n💡 Tips:', 'yellow');
    log('• The frontend may take a moment to fully load', 'yellow');
    log('• Check the console for any error messages', 'yellow');
    log('• Press Ctrl+C to stop both services', 'yellow');
    log('• You can restart the services after stopping', 'yellow');
    
    // Handle graceful shutdown
    const shutdown = async () => {
      log('\n🛑 Shutting down tickr...', 'yellow');
      if (backend && !backend.killed) {
        backend.kill('SIGINT');
      }
      if (frontend && !frontend.killed) {
        frontend.kill('SIGINT');
      }
      
      // Wait a moment for services to stop
      setTimeout(async () => {
        const choice = await showRestartMenu();
        
        if (choice === '1') {
          log('\n🔄 Restarting tickr...', 'green');
          // Restart the application
          startStockBuddy();
        } else {
           log('\n🔄 Returning to main menu...', 'green');
          // Return to main menu instead of exiting
          mainMenu();
        }
      }, 2000);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
  } catch (error) {
    log(`❌ Failed to start tickr: ${error.message}`, 'red');
    log('\n🔧 Troubleshooting:', 'yellow');
    log('1. Make sure Node.js is installed', 'yellow');
    log('2. Check that ports 5001 and 5173 are available', 'yellow');
    log('3. Try running "npm install" in both auth-backend and tickr directories', 'yellow');
    log('4. Check the console output above for specific errors', 'yellow');
    
    // Ask if user wants to retry
    const retry = await askForRestart();
    if (retry) {
      log('\n🔄 Retrying...', 'green');
      startStockBuddy();
    } else {
      process.exit(1);
    }
  }
}

// Main menu function
async function mainMenu() {
  while (true) {
    const choice = await showMainMenu();
    
    switch (choice) {
      case '1':
        // Start both services
        startStockBuddy();
        return; // Exit menu loop when starting services
      case '2':
        // Start backend only
        startBackendOnly();
        return; // Exit menu loop when starting services
      case '3':
        // Start frontend only
        startFrontendOnly();
        return; // Exit menu loop when starting services
      case '4':
        // Quick restart
        log('\n🔄 Running quick restart...', 'green');
        require('./restart-tickr.js');
        return; // Exit menu loop when starting services
      case '5':
        // Check status
        await checkStatusAndReturn();
        // Continue loop to show menu again
        break;
      case '6':
        // Exit
        log('👋 Goodbye!', 'green');
        // Close the terminal completely when exiting from main menu
        if (isCalledFromBat) {
          // If called from batch file, close the terminal window
          log('\n🔄 Closing terminal...', 'yellow');
          // Use a special exit code to signal the batch file to close
          process.exit(999);
        } else {
          // If running standalone, just exit normally
          process.exit(0);
        }
      default:
        log('❌ Invalid choice. Please try again.', 'red');
        break;
    }
  }
}

// Handle different startup modes
if (isCalledFromBat) {
  // If called from .bat file, check for specific arguments
  const mode = args[0] || 'both';
  
  switch (mode) {
    case 'backend':
      startBackendOnly();
      break;
    case 'frontend':
      startFrontendOnly();
      break;
    case 'both':
    default:
      startStockBuddy();
      break;
  }
} else {
  // Start the main menu
  mainMenu();
} 