const webpack = require('webpack');
require('dotenv').config({ path: '../../.env' }); // Load from root .env

/**
 * Webpack configuration for securely injecting environment variables
 * 
 * This configuration injects environment variables from .env into 
 * globalThis.__ENV__ at build time, ensuring no secrets are hardcoded
 * in the source code.
 * 
 * IMPORTANT: Only add non-sensitive or frontend-necessary variables here.
 * Never include secrets that shouldn't be exposed to the browser.
 */
module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      'globalThis.__ENV__': JSON.stringify({
        AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE || 'https://dev-gzv9qjr6.us.auth0.com/api/v2/',
        AUTH0_DOMAIN: process.env.AUTH0_DOMAIN || 'dev-gzv9qjr6.us.auth0.com',
        AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID || 'your-auth0-client-id',
        BASE_URL: process.env.BASE_URL || 'http://localhost:4200',
        API_URL: process.env.API_URL || 'http://localhost:3333/api',
      })
    })
  ]
};
