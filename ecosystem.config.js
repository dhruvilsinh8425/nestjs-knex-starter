module.exports = {
  apps: [
    {
      name: "nestjs-api",
      script: "dist/main.js", // main entry file
      instances: 1,            // or "max" for cluster mode
      autorestart: true,
      watch: false,
      max_memory_restart: "1024M",
      env: {
        NODE_ENV: "development",
      },
      env_staging: {
        NODE_ENV: "staging",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};