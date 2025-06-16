import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserSignupRequest } from '@planza/api-interfaces';
import { ToastService } from '@planza/web/ui';
import { API_TOKEN } from '@planza/web/ui/tokens';
import { BehaviorSubject } from 'rxjs';
@Component({
  selector: 'planza-signup',
  styleUrls: ['./signup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="w-screen h-screen grid grid-cols-1 lg:grid-cols-2">
      <!-- Left side - Purple gradient with content -->
      <section class="hidden lg:flex flex-col items-center justify-center bg-primary-gradient p-10">
        <div class="max-w-lg">
          <div class="mb-6">
            <h1 class="text-3xl font-bold text-white mb-2">Welcome to Planza</h1>
            <p class="text-white/90 text-lg">Plan, organize, and collaborate with ease</p>
          </div>
          
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg">
            <ul class="space-y-3 mb-6">
              <li class="flex items-center text-white">
                <span class="flex-shrink-0 rounded-full bg-primary-400 p-1 mr-3">
                  <rmx-icon class="icon-xs text-white" name="check-line"></rmx-icon>
                </span>
                <span>Create and manage tasks with ease</span>
              </li>
              <li class="flex items-center text-white">
                <span class="flex-shrink-0 rounded-full bg-primary-400 p-1 mr-3">
                  <rmx-icon class="icon-xs text-white" name="check-line"></rmx-icon>
                </span>
                <span>Collaborate with your team in real-time</span>
              </li>
              <li class="flex items-center text-white">
                <span class="flex-shrink-0 rounded-full bg-primary-400 p-1 mr-3">
                  <rmx-icon class="icon-xs text-white" name="check-line"></rmx-icon>
                </span>
                <span>Track progress with intuitive dashboards</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
      
      <!-- Right side - Form (on desktop) -->
      <section class="flex items-center justify-center bg-surface lg:bg-white p-4 lg:p-0">
        <!-- Mobile view - Full centered design -->
        <div class="w-full max-w-md lg:max-w-lg lg:px-12 block lg:hidden">
          <div class="mb-8 flex flex-col items-center">
            <!-- <img src="assets/images/logo.svg" height="60" width="180" alt="Planza" class="mb-4" /> -->
            <h1 class="text-2xl font-semibold text-neutral-800 mb-1">Create your account</h1>
            <p class="text-neutral-600 text-center">Join Planza and start managing your projects efficiently</p>
          </div>
          
          <div class="bg-white rounded-xl shadow-sm-colored p-6">
            <form id="signupFormMobile" [formGroup]="signupForm" (ngSubmit)="signup()">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div class="form-group">
                  <input class="w-full" type="text" id="firstNameMobile" formControlName="firstName" placeholder="First Name" />
                </div>
                <div class="form-group">
                  <input class="w-full" type="text" id="lastNameMobile" formControlName="lastName" placeholder="Last Name" />
                </div>
              </div>
              
              <div class="form-group mt-2">
                <input class="w-full" type="email" id="emailMobile" formControlName="email" placeholder="Email Address" />
              </div>
              
              <div class="form-group mt-2 relative">
                <input class="w-full pr-10" type="password" id="passwordMobile" formControlName="password" passwordToggle placeholder="Password" />
                <div *ngIf="signupForm.get('password')?.touched && signupForm.get('password')?.invalid" class="error-text">
                  <span *ngIf="signupForm.get('password')?.errors?.required">Password is required</span>
                  <span *ngIf="signupForm.get('password')?.errors?.minlength">Password must be at least 8 characters</span>
                  <span *ngIf="signupForm.get('password')?.errors?.pattern">
                    Password must include at least one uppercase letter, one lowercase letter, one number, and one special character
                  </span>
                </div>
              </div>
              
              <div class="form-group mt-2">
                <input class="w-full" type="text" id="orgMobile" formControlName="org" placeholder="Organization Name" />
              </div>

              <div class="mt-6 flex space-x-4">
                <button btn type="button" variant="secondary" routerLink="/auth/login" class="w-1/3">
                  Cancel
                </button>
                <button
                  btn
                  type="submit"
                  form="signupFormMobile"
                  class="w-2/3"
                  variant="primary"
                  [disabled]="signupForm.invalid || (loading$ | async)"
                >
                  <span *ngIf="loading$ | async">Creating Account...</span>
                  <span *ngIf="!(loading$ | async)">Create Account</span>
                </button>
              </div>
            </form>
          </div>

          <div class="mt-6 text-center">
            <p class="text-neutral-600">
              Already have an account? <a routerLink="/auth/login" class="text-primary font-medium hover:text-primary-600 transition-colors">Log in</a>
            </p>
          </div>
        </div>

        <!-- Desktop view - Side form -->
        <div class="hidden lg:block w-full max-w-md" cdkTrapFocus cdkTrapFocusAutoCapture>
          <header class="mb-8">
            <img src="assets/images/logo.svg" height="65" width="200" alt="Planza" class="mb-4" />
            <h1 class="text-2xl font-semibold text-neutral-800">Create your account</h1>
            <p class="text-neutral-600">Start managing your projects with Planza</p>
          </header>
          
          <form id="signupForm" [formGroup]="signupForm" (ngSubmit)="signup()">
            <div class="grid grid-cols-2 gap-5">
              <div class="form-group">
                <input class="w-full" type="text" id="firstName" formControlName="firstName" placeholder="First Name" cdkFocusInitial />
              </div>
              <div class="form-group">
                <input class="w-full" type="text" id="lastName" formControlName="lastName" placeholder="Last Name" />
              </div>
            </div>
            
            <div class="form-group mt-2">
              <input class="w-full" type="email" id="email" formControlName="email" placeholder="Email Address" />
            </div>              
            
            <div class="form-group mt-2 relative">
              <input class="w-full pr-10" type="password" id="password" formControlName="password" passwordToggle placeholder="Password" />
              <div *ngIf="signupForm.get('password')?.touched && signupForm.get('password')?.invalid" class="error-text">
                <span *ngIf="signupForm.get('password')?.errors?.required">Password is required</span>
                <span *ngIf="signupForm.get('password')?.errors?.minlength">Password must be at least 8 characters</span>
                <span *ngIf="signupForm.get('password')?.errors?.pattern">
                  Password must include uppercase, lowercase, number, and special character
                </span>
              </div>
            </div>
            
            <div class="form-group mt-2">
              <input class="w-full" type="text" id="org" formControlName="org" placeholder="Organization Name" />
            </div>

            <div class="mt-6 flex items-center space-x-4">
              <button btn type="button" variant="secondary" routerLink="/auth/login" class="w-1/3">
                Cancel
              </button>
              <button
                btn
                type="submit"
                form="signupForm"
                class="w-2/3"
                variant="primary"
                [disabled]="signupForm.invalid || (loading$ | async)"
              >
                <span *ngIf="loading$ | async">Creating Account...</span>
                <span *ngIf="!(loading$ | async)">Create Account</span>
              </button>
            </div>
            
            <div class="mt-6 text-center">
              <p class="text-neutral-600">
                Already have an account? <a routerLink="/auth/login" class="text-primary font-medium hover:text-primary-600 transition-colors">Log in</a>
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  `,
  styles: [],
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
  loading$ = new BehaviorSubject(false);
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private toast: ToastService,
    @Inject(API_TOKEN) private apiToken: string,
  ) {}

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
      lastName: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
      email: ['', [Validators.required, Validators.email, Validators.minLength(5), Validators.maxLength(200)]],
      password: ['', [
        Validators.required, 
        Validators.minLength(8), // Increased from 6 to 8 for better security
        Validators.maxLength(32),
        // Regex for at least one uppercase, one lowercase, one number, and one special character
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      org: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(64)]],
    });
  }

  signup() {
    if (this.signupForm.valid) {
      const data: UserSignupRequest = { ...this.signupForm.value };
      this.loading$.next(true);
      this.http.post(`${this.apiToken}/users/signup`, data).subscribe(
        () => {
          this.toast.success('Signed up successfully! You can now login.');
          this.router.navigate(['/auth/login']);
        },
        (error) => {
          // Handle specific error messages from the backend
          if (error && error.error) {
            // If there's a message in the error response, use it
            if (error.error.message) {
              this.toast.error(error.error.message);
            } else if (typeof error.error === 'string') {
              this.toast.error(error.error);
            } else {
              this.toast.error('Something went wrong! Please try again later.');
            }
          } else {
            this.toast.error('Connection error. Please check your internet connection and try again.');
          }
          this.loading$.next(false);
        },
      );
    }
  }
}

