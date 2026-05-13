module.exports = {
  apps: [
    {
      name: 'tf-server',
      script: 'server.js',
      cwd: process.cwd(),
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/tf-server-error.log',
      out_file: './logs/tf-server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'tf-api',
      script: 'api-server.js',
      cwd: process.cwd(),
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        BACKEND_URL: 'http://localhost:3000'
      },
      error_file: './logs/tf-api-error.log',
      out_file: './logs/tf-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'tf-broker',
      script: 'broker-server.js',
      cwd: process.cwd(),
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/tf-broker-error.log',
      out_file: './logs/tf-broker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
}
