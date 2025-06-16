import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { environment } from '../environments/environment';
import { ConfigService } from './core/services/config.service';

@Component({
  selector: 'planza-root',
  template: `
    <router-outlet></router-outlet>
    <div *ngIf="showDebug" style="position: fixed; bottom: 0; right: 0; background: #f1f1f1; padding: 10px; font-size: 12px; max-width: 300px; max-height: 200px; overflow: auto; z-index: 9999;">
      <h4>Auth0 Debug</h4>
      <p>URL: {{currentUrl}}</p>
      <p>Auth Status: {{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}}</p>
      <button (click)="showDebug = false">Close</button>
    </div>
  `,
})
export class AppComponent implements OnInit {
  isAuthenticated = false;
  currentUrl = '';
  showDebug = false;

  constructor(
    private http: HttpClient, 
    private auth: AuthService, 
    private route: ActivatedRoute,
    private router: Router,
    private configService: ConfigService
  ) {
    // Check API connection
    this.http.get(`${environment.api}/ping`).subscribe(console.log);
    
    // Get current URL for debugging
    this.currentUrl = window.location.href;

    // Check if we're in a debugging route
    this.showDebug = window.location.pathname.includes('auth0-test');
    
    // Log config for debugging
    console.log('App Component - Auth config:', this.configService.getAuthConfig());
    console.log('App Component - Current URL:', window.location.href);
  }

  ngOnInit() {
    // Check authentication status
    this.auth.isAuthenticated$.subscribe(isAuthenticated => {
      this.isAuthenticated = isAuthenticated;
      console.log('Authentication status:', isAuthenticated);
    });

    // Handle Auth0 errors
    this.auth.error$.subscribe(error => {
      if (error) {
        console.error('Auth0 error:', error);
      }
    });
  }
}

