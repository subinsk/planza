# Secure Environment Variable Setup for Planza

This document explains how to properly handle environment variables in the Planza application to ensure sensitive information like Auth0 credentials are never exposed in the codebase or committed to GitHub.

## Overview

The application now uses a secure configuration system where:
- **NO SECRETS** are hardcoded in `environment.ts` or `environment.prod.ts`
- Auth0 configuration is loaded at runtime via a `ConfigService`
- Environment variables are injected at build time or deployment time
- All sensitive data remains in `.env` files (which are in `.gitignore`)

## Development Setup

1. **Create a `.env` file** in the project root (never commit this):
```bash
AUTH0_AUDIENCE=your-auth0-api-identifier
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
BASE_URL=http://localhost:4200
API_URL=http://localhost:3333/api
```

2. **Use the secure development scripts**:
```bash
# On Linux/Mac
./scripts/start-dev.sh

# On Windows
./scripts/start-dev.ps1

# Or add to package.json
npm run start:secure
```

## Production Deployment

### For Vercel (Frontend)

1. **Set environment variables in Vercel dashboard**:
   - `AUTH0_AUDIENCE`
   - `AUTH0_DOMAIN` 
   - `AUTH0_CLIENT_ID`
   - `BASE_URL` (your production URL)
   - `API_URL` (your backend API URL)

2. **Build command**: `ng build --prod`
   - The webpack config automatically injects env vars into `globalThis.__ENV__`

### For Railway/Heroku (Backend)

Set the same environment variables in your hosting platform's dashboard.

### For Other Platforms

Ensure environment variables are available during the build process. The webpack config will automatically inject them.

## How It Works

1. **Build Time**: Webpack reads environment variables and injects them into `globalThis.__ENV__`
2. **Runtime**: `ConfigService` reads from `globalThis.__ENV__` first, falls back to empty strings
3. **No Secrets in Code**: Environment files contain only empty strings for secrets

## Security Benefits

✅ **Secrets never committed to GitHub**  
✅ **No secrets in built JavaScript bundles**  
✅ **Environment-specific configuration**  
✅ **Easy deployment across platforms**  
✅ **Secure development workflow**

## Migration Notes

If you have existing hardcoded secrets in environment files:
1. Move them to `.env` file
2. Replace with empty strings in `environment.ts`/`environment.prod.ts`
3. Test with the new secure startup scripts
4. Deploy with environment variables set in hosting platform

## Troubleshooting

**Problem**: Auth0 login fails with "Service not found" error  
**Solution**: Ensure `AUTH0_AUDIENCE`, `AUTH0_DOMAIN`, and `AUTH0_CLIENT_ID` are properly set

**Problem**: Config shows empty values  
**Solution**: Check that environment variables are loaded during build/runtime

**Problem**: Development server doesn't load .env  
**Solution**: Use the provided scripts or add dotenv to your build process

## Verifying Configuration

Run the config verification script to ensure everything is properly set up:

```bash
npm run verify:config
```

This script will:
- Check if all required environment variables are present in your `.env` file
- Validate the webpack configuration
- Show what variables will be injected into the frontend
- Verify no secrets are exposed in the frontend
- Provide next steps for testing

If the script reports any issues:
1. Check your `.env` file for missing variables
2. Ensure webpack.config.js is properly configured
3. Verify no sensitive values are being exposed

## Security Best Practices

- Never hardcode secrets in source code
- Never commit `.env` files to Git
- Use the ConfigService to access configuration values
- Always access Auth0 and API URLs through the ConfigService
- Keep frontend configuration minimal - only include what's needed
- Regularly verify your configuration using the verification script

For any questions about secure configuration handling, contact the project maintainers.
