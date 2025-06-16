import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { ToastService } from '@planza/web/ui';

@Component({
  selector: 'planza-login',
  styleUrls: ['./login.component.scss'],
  template: `
    <main class="w-screen h-screen grid grid-cols-1 lg:grid-cols-2">
      <!-- Left side - Purple gradient with content -->
      <section class="hidden lg:flex flex-col items-center justify-center bg-primary-gradient p-10">
        <div class="max-w-lg">
          <div class="mb-6">
            <h1 class="text-3xl font-bold text-white mb-2">Welcome Back!</h1>
            <p class="text-white/90 text-lg">Continue managing your tasks with ease</p>
          </div>
          
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg">
            <ul class="space-y-3 mb-6">
              <li class="flex items-center text-white">
                <span class="flex-shrink-0 rounded-full bg-primary-400 p-1 mr-3">
                  <rmx-icon class="icon-xs text-white" name="check-line"></rmx-icon>
                </span>
                <span>Access your projects and tasks</span>
              </li>
              <li class="flex items-center text-white">
                <span class="flex-shrink-0 rounded-full bg-primary-400 p-1 mr-3">
                  <rmx-icon class="icon-xs text-white" name="check-line"></rmx-icon>
                </span>
                <span>Collaborate with your team</span>
              </li>
              <li class="flex items-center text-white">
                <span class="flex-shrink-0 rounded-full bg-primary-400 p-1 mr-3">
                  <rmx-icon class="icon-xs text-white" name="check-line"></rmx-icon>
                </span>
                <span>Track your progress</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
      
      <!-- Right side - Form -->
      <section class="flex items-center justify-center bg-surface lg:bg-white p-4 lg:p-0">
        <div class="w-full max-w-md lg:max-w-lg lg:px-12" cdkTrapFocus cdkTrapFocusAutoCapture>
          <div class="mb-8 flex flex-col items-center">
            <h1 class="text-2xl font-semibold text-neutral-800 mb-1">Welcome back</h1>
            <p class="text-neutral-600 text-center">Log in to continue with Planza</p>
          </div>
          
          <div class="bg-white rounded-xl shadow-sm-colored p-6">
            <button
              btn
              type="button"
              variant="primary"
              class="w-full h-11 flex items-center justify-center"
              (click)="login()"
            >
              <span>Login</span>
            </button>
            
            <!-- Debug section for troubleshooting -->
            <div *ngIf="showDebugInfo" class="mt-4 p-3 bg-gray-100 rounded-lg text-xs">
              <p><strong>Auth0 Debug Info:</strong></p>
              <p>Current URL: {{currentUrl}}</p>
              <p>Has error params: {{hasErrorParams}}</p>
              <p>Callback URL: {{callbackUrl}}</p>
              
              <!-- Added debug buttons -->
              <div class="mt-2 flex space-x-2">
                <button 
                  (click)="clearAuth0Storage()" 
                  class="px-2 py-1 bg-red-500 text-white rounded text-xs"
                >
                  Force Clear Auth0 Storage
                </button>
                <button 
                  (click)="showDebugInfo = false" 
                  class="px-2 py-1 bg-gray-200 rounded text-xs"
                >
                  Hide Debug Info
                </button>
              </div>
            </div>
          </div>

          <div class="mt-6 text-center">
            <p class="text-neutral-600">
              Don't have an account? <a routerLink="/auth/signup" class="text-primary font-medium hover:text-primary-600 transition-colors">Sign up</a>
            </p>
            
            <!-- Toggle debug info -->
            <button 
              (click)="toggleDebugInfo()" 
              class="mt-4 text-xs text-gray-400 hover:text-gray-600"
            >
              {{showDebugInfo ? 'Hide' : 'Show'}} Debug Info
            </button>
          </div>
        </div>
      </section>
    </main>
  `,
})
export class LoginComponent implements OnInit {
  showDebugInfo = false;
  currentUrl = '';
  hasErrorParams = false;
  callbackUrl = '';

  constructor(
    public auth: AuthService, 
    private activatedRoute: ActivatedRoute, 
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Capture current URL for debugging
    this.currentUrl = window.location.href;
    this.callbackUrl = window.location.origin + '/auth/callback';
    
    console.log('Login component initialized');
    console.log('localStorage keys on login page load:', 
      Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)));
    console.log('sessionStorage keys on login page load:', 
      Array.from({ length: sessionStorage.length }, (_, i) => sessionStorage.key(i)));
    
    // Check for error parameters
    const params = this.activatedRoute.snapshot.queryParams;
    this.hasErrorParams = params?.error || params?.error_description || params?.code === 'INVALID_SESSION';
    
    if (this.hasErrorParams) {
      console.error('Auth0 Error Params:', params);
      
      if (params?.error_description) {
        this.toast.error(params.error_description);
      } else if (params?.code === 'INVALID_SESSION') {
        this.toast.error('Invalid session! Please login again');
        // If specifically redirected with INVALID_SESSION, check if there are any tokens still in storage
        this.logStorageState('After INVALID_SESSION redirect');
      } else if (params?.error) {
        this.toast.error(`Authentication error: ${params.error}`);
      }
    }
    
    // Subscribe to Auth0 errors
    this.auth.error$.subscribe({
      next: (error) => {
        if (error) {
          console.error('Auth0 Error:', error);
          this.toast.error('Authentication failed. Please try again.');
        }
      },
      error: (err) => {
        console.error('Error subscription failed:', err);
        this.toast.error('Something went wrong. Please try again.');
      }
    });
    
    // Check auth state
    this.auth.isAuthenticated$.subscribe(isAuthenticated => {
      console.log('Auth state on login page:', isAuthenticated ? 'Authenticated' : 'Not authenticated');
      
      // If authenticated and no error params, redirect to app
      if (isAuthenticated && !this.hasErrorParams) {
        console.log('User already authenticated on login page, redirecting to app');
        this.router.navigate(['/app']);
      }
    });
  }
  
  // Helper to log storage state
  private logStorageState(context: string): void {
    console.log(`${context} - localStorage keys:`, 
      Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)));
    console.log(`${context} - sessionStorage keys:`, 
      Array.from({ length: sessionStorage.length }, (_, i) => sessionStorage.key(i)));
  }

  login() {
    try {
      // Log debugging info
      console.log('Attempting Auth0 login redirect');
      console.log('Current origin:', window.location.origin);
      console.log('Redirect URI:', window.location.origin + '/auth/callback');
      
      // Check storage before login
      this.logStorageState('Before login attempt');
      
      // Check for force parameter to clear storage
      const params = this.activatedRoute.snapshot.queryParams;
      if (params?.force === 'true') {
        this.clearAuth0Storage();
      }
      
      // Before login, check if we already have a valid token
      this.auth.isAuthenticated$.subscribe(isAuthenticated => {
        console.log('Is authenticated before login attempt:', isAuthenticated);
        
        if (isAuthenticated) {
          console.log('User is already authenticated, checking token validity...');
          // If we're already authenticated but seeing the login page, we may have a token issue
          // Let's check the token and possibly force a logout/login cycle
          this.auth.getAccessTokenSilently().subscribe(
            token => {
              console.log('Got token, length:', token?.length);
              // If we have a token but ended up on login page, redirect to app
              this.router.navigate(['/app']);
            },
            error => {
              console.error('Token retrieval error:', error);
              // Force clear storage and logout if token retrieval fails
              this.clearAuth0Storage();
              // Then proceed with login
              this.proceedWithLogin();
            }
          );
        } else {
          // Not authenticated, proceed with normal login
          this.proceedWithLogin();
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      this.toast.error('Failed to initiate login. Please try again.');
    }
  }
  
  // Helper to clear Auth0 related storage
  clearAuth0Storage(): void {
    console.log('Clearing Auth0 storage items');
    
    // Clear localStorage
    const localStorageKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && this.isAuth0Key(key)) {
        localStorageKeys.push(key);
      }
    }
    
    localStorageKeys.forEach(key => {
      console.log('Removing localStorage item:', key);
      localStorage.removeItem(key);
    });
    
    // Clear sessionStorage
    const sessionStorageKeys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && this.isAuth0Key(key)) {
        sessionStorageKeys.push(key);
      }
    }
    
    sessionStorageKeys.forEach(key => {
      console.log('Removing sessionStorage item:', key);
      sessionStorage.removeItem(key);
    });
    
    console.log('Storage cleared');
  }
  
  // Helper to check if a key is Auth0 related
  private isAuth0Key(key: string): boolean {
    const prefixes = ['auth0', 'auth.', '@auth0', 'a0.', 'oidc.', 'token'];
    return prefixes.some(prefix => key.toLowerCase().includes(prefix));
  }
  
  // Proceed with actual login
  private proceedWithLogin(): void {
    console.log('Proceeding with Auth0 login');
    this.auth.loginWithRedirect({
      appState: {
        target: '/app',
        returnTo: '/app'
      },
      // Explicitly set the redirect URI to match what's in the Auth0 dashboard
      redirectUri: window.location.origin + '/auth/callback'
    });
  }
  
  toggleDebugInfo() {
    this.showDebugInfo = !this.showDebugInfo;
  }
}

