#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔄 Quick Restart - tickr Services\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Check if services are running
async function checkIfRunning() {
  const { spawn } = require('child_process');
  
  return new Promise((resolve) => {
    const check = spawn('netstat', ['-an'], { shell: true });
    let output = '';
    
    check.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    check.on('close', () => {
      const backendRunning = output.includes(':5001') && output.includes('LISTENING');
      const frontendRunning = output.includes(':5173') && output.includes('LISTENING');
      resolve({ backendRunning, frontendRunning });
    });
  });
}

// Kill processes on ports
async function killProcesses() {
  return new Promise((resolve) => {
    log('🛑 Stopping existing services...', 'yellow');
    
    // Kill processes on port 5001 (backend)
    const killBackend = spawn('netstat', ['-ano'], { shell: true });
    let backendPids = [];
    
    killBackend.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.includes(':5001') && line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          if (parts.length > 4) {
            backendPids.push(parts[4]);
          }
        }
      });
    });
    
    killBackend.on('close', () => {
      backendPids.forEach(pid => {
        try {
          spawn('taskkill', ['/PID', pid, '/F'], { shell: true });
        } catch (e) {
          // Ignore errors
        }
      });
      
      // Kill processes on port 5173 (frontend)
      const killFrontend = spawn('netstat', ['-ano'], { shell: true });
      let frontendPids = [];
      
      killFrontend.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
          if (line.includes(':5173') && line.includes('LISTENING')) {
            const parts = line.trim().split(/\s+/);
            if (parts.length > 4) {
              frontendPids.push(parts[4]);
            }
          }
        });
      });
      
      killFrontend.on('close', () => {
        frontendPids.forEach(pid => {
          try {
            spawn('taskkill', ['/PID', pid, '/F'], { shell: true });
          } catch (e) {
            // Ignore errors
          }
        });
        
        setTimeout(() => {
          log('✅ Services stopped', 'green');
          resolve();
        }, 1000);
      });
    });
  });
}

// Quick restart function
async function quickRestart() {
  try {
    // Check if services are already running
    const { backendRunning, frontendRunning } = await checkIfRunning();
    
    if (backendRunning || frontendRunning) {
      log('⚠️ Services are already running. Stopping them first...', 'yellow');
      await killProcesses();
    }
    
    // Wait a moment for ports to be freed
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    log('🚀 Starting services...', 'cyan');
    
    // Start backend
    const backend = spawn('npm', ['start'], {
      cwd: path.join(__dirname, 'auth-backend'),
      stdio: 'pipe',
      shell: true
    });
    
    // Start frontend
    const frontend = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'stockbuddy'),
      stdio: 'pipe',
      shell: true
    });
    
    // Handle output
    backend.stdout.on('data', (data) => {
      const message = data.toString();
      message.split('\n').forEach(line => {
        if (line.trim()) {
          log(`[Backend] ${line}`, 'blue');
        }
      });
    });
    
    frontend.stdout.on('data', (data) => {
      const message = data.toString();
      message.split('\n').forEach(line => {
        if (line.trim()) {
          log(`[Frontend] ${line}`, 'magenta');
        }
      });
    });
    
    // Handle errors
    backend.stderr.on('data', (data) => {
      log(`[Backend ERROR] ${data.toString()}`, 'red');
    });
    
    frontend.stderr.on('data', (data) => {
      log(`[Frontend ERROR] ${data.toString()}`, 'red');
    });
    
    // Wait for services to start
    setTimeout(() => {
      log('\n🎉 tickr restarted successfully!', 'green');
      log('📱 Frontend: http://localhost:5173', 'cyan');
      log('🔧 Backend: http://localhost:5001', 'cyan');
      log('\n💡 Press Ctrl+C to stop services', 'yellow');
    }, 5000);
    
    // Handle shutdown
    const shutdown = () => {
      log('\n🛑 Stopping services...', 'yellow');
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
    log(`❌ Restart failed: ${error.message}`, 'red');
    log('Try running the full startup script: node start-tickr.js', 'yellow');
    process.exit(1);
  }
}

// Run the quick restart
quickRestart(); 