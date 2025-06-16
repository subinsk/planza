import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogRef } from '@ngneat/dialog';
import cuid from 'cuid';
import { kebabCase } from 'lodash';

@Component({
  selector: 'planza-orgs-create-modal',
  template: ` <planza-modal
    [title]="ref.data.isUpdateMode ? 'Update Org' : 'Create New Org'"
    [ref]="ref"
    cdkTrapFocus
    cdkTrapFocusAutoCapture
  >
    <section>
      <form [formGroup]="orgForm" id="orgForm" class="max-w-xl" (ngSubmit)="handleFormSubmit()">
        <div class="form-group">
          <label for="name">Name</label>
          <input class="w-full" type="text" id="name" formControlName="name" cdkFocusInitial />
        </div>
      </form>
    </section>

    <ng-template planzaModalActions>
      <div class="flex justify-end space-x-4">
        <button btn type="button" variant="secondary" (click)="ref.close()">Close</button>
        <button btn type="submit" form="orgForm" variant="primary" [disabled]="orgForm.invalid">
          {{ ref.data.isUpdateMode ? 'Update' : 'Create' }}
        </button>
      </div>
    </ng-template>
  </planza-modal>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgsCreateModalComponent implements OnInit {
  orgForm!: FormGroup;

  constructor(public ref: DialogRef, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    const initialData = this.ref.data?.initialData;
    if (initialData) {
      this.orgForm.patchValue(initialData);
    }
  }

  handleFormSubmit() {
    this.ref.close(this.orgForm.value);
  }

  private initForm() {
    this.orgForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(20), Validators.minLength(3)]],
      slug: ['', Validators.required],
      members: [[]],
    });
    this.orgForm.get('name')?.valueChanges.subscribe((data) => {
      this.orgForm.get('slug')?.setValue(`${kebabCase(data)}-${cuid()}`);
    });
  }
}



