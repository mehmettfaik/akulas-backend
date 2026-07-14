const dotenv = require('dotenv');

dotenv.config();

const config = {
  port: parseInt(process.env.PORT || '3003', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || ''
  },
  api: {
    prefix: process.env.API_PREFIX || '/api',
    version: process.env.API_VERSION || 'v1'
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10)
  }
};

module.exports = config;
