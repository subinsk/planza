import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[planzaModalActions]',
})
export class ModalActionsDirective {
  constructor(public tpl: TemplateRef<HTMLElement>) {}
}

