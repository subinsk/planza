export const environment = {
  production: true,
  baseURL: 'https://planza-app.vercel.app',
  api: 'https://planza-api.onrender.com/api',
  auth: {
    // Runtime values will be provided by ConfigService from window.__ENV__
    audience: 'https://planza.us.auth0.com/api/v2/',
    domain: 'planza.us.auth0.com',
    clientId: 'fallback-client-id', // Will be replaced by runtime config
    redirectUri: window.location.origin + '/auth/callback',
  },
};

