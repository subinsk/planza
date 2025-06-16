import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthHttpInterceptor, AuthModule, AuthService } from '@auth0/auth0-angular';
import { DelayInterceptor, IconModule, ModalModule, TokenValidatorInterceptor } from '@planza/web/ui';
import { API_TOKEN, ENV_TOKEN } from '@planza/web/ui/tokens';
import { UsersState } from '@planza/web/users/state/users.state';
import { DialogModule } from '@ngneat/dialog';
import { popperVariation, TippyModule, tooltipVariation } from '@ngneat/helipopper';
import { HotToastModule } from '@ngneat/hot-toast';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsModule } from '@ngxs/store';
import { enableMapSet } from 'immer';
import { environment } from '../environments/environment';
import { ConfigService } from './core/services/config.service';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
enableMapSet();

// Factory function to get auth config from ConfigService
export function getAuthConfig(configService: ConfigService) {
  const config = configService.getConfig();
  return {
    domain: config.auth.domain,
    audience: config.auth.audience,
    clientId: config.auth.clientId,
    redirectUri: `${window.location.origin}/app`,
    errorPath: '/auth/login',
    cacheLocation: 'localstorage' as const,
    useRefreshTokens: true,
    httpInterceptor: {
      allowedList: [
        {
          uriMatcher: (uri: string) => {
            if (uri.includes(config.api)) {
              if (uri.includes('/ping') || uri.includes('/pre-auth')) {
                return false;
              }
              return true;
            }
            return false;
          },
        },
      ],
    },
  };
}

// App initializer function to ensure config is loaded before app starts
export function initializeApp(configService: ConfigService): () => Promise<any> {
  return () => {
    // Load configuration - this ensures config is available before Auth0 initializes
    configService.getConfig();
    return Promise.resolve();
  };
}
@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    AuthModule.forRoot({
      domain: (globalThis as any).__ENV__?.AUTH0_DOMAIN || 'dev-gzv9qjr6.us.auth0.com',
      clientId: (globalThis as any).__ENV__?.AUTH0_CLIENT_ID || environment.auth.clientId || '3lhIiyTsj0kVUePwsEL6WXcUnTG3qYUy',
      audience: (globalThis as any).__ENV__?.AUTH0_AUDIENCE || 'https://planza.app/api',
      redirectUri: `${window.location.origin}/auth/callback`,
      errorPath: '/auth/login',
      cacheLocation: 'localstorage' as const,
      useRefreshTokens: true,
      scope: 'openid profile email offline_access',
      sessionCheckExpiryDays: 7, // Increase session check expiry
      // Store tokens so they're accessible in localStorage
      useCookiesForTransactions: false,
      // Explicitly set auth config to clear localStorage on logout
      logoutOptions: {
        localOnly: false,
        federated: false,
        clientID: (globalThis as any).__ENV__?.AUTH0_CLIENT_ID || environment.auth.clientId || '3lhIiyTsj0kVUePwsEL6WXcUnTG3qYUy',
      },
      httpInterceptor: {
        allowedList: [
          {
            uriMatcher: (uri: string) => {
              console.log('Auth0 interceptor checking URI:', uri);
              const apiUrl = (globalThis as any).__ENV__?.API_URL || 'http://localhost:3333/api';
              if (uri.includes(apiUrl)) {
                if (uri.includes('/ping') || uri.includes('/pre-auth')) {
                  console.log('Auth0 interceptor skipping URI:', uri);
                  return false;
                }
                console.log('Auth0 interceptor will add token to URI:', uri);
                return true;
              }
              return false;
            },
          },
        ],
      },
    }),
    DialogModule.forRoot(),
    HotToastModule.forRoot(),
    TippyModule.forRoot({
      defaultVariation: 'tooltip',
      variations: {
        tooltip: tooltipVariation,
        popper: popperVariation,
        menu: {
          ...popperVariation,
          role: 'dropdown',
          arrow: false,
          hideOnClick: true,
          zIndex: 99,
        },
      },
    }),
    IconModule,
    NgxsModule.forRoot([UsersState], {
      developmentMode: !environment.production,
    }),
    NgxsReduxDevtoolsPluginModule.forRoot(),
    ModalModule,
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (configService: ConfigService) => {
        return () => {
          // Initialize config service and log values for debugging
          const config = configService.getConfig();
          console.log('APP_INITIALIZER - Auth config:', config.auth);
          console.log('APP_INITIALIZER - Auth redirect URI:', `${window.location.origin}/auth/login`);
          console.log('APP_INITIALIZER - Environment:', environment);
          return Promise.resolve();
        };
      },
      deps: [ConfigService],
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthHttpInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenValidatorInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: DelayInterceptor,
      multi: true,
    },
    {
      provide: API_TOKEN,
      useFactory: (configService: ConfigService) => configService.getApiUrl(),
      deps: [ConfigService],
    },
    {
      provide: ENV_TOKEN,
      useFactory: (configService: ConfigService) => configService.getConfig(),
      deps: [ConfigService],
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}


