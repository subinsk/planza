import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BoardsState } from '@planza/web/boards/state';
import { OrgsState } from '@planza/web/orgs/state/orgs.state';
import { ProjectsState } from '@planza/web/projects/state';
import { TasksState } from '@planza/web/tasks/state/tasks.state';
import { ButtonModule, HeaderModule } from '@planza/web/ui';
import { UsersState } from '@planza/web/users/state';
import { NgxsModule } from '@ngxs/store';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';

@NgModule({
  declarations: [DashboardComponent],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    ButtonModule,
    HeaderModule,
    NgxsModule.forFeature([UsersState, OrgsState, ProjectsState, BoardsState, TasksState]),
  ],
})
export class DashboardModule {}


