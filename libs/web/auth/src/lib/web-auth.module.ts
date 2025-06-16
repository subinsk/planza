import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';

// Simple component to handle Auth0 callbacks
@Component({
  selector: 'planza-auth-callback',
  template: `<div class="p-4 text-center">
    <p>Processing authentication...</p>
    <div class="mt-4">
      <div class="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto"></div>
    </div>
    <div *ngIf="errorMessage" class="mt-4 p-3 bg-red-100 text-red-700 rounded">
      {{ errorMessage }}
    </div>
  </div>`,
})
export class CallbackComponent implements OnInit {
  errorMessage: string | null = null;
  
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    // Log that we're in the callback handler
    console.log('Auth0 callback handler component initialized');
    console.log('Current URL:', window.location.href);
    
    // Check if user is authenticated
    this.auth.isAuthenticated$.subscribe(isAuthenticated => {
      console.log('Is authenticated in callback handler:', isAuthenticated);
      
      if (isAuthenticated) {
        // Get the token for debugging
        this.auth.getAccessTokenSilently().subscribe(
          token => {
            console.log('Got access token in callback, length:', token?.length);
            
            // Check user profile to ensure we have the necessary claims
            this.auth.user$.subscribe(
              user => {
                console.log('User profile in callback:', user);
                
                // Redirect to the app after successful authentication
                this.router.navigate(['/app']);
              },
              error => {
                console.error('Error getting user profile:', error);
                this.errorMessage = 'Error retrieving user profile. Please try again.';
                setTimeout(() => this.router.navigate(['/auth/login']), 3000);
              }
            );
          },
          error => {
            console.error('Error getting access token in callback:', error);
            this.errorMessage = 'Error retrieving access token. Please try again.';
            setTimeout(() => this.router.navigate(['/auth/login']), 3000);
          }
        );
      } else {
        // If not authenticated after a brief delay, go back to login
        setTimeout(() => {
          this.auth.error$.subscribe(error => {
            if (error) {
              console.error('Auth0 error in callback:', error);
              this.errorMessage = 'Authentication error. Please try again.';
            }
            this.router.navigate(['/auth/login']);
          });
        }, 5000); // Give it a longer timeout to complete authentication
      }
    });
  }
}

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: 'login',
        loadChildren: () => import('./login/login.module').then((m) => m.LoginModule),
      },
      {
        path: 'signup',
        loadChildren: () => import('./signup/signup.module').then((m) => m.SignupModule),
      },
      {
        // This path handles Auth0 callbacks
        path: 'callback',
        component: CallbackComponent,
      }
    ]),
  ],
  declarations: [CallbackComponent],
})
export class WebAuthModule {}

