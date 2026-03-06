export type WorkOrderStatus = 'open' | 'in-progress' | 'complete' | 'blocked';
export type ZoomLevel = 'hour' | 'day' | 'week' | 'month';

export interface WorkCenterDocument {
  docId: string;
  docType: 'workCenter';
  data: { name: string };
}

export interface WorkOrderDocument {
  docId: string;
  docType: 'workOrder';
  data: {
    name: string;
    workCenterId: string;
    status: WorkOrderStatus;
    startDate: string; // ISO datetime: "YYYY-MM-DDTHH:mm" for hour view, "YYYY-MM-DD" for others
    endDate: string;
  };
}

export interface PanelState {
  open: boolean;
  mode: 'create' | 'edit';
  workCenterId?: string;
  prefillStartDate?: string;
  editOrder?: WorkOrderDocument;
}
