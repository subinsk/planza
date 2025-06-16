export const environment = {
  production: true,
  baseURL: 'https://your-app-name.vercel.app', // Update after Vercel deployment
  api: 'https://your-railway-app.up.railway.app/api', // Update after Railway deployment
  auth: {
    audience: 'https://dev-gzv9qjr6.us.auth0.com/api/v2/',
    domain: 'dev-gzv9qjr6.us.auth0.com',
    clientId: '3lhIiyTsj0kVUePwsEL6WXcUnTG3qYUy',
    redirectUri: window.location.origin,
  },
};

