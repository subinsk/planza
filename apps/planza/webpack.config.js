const webpack = require('webpack');
require('dotenv').config({ path: '../../.env' }); // Load from root .env

/**
 * Webpack configuration for securely injecting environment variables
 * 
 * This configuration injects environment variables from .env into 
 * the application at build time, ensuring no secrets are hardcoded
 * in the source code.
 * 
 * IMPORTANT: Only add non-sensitive or frontend-necessary variables here.
 * Never include secrets that shouldn't be exposed to the browser.
 */

console.log('🚀 Webpack config loading...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VERCEL:', process.env.VERCEL);
console.log('Environment variables from process.env:');
console.log('AUTH0_DOMAIN:', process.env.AUTH0_DOMAIN);
console.log('AUTH0_AUDIENCE:', process.env.AUTH0_AUDIENCE);
console.log('AUTH0_CLIENT_ID:', process.env.AUTH0_CLIENT_ID);
console.log('BASE_URL:', process.env.BASE_URL);
console.log('API_URL:', process.env.API_URL);

// Production values for Vercel deployment
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

let config = {};

if (isProduction && isVercel) {
  // Vercel production deployment
  config = {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.AUTH0_DOMAIN': JSON.stringify(process.env.AUTH0_DOMAIN || 'planza.us.auth0.com'),
    'process.env.AUTH0_AUDIENCE': JSON.stringify(process.env.AUTH0_AUDIENCE || 'https://planza.us.auth0.com/api/v2/'),
    'process.env.AUTH0_CLIENT_ID': JSON.stringify(process.env.AUTH0_CLIENT_ID || 'YOUR_CLIENT_ID_PLACEHOLDER'),
    'process.env.BASE_URL': JSON.stringify(process.env.BASE_URL || 'https://planza-app.vercel.app'),
    'process.env.API_URL': JSON.stringify(process.env.API_URL || 'https://planza-api.onrender.com/api'),
  };
} else {
  // Development/local build
  config = {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.AUTH0_DOMAIN': JSON.stringify(process.env.AUTH0_DOMAIN || 'dev-gzv9qjr6.us.auth0.com'),
    'process.env.AUTH0_AUDIENCE': JSON.stringify(process.env.AUTH0_AUDIENCE || 'https://planza.app/api'),
    'process.env.AUTH0_CLIENT_ID': JSON.stringify(process.env.AUTH0_CLIENT_ID || '3lhIiyTsj0kVUePwsEL6WXcUnTG3qYUy'),
    'process.env.BASE_URL': JSON.stringify(process.env.BASE_URL || 'http://localhost:4200'),
    'process.env.API_URL': JSON.stringify(process.env.API_URL || 'http://localhost:3333/api'),
  };
}

console.log('Final webpack config:', config);

module.exports = {
  plugins: [
    new webpack.DefinePlugin(config)
  ]
};
