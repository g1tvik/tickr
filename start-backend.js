// Simple script to start the backend server
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting StockBuddy Backend Server...\n');

// Change to the backend directory
process.chdir(path.join(__dirname, 'auth-backend'));

// Start the server
const server = spawn('npm', ['start'], {
  stdio: 'inherit',
  shell: true
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Make sure you have Node.js installed');
  console.log('2. Run "npm install" in the auth-backend folder');
  console.log('3. Check if port 5001 is available');
});

server.on('close', (code) => {
  console.log(`\n📴 Server stopped with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping server...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping server...');
  server.kill('SIGTERM');
  process.exit(0);
}); 