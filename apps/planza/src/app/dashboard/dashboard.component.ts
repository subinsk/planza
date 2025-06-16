import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { Organization } from '@planza/api-interfaces';
import { OrgsAction } from '@planza/web/orgs/state/orgs.actions';
import { OrgsState } from '@planza/web/orgs/state/orgs.state';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';

@Component({
  selector: 'planza-dashboard',
  template: ` <main class="h-screen grid">
    <planza-header></planza-header>
    <section style="min-height: calc(100vh - 64px);" class="overflow-y-auto">
      <router-outlet></router-outlet>
    </section>
  </main>`,
})
export class DashboardComponent implements OnInit {
  @Select(OrgsState.getAllOrgs)
  orgs$!: Observable<Organization[]>;
  constructor(public auth: AuthService, private http: HttpClient, private store: Store) {}

  ngOnInit(): void {
    this.store.dispatch(new OrgsAction.GetAll());
  }
}



