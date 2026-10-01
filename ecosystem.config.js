// PM2 config for the frontend server (เครื่อง 1).
// Create .env.production.local first, build (npm ci && npm run build), then:
//   pm2 start ecosystem.config.js && pm2 save
//
// Next listens on 127.0.0.1 only; IIS (deploy/iis/web.config) is the public
// entry point on 443 and reverse-proxies to it, so port 3000 stays closed.
module.exports = {
  apps: [
    {
      name: 'leave-frontend',
      cwd: __dirname,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 127.0.0.1',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '1500M',
      env: {
        NODE_ENV: 'production',
        TZ: 'Asia/Bangkok',
      },
      time: true,
      out_file: 'logs/frontend-out.log',
      error_file: 'logs/frontend-error.log',
    },
  ],
};
