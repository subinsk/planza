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
    }    // Try to get config from runtime environment variables (injected at build/deploy time)
    const runtimeEnv = (globalThis as any).__ENV__;

    // Debug env variables
    console.log('Runtime ENV variables:', runtimeEnv);
      // Validate runtime environment is available in production
    if (environment.production && (!runtimeEnv || !runtimeEnv.AUTH0_DOMAIN)) {
      console.warn('Runtime environment variables are not fully available, using fallback values.');
      console.log('Available runtime env keys:', runtimeEnv ? Object.keys(runtimeEnv) : 'none');
    }
    
    this.config = {
      production: environment.production,
      baseURL: runtimeEnv?.BASE_URL || environment.baseURL,
      api: runtimeEnv?.API_URL || environment.api,
      auth: {        audience: runtimeEnv?.AUTH0_AUDIENCE || environment.auth.audience,
        domain: runtimeEnv?.AUTH0_DOMAIN || environment.auth.domain,
        clientId: runtimeEnv?.AUTH0_CLIENT_ID || environment.auth.clientId,
        redirectUri: `${window.location.origin}/auth/callback`,
      }
    };

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
