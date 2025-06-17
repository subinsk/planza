import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Auth0 Authentication Configuration Interface
 */
export interface AuthConfig {
  audience: string;
  domain: string;
  clientId: string;
  redirectUri: string;
}

/**
 * Application Configuration Interface
 */
export interface AppConfig {
  auth: AuthConfig;
  api: string;
  baseURL: string;
  production: boolean;
}

/**
 * Service responsible for securely loading application configuration
 * from runtime environment variables that are injected at build/deploy time.
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: AppConfig | null = null;
    /**
   * Get the application configuration, prioritizing runtime injected environment variables
   * and falling back to environment.ts only for non-sensitive defaults
   * @returns The complete application configuration
   */
  getConfig(): AppConfig {
    if (this.config) {
      return this.config;
    }

    // In production builds, webpack injects environment variables into process.env
    // In development, they come from .env via dotenv
    
    // Debug env variables
    console.log('ConfigService: Loading configuration...');
    console.log('Environment production flag:', environment.production);
    console.log('Available process.env variables:', {
      AUTH0_DOMAIN: (process.env as any).AUTH0_DOMAIN,
      AUTH0_AUDIENCE: (process.env as any).AUTH0_AUDIENCE,
      AUTH0_CLIENT_ID: (process.env as any).AUTH0_CLIENT_ID,
      BASE_URL: (process.env as any).BASE_URL,
      API_URL: (process.env as any).API_URL,
    });

    this.config = {
      production: environment.production,
      baseURL: (process.env as any).BASE_URL || environment.baseURL,
      api: (process.env as any).API_URL || environment.api,
      auth: {
        audience: (process.env as any).AUTH0_AUDIENCE || environment.auth.audience,
        domain: (process.env as any).AUTH0_DOMAIN || environment.auth.domain,
        clientId: (process.env as any).AUTH0_CLIENT_ID || environment.auth.clientId,
        redirectUri: `${window.location.origin}/auth/callback`,
      }
    };

    console.log('Final config:', this.config);

    // Additional validation for production environment
    if (environment.production) {
      this.validateProductionConfig();
    }

    return this.config;
  }

  /**
   * Get the Auth0 configuration
   * @returns Auth0 configuration
   */
  getAuthConfig(): AuthConfig {
    return this.getConfig().auth;
  }
  
  /**
   * Get the API URL
   * @returns API URL
   */
  getApiUrl(): string {
    return this.getConfig().api;
  }

  /**
   * Get the base URL
   * @returns Base URL
   */
  getBaseUrl(): string {
    return this.getConfig().baseURL;
  }

  /**
   * Check if the application is running in production mode
   * @returns true if in production mode
   */
  isProduction(): boolean {
    return this.getConfig().production;
  }

  /**
   * Validates that all required configuration values are present in production mode
   * @private
   */
  private validateProductionConfig(): void {
    const config = this.config;
    if (!config) return;

    const missingValues = [];
    
    if (!config.auth.domain) missingValues.push('AUTH0_DOMAIN');
    if (!config.auth.audience) missingValues.push('AUTH0_AUDIENCE');
    if (!config.auth.clientId) missingValues.push('AUTH0_CLIENT_ID');
    if (!config.api) missingValues.push('API_URL');
    
    if (missingValues.length > 0) {
      console.error(`SECURITY ERROR: Missing required environment variables in production: ${missingValues.join(', ')}`);
      // In a real app, you might want to redirect to an error page or take other action
    }
  }
}
