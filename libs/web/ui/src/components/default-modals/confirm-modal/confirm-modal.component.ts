import { Component } from '@angular/core';
import { DialogRef } from '@ngneat/dialog';

export interface ConfirmModalData {
  title: string;
  body: string;
  primaryAction: string;
  primaryActionType: 'primary' | 'secondary' | 'warn';
}

@Component({
  selector: 'planza-confirm-modal',
  template: `
    <header>
      <h2 class="font-medium text-gray-600 text-lg">{{ ref?.data?.title ?? 'Are you sure?' }}</h2>
    </header>
    <div class="flex-1 mt-4 text-sm text-gray-600">
      {{ ref?.data?.body ?? 'Confirm your action as it cannot be reversed. Are you sure that you want to proceed?' }}
    </div>
    <footer class="flex justify-end space-x-4" cdkTrapFocus cdkTrapFocusAutoCapture>
      <button planza-btn variant="secondary" (click)="ref.close(false)" cdkFocusInitial>Close</button>
      <button planza-btn [variant]="ref?.data?.primaryActionType ?? 'primary'" (click)="ref.close(true)">
        {{ ref?.data?.primaryAction ?? 'Confirm' }}
      </button>
    </footer>
  `,
  styles: [
    `
      :host {
        min-height: 200px;
        @apply p-4 flex flex-col;
      }
    `,
  ],
})
export class ConfirmModalComponent {
  constructor(public ref: DialogRef<ConfirmModalData>) {}
}

