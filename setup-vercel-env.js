#!/usr/bin/env node

/**
 * Script to help set up environment variables for Vercel deployment
 * 
 * This script shows the commands needed to set environment variables in Vercel
 * for the Planza application to work properly.
 */

console.log('🚀 Planza Vercel Environment Setup');
console.log('=====================================\n');

console.log('To fix the blank page issue on https://planza-app.vercel.app/, you need to set the following environment variables in your Vercel dashboard:\n');

console.log('1. Go to https://vercel.com/dashboard');
console.log('2. Select your planza-app project');
console.log('3. Go to Settings > Environment Variables');
console.log('4. Add the following variables:\n');

const envVars = [
  {
    name: 'AUTH0_DOMAIN',
    value: 'planza.us.auth0.com',
    description: 'Your Auth0 domain'
  },
  {
    name: 'AUTH0_AUDIENCE',
    value: 'https://planza.us.auth0.com/api/v2/',
    description: 'Auth0 API audience'
  },
  {
    name: 'AUTH0_CLIENT_ID',
    value: '[YOUR_ACTUAL_CLIENT_ID]',
    description: 'Auth0 Client ID (replace with actual value)'
  },
  {
    name: 'BASE_URL',
    value: 'https://planza-app.vercel.app',
    description: 'Your Vercel app URL'
  },
  {
    name: 'API_URL',
    value: 'https://planza-api.onrender.com/api',
    description: 'Your API backend URL'
  },
  {
    name: 'NODE_ENV',
    value: 'production',
    description: 'Environment mode'
  }
];

envVars.forEach((envVar, index) => {
  console.log(`${index + 1}. ${envVar.name}`);
  console.log(`   Value: ${envVar.value}`);
  console.log(`   Description: ${envVar.description}\n`);
});

console.log('Alternative: Use Vercel CLI commands:');
console.log('=====================================\n');

envVars.forEach(envVar => {
  if (envVar.name === 'AUTH0_CLIENT_ID') {
    console.log(`vercel env add ${envVar.name} production # Enter your actual Auth0 Client ID`);
  } else {
    console.log(`vercel env add ${envVar.name} production`);
    console.log(`# Enter: ${envVar.value}`);
  }
});

console.log('\n5. After setting the environment variables, redeploy your app:');
console.log('   vercel --prod\n');

console.log('🔧 The main issue was that AUTH0_CLIENT_ID was set to a placeholder value.');
console.log('   Once you set the correct Auth0 Client ID, the app should work properly.\n');

console.log('💡 You can find your Auth0 Client ID in your Auth0 Dashboard > Applications > [Your App] > Settings');
