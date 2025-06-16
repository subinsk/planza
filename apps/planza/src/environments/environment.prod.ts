export const environment = {
  production: true,
  baseURL: 'https://your-app-name.vercel.app',
  api: 'https://your-railway-app.up.railway.app/api',
  auth: {
    // Auth config will be loaded at runtime via ConfigService
    // NO SECRETS should be hardcoded here
    audience: '',
    domain: '',
    clientId: '',
    redirectUri: window.location.origin + '/auth/callback',
  },
};

