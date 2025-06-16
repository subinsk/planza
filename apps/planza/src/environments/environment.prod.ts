export const environment = {
  production: true,
  baseURL: 'https://planza-app.vercel.app',
  api: 'https://planza-api.onrender.com/api',
  auth: {
    // These will be replaced by ConfigService with runtime values
    audience: 'https://your-domain.us.auth0.com/api/v2/',
    domain: 'your-domain.us.auth0.com',
    clientId: 'your-frontend-client-id',
    redirectUri: window.location.origin + '/auth/callback',
  },
};

