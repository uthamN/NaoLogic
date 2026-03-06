import { Injectable, signal } from '@angular/core';
import { WorkCenterDocument, WorkOrderDocument, ZoomLevel, PanelState } from '../models';
import { WORK_CENTERS, WORK_ORDERS } from '../data/sample-data';

@Injectable({ providedIn: 'root' })
export class TimelineService {
  workCenters = signal<WorkCenterDocument[]>(WORK_CENTERS);

  workOrders = signal<WorkOrderDocument[]>(
    JSON.parse(localStorage.getItem('wo_orders') ?? 'null') ?? WORK_ORDERS
  );

  zoom       = signal<ZoomLevel>('month');
  panelState = signal<PanelState>({ open: false, mode: 'create' });

  private persist() {
    localStorage.setItem('wo_orders', JSON.stringify(this.workOrders()));
  }

  setZoom(z: ZoomLevel) { this.zoom.set(z); }

  openCreatePanel(workCenterId: string, prefillStartDate: string) {
    this.panelState.set({ open: true, mode: 'create', workCenterId, prefillStartDate });
  }

  openEditPanel(order: WorkOrderDocument) {
    this.panelState.set({ open: true, mode: 'edit', editOrder: order,
      workCenterId: order.data.workCenterId });
  }

  closePanel() { this.panelState.set({ open: false, mode: 'create' }); }

  hasOverlap(wcId: string, start: string, end: string, excludeId?: string): boolean {
  // Normalise any value to a comparable timestamp number
    const toMs = (s: string): number => {
      // "YYYY-MM-DD" → treat as local midnight
      // "YYYY-MM-DDTHH:mm" → parse directly
      return new Date(s.includes('T') ? s : s + 'T00:00:00').getTime();
    };

    const newStart = toMs(start);
    const newEnd   = toMs(end);

    return this.workOrders().some(wo => {
      if (wo.data.workCenterId !== wcId) return false;
      if (wo.docId === excludeId)        return false;

      const exStart = toMs(wo.data.startDate);
      const exEnd   = toMs(wo.data.endDate);

      // Standard interval overlap: they overlap only if newStart < exEnd AND newEnd > exStart
      // Touching endpoints (newEnd === exStart) is NOT an overlap
      return newStart < exEnd && newEnd > exStart;
    });
  }

  createOrder(order: Omit<WorkOrderDocument, 'docId'>) {
    this.workOrders.update(list => [...list, { ...order, docId: 'wo-' + Date.now() }]);
    this.persist(); this.closePanel();
  }

  updateOrder(docId: string, data: WorkOrderDocument['data']) {
    this.workOrders.update(list =>
      list.map(wo => wo.docId === docId ? { ...wo, data } : wo)
    );
    this.persist(); this.closePanel();
  }

  deleteOrder(docId: string) {
    this.workOrders.update(list => list.filter(wo => wo.docId !== docId));
    this.persist();
  }
}
