import { Injectable, signal } from '@angular/core';
import { WorkCenterDocument, WorkOrderDocument, ZoomLevel, PanelState } from '../models';
import { WORK_CENTERS, WORK_ORDERS } from '../data/sample-data';

@Injectable({ providedIn: 'root' })
export class TimelineService {
  workCenters  = signal<WorkCenterDocument[]>(WORK_CENTERS);
  workOrders   = signal<WorkOrderDocument[]>(
    JSON.parse(localStorage.getItem('wo_orders') ?? 'null') ?? WORK_ORDERS
  );
  zoom         = signal<ZoomLevel>('month');
  panelState   = signal<PanelState>({ open: false, mode: 'create' });
  activeMenuId = signal<string | null>(null);

  private persist() {
    localStorage.setItem('wo_orders', JSON.stringify(this.workOrders()));
  }

  setZoom(z: ZoomLevel) { this.zoom.set(z); }

  openMenu(id: string)  { this.activeMenuId.set(id); }
  closeMenu()           { this.activeMenuId.set(null); }

  openCreatePanel(workCenterId: string, prefillStartDate: string) {
    this.activeMenuId.set(null);
    this.panelState.set({ open: true, mode: 'create', workCenterId, prefillStartDate });
  }

  openEditPanel(order: WorkOrderDocument) {
    this.activeMenuId.set(null);
    this.panelState.set({ open: true, mode: 'edit', editOrder: order,
      workCenterId: order.data.workCenterId });
  }

  closePanel() { this.panelState.set({ open: false, mode: 'create' }); }

  hasOverlap(wcId: string, start: string, end: string, excludeId?: string): boolean {
    // Null-safe parser: bare YYYY-MM-DD treated as local midnight via T00:00:00
    const toMs = (s: string | null | undefined): number => {
      if (!s) return NaN;
      return new Date(s.includes('T') ? s : s + 'T00:00:00').getTime();
    };

    const newStart = toMs(start);
    const newEnd   = toMs(end);

    // Guard: bail if form values are invalid (form validation should catch first)
    if (isNaN(newStart) || isNaN(newEnd)) return false;

    // Same-day start+end is zero-length — not a valid range
    if (newEnd <= newStart) return false;

    return this.workOrders().some(wo => {
      if (wo.data.workCenterId !== wcId) return false;
      if (wo.docId === excludeId)        return false;

      const exStart = toMs(wo.data.startDate);
      const exEnd   = toMs(wo.data.endDate);

      // Skip malformed stored orders
      if (isNaN(exStart) || isNaN(exEnd)) return false;

      // Ranges [a,b) and [c,d) overlap iff a < d AND b > c
      // Touching endpoints are NOT an overlap
      return newStart < exEnd && newEnd > exStart;
    });
  }

  createOrder(order: Omit<WorkOrderDocument, 'docId'>) {
    this.workOrders.update(list => [...list, { ...order, docId: 'wo-' + Date.now() }]);
    this.persist();
    this.closePanel();
  }

  updateOrder(docId: string, data: WorkOrderDocument['data']) {
    this.workOrders.update(list =>
      list.map(wo => wo.docId === docId ? { ...wo, data } : wo)
    );
    this.persist();
    this.closePanel();
  }

  deleteOrder(docId: string) {
    this.workOrders.update(list => list.filter(wo => wo.docId !== docId));
    this.persist();
  }
}