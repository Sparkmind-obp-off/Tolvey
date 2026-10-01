module.exports = {
  apps: [
    {
      name: 'tolvey',
      cwd: '/home/user/webapp',
      script: 'node',
      interpreter: 'none',
      args: 'node_modules/wrangler/bin/wrangler.js pages dev dist --ip 0.0.0.0 --port 3000 --binding APP_ENV=local --binding DUITKU_POP_ENABLED=false --binding DUITKU_ENV=sandbox',
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'development' },
    },
  ],
};
