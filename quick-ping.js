const axios = require('axios');

const BASE_URL = 'https://chat-backend-ehww.onrender.com';

async function quickPing() {
  console.log('🏃‍♂️ Quick Render Status Check');
  console.log('=============================');
  console.log(`Testing: ${BASE_URL}`);
  console.log('');

  try {
    console.log('⏳ Checking server status...');
    const response = await axios.get(`${BASE_URL}/health`, { 
      timeout: 30000 // 30 second timeout for slow starts
    });
    
    if (response.status === 200) {
      console.log('✅ SUCCESS! Your server is running!');
      console.log(`📊 Response: ${response.data.message}`);
      console.log(`👥 Connected Users: ${response.data.connectedUsers || 0}`);
      console.log('');
      console.log('🎉 You can now run the full test suite:');
      console.log('npm run test:render');
    } else {
      console.log(`⚠️  Server responded but with status: ${response.status}`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Connection refused - app is not running');
    } else if (error.response?.status === 502) {
      console.log('❌ 502 Bad Gateway - app is not running properly');
      console.log('');
      console.log('🔍 Common causes:');
      console.log('1. App is still deploying (check Render dashboard)');
      console.log('2. Build failed (check Render logs)');
      console.log('3. Environment variables missing');
      console.log('4. Port configuration issue');
    } else if (error.code === 'ENOTFOUND') {
      console.log('❌ Domain not found - check your Render URL');
    } else {
      console.log(`❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
      }
    }
    
    console.log('');
    console.log('📋 Troubleshooting steps:');
    console.log('1. Check Render dashboard for deployment status');
    console.log('2. Review Render logs for errors');
    console.log('3. Verify environment variables are set');
    console.log('4. Try manual redeploy if needed');
  }
}

quickPing();
