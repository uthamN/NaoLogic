import { WorkCenterDocument, WorkOrderDocument } from '../models';

export const WORK_CENTERS: WorkCenterDocument[] = [
  { docId: 'wc-1', docType: 'workCenter', data: { name: 'Genesis Hardware' } },
  {
    docId: 'wc-2',
    docType: 'workCenter',
    data: { name: 'Rodriques Electrics' },
  },
  { docId: 'wc-3', docType: 'workCenter', data: { name: 'Konsulting Inc' } },
  {
    docId: 'wc-4',
    docType: 'workCenter',
    data: { name: 'McMarrow Distribution' },
  },
  {
    docId: 'wc-5',
    docType: 'workCenter',
    data: { name: 'Spartan Manufacturing' },
  },
  { docId: 'wc-6', docType: 'workCenter', data: { name: 'Centrix Ltd' } },
];

/** ISO date offset from today */
function d(offsetDays: number): string {
  const dt = new Date();
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() + offsetDays);
  return dt.toISOString().split('T')[0];
}

/** ISO datetime offset from now by hours */
function h(offsetHours: number): string {
  const dt = new Date();
  dt.setMinutes(0, 0, 0);
  dt.setHours(dt.getHours() + offsetHours);
  // Return as ISO string without seconds
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    dt.getFullYear() +
    '-' +
    pad(dt.getMonth() + 1) +
    '-' +
    pad(dt.getDate()) +
    'T' +
    pad(dt.getHours()) +
    ':00'
  );
}

export const WORK_ORDERS: WorkOrderDocument[] = [
  // Day/week/month visible orders (date-only)
  {
    docId: 'wo-1',
    docType: 'workOrder',
    data: {
      name: 'Centrix Ltd',
      workCenterId: 'wc-1',
      status: 'complete',
      startDate: d(-45),
      endDate: d(-10),
    },
  },
  {
    docId: 'wo-2',
    docType: 'workOrder',
    data: {
      name: 'Rodriques Electrics',
      workCenterId: 'wc-2',
      status: 'open',
      startDate: d(-5),
      endDate: d(20),
    },
  },
  {
    docId: 'wo-3',
    docType: 'workOrder',
    data: {
      name: 'Konsulting Inc',
      workCenterId: 'wc-3',
      status: 'in-progress',
      startDate: d(-30),
      endDate: d(5),
    },
  },
  {
    docId: 'wo-4',
    docType: 'workOrder',
    data: {
      name: 'Compleks Systems',
      workCenterId: 'wc-3',
      status: 'in-progress',
      startDate: d(15),
      endDate: d(50),
    },
  },
  {
    docId: 'wo-5',
    docType: 'workOrder',
    data: {
      name: 'McMarrow Distribution',
      workCenterId: 'wc-4',
      status: 'open',
      startDate: d(-20),
      endDate: d(20),
    },
  },
  {
    docId: 'wo-6',
    docType: 'workOrder',
    data: {
      name: 'Blocked Run',
      workCenterId: 'wc-4',
      status: 'blocked',
      startDate: d(35),
      endDate: d(65),
    },
  },
  {
    docId: 'wo-7',
    docType: 'workOrder',
    data: {
      name: 'Spartan Batch A',
      workCenterId: 'wc-5',
      status: 'complete',
      startDate: d(-60),
      endDate: d(-25),
    },
  },
  {
    docId: 'wo-8',
    docType: 'workOrder',
    data: {
      name: 'Genesis QC Run',
      workCenterId: 'wc-1',
      status: 'in-progress',
      startDate: d(10),
      endDate: d(40),
    },
  },
  // Hour view orders (datetime with T)
  {
    docId: 'wo-h1',
    docType: 'workOrder',
    data: {
      name: 'Morning Shift',
      workCenterId: 'wc-1',
      status: 'complete',
      startDate: h(-6),
      endDate: h(-3),
    },
  },
  {
    docId: 'wo-h2',
    docType: 'workOrder',
    data: {
      name: 'Assembly Run',
      workCenterId: 'wc-2',
      status: 'in-progress',
      startDate: h(-2),
      endDate: h(3),
    },
  },
  {
    docId: 'wo-h3',
    docType: 'workOrder',
    data: {
      name: 'QC Check',
      workCenterId: 'wc-3',
      status: 'open',
      startDate: h(1),
      endDate: h(5),
    },
  },
  {
    docId: 'wo-h4',
    docType: 'workOrder',
    data: {
      name: 'Line Maintenance',
      workCenterId: 'wc-4',
      status: 'blocked',
      startDate: h(-4),
      endDate: h(-1),
    },
  },
  {
    docId: 'wo-h5',
    docType: 'workOrder',
    data: {
      name: 'Packaging Slot',
      workCenterId: 'wc-5',
      status: 'open',
      startDate: h(2),
      endDate: h(7),
    },
  },
  {
    docId: 'wo-h6',
    docType: 'workOrder',
    data: {
      name: 'Centrix Urgent',
      workCenterId: 'wc-6',
      status: 'in-progress',
      startDate: h(-1),
      endDate: h(4),
    },
  },
];
