import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CardEvent, Organization, UserDetails } from '@planza/api-interfaces';
@Component({
  selector: 'planza-orgs-card',
  template: `<article
      *ngIf="data"
      class="p-4 relative rounded-md border transition-all hover:shadow-lg duration-200 ease-in hover:border-gray-200
      border-gray-100 bg-white shadow-sm"
    >
      <button
        *ngIf="data?.createdById === user?.userId"
        [tippy]="moreOptions"
        placement="bottom-start"
        variation="menu"
        class="absolute z-10 top-3 right-3 text-gray-500 hover:bg-gray-100 p-1 rounded-md"
      >
        <rmx-icon class="icon-xs" name="more-2-fill"></rmx-icon>
      </button>
      <header>
        <p class="text-md font-medium cursor-pointer hover:text-primary" [routerLink]="['/app/orgs', data.id]">
          {{ data?.name }}
        </p>
        <p class="text-xs text-gray-400 ">
          Assigned role <span class="font-medium text-gray-600">{{ data?.userRoleOrg?.[0]?.role?.label }}</span>
        </p>
      </header>
      <div class="my-4">
        <planza-user-avatar-group [data]="[]"></planza-user-avatar-group>
      </div>
      <footer class="flex items-center justify-between text-xs text-gray-400 mt-4">
        <p>
          Created
          <span class="font-medium text-gray-600">{{ data?.createdAt | timeAgo }}</span>
        </p>
        <div [tippy]="data?.createdById === user?.userId ? 'Own Org' : 'Invited Org'">
          <rmx-icon
            class="icon-sm"
            [name]="data?.createdById === user?.userId ? 'user-settings-line' : 'user-shared-2-line'"
          ></rmx-icon>
        </div>
      </footer>
    </article>

    <ng-template #moreOptions let-hide>
      <div class="flex flex-col w-44">
        <div class="dropdown-item" (click)="clicked.emit({ type: 'edit' }); hide()">Edit</div>
        <div class="text-red-600 dropdown-item" (click)="clicked.emit({ type: 'delete' }); hide()">Delete</div>
      </div>
    </ng-template>`,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgsCardComponent {
  @Input() data: Organization | null = null;
  @Input() user: UserDetails | null = null;
  @Output() clicked = new EventEmitter<CardEvent>();
}



