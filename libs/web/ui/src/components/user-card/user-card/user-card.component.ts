import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CardEvent, User, UserDetails } from '@planza/api-interfaces';

@Component({
  selector: 'planza-user-card',
  template: `
    <article
      *ngIf="data"
      class="p-4 rounded-md border transition-all hover:shadow-lg duration-200 ease-in
      border-gray-100 bg-white shadow-sm hover:border-gray-200 relative"
    >
      <ng-container *permission="'user:update'">
        <button
          *ngIf="!disabled.includes(data.id)"
          [tippy]="moreOptions"
          placement="bottom-start"
          variation="menu"
          class="absolute z-10 top-3 right-3 text-gray-500 hover:bg-gray-100 p-1 rounded-md"
        >
          <rmx-icon class="icon-xs" name="more-2-fill"></rmx-icon>
        </button>
      </ng-container>
      <header class="flex items-center justify-between relative">
        <div class="">
          <div class="relative">
            <img
              [src]="data?.image ?? 'https://avatar.tobi.sh/' + data.email"
              [alt]="data?.firstName"
              width="100"
              height="100"
              class="rounded-full mb-4"
            />
            <div
              *ngIf="data?.verified"
              class="bg-primary text-white absolute bottom-0 left-0 rounded-full border-4 border-white"
              [style.padding.px]="2"
              tippy="Verified"
            >
              <rmx-icon name="check-line" class="icon-xxs"></rmx-icon>
            </div>
          </div>
          <p class="text-md font-medium">{{ data?.firstName }} {{ data?.lastName }}</p>
          <p class="text-gray-400 text-sm line-clamp-2">{{ data?.email }}</p>
          <p class="text-gray-400 text-sm">
            Role
            <span class="font-medium text-gray-600">{{ data?.roles?.[0]?.role?.label }}</span>
          </p>
        </div>
      </header>
      <div class="my-4"></div>
      <footer class="flex items-center justify-between text-xs text-gray-400 mt-4">
        <div>
          <p>
            Since
            <span class="font-medium text-gray-600">{{ data?.createdAt | date: 'mediumDate' }}</span>
          </p>
        </div>
      </footer>
    </article>

    <ng-template #moreOptions let-hide>
      <div class="flex flex-col w-44">
        <div class="dropdown-item" (click)="clicked.emit({ type: 'edit' }); hide()">Edit</div>
        <div class="text-red-600 dropdown-item" (click)="clicked.emit({ type: 'remove' }); hide()">Remove</div>
      </div>
    </ng-template>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCardComponent {
  @Input() data: User | null = null;
  @Input() user!: UserDetails | null;

  @Input() disabled: string[] = [];
  @Output() clicked = new EventEmitter<CardEvent>();
}


