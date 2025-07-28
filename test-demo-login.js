// Test demo login
const fetch = require('node-fetch');

async function testDemoLogin() {
  console.log('🔍 Testing Demo Login...\n');
  
  try {
    const response = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'demo@stockbuddy.com',
        password: 'demo123'
      })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    if (response.ok) {
      console.log('✅ Demo login successful!');
      console.log('Token received:', !!data.token);
      console.log('User:', data.user.name);
    } else {
      console.log('❌ Demo login failed:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDemoLogin(); 