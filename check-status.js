#!/usr/bin/env node

const axios = require('axios');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

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

async function checkStockBuddyStatus() {
  console.log('🔍 Checking StockBuddy Services Status...\n');
  
  const backendRunning = await checkService('Backend API', 'http://localhost:5001');
  const frontendRunning = await checkService('Frontend App', 'http://localhost:5173');
  
  console.log('\n📊 Summary:');
  if (backendRunning && frontendRunning) {
    log('🎉 All services are running!', 'green');
    log('📱 Frontend: http://localhost:5173', 'cyan');
    log('🔧 Backend: http://localhost:5001', 'cyan');
    log('\n💡 You can now open your browser and navigate to http://localhost:5173', 'yellow');
  } else {
    log('⚠️ Some services are not running properly', 'yellow');
    log('\n🔧 Troubleshooting:', 'yellow');
    log('1. Make sure you ran the startup script: node start-stockbuddy.js', 'yellow');
    log('2. Check that ports 5001 and 5173 are not in use by other applications', 'yellow');
    log('3. Try restarting the services', 'yellow');
  }
}

checkStockBuddyStatus(); 