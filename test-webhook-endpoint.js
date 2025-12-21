/**
 * Simple script to test the achievement webhook endpoint
 * Run this before setting up n8n to make sure your backend is working
 * 
 * Usage:
 *   node test-webhook-endpoint.js
 *   node test-webhook-endpoint.js https://your-backend-url.com
 */

const backendUrl = process.argv[2] || 'http://localhost:4000';
const endpoint = `${backendUrl}/api/webhook/check-achievements`;

console.log('🧪 Testing Achievement Webhook Endpoint');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📍 URL: ${endpoint}`);
console.log('');

// Check if fetch is available (Node.js 18+)
let fetch;
try {
  fetch = require('node-fetch');
} catch (e) {
  // Node.js 18+ has fetch built-in
  if (typeof globalThis.fetch === 'undefined') {
    console.error('❌ Error: This script requires Node.js 18+ or node-fetch package');
    console.error('   Install node-fetch: npm install node-fetch');
    process.exit(1);
  }
  fetch = globalThis.fetch;
}

async function testEndpoint() {
  try {
    console.log('⏳ Sending POST request...');
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log('');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response:');
      console.error(errorText);
      return;
    }

    const data = await response.json();
    
    console.log('✅ Success! Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
    
    if (data.success) {
      console.log('🎉 Your endpoint is working correctly!');
      console.log('');
      console.log('📋 Summary:');
      console.log(`   • Total users checked: ${data.results?.totalUsers || 0}`);
      console.log(`   • Notifications sent: ${data.results?.notificationsSent || 0}`);
      console.log(`   • Users with all achievements: ${data.results?.usersWithAllAchievements || 0}`);
      console.log('');
      console.log('✅ Ready to set up n8n workflow!');
    } else {
      console.log('⚠️  Endpoint responded but reported an error');
    }

  } catch (error) {
    console.error('❌ Error testing endpoint:');
    console.error(`   ${error.message}`);
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('   1. Make sure your backend server is running');
    console.log('   2. Check that the URL is correct');
    console.log('   3. Verify the endpoint exists: /api/webhook/check-achievements');
    console.log('   4. Check your backend server logs for errors');
  }
}

testEndpoint();

