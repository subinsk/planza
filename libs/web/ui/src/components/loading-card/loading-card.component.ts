import { Component, Input } from '@angular/core';

@Component({
  selector: 'planza-loading-card',
  template: `
    <article [style.height]="height" class="p-4 relative rounded-md border border-gray-100 bg-white shadow-sm">
      <ng-content></ng-content>
    </article>
  `,
  styles: [],
})
export class LoadingCardComponent {
  @Input() height = '';
}

