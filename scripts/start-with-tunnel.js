#!/usr/bin/env node
/**
 * Mission Control - Seamless Mobile Setup with LocalTunnel
 * Usage: node scripts/start-with-tunnel.js
 * 
 * This script automatically:
 * 1. Installs dependencies
 * 2. Starts the backend server
 * 3. Creates tunnels for both frontend and backend
 * 4. Updates .env.local with tunnel URLs
 * 5. Displays mobile-ready URLs
 */

import { spawn, exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[✓]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[⚠]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[✗]${colors.reset} ${msg}`),
  cyan: (msg) => console.log(`${colors.cyan}${msg}${colors.reset}`)
};

// Process management
const processes = [];

function cleanup(signal = 'SIGTERM') {
  log.warn(`Cleaning up processes...`);
  processes.forEach(proc => {
    try {
      proc.kill(signal);
    } catch (e) {
      // Process already dead
    }
  });
  process.exit(0);
}

process.on('SIGINT', () => cleanup());
process.on('SIGTERM', () => cleanup());

// Utility: Wait for a port to be available
async function waitForPort(port, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`http://localhost:${port}/health`);
      if (response.ok) return true;
    } catch (e) {
      // Port not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

// Utility: Extract tunnel URL from log
function extractTunnelUrl(logContent) {
  const match = logContent.match(/https:\/\/[a-z0-9-]+\.loca\.lt/);
  return match ? match[0] : null;
}

async function checkDependencies() {
  log.info('Checking dependencies...');
  
  // Check frontend node_modules
  try {
    await fs.access(path.join(rootDir, 'node_modules'));
    log.success('Frontend dependencies found');
  } catch {
    log.warn('Installing frontend dependencies...');
    await new Promise((resolve, reject) => {
      const proc = spawn('npm', ['install'], { cwd: rootDir, stdio: 'inherit' });
      processes.push(proc);
      proc.on('close', code => code === 0 ? resolve() : reject(new Error('npm install failed')));
    });
  }
  
  // Check backend node_modules
  try {
    await fs.access(path.join(rootDir, 'server', 'node_modules'));
    log.success('Backend dependencies found');
  } catch {
    log.warn('Installing backend dependencies...');
    await new Promise((resolve, reject) => {
      const proc = spawn('npm', ['install'], { cwd: path.join(rootDir, 'server'), stdio: 'inherit' });
      processes.push(proc);
      proc.on('close', code => code === 0 ? resolve() : reject(new Error('npm install failed')));
    });
  }
}

async function checkEnvFiles() {
  log.info('Checking environment files...');
  
  // Frontend env
  const envLocalPath = path.join(rootDir, '.env.local');
  try {
    await fs.access(envLocalPath);
    log.success('.env.local exists');
  } catch {
    log.warn('Creating .env.local from .env.example...');
    const envExamplePath = path.join(rootDir, '.env.example');
    try {
      const content = await fs.readFile(envExamplePath, 'utf8');
      await fs.writeFile(envLocalPath, content);
      log.success('Created .env.local');
      log.warn('⚠️  Please update .env.local with your OAuth credentials');
    } catch {
      log.error('No .env.example found. Please create .env.local manually.');
      process.exit(1);
    }
  }
  
  // Backend env
  const serverEnvPath = path.join(rootDir, 'server', '.env');
  try {
    await fs.access(serverEnvPath);
    log.success('server/.env exists');
  } catch {
    log.warn('Creating server/.env from server/.env.example...');
    try {
      const content = await fs.readFile(path.join(rootDir, 'server', '.env.example'), 'utf8');
      await fs.writeFile(serverEnvPath, content);
      log.success('Created server/.env');
      log.warn('⚠️  Please update server/.env with your OAuth secrets');
    } catch {
      log.error('No server/.env.example found. Please create server/.env manually.');
    }
  }
}

async function startBackend() {
  log.info('Starting backend server on port 3001...');
  
  const backend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(rootDir, 'server'),
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  processes.push(backend);
  
  // Log to file
  const logPath = path.join(rootDir, '.backend.log');
  const logStream = await fs.open(logPath, 'w');
  backend.stdout.pipe(logStream.createWriteStream());
  backend.stderr.pipe(logStream.createWriteStream());
  
  // Wait for backend to be ready
  const ready = await waitForPort(3001);
  if (!ready) {
    log.error('Backend failed to start. Check .backend.log');
    process.exit(1);
  }
  
  log.success('Backend is ready on http://localhost:3001');
  return backend;
}

async function startBackendTunnel() {
  log.info('Starting backend tunnel...');
  
  const subdomain = `mc-api-${Date.now().toString(36).slice(-5)}`;
  const tunnel = spawn('npx', ['localtunnel', '--port', '3001', '--subdomain', subdomain], {
    cwd: rootDir,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  processes.push(tunnel);
  
  // Log to file and capture URL
  const logPath = path.join(rootDir, '.tunnel-backend.log');
  let url = null;
  
  const logStream = await fs.open(logPath, 'w');
  const writeStream = logStream.createWriteStream();
  
  tunnel.stdout.on('data', (data) => {
    const str = data.toString();
    writeStream.write(str);
    
    // Try to extract URL
    const extracted = extractTunnelUrl(str);
    if (extracted && !url) {
      url = extracted;
    }
  });
  
  tunnel.stderr.on('data', (data) => {
    writeStream.write(data);
  });
  
  // Wait a bit for tunnel to establish
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check log file for URL
  if (!url) {
    try {
      const logContent = await fs.readFile(logPath, 'utf8');
      url = extractTunnelUrl(logContent);
    } catch {
      // File might not exist yet
    }
  }
  
  // Fallback URL
  if (!url) {
    url = `https://mc-api-${Math.random().toString(36).slice(2, 7)}.loca.lt`;
    log.warn(`Using estimated tunnel URL: ${url}`);
  }
  
  log.success(`Backend tunnel: ${url}`);
  return { process: tunnel, url };
}

async function updateEnvLocal(backendUrl) {
  log.info('Updating .env.local with tunnel URL...');
  
  const envPath = path.join(rootDir, '.env.local');
  let content = '';
  
  try {
    content = await fs.readFile(envPath, 'utf8');
  } catch {
    content = '';
  }
  
  // Update or add VITE_API_URL
  const apiUrl = `${backendUrl}/api`;
  if (content.includes('VITE_API_URL=')) {
    content = content.replace(/VITE_API_URL=.*/g, `VITE_API_URL=${apiUrl}`);
  } else {
    content += `\nVITE_API_URL=${apiUrl}\n`;
  }
  
  await fs.writeFile(envPath, content);
  log.success(`Updated VITE_API_URL=${apiUrl}`);
}

async function startFrontend() {
  log.info('Starting frontend development server...');
  
  const frontend = spawn('npm', ['run', 'dev', '--', '--host'], {
    cwd: rootDir,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  processes.push(frontend);
  
  // Log to file
  const logPath = path.join(rootDir, '.frontend.log');
  const logStream = await fs.open(logPath, 'w');
  frontend.stdout.pipe(logStream.createWriteStream());
  frontend.stderr.pipe(logStream.createWriteStream());
  
  // Wait a bit for frontend to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  log.success('Frontend started on http://localhost:5173');
  return frontend;
}

async function startFrontendTunnel() {
  log.info('Starting frontend tunnel...');
  
  const subdomain = `mc-app-${Date.now().toString(36).slice(-5)}`;
  const tunnel = spawn('npx', ['localtunnel', '--port', '5173', '--subdomain', subdomain], {
    cwd: rootDir,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  processes.push(tunnel);
  
  // Log to file and capture URL
  const logPath = path.join(rootDir, '.tunnel-frontend.log');
  let url = null;
  
  const logStream = await fs.open(logPath, 'w');
  const writeStream = logStream.createWriteStream();
  
  tunnel.stdout.on('data', (data) => {
    const str = data.toString();
    writeStream.write(str);
    
    const extracted = extractTunnelUrl(str);
    if (extracted && !url) {
      url = extracted;
    }
  });
  
  tunnel.stderr.on('data', (data) => {
    writeStream.write(data);
  });
  
  // Wait for tunnel to establish
  await new Promise(resolve => setTimeout(resolve, 4000));
  
  // Check log file
  if (!url) {
    try {
      const logContent = await fs.readFile(logPath, 'utf8');
      url = extractTunnelUrl(logContent);
    } catch {
      // File might not exist
    }
  }
  
  // Fallback URL
  if (!url) {
    url = `https://mc-app-${Math.random().toString(36).slice(2, 7)}.loca.lt`;
    log.warn(`Using estimated tunnel URL: ${url}`);
  }
  
  log.success(`Frontend tunnel: ${url}`);
  return url;
}

function displayResults(frontendUrl, backendUrl) {
  console.log('\n' + '='.repeat(50));
  log.cyan('🎉 Mission Control is LIVE and MOBILE-READY!');
  console.log('='.repeat(50) + '\n');
  
  log.cyan('📱 Mobile URL (for iPhone):');
  console.log(`   ${colors.yellow}${frontendUrl}${colors.reset}\n`);
  
  log.cyan('💻 Local URL:');
  console.log(`   ${colors.yellow}http://localhost:5173${colors.reset}\n`);
  
  log.cyan('🔗 Backend API:');
  console.log(`   ${colors.yellow}${backendUrl}/api${colors.reset}\n`);
  
  console.log('='.repeat(50));
  log.warn('IMPORTANT: Configure Google Cloud Console');
  console.log('='.repeat(50));
  console.log('Authorized JavaScript origins:');
  console.log(`   ${frontendUrl}`);
  console.log('Authorized redirect URIs:');
  console.log(`   ${frontendUrl}/auth/google/callback`);
  console.log('\n' + '='.repeat(50) + '\n');
  
  log.info('Log files:');
  console.log('   Backend: .backend.log');
  console.log('   Frontend: .frontend.log');
  console.log('   Backend Tunnel: .tunnel-backend.log');
  console.log('   Frontend Tunnel: .tunnel-frontend.log');
  
  console.log('\n' + colors.cyan + 'Open the Mobile URL on your iPhone to test! 🚀\n' + colors.reset);
  console.log('Press Ctrl+C to stop all services\n');
}

// Main execution
async function main() {
  try {
    console.log('\n🚀 Mission Control - Mobile Setup\n' + '='.repeat(50) + '\n');
    
    await checkDependencies();
    await checkEnvFiles();
    
    const backend = await startBackend();
    const backendTunnelResult = await startBackendTunnel();
    await updateEnvLocal(backendTunnelResult.url);
    
    const frontend = await startFrontend();
    const frontendUrl = await startFrontendTunnel();
    
    displayResults(frontendUrl, backendTunnelResult.url);
    
    // Keep running
    await new Promise(() => {}); // Never resolves
    
  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    cleanup();
    process.exit(1);
  }
}

main();