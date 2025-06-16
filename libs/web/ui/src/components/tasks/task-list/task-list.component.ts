import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { BoardListWithTasks, Task } from '@planza/api-interfaces';
@Component({
  selector: 'planza-task-list',
  template: `<div
    *ngIf="list"
    cdkDropList
    [cdkDropListData]="list.tasks"
    [id]="list.id"
    [cdkDropListConnectedTo]="list.id | dropListConnection: allList"
    (cdkDropListDropped)="dropped.emit($event)"
    class="task-list relative h-full border-2 border-transparent border-dashed bg-gray-50 rounded-md transition-all duration-200 ease-in p-4"
  >
    <ng-content></ng-content>
    <header class="flex items-center justify-between sticky top-0 mb-4">
      <p class="font-medium">{{ list?.name }}</p>
      <button
        (click)="newTask.emit(list.id)"
        class="text-gray-500 bg-white border rounded-md shadow-sm hover:shadow-md"
      >
        <rmx-icon class="w-5 h-5" name="add-line"></rmx-icon>
      </button>
    </header>
    <ul *ngIf="list.tasks.length > 0; else noTask" class="task-list__container space-y-4 -mx-4 px-4 py-2">
      <ng-container *ngFor="let task of list.tasks">
        <article cdkDrag class="relative task-card cursor-pointer">
          <div
            class="overview hidden rounded-md shadow-none absolute z-40 top-0 left-0 w-full h-full bg-gray-200"
          ></div>
          <planza-task-card
            [task]="task"
            [assignees]="task.assignees | usersToAvatarGroup"
            (clicked)="taskClicked.emit($event)"
          ></planza-task-card>
        </article>
      </ng-container>
    </ul>
    <ng-template #noTask>
      <div class="no-task mt-4">
        <p class="text-sm text-gray-400">No tasks available</p>
      </div>
    </ng-template>
  </div>`,
  styles: [
    `
      :host.cdk-drag-preview {
        .task-list {
          @apply shadow-xl;
        }
      }
      .task-list {
        @apply w-72;
        &.cdk-drop-list-dragging {
          @apply bg-gray-100 border-primary border-2;
          .task-list__container {
            /* @apply opacity-0; */
          }
          .no-task {
            @apply hidden;
          }
        }
      }
      .task-list__container {
        @apply overflow-y-auto;
        max-height: calc(100vh - var(--header-height) - 64px - 154px);
      }
      .task-card.cdk-drag-preview {
        @apply shadow-xl;
      }
      .cdk-drag.task-card.cdk-drag-placeholder {
        .overview {
          @apply flex;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent {
  @Input() list: BoardListWithTasks | null = null;
  @Input() allList: any[] = [];

  @Output() dropped = new EventEmitter();
  @Output() newTask = new EventEmitter<string>();
  @Output() taskClicked = new EventEmitter<Task>();
}



