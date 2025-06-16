import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
  ButtonModule,
  IconModule,
  LoadingCardModule,
  PageHeaderModule,
  ProjectCardModule,
  SectionHeaderModule,
  UserCardModule,
  UserSelectModule,
} from '@planza/web/ui';
import { TippyModule } from '@ngneat/helipopper';
import { OrgsDetailRoutingModule } from './orgs-detail-routing.module';
import { OrgsDetailComponent } from './orgs-detail.component';

const routes: Routes = [{ path: '', component: OrgsDetailComponent }];

@NgModule({
  declarations: [OrgsDetailComponent],
  imports: [
    CommonModule,
    OrgsDetailRoutingModule,
    RouterModule.forChild(routes),
    PageHeaderModule,
    SectionHeaderModule,
    IconModule,
    TippyModule,
    UserCardModule,
    ProjectCardModule,
    ButtonModule,
    LoadingCardModule,
    UserSelectModule,
  ],
})
export class OrgsDetailModule {}


