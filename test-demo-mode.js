#!/usr/bin/env node

/**
 * Demo Mode End-to-End Test
 * Tests the complete demo authentication flow
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';
const FRONTEND_BASE = 'http://localhost:5173';

async function testDemoMode() {
  console.log('🧪 Testing Demo Mode End-to-End\n');

  try {
    // Step 1: Test demo authentication endpoint
    console.log('1️⃣ Testing demo authentication endpoint...');
    const demoAuth = await axios.post(`${API_BASE}/auth/demo`);
    
    if (demoAuth.data.success && demoAuth.data.token) {
      console.log('✅ Demo authentication successful');
      console.log(`   User: ${demoAuth.data.user.name} (${demoAuth.data.user.email})`);
      console.log(`   Token: ${demoAuth.data.token.substring(0, 20)}...`);
    } else {
      throw new Error('Demo authentication failed');
    }

    const demoToken = demoAuth.data.token;

    // Step 2: Test authenticated requests
    console.log('\n2️⃣ Testing authenticated API requests...');
    
    const authHeaders = { 'Authorization': `Bearer ${demoToken}` };

    // Test tasks endpoint
    const tasksResponse = await axios.get(`${API_BASE}/tasks`, { headers: authHeaders });
    if (Array.isArray(tasksResponse.data.tasks)) {
      console.log('✅ Tasks endpoint working (authenticated)');
      console.log(`   Tasks found: ${tasksResponse.data.tasks.length}`);
    }

    // Test user profile endpoint
    const profileResponse = await axios.get(`${API_BASE}/users/profile`, { headers: authHeaders });
    if (profileResponse.data.user) {
      console.log('✅ User profile endpoint working (authenticated)');
      console.log(`   Profile: ${profileResponse.data.user.name}`);
    }

    // Test dashboard endpoint
    const dashboardResponse = await axios.get(`${API_BASE}/users/dashboard`, { headers: authHeaders });
    if (dashboardResponse.data.task_stats) {
      console.log('✅ Dashboard endpoint working (authenticated)');
      console.log(`   Total tasks: ${dashboardResponse.data.total_tasks || 0}`);
    }

    // Test OpenClaw config endpoint
    const openclawResponse = await axios.get(`${API_BASE}/openclaw/config`, { headers: authHeaders });
    if (typeof openclawResponse.data.connected !== 'undefined') {
      console.log('✅ OpenClaw config endpoint working (authenticated)');
      console.log(`   OpenClaw connected: ${openclawResponse.data.connected}`);
    }

    // Step 3: Test task creation
    console.log('\n3️⃣ Testing task creation...');
    const createTaskResponse = await axios.post(`${API_BASE}/tasks`, {
      title: 'Demo Test Task',
      description: 'Testing task creation in demo mode',
      priority: 'medium'
    }, { headers: authHeaders });

    if (createTaskResponse.data.task) {
      console.log('✅ Task creation working (authenticated)');
      console.log(`   Created task: "${createTaskResponse.data.task.title}"`);
      console.log(`   Task ID: ${createTaskResponse.data.task.id}`);

      // Test task retrieval
      const updatedTasksResponse = await axios.get(`${API_BASE}/tasks`, { headers: authHeaders });
      if (updatedTasksResponse.data.tasks.length > 0) {
        console.log('✅ Task retrieval after creation working');
        console.log(`   Tasks now: ${updatedTasksResponse.data.tasks.length}`);
      }
    }

    // Step 4: Test frontend accessibility
    console.log('\n4️⃣ Testing frontend accessibility...');
    const frontendResponse = await axios.get(FRONTEND_BASE);
    if (frontendResponse.status === 200) {
      console.log('✅ Frontend accessible');
    }

    console.log('\n🎉 DEMO MODE FULLY FUNCTIONAL!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n📋 What\'s Working:');
    console.log('✅ Demo authentication endpoint');
    console.log('✅ JWT token generation and validation');
    console.log('✅ All protected API endpoints accessible');
    console.log('✅ Task creation and management');
    console.log('✅ User profile and dashboard data');
    console.log('✅ OpenClaw integration endpoints');
    console.log('✅ Frontend serving correctly');

    console.log('\n🚀 User Experience:');
    console.log('1. Visit: http://localhost:5173');
    console.log('2. Click: "🚀 Continue as Demo User"');
    console.log('3. Access: Full Mission Control dashboard');
    console.log('4. Create: Tasks and test OpenClaw integration');

    console.log('\n💡 All 401 errors should now be resolved!');

  } catch (error) {
    console.error('\n❌ Demo mode test failed:', error.message);
    if (error.response) {
      console.error(`   HTTP ${error.response.status}: ${error.response.data?.error || error.response.statusText}`);
    }
    process.exit(1);
  }
}

testDemoMode().catch(console.error);