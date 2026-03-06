import {
  Component,
  inject,
  computed,
  ElementRef,
  ViewChild,
  AfterViewInit,
  signal,
  effect,
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { TimelineService } from '../../services/timeline.service';
import { WorkOrderBarComponent } from '../work-order-bar/work-order-bar.component';
import { WorkOrderDocument, ZoomLevel } from '../../models';

interface ColDef {
  label: string;
  subLabel: string;
  isToday: boolean;
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [NgFor, NgIf, WorkOrderBarComponent],
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
})
export class TimelineComponent implements AfterViewInit {
  constructor() {
    effect(() => {
      const z = this.svc.zoom();
      this.totalCols.set(this.TOTAL_N[z]);
      this.extraLeft.set(0);
      setTimeout(() => this.scrollToToday(), 60);
    });
  }
  @ViewChild('rightScroll') rightScrollRef!: ElementRef<HTMLElement>;

  svc = inject(TimelineService);
  TODAY = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  NOW = new Date();

  private MONTHS_SHORT = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  private MONTHS_FULL = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  private DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  private COL_W: Record<ZoomLevel, number> = {
    hour: 90,
    day: 56,
    week: 110,
    month: 130,
  };
  private TOTAL_N: Record<ZoomLevel, number> = {
    hour: 48,
    day: 60,
    week: 26,
    month: 14,
  };

  hoveredWcId = signal<string | null>(null);

  colWidth = computed(() => this.COL_W[this.svc.zoom()]);
  totalCols = signal(this.TOTAL_N[this.svc.zoom()]);
  extraLeft = signal(0);
  totalWidth = computed(() => this.totalCols() * this.colWidth());

  rangeStart = computed<Date>(() => {
    const z = this.svc.zoom();
    if (z === 'hour') {
      const d = new Date(this.NOW);
      d.setMinutes(0, 0, 0);
      d.setHours(
        d.getHours() - Math.floor(this.TOTAL_N['hour'] / 2) - this.extraLeft(),
      );
      return d;
    }
    const half = Math.floor(this.TOTAL_N[z] / 2) + this.extraLeft();
    return new Date(this.TODAY.getTime() - half * this.unitMs());
  });

  cols = computed<ColDef[]>(() =>
    Array.from({ length: this.totalCols() }, (_, i) => ({
      label: this.buildLabel(i),
      subLabel: this.buildSubLabel(i),
      isToday: this.isTodayCol(i),
    })),
  );

  todayOffsetPx = computed(() => {
    const ref = this.svc.zoom() === 'hour' ? this.NOW : this.TODAY;
    return (
      ((ref.getTime() - this.rangeStart().getTime()) / this.unitMs()) *
      this.colWidth()
    );
  });

  ordersForWc(wcId: string): WorkOrderDocument[] {
    const z = this.svc.zoom();
    return this.svc.workOrders().filter((o) => {
      if (o.data.workCenterId !== wcId) return false;
      const isHourOrder = o.data.startDate.includes('T');
      if (z === 'hour') return isHourOrder;
      return !isHourOrder;
    });
  }

  barStyle(wo: WorkOrderDocument): { left: string; width: string } {
    const cw = this.colWidth();
    const unit = this.unitMs();
    const s = new Date(wo.data.startDate);
    const e = new Date(wo.data.endDate);
    const left = Math.round(
      ((s.getTime() - this.rangeStart().getTime()) / unit) * cw,
    );
    const width = Math.max(
      40,
      Math.round(((e.getTime() - s.getTime()) / unit) * cw),
    );
    return { left: left + 'px', width: width + 'px' };
  }

  onRowClick(wcId: string, event: MouseEvent) {
    if ((event.target as HTMLElement).closest('app-work-order-bar')) return;
    const row = event.currentTarget as HTMLElement;
    const scrollL = this.rightScrollRef.nativeElement.scrollLeft;
    const xInRow = event.clientX - row.getBoundingClientRect().left + scrollL;
    const colIdx = Math.floor(xInRow / this.colWidth());
    const clicked = new Date(
      this.rangeStart().getTime() + colIdx * this.unitMs(),
    );
    this.svc.openCreatePanel(wcId, this.toIsoString(clicked));
  }

  scrollToToday() {
    const el = this.rightScrollRef?.nativeElement;
    if (!el) return;
    el.scrollTo({
      left: this.todayOffsetPx() - el.clientWidth / 2,
      behavior: 'smooth',
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.scrollToToday(), 60);

    const el = this.rightScrollRef.nativeElement;
    el.addEventListener('scroll', () => this.onScroll());
  }

  private onScroll() {
    const el = this.rightScrollRef.nativeElement;
    const threshold = 300; // px from edge to trigger load
    const CHUNK = 12; // how many cols to add at a time

    // Near right edge — append columns
    if (el.scrollWidth - el.scrollLeft - el.clientWidth < threshold) {
      this.totalCols.update((n) => n + CHUNK);
    }

    // Near left edge — prepend columns by expanding rangeStart
    if (el.scrollLeft < threshold) {
      const prevScrollWidth = el.scrollWidth;
      this.totalCols.update((n) => n + CHUNK);
      this.extraLeft.update((n) => n + CHUNK);

      // After Angular updates the DOM, restore scroll position
      // so the view doesn't jump
      setTimeout(() => {
        const added = el.scrollWidth - prevScrollWidth;
        el.scrollLeft += added;
      }, 0);
    }
  }

  private unitMs(): number {
    const z = this.svc.zoom();
    if (z === 'hour') return 3_600_000;
    if (z === 'day') return 86_400_000;
    if (z === 'week') return 7 * 86_400_000;
    return 30 * 86_400_000;
  }

  private colDate(i: number): Date {
    return new Date(this.rangeStart().getTime() + i * this.unitMs());
  }

  private isTodayCol(i: number): boolean {
    const d = this.colDate(i);
    const z = this.svc.zoom();
    if (z === 'hour') {
      const now = this.NOW;
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate() &&
        d.getHours() === now.getHours()
      );
    }
    if (z === 'day') return d.toDateString() === this.TODAY.toDateString();
    if (z === 'week') {
      const end = new Date(d.getTime() + 6 * 86_400_000);
      return this.TODAY >= d && this.TODAY <= end;
    }
    return (
      d.getFullYear() === this.TODAY.getFullYear() &&
      d.getMonth() === this.TODAY.getMonth()
    );
  }

  private buildLabel(i: number): string {
    const d = this.colDate(i);
    const z = this.svc.zoom();
    if (z === 'hour') return String(d.getHours()).padStart(2, '0') + ':00';
    if (z === 'day') return this.DAYS[d.getDay()];
    if (z === 'week')
      return this.MONTHS_SHORT[d.getMonth()] + ' ' + d.getDate();
    return this.MONTHS_SHORT[d.getMonth()] + ' ' + d.getFullYear();
  }

  private buildSubLabel(i: number): string {
    const d = this.colDate(i);
    const z = this.svc.zoom();
    if (z === 'hour') {
      const prev = i > 0 ? this.colDate(i - 1) : null;
      if (!prev || prev.getDate() !== d.getDate())
        return this.MONTHS_SHORT[d.getMonth()] + ' ' + d.getDate();
      return '';
    }
    if (z === 'day') return String(d.getDate());
    return '';
  }

  private toIsoString(d: Date): string {
    if (this.svc.zoom() === 'hour') {
      const p = (n: number) => String(n).padStart(2, '0');
      return (
        d.getFullYear() +
        '-' +
        p(d.getMonth() + 1) +
        '-' +
        p(d.getDate()) +
        'T' +
        p(d.getHours()) +
        ':00'
      );
    }
    return d.toISOString().split('T')[0];
  }
}
