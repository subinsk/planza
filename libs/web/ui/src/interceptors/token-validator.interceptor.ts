import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastService } from '../components';
import { ENV_TOKEN } from '../tokens';

@Injectable()
export class TokenValidatorInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private toast: ToastService,
    private auth: AuthService,
    @Inject(ENV_TOKEN) private env: any,
  ) {}
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Log request URL for debugging
    if (req.url.includes(this.env.api) && !req.url.includes('/ping')) {
      console.log('TokenValidator - API Request:', req.url);
    }
    
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('HTTP Error:', error);
        
        if (error?.status === 401) {
          console.log('401 Unauthorized Error - Token validation failed');
          console.log('Current URL:', window.location.href);
          console.log('Request URL:', req.url);
          
          // Get headers for debugging
          const headers: Record<string, string | null> = {};
          req.headers.keys().forEach(key => {
            headers[key] = req.headers.get(key);
          });
          console.log('Request headers:', headers);
          
          // Add more specific handling for different paths
          const isLoginRelated = window.location.href.includes('/auth/') || 
                                req.url.includes('/auth/') ||
                                req.url.includes('/pre-auth/');
          
          console.log('Login related request:', isLoginRelated);
          
          // Only logout if we're not on auth-related pages
          if (!isLoginRelated) {
            console.log('Not on auth page, checking if authenticated before logout...');
            this.auth.isAuthenticated$.subscribe(isAuthenticated => {
              if (isAuthenticated) {
                console.log('User is authenticated but API returned 401, logging out...');
                this.toast.error('Your session has expired. Please login again.');
                this.auth.logout({ 
                  returnTo: `${window.location.origin}/auth/login` 
                });
              } else {
                console.log('User is not authenticated, redirecting to login...');
                this.router.navigate(['/auth/login']);
              }
            });
          }
        }
        return throwError(error);
      }),
    );
  }
}

