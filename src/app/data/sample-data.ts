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
  { docId: 'wc-7', docType: 'workCenter', data: { name: 'Apex Logistics' } },
  { docId: 'wc-8', docType: 'workCenter', data: { name: 'Wayne Enterprises'}}
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
  // ── wc-1: Genesis Hardware — 3 non-overlapping orders ──────────────────────
  // Spans ~8 months total: large past project, active mid-term, far future run
  {
    docId: 'wo-1',
    docType: 'workOrder',
    data: {
      name: 'Genesis Batch A',
      workCenterId: 'wc-1',
      status: 'complete',
      startDate: d(-240),
      endDate: d(-150),
    },
  },
  {
    docId: 'wo-2',
    docType: 'workOrder',
    data: {
      name: 'Genesis QC Run',
      workCenterId: 'wc-1',
      status: 'in-progress',
      startDate: d(-60),
      endDate: d(30),
    },
  },
  {
    docId: 'wo-3',
    docType: 'workOrder',
    data: {
      name: 'Genesis Phase 3',
      workCenterId: 'wc-1',
      status: 'open',
      startDate: d(90),
      endDate: d(210),
    },
  },

  // ── wc-2: Rodriques Electrics — 2 non-overlapping orders ───────────────────
  // One large completed contract, one long blocked run into the future
  {
    docId: 'wo-4',
    docType: 'workOrder',
    data: {
      name: 'Electrical Fit-Out',
      workCenterId: 'wc-2',
      status: 'complete',
      startDate: d(-300),
      endDate: d(-180),
    },
  },
  {
    docId: 'wo-5',
    docType: 'workOrder',
    data: {
      name: 'Wiring Run B',
      workCenterId: 'wc-2',
      status: 'blocked',
      startDate: d(-30),
      endDate: d(120),
    },
  },

  // ── wc-3: Konsulting Inc — 3 non-overlapping orders ────────────────────────
  // Past strategy, currently active retainer, and a long Q3/Q4 engagement
  {
    docId: 'wo-6',
    docType: 'workOrder',
    data: {
      name: 'Strategy Sprint',
      workCenterId: 'wc-3',
      status: 'complete',
      startDate: d(-365),
      endDate: d(-270),
    },
  },
  {
    docId: 'wo-7',
    docType: 'workOrder',
    data: {
      name: 'Konsulting Retainer',
      workCenterId: 'wc-3',
      status: 'in-progress',
      startDate: d(-90),
      endDate: d(60),
    },
  },
  {
    docId: 'wo-8',
    docType: 'workOrder',
    data: {
      name: 'Annual Deliverables',
      workCenterId: 'wc-3',
      status: 'open',
      startDate: d(120),
      endDate: d(300),
    },
  },

  // ── wc-4: McMarrow Distribution — 2 non-overlapping orders ─────────────────
  // Completed freight run, active long-haul contract running 5 months
  {
    docId: 'wo-9',
    docType: 'workOrder',
    data: {
      name: 'Freight Batch 1',
      workCenterId: 'wc-4',
      status: 'complete',
      startDate: d(-270),
      endDate: d(-150),
    },
  },
  {
    docId: 'wo-10',
    docType: 'workOrder',
    data: {
      name: 'Freight Batch 2',
      workCenterId: 'wc-4',
      status: 'blocked',
      startDate: d(-45),
      endDate: d(105),
    },
  },

  // ── wc-5: Spartan Manufacturing — 2 non-overlapping orders ─────────────────
  // Large in-progress production run, followed by a long planned campaign
  {
    docId: 'wo-11',
    docType: 'workOrder',
    data: {
      name: 'Spartan Line A',
      workCenterId: 'wc-5',
      status: 'in-progress',
      startDate: d(-120),
      endDate: d(30),
    },
  },
  {
    docId: 'wo-12',
    docType: 'workOrder',
    data: {
      name: 'Spartan Line B',
      workCenterId: 'wc-5',
      status: 'open',
      startDate: d(90),
      endDate: d(240),
    },
  },

  // ── wc-6: Centrix Ltd — 2 non-overlapping orders ───────────────────────────
  // Long completed pilot, then a scale-up spanning most of the coming year
  {
    docId: 'wo-13',
    docType: 'workOrder',
    data: {
      name: 'Centrix Pilot',
      workCenterId: 'wc-6',
      status: 'complete',
      startDate: d(-330),
      endDate: d(-180),
    },
  },
  {
    docId: 'wo-14',
    docType: 'workOrder',
    data: {
      name: 'Centrix Scale-Up',
      workCenterId: 'wc-6',
      status: 'open',
      startDate: d(-30),
      endDate: d(180),
    },
  },

  // ── wc-7: Apex Logistics — 2 non-overlapping orders ────────────────────────
  // Completed route planning, active fleet deployment running 4 months
  {
    docId: 'wo-15',
    docType: 'workOrder',
    data: {
      name: 'Apex Route Plan',
      workCenterId: 'wc-7',
      status: 'complete',
      startDate: d(-210),
      endDate: d(-90),
    },
  },
  {
    docId: 'wo-16',
    docType: 'workOrder',
    data: {
      name: 'Apex Fleet Run',
      workCenterId: 'wc-7',
      status: 'in-progress',
      startDate: d(-15),
      endDate: d(105),
    },
  },

  // ── Hour view orders (datetime with T) ─────────────────────────────────────
  // Wider hour spans (8–12 hrs) to be clearly visible in the hour grid
  {
    docId: 'wo-h1',
    docType: 'workOrder',
    data: {
      name: 'Morning Shift',
      workCenterId: 'wc-1',
      status: 'complete',
      startDate: h(-10),
      endDate: h(-4),
    },
  },
  {
    docId: 'wo-h2',
    docType: 'workOrder',
    data: {
      name: 'Afternoon Run',
      workCenterId: 'wc-1',
      status: 'open',
      startDate: h(4),
      endDate: h(12),
    },
  },
  {
    docId: 'wo-h3',
    docType: 'workOrder',
    data: {
      name: 'Assembly Run',
      workCenterId: 'wc-2',
      status: 'in-progress',
      startDate: h(-6),
      endDate: h(4),
    },
  },
  {
    docId: 'wo-h4',
    docType: 'workOrder',
    data: {
      name: 'QC Check',
      workCenterId: 'wc-3',
      status: 'open',
      startDate: h(2),
      endDate: h(10),
    },
  },
  {
    docId: 'wo-h5',
    docType: 'workOrder',
    data: {
      name: 'Line Maintenance',
      workCenterId: 'wc-4',
      status: 'blocked',
      startDate: h(-12),
      endDate: h(-4),
    },
  },
  {
    docId: 'wo-h6',
    docType: 'workOrder',
    data: {
      name: 'Packaging Slot',
      workCenterId: 'wc-5',
      status: 'open',
      startDate: h(3),
      endDate: h(11),
    },
  },
  {
    docId: 'wo-h7',
    docType: 'workOrder',
    data: {
      name: 'Centrix Urgent',
      workCenterId: 'wc-6',
      status: 'in-progress',
      startDate: h(-5),
      endDate: h(6),
    },
  },
  {
    docId: 'wo-h8',
    docType: 'workOrder',
    data: {
      name: 'Apex Night Haul',
      workCenterId: 'wc-7',
      status: 'blocked',
      startDate: h(-14),
      endDate: h(-6),
    },
  },
];
