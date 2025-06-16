import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadChildren: () => import('@planza/web/home').then((m) => m.WebHomeModule),
      },
      {
        path: 'orgs',
        loadChildren: () => import('@planza/web/orgs').then((m) => m.WebOrgsModule),
      },
      {
        path: 'projects',
        loadChildren: () => import('@planza/web/projects').then((m) => m.WebProjectsModule),
      },
      {
        path: 'boards',
        loadChildren: () => import('@planza/web/boards').then((m) => m.WebBoardsModule),
      },
      {
        path: 'tasks',
        loadChildren: () => import('@planza/web/tasks').then((m) => m.WebTasksModule),
      },
      {
        path: 'profile',
        loadChildren: () => import('@planza/web/profile').then((m) => m.WebProfileModule),
      },
      {
        path: 'users',
        loadChildren: () => import('@planza/web/users').then((m) => m.WebUsersModule),
      },
      {
        path: 'settings',
        loadChildren: () => import('@planza/web/settings').then((m) => m.WebSettingsModule),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}


