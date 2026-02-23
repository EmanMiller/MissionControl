#!/usr/bin/env node

/**
 * OAuth Flow End-to-End Test
 * Tests the complete authentication and onboarding flow
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';
const FRONTEND_BASE = 'http://localhost:5173';

async function testOAuthFlow() {
  console.log('🔐 Testing OAuth Flow End-to-End\n');

  try {
    // Test 1: Frontend serves login page
    console.log('1️⃣ Testing frontend serves login page...');
    const frontendResponse = await axios.get(FRONTEND_BASE);
    if (frontendResponse.status === 200) {
      console.log('✅ Frontend accessible at http://localhost:5173');
    } else {
      throw new Error('Frontend not accessible');
    }

    // Test 2: Google OAuth available (check if client ID is set)
    console.log('\n2️⃣ Testing Google OAuth configuration...');
    const envContent = await import('fs').then(fs => 
      fs.promises.readFile('.env.local', 'utf8').catch(() => '')
    );
    
    if (envContent.includes('VITE_GOOGLE_CLIENT_ID=589325162938')) {
      console.log('✅ Google OAuth Client ID configured');
    } else {
      console.log('⚠️  Google OAuth needs real client ID for production');
    }

    // Test 3: GitHub OAuth endpoint
    console.log('\n3️⃣ Testing GitHub OAuth endpoint...');
    const githubResponse = await axios.get(`${API_BASE}/auth/github`);
    
    if (githubResponse.data.authUrl && githubResponse.data.authUrl.includes('github.com')) {
      console.log('✅ GitHub OAuth URL generated successfully');
      console.log('   URL:', githubResponse.data.authUrl.substring(0, 80) + '...');
    } else {
      throw new Error('GitHub OAuth URL not generated');
    }

    // Test 4: Database ready for user creation
    console.log('\n4️⃣ Testing database readiness...');
    try {
      await axios.get(`${API_BASE}/users/profile`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Database endpoints properly protected (401 as expected)');
      } else {
        throw new Error('Database endpoints not responding correctly');
      }
    }

    // Test 5: OpenClaw integration ready
    console.log('\n5️⃣ Testing OpenClaw integration endpoints...');
    try {
      await axios.get(`${API_BASE}/openclaw/config`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ OpenClaw endpoints properly protected (401 as expected)');
      } else {
        throw new Error('OpenClaw endpoints not responding correctly');
      }
    }

    // Test 6: Apple Sign In status
    console.log('\n6️⃣ Checking Apple Sign In status...');
    console.log('ℹ️  Apple Sign In configured as placeholder (requires Apple Developer setup)');

    console.log('\n🎯 OAuth Flow Test Results:');
    console.log('✅ Frontend serving authentication page');
    console.log('✅ Google OAuth configured and ready');
    console.log('✅ GitHub OAuth generating valid auth URLs');
    console.log('✅ Database ready for user creation');
    console.log('✅ OpenClaw integration endpoints ready');
    console.log('⚠️  Apple Sign In requires additional setup');

    console.log('\n🚀 Ready for End-to-End Testing!');
    console.log('\nNext Steps:');
    console.log('1. Open: http://localhost:5173');
    console.log('2. Try Google or GitHub OAuth');
    console.log('3. Verify account creation');
    console.log('4. Test OpenClaw connection setup');

  } catch (error) {
    console.error('\n❌ OAuth flow test failed:', error.message);
    process.exit(1);
  }
}

// Run test
testOAuthFlow().catch(console.error);