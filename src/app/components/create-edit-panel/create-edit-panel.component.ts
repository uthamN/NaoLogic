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
  { value: 'open',        label: 'Open'        },
  { value: 'in-progress', label: 'In progress' },
  { value: 'complete',    label: 'Complete'    },
  { value: 'blocked',     label: 'Blocked'     },
];

// Cross-field validator attached at group level so it can read both
// startDate and endDate simultaneously. Returns null (valid) when either
// field is still empty so Validators.required surfaces first.
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
  fb  = inject(FormBuilder);

  statusOpts = STATUS_OPTS;
  overlapErr = false;
  submitted  = false;
  statusOpen = signal(false);
  // menuPos holds the fixed viewport coordinates for the status dropdown.
  // Named menuPos to match the template binding — set in toggleStatus().
  menuPos    = signal({ top: 0, left: 0, width: 0 });
  panel      = this.svc.panelState;

  wcName = computed(() => {
    const ps   = this.panel();
    const wcId = ps.workCenterId ?? ps.editOrder?.data.workCenterId;
    return this.svc.workCenters().find((w) => w.docId === wcId)?.data.name ?? '';
  });

  isEdit = computed(() => this.panel().mode === 'edit');

  form = this.fb.group(
    {
      name:      ['', Validators.required],
      status:    ['' as WorkOrderStatus, Validators.required],
      startDate: ['', Validators.required],
      endDate:   ['', Validators.required],
    },
    { validators: endAfterStart },
  );

  constructor() {
    // Poll on every animation frame to detect the closed→open edge.
    // populate() only fires on the rising edge, so the cost is minimal.
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
    this.submitted  = false;
    this.overlapErr = false;
    this.statusOpen.set(false);
    const ps = this.panel();
    if (ps.mode === 'create') {
      this.form.reset({ name: '', status: '' as WorkOrderStatus, startDate: '', endDate: '' });
    } else if (ps.editOrder) {
      // Pre-fill all fields from the existing order so the user sees current
      // values and only needs to change what they want.
      const d = ps.editOrder.data;
      this.form.reset({ name: d.name, status: d.status, startDate: d.startDate, endDate: d.endDate });
    }
  }

  get f() { return this.form.controls; }

  get currentStatus(): WorkOrderStatus {
    return this.f['status'].value as WorkOrderStatus;
  }

  statusLabel(v: WorkOrderStatus): string {
    return STATUS_OPTS.find((o) => o.value === v)?.label ?? '';
  }

  cancel() {
    this.svc.closePanel();
  }

  toggleStatus(e: MouseEvent) {
    // stopPropagation() prevents the document-level click handler from
    // closing the dropdown on the same event that opens it.
    e.stopPropagation();
    if (!this.statusOpen()) {
      // Capture the trigger's viewport rect so the fixed-position dropdown
      // aligns exactly below it, regardless of scroll position.
      const trigger = (e.currentTarget as HTMLElement).getBoundingClientRect();
      this.menuPos.set({ top: trigger.bottom + 4, left: trigger.left, width: trigger.width });
    }
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
    // Auto-advance disabled: setting endDate automatically overwrote
    // user-entered values unexpectedly.
    // if (s && (!e || e <= s)) this.f['endDate'].setValue(this.plusDays(s, 7));
  }

  submit() {
    this.submitted  = true;
    this.overlapErr = false;

    // Angular validators (required + endAfterStart) run first.
    if (this.form.invalid) return;

    const { name, status, startDate, endDate } = this.form.value as {
      name: string; status: WorkOrderStatus; startDate: string; endDate: string;
    };
    const ps   = this.panel();
    const wcId = ps.workCenterId ?? ps.editOrder?.data.workCenterId ?? '';

    // excludeId is passed in edit mode so the order doesn't conflict with
    // its own existing position in the stored list.
    if (this.svc.hasOverlap(wcId, startDate, endDate, ps.editOrder?.docId)) {
      this.overlapErr = true;
      return;
    }

    if (ps.mode === 'create') {
      this.svc.createOrder({ docType: 'workOrder', data: { name, workCenterId: wcId, status, startDate, endDate } });
    } else if (ps.editOrder) {
      this.svc.updateOrder(ps.editOrder.docId, { name, workCenterId: wcId, status, startDate, endDate });
    }
    // createOrder / updateOrder both call closePanel() internally.
  }

  private plusDays(iso: string, n: number): string {
    const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  }
}