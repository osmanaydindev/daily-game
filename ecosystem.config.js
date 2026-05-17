module.exports = {
  apps: [
    {
      name: 'dail-game-api',
      cwd: './apps/backend',
      script: 'dist/server.js',
      interpreter: 'node',
      env_production: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
    },
    {
      name: 'dail-game-web',
      cwd: './apps/frontend',
      script: 'node_modules/.bin/next',
      args: 'start',
      env_production: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
    },
  ],
};
