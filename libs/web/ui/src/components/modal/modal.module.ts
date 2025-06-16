import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ButtonModule } from '../button';
import { IconModule } from '../icon/icon.module';
import { ModalActionsDirective } from './modal-actions/modal-actions.directive';
import { ModalComponent } from './modal.component';

@NgModule({
  declarations: [ModalComponent, ModalActionsDirective],
  imports: [CommonModule, IconModule, ButtonModule],
  exports: [ModalComponent, ModalActionsDirective],
})
export class ModalModule {}

