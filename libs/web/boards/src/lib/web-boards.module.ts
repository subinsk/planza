import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  AssetUrlPipeModule,
  ButtonModule,
  FileDndModule,
  IconModule,
  PageHeaderModule,
  TaskSharedModule,
  TimeAgoModule,
  UserAvatarGroupModule,
  UserSelectModule,
} from '@planza/web/ui';
import { TippyModule } from '@ngneat/helipopper';
import { ShimmerModule } from '@sreyaj/ng-shimmer';
import { ContenteditableValueAccessorModule } from '@tinkoff/angular-contenteditable-accessor';
import { BoardsComponent } from './boards.component';
import { TaskDetailModalComponent } from './shared/components/task-detail-modal/task-detail-modal.component';
@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: ':id/tasks/:taskId',
        component: BoardsComponent,
      },
      {
        path: ':id',
        component: BoardsComponent,
      },
    ]),
    PageHeaderModule,
    IconModule,
    ButtonModule,
    DragDropModule,
    UserAvatarGroupModule,
    TippyModule,
    FormsModule,
    ReactiveFormsModule,
    ContenteditableValueAccessorModule,
    TimeAgoModule,
    TaskSharedModule,
    UserSelectModule,
    ShimmerModule,
    FileDndModule,
    AssetUrlPipeModule,
  ],
  declarations: [BoardsComponent, TaskDetailModalComponent],
})
export class WebBoardsModule {}


