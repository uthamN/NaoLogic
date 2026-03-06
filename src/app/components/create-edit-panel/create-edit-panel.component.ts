import { Component, inject, computed, signal } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { TimelineService } from '../../services/timeline.service';
import { WorkOrderStatus } from '../../models';

export const STATUS_OPTS: { value: WorkOrderStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'complete', label: 'Complete' },
  { value: 'blocked', label: 'Blocked' },
];

function endAfterStart(form: AbstractControl) {
  const s = form.get('startDate')?.value;
  const e = form.get('endDate')?.value;
  if (!s || !e) return null;
  return e > s ? null : { endBeforeStart: true };
}

@Component({
  selector: 'app-create-edit-panel',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, ReactiveFormsModule],
  templateUrl: './create-edit-panel.component.html',
  styleUrls: ['./create-edit-panel.component.scss'],
})
export class CreateEditPanelComponent {
  svc = inject(TimelineService);
  fb = inject(FormBuilder);

  statusOpts = STATUS_OPTS;
  overlapErr = false;
  submitted = false;
  statusOpen = signal(false);
  panel = this.svc.panelState;

  wcName = computed(() => {
    const ps = this.panel();
    const wcId = ps.workCenterId ?? ps.editOrder?.data.workCenterId;
    return (
      this.svc.workCenters().find((w) => w.docId === wcId)?.data.name ?? ''
    );
  });

  isEdit = computed(() => this.panel().mode === 'edit');

  form = this.fb.group(
    {
      name: ['', Validators.required],
      status: ['' as WorkOrderStatus, Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
    },
    { validators: endAfterStart },
  );

  constructor() {
    let wasOpen = false;
    const tick = () => {
      const open = this.panel().open;
      if (open && !wasOpen) this.populate();
      wasOpen = open;
      requestAnimationFrame(tick);
    };
    tick();
  }

  private populate() {
    this.submitted = false;
    this.overlapErr = false;
    this.statusOpen.set(false);
    const ps = this.panel();
    if (ps.mode === 'create') {
      // Do NOT pre-fill dates — leave blank for user to choose
      this.form.reset({
        name: '',
        status: '' as WorkOrderStatus,
        startDate: '',
        endDate: '',
      });
    } else if (ps.editOrder) {
      const d = ps.editOrder.data;
      this.form.reset({
        name: d.name,
        status: d.status,
        startDate: d.startDate,
        endDate: d.endDate,
      });
    }
  }

  get f() {
    return this.form.controls;
  }
  get currentStatus(): WorkOrderStatus {
    return this.f['status'].value as WorkOrderStatus;
  }

  statusLabel(v: WorkOrderStatus): string {
    return STATUS_OPTS.find((o) => o.value === v)?.label ?? '';
  }

  toggleStatus(e: MouseEvent) {
    e.stopPropagation();
    this.statusOpen.update((v) => !v);
  }

  selectStatus(v: WorkOrderStatus, e: MouseEvent) {
    e.stopPropagation();
    this.f['status'].setValue(v);
    this.statusOpen.set(false);
  }

  closeStatusDropdown() {
    this.statusOpen.set(false);
  }

  onStartChange() {
    const s = this.f['startDate'].value;
    const e = this.f['endDate'].value;
    if (s && (!e || e <= s)) this.f['endDate'].setValue(this.plusDays(s, 7));
  }

  submit() {
    this.submitted = true;
    this.overlapErr = false;
    if (this.form.invalid) return;

    const { name, status, startDate, endDate } = this.form.value as {
      name: string;
      status: WorkOrderStatus;
      startDate: string;
      endDate: string;
    };
    const ps = this.panel();
    const wcId = ps.workCenterId ?? ps.editOrder?.data.workCenterId ?? '';

    if (this.svc.hasOverlap(wcId, startDate, endDate, ps.editOrder?.docId)) {
      this.overlapErr = true;
      return;
    }

    if (ps.mode === 'create') {
      this.svc.createOrder({
        docType: 'workOrder',
        data: { name, workCenterId: wcId, status, startDate, endDate },
      });
    } else if (ps.editOrder) {
      this.svc.updateOrder(ps.editOrder.docId, {
        name,
        workCenterId: wcId,
        status,
        startDate,
        endDate,
      });
    }
  }

  private plusDays(iso: string, n: number): string {
    const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  }
}
