module.exports = {
  apps: [
    {
      name: 'mission-control-backend',
      cwd: './server',
      script: 'server.js',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        AUTH_MODE: 'local',
        ALLOW_DEMO_AUTH: '1',
        JWT_SECRET: 'eman-mission-control-secret-key'
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      log_file: './logs/backend.log',
      out_file: './logs/backend-out.log',
      error_file: './logs/backend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'mission-control-frontend',
      cwd: './',
      script: 'npm',
      args: 'run preview -- --host 0.0.0.0 --port 5173',
      env: {
        NODE_ENV: 'production'
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      log_file: './logs/frontend.log',
      out_file: './logs/frontend-out.log',
      error_file: './logs/frontend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};