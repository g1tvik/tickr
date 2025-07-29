const fs = require('fs');

console.log('=== Simple Test ===');

try {
  const envContent = fs.readFileSync('.env', 'utf8');
  console.log('Raw env content:', envContent);
  
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
  
  console.log('Parsed env vars:', envVars);
  console.log('API Key:', envVars.ALPACA_API_KEY);
  console.log('Secret Key:', envVars.ALPACA_SECRET_KEY);
} catch (error) {
  console.error('Error:', error.message);
} 