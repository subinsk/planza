import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
  ButtonModule,
  IconModule,
  LoadingCardModule,
  PageHeaderModule,
  PermissionsDirectiveModule,
  SectionHeaderModule,
  TimeAgoModule,
  UserSelectModule,
} from '@planza/web/ui';
import { TippyModule } from '@ngneat/helipopper';
import { BoardsCardComponent } from '../../shared/components/boards-card/boards-card.component';
import { ProjectMemberCardComponent } from '../../shared/components/project-member-card/project-member-card.component';
import { ProjectsDetailComponent } from './projects-detail.component';

const routes: Routes = [{ path: '', component: ProjectsDetailComponent }];

@NgModule({
  declarations: [ProjectsDetailComponent, BoardsCardComponent, ProjectMemberCardComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    PageHeaderModule,
    IconModule,
    ButtonModule,
    TippyModule,
    TimeAgoModule,
    SectionHeaderModule,
    LoadingCardModule,
    UserSelectModule,
    PermissionsDirectiveModule,
  ],
})
export class ProjectsDetailModule {}


