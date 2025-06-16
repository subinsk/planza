#!/usr/bin/env node

// Simple script to verify environment variable injection works
const webpack = require('webpack');
const path = require('path');
const webpackConfigPath = path.join(__dirname, '..', 'apps', 'planza', 'webpack.config.js');
const webpackConfig = require(webpackConfigPath);

// Load .env
require('dotenv').config();

console.log('🔍 Verifying environment variable setup...\n');

// Check if .env file exists
const fs = require('fs');
if (!fs.existsSync('.env')) {
    console.log('❌ .env file not found!');
    console.log('📝 Please create a .env file from .env.example');
    process.exit(1);
}

console.log('✅ .env file found');

// Check required environment variables
const requiredVars = [
  'AUTH0_AUDIENCE', 
  'AUTH0_DOMAIN', 
  'AUTH0_CLIENT_ID',
  'AUTH0_CLIENT_SECRET',  // Required for backend
  'DATABASE_URL'          // Required for database connection
];

const missingVars = [];

requiredVars.forEach(varName => {
    if (!process.env[varName]) {
        missingVars.push(varName);
    } else {
        // Only show first few characters of sensitive values
        const isSensitive = varName.includes('SECRET') || varName.includes('KEY') || varName.includes('PASS');
        const displayValue = isSensitive 
            ? '********' 
            : `${process.env[varName].substring(0, 10)}...`;
        console.log(`✅ ${varName}: ${displayValue}`);
    }
});

if (missingVars.length > 0) {
    console.log(`\n❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.log('📝 Please update your .env file with the missing values');
    process.exit(1);
}

// Check webpack config
try {
    const compiler = webpack(webpackConfig);
    console.log('\n✅ Webpack configuration is valid');
    
    // Check what webpack will inject
    const definePlugin = webpackConfig.plugins.find(p => p.constructor.name === 'DefinePlugin');
    if (definePlugin) {
        console.log('\n🎯 Environment variables that will be injected:');
        const definitions = definePlugin.definitions;
        Object.keys(definitions).forEach(key => {
            if (key.startsWith('globalThis.__ENV__')) {
                console.log(`   ${key}: ${JSON.stringify(definitions[key], null, 2)}`);
            }
        });
        
        // Verify no secrets are exposed
        const envObj = JSON.parse(definitions['globalThis.__ENV__']);
        const sensitiveKeys = Object.keys(envObj).filter(key => 
            key.includes('SECRET') || key.includes('KEY') || key.includes('PASS'));
            
        if (sensitiveKeys.length > 0) {
            console.log('\n⚠️ WARNING: Potentially sensitive values are being exposed in the frontend:');
            sensitiveKeys.forEach(key => console.log(`   - ${key}`));
            console.log('   Consider removing these from webpack.config.js');
        } else {
            console.log('\n✅ No sensitive values detected in frontend configuration');
        }
    }
    
    console.log('\n🎉 Configuration setup is working correctly!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: npm run start:secure');
    console.log('   2. Test Auth0 login functionality');
    console.log('   3. In browser dev tools, check that globalThis.__ENV__ contains necessary values but no secrets');
    console.log('   4. Verify the app can communicate with Auth0 and backend API');
    
} catch (error) {
    console.log('\n❌ Webpack configuration error:', error.message);
    process.exit(1);
}
