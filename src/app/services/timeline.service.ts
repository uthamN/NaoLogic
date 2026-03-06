import { Injectable, signal } from '@angular/core';
import {
  WorkCenterDocument,
  WorkOrderDocument,
  ZoomLevel,
  PanelState,
} from '../models';
import { WORK_CENTERS, WORK_ORDERS } from '../data/sample-data';

@Injectable({ providedIn: 'root' })
export class TimelineService {
  workCenters = signal<WorkCenterDocument[]>(WORK_CENTERS);

  // On first load, try to restore persisted orders from localStorage.
  // The ?? 'null' turns a missing key into the string 'null' so
  // JSON.parse returns null rather than throwing, and the outer ??
  // falls back to the bundled sample data.
  workOrders = signal<WorkOrderDocument[]>(
    JSON.parse(localStorage.getItem('wo_orders') ?? 'null') ?? WORK_ORDERS,
  );

  zoom = signal<ZoomLevel>('month');
  panelState = signal<PanelState>({ open: false, mode: 'create' });

  // Tracks which bar's three-dot menu is currently open.
  // Storing it here (rather than as a local signal on each bar) ensures
  // only one menu can be open at a time without inter-component messaging.
  activeMenuId = signal<string | null>(null);

  // Serialises the entire workOrders array to localStorage after every
  // mutation. Full overwrite on each call — no diffing or patching.
  private persist() {
    localStorage.setItem('wo_orders', JSON.stringify(this.workOrders()));
  }

  setZoom(z: ZoomLevel) {
    this.zoom.set(z);
  }

  openMenu(id: string) {
    this.activeMenuId.set(id);
  }
  closeMenu() {
    this.activeMenuId.set(null);
  }

  openCreatePanel(workCenterId: string, prefillStartDate: string) {
    // Close any open bar menu before opening the panel so the UI
    // doesn't have two overlays visible at once.
    this.activeMenuId.set(null);
    this.panelState.set({
      open: true,
      mode: 'create',
      workCenterId,
      prefillStartDate,
    });
  }

  openEditPanel(order: WorkOrderDocument) {
    this.activeMenuId.set(null);
    this.panelState.set({
      open: true,
      mode: 'edit',
      editOrder: order,
      workCenterId: order.data.workCenterId,
    });
  }

  closePanel() {
    this.panelState.set({ open: false, mode: 'create' });
  }

  hasOverlap(
    wcId: string,
    start: string,
    end: string,
    excludeId?: string,
  ): boolean {
    // Bare YYYY-MM-DD strings are parsed as UTC midnight by the Date constructor,
    // so appending T00:00:00 forces local midnight instead, keeping all comparisons
    // in the same timezone as the user's browser.
    const toMs = (s: string | null | undefined): number => {
      if (!s) return NaN;
      return new Date(s.includes('T') ? s : s + 'T00:00:00').getTime();
    };

    const newStart = toMs(start);
    const newEnd = toMs(end);

    // Bail early if form values are invalid — form validation should have
    // caught this before submit() calls hasOverlap, but we guard defensively.
    if (isNaN(newStart) || isNaN(newEnd)) return false;

    // A zero-length range (same start and end) cannot overlap anything.
    if (newEnd <= newStart) return false;

    return this.workOrders().some((wo) => {
      if (wo.data.workCenterId !== wcId) return false;

      // In edit mode, exclude the order being edited so it doesn't
      // conflict with its own current position in the stored list.
      if (wo.docId === excludeId) return false;

      const exStart = toMs(wo.data.startDate);
      const exEnd = toMs(wo.data.endDate);

      if (isNaN(exStart) || isNaN(exEnd)) return false;

      // Standard interval overlap test: [a,b) and [c,d) overlap iff a < d && b > c.
      // Touching endpoints (newEnd === exStart) are intentionally NOT an overlap.
      return newStart < exEnd && newEnd > exStart;
    });
  }

  createOrder(order: Omit<WorkOrderDocument, 'docId'>) {
    // Generate a unique docId from the current timestamp. Sufficient for a
    // single-user local app — would need a UUID or server ID in production.
    this.workOrders.update((list) => [
      ...list,
      { ...order, docId: 'wo-' + Date.now() },
    ]);
    this.persist();
    this.closePanel();
  }

  updateOrder(docId: string, data: WorkOrderDocument['data']) {
    this.workOrders.update((list) =>
      list.map((wo) => (wo.docId === docId ? { ...wo, data } : wo)),
    );
    this.persist();
    this.closePanel();
  }

  deleteOrder(docId: string) {
    this.workOrders.update((list) => list.filter((wo) => wo.docId !== docId));
    this.persist();
  }
}
