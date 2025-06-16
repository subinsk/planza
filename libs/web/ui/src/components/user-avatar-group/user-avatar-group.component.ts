import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export interface UserAvatarGroupData {
  name: string;
  image: string;
}

@Component({
  selector: 'planza-user-avatar-group',
  template: `
    <div *ngIf="data">
      <ul class="flex items-center -space-x-4">
        <ng-container *ngFor="let item of data | slice: 0:itemsToShow">
          <li [tippy]="item.name" class="rounded-full bg-white p-1 cursor-pointer">
            <img
              class="rounded-full pointer-events-none"
              [width]="size"
              [height]="size"
              [src]="item.image"
              [alt]="item.name"
            />
          </li>
        </ng-container>
        <ng-container *ngIf="data.length - itemsToShow > 0">
          <li class="rounded-full bg-gray-100 cursor-pointer">
            <div
              class="flex justify-center items-center text-gray-500"
              [style.height.px]="size"
              [style.width.px]="size"
            >
              <p class="text-sm">+{{ data.length - itemsToShow }}</p>
            </div>
          </li>
        </ng-container>
      </ul>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatarGroupComponent {
  @Input() data: UserAvatarGroupData[] | null = [];
  @Input() size = 40;
  @Input() itemsToShow = 5;
}

