module.exports = {
    apps : [{
      name: "fedwave",
      script: "./index.mjs",
      mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      }
    }]
  }