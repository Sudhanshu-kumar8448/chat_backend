const axios = require('axios');
const WebSocket = require('ws');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// UPDATE THIS WITH YOUR RENDER URL
const BASE_URL = 'https://chat-backend-ehww.onrender.com/api';
const WS_URL = 'wss://chat-backend-ehww.onrender.com';
const HEALTH_URL = 'https://chat-backend-ehww.onrender.com/health';

// Test Firebase ID Token (You'll need to get this from your Flutter app)
// To get this token:
// 1. Login to your Flutter app with Firebase Auth
// 2. Call: final token = await FirebaseAuth.instance.currentUser?.getIdToken();
// 3. Replace the token below
const FIREBASE_TOKEN = 'YOUR_FIREBASE_ID_TOKEN_HERE';

console.log('🚀 RENDER DEPLOYMENT TEST SUITE');
console.log('===============================');
console.log(`Testing server at: ${BASE_URL.replace('/api', '')}`);
console.log('');

// Test results tracking
const results = {
  health: false,
  apiDocs: false,
  publicUsers: false,
  publicCommunities: false,
  protectedUsers: false,
  protectedCommunities: false,
  messages: false,
  notifications: false,
  fileUpload: false,
  reports: false,
  websocket: false,
  authentication: false,
  cors: false,
  rateLimiting: false
};

let testCount = 0;
let passedTests = 0;

// Helper function to log test results
function logTest(testName, success, details = '', expected = true) {
  testCount++;
  if (success === expected) passedTests++;

  const status = (success === expected) ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  if (details) console.log(`   ${details}`);
  console.log('');
}

// Helper function to get auth headers
function getAuthHeaders(includeToken = false) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (includeToken && FIREBASE_TOKEN && FIREBASE_TOKEN !== 'YOUR_FIREBASE_ID_TOKEN_HERE') {
    headers['Authorization'] = `Bearer ${FIREBASE_TOKEN}`;
  }
  
  return headers;
}

// Test 1: Server Health Check
async function testHealth() {
  try {
    const response = await axios.get(HEALTH_URL, { timeout: 10000 });
    const success = response.status === 200 && response.data.success;
    results.health = success;
    
    if (success) {
      logTest('Server Health Check', success, 
        `✅ Server is running!\n   Response: ${response.data.message}\n   Connected Users: ${response.data.connectedUsers || 0}`);
    } else {
      logTest('Server Health Check', false, `Unexpected response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    logTest('Server Health Check', false, 
      `❌ Server is not accessible!\n   Error: ${error.message}\n   💡 Check if your Render app is deployed and running`);
  }
}

// Test 2: API Documentation
async function testApiDocs() {
  try {
    const response = await axios.get(`${BASE_URL.replace('/api', '')}/api-docs`, { timeout: 10000 });
    const success = response.status === 200;
    results.apiDocs = success;
    logTest('API Documentation', success, success ? 'Swagger docs are accessible' : 'Docs not accessible');
  } catch (error) {
    logTest('API Documentation', false, `Error: ${error.response?.status || error.message}`);
  }
}

// Test 3: Public Users API (No auth required)
async function testPublicUsers() {
  try {
    const response = await axios.get(`${BASE_URL}/users`, {
      headers: getAuthHeaders(false),
      timeout: 10000
    });
    
    const success = response.status === 200 && response.data.success;
    results.publicUsers = success;
    
    if (success) {
      logTest('Public Users API', success, 
        `Found ${response.data.count || 0} users\n   Database is working and returning data`);
    } else {
      logTest('Public Users API', false, `Unexpected response: ${response.status}`);
    }
  } catch (error) {
    logTest('Public Users API', false, 
      `Error: ${error.response?.status || error.message}\n   This might indicate database connection issues`);
  }
}

// Test 4: Public Communities API (No auth required)
async function testPublicCommunities() {
  try {
    const response = await axios.get(`${BASE_URL}/communities`, {
      headers: getAuthHeaders(false),
      timeout: 10000
    });
    
    const success = response.status === 200 && response.data.success;
    results.publicCommunities = success;
    
    if (success) {
      logTest('Public Communities API', success, 
        `Found ${response.data.count || 0} communities\n   Community system is working`);
    } else {
      logTest('Public Communities API', false, `Unexpected response: ${response.status}`);
    }
  } catch (error) {
    logTest('Public Communities API', false, `Error: ${error.response?.status || error.message}`);
  }
}

// Test 5: Protected User Profile (Requires auth)
async function testProtectedUsers() {
  if (!FIREBASE_TOKEN || FIREBASE_TOKEN === 'YOUR_FIREBASE_ID_TOKEN_HERE') {
    logTest('Protected User Profile', false, 
      '⚠️  No Firebase token provided\n   To test: Get token from Flutter app and update FIREBASE_TOKEN variable');
    return;
  }

  try {
    const response = await axios.get(`${BASE_URL}/users/profile`, {
      headers: getAuthHeaders(true),
      timeout: 10000
    });
    
    const success = response.status === 200 && response.data.success;
    results.protectedUsers = success;
    
    if (success) {
      logTest('Protected User Profile', success, 
        `✅ Firebase authentication is working!\n   User: ${response.data.data.displayName || 'Unknown'}\n   Email: ${response.data.data.email || 'Not provided'}`);
    } else {
      logTest('Protected User Profile', false, `Unexpected response: ${response.status}`);
    }
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('Protected User Profile', false, 
        '🔐 Authentication failed\n   Firebase token might be expired or invalid\n   Get a fresh token from your Flutter app');
    } else {
      logTest('Protected User Profile', false, `Error: ${error.response?.status || error.message}`);
    }
  }
}

// Test 6: Authentication Check (Should fail without token)
async function testAuthentication() {
  try {
    const response = await axios.get(`${BASE_URL}/users/profile`, {
      headers: getAuthHeaders(false), // No token
      timeout: 10000
    });
    
    // Should fail with 401
    logTest('Authentication Check', false, 'Authentication should have failed but didn\'t');
  } catch (error) {
    if (error.response?.status === 401) {
      results.authentication = true;
      logTest('Authentication Check', true, 
        '🔐 Authentication is properly enforced\n   Unauthorized requests are correctly rejected');
    } else {
      logTest('Authentication Check', false, `Unexpected error: ${error.response?.status || error.message}`);
    }
  }
}

// Test 7: Messages API (Protected)
async function testMessages() {
  if (!FIREBASE_TOKEN || FIREBASE_TOKEN === 'YOUR_FIREBASE_ID_TOKEN_HERE') {
    logTest('Messages API', false, '⚠️  No Firebase token provided for protected endpoint');
    return;
  }

  try {
    const response = await axios.get(`${BASE_URL}/messages`, {
      headers: getAuthHeaders(true),
      timeout: 10000
    });
    
    const success = response.status === 200;
    results.messages = success;
    logTest('Messages API', success, success ? 'Messages endpoint is accessible' : 'Messages endpoint failed');
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('Messages API', false, 'Authentication failed - check Firebase token');
    } else {
      logTest('Messages API', false, `Error: ${error.response?.status || error.message}`);
    }
  }
}

// Test 8: Notifications API (Protected)
async function testNotifications() {
  if (!FIREBASE_TOKEN || FIREBASE_TOKEN === 'YOUR_FIREBASE_ID_TOKEN_HERE') {
    logTest('Notifications API', false, '⚠️  No Firebase token provided for protected endpoint');
    return;
  }

  try {
    const response = await axios.get(`${BASE_URL}/notifications`, {
      headers: getAuthHeaders(true),
      timeout: 10000
    });
    
    const success = response.status === 200;
    results.notifications = success;
    logTest('Notifications API', success, success ? 'Notifications endpoint is accessible' : 'Notifications endpoint failed');
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('Notifications API', false, 'Authentication failed - check Firebase token');
    } else {
      logTest('Notifications API', false, `Error: ${error.response?.status || error.message}`);
    }
  }
}

// Test 9: File Upload API (Protected)
async function testFileUpload() {
  if (!FIREBASE_TOKEN || FIREBASE_TOKEN === 'YOUR_FIREBASE_ID_TOKEN_HERE') {
    logTest('File Upload API', false, '⚠️  No Firebase token provided for protected endpoint');
    return;
  }

  try {
    // Create a small test file
    const testContent = 'This is a test file for upload functionality on Render';
    const testFilePath = path.join(__dirname, 'render-test-upload.txt');
    fs.writeFileSync(testFilePath, testContent);

    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath));

    const response = await axios.post(`${BASE_URL}/upload`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${FIREBASE_TOKEN}`,
      },
      timeout: 15000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    const success = response.status === 200 && response.data.success;
    results.fileUpload = success;
    
    if (success) {
      logTest('File Upload API', success, 
        `✅ File upload is working!\n   File URL: ${response.data.data.url}\n   File size: ${response.data.data.size} bytes`);
    } else {
      logTest('File Upload API', false, `Upload failed: ${response.data.message || 'Unknown error'}`);
    }

    // Clean up test file
    try {
      fs.unlinkSync(testFilePath);
    } catch (e) {
      // Ignore cleanup errors
    }

  } catch (error) {
    logTest('File Upload API', false, 
      `Error: ${error.response?.status || error.message}\n   ${error.response?.status === 401 ? 'Authentication failed' : 'Upload system may not be working'}`);
    
    // Clean up test file on error
    try {
      const testFilePath = path.join(__dirname, 'render-test-upload.txt');
      fs.unlinkSync(testFilePath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

// Test 10: WebSocket Connection
async function testWebSocket() {
  if (!FIREBASE_TOKEN || FIREBASE_TOKEN === 'YOUR_FIREBASE_ID_TOKEN_HERE') {
    logTest('WebSocket Connection', false, '⚠️  No Firebase token provided for WebSocket auth');
    return;
  }

  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(WS_URL, [], {
        headers: {
          'Authorization': `Bearer ${FIREBASE_TOKEN}`
        }
      });

      const timeout = setTimeout(() => {
        logTest('WebSocket Connection', false, 'Connection timeout (10 seconds)');
        ws.close();
        resolve();
      }, 10000);

      ws.on('open', () => {
        clearTimeout(timeout);
        results.websocket = true;
        logTest('WebSocket Connection', true, 
          '🌐 Real-time WebSocket is working!\n   Your app can now support live messaging');
        ws.close();
        resolve();
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        logTest('WebSocket Connection', false, 
          `Connection failed: ${error.message}\n   Real-time features may not work`);
        resolve();
      });

    } catch (error) {
      logTest('WebSocket Connection', false, `Setup error: ${error.message}`);
      resolve();
    }
  });
}

// Test 11: CORS Headers
async function testCORS() {
  try {
    const response = await axios.options(`${BASE_URL}/communities`, {
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'GET'
      },
      timeout: 10000
    });

    const hasCORS = response.headers['access-control-allow-origin'] || 
                    response.headers['access-control-allow-methods'];
    
    results.cors = !!hasCORS;
    logTest('CORS Configuration', !!hasCORS, 
      hasCORS ? '🌐 CORS is properly configured for cross-origin requests' : 'CORS headers not found');
  } catch (error) {
    // CORS preflight might not be implemented, try a regular request
    try {
      const response = await axios.get(`${BASE_URL}/communities`);
      const hasCORS = response.headers['access-control-allow-origin'];
      results.cors = !!hasCORS;
      logTest('CORS Configuration', !!hasCORS, 
        hasCORS ? 'CORS headers present in response' : 'CORS headers not found in response');
    } catch (e) {
      logTest('CORS Configuration', false, `Error testing CORS: ${error.message}`);
    }
  }
}

// Test 12: Rate Limiting
async function testRateLimiting() {
  try {
    const promises = [];
    // Make multiple requests quickly to test rate limiting
    for (let i = 0; i < 20; i++) {
      promises.push(
        axios.get(`${BASE_URL}/communities`, { 
          headers: getAuthHeaders(false),
          timeout: 5000
        }).catch(err => err.response)
      );
    }

    const responses = await Promise.all(promises);
    const rateLimitedCount = responses.filter(
      r => r && (r.status === 429 || (r.data && r.data.message && r.data.message.includes('rate')))
    ).length;

    const success = rateLimitedCount > 0;
    results.rateLimiting = success;
    
    logTest('Rate Limiting', success, 
      success 
        ? `🛡️  Rate limiting is working! ${rateLimitedCount} requests were limited`
        : '⚠️  Rate limiting might not be active (this could be normal for light testing)');
  } catch (error) {
    logTest('Rate Limiting', false, `Error testing rate limits: ${error.message}`);
  }
}

// Test 13: Error Handling (404)
async function testErrorHandling() {
  try {
    const response = await axios.get(`${BASE_URL}/nonexistent-endpoint`, { timeout: 10000 });
    logTest('Error Handling (404)', false, `Expected 404 but got ${response.status}`);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      logTest('Error Handling (404)', true, 
        '🔧 404 error handling is working correctly\n   Invalid endpoints return proper error responses');
    } else {
      logTest('Error Handling (404)', false, `Unexpected error: ${error.response?.status || error.message}`);
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Starting comprehensive Render deployment test...\n');

  // Basic connectivity tests
  await testHealth();
  await testApiDocs();
  await testErrorHandling();

  // Database and API tests
  await testPublicUsers();
  await testPublicCommunities();

  // Authentication tests
  await testAuthentication();
  await testProtectedUsers();
  await testMessages();
  await testNotifications();

  // File upload test
  await testFileUpload();

  // Real-time features
  await testWebSocket();

  // Security and performance
  await testCORS();
  await testRateLimiting();

  // Final results
  console.log('\n🎯 RENDER DEPLOYMENT TEST RESULTS');
  console.log('==================================');

  const totalTests = testCount;
  const criticalTests = ['health', 'publicUsers', 'publicCommunities', 'authentication'];
  const criticalPassed = criticalTests.filter(test => results[test]).length;

  console.log(`\n📊 Overall Results:`);
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);
  console.log(`🔑 Critical Tests: ${criticalPassed}/${criticalTests.length} passed`);

  console.log('\n🔍 Detailed Results:');
  Object.entries(results).forEach(([test, passed]) => {
    const isCritical = criticalTests.includes(test);
    const symbol = passed ? '✅' : '❌';
    const critical = isCritical ? ' [CRITICAL]' : '';
    console.log(`${symbol} ${test.replace(/([A-Z])/g, ' $1').toLowerCase()}${critical}`);
  });

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (!results.health) {
    console.log('🚨 CRITICAL: Server health check failed');
    console.log('   • Check if your Render app is deployed and running');
    console.log('   • Verify the BASE_URL is correct');
    console.log('   • Check Render logs for startup errors');
  }
  
  if (!results.publicUsers || !results.publicCommunities) {
    console.log('🚨 CRITICAL: Database connection issues detected');
    console.log('   • Check MongoDB Atlas connection string in Render environment variables');
    console.log('   • Verify MongoDB Atlas allows connections from all IPs (0.0.0.0/0)');
    console.log('   • Check Render logs for database errors');
  }
  
  if (!results.authentication) {
    console.log('⚠️  Authentication system needs attention');
    console.log('   • Check Firebase configuration in Render environment variables');
    console.log('   • Verify Firebase private key format is correct');
  }
  
  if (FIREBASE_TOKEN === 'YOUR_FIREBASE_ID_TOKEN_HERE') {
    console.log('📱 To test protected endpoints:');
    console.log('   1. Login to your Flutter app with Firebase Auth');
    console.log('   2. Get ID token: await FirebaseAuth.instance.currentUser?.getIdToken()');
    console.log('   3. Update FIREBASE_TOKEN variable in this test file');
    console.log('   4. Run the test again');
  }

  // Overall assessment
  if (criticalPassed === criticalTests.length && passedTests >= totalTests * 0.7) {
    console.log('\n🎉 DEPLOYMENT SUCCESSFUL!');
    console.log('✅ Your backend is production-ready on Render!');
    console.log('🚀 You can now connect your Flutter app to this server.');
    console.log(`\n📱 Flutter App Configuration:`);
    console.log(`const String baseUrl = '${BASE_URL}';`);
    console.log(`const String websocketUrl = '${WS_URL}';`);
  } else if (criticalPassed === criticalTests.length) {
    console.log('\n👍 DEPLOYMENT MOSTLY SUCCESSFUL!');
    console.log('✅ Core functionality is working');
    console.log('⚠️  Some advanced features need attention (see above)');
  } else {
    console.log('\n🔧 DEPLOYMENT NEEDS ATTENTION!');
    console.log('❌ Critical issues detected that need to be fixed');
    console.log('📋 Review the failed tests and recommendations above');
  }

  process.exit(criticalPassed === criticalTests.length ? 0 : 1);
}

// Instructions
console.log('📋 SETUP INSTRUCTIONS:');
console.log('1. Update BASE_URL and WS_URL with your actual Render URLs');
console.log('2. (Optional) Add your Firebase ID token to FIREBASE_TOKEN for full testing');
console.log('3. Run: node render-test.js');
console.log('');

// Check if URLs are updated
if (BASE_URL.includes('your-app-name') || WS_URL.includes('your-app-name')) {
  console.log('⚠️  WARNING: Please update the URLs at the top of this file with your actual Render URLs!');
  console.log('');
}

// Run tests
runAllTests().catch(console.error);
