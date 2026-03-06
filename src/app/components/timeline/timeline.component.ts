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
    // Reset column count and scroll to today whenever zoom changes.
    // effect() re-runs automatically when svc.zoom() signal changes.
    effect(() => {
      const z = this.svc.zoom();
      this.totalCols.set(this.TOTAL_N[z]);
      this.extraLeft.set(0);
      setTimeout(() => this.scrollToToday(), 60);
    });
  }

  @ViewChild('rightScroll') rightScrollRef!: ElementRef<HTMLElement>;

  svc = inject(TimelineService);

  // Snapshot today at midnight — used for day/week/month positioning.
  // Captured once at construction so all calculations in a session use
  // the same reference point.
  TODAY = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  // Snapshot the current time — used only for hour-view positioning.
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

  // totalCols is a signal (not a computed) so the infinite-scroll handler
  // can append/prepend columns without triggering a full zoom reset.
  totalCols = signal(this.TOTAL_N[this.svc.zoom()]);

  // Tracks how many columns have been prepended to the left. Used to shift
  // rangeStart backward so existing bars stay in the correct position after
  // left-side expansion.
  extraLeft = signal(0);

  totalWidth = computed(() => this.totalCols() * this.colWidth());

  rangeStart = computed<Date>(() => {
    const z = this.svc.zoom();

    if (z === 'hour') {
      // Centre the hour grid on NOW. Subtract half the total columns (plus any
      // prepended extras) to put the current hour roughly in the middle.
      const d = new Date(this.NOW);
      d.setMinutes(0, 0, 0);
      d.setHours(
        d.getHours() - Math.floor(this.TOTAL_N['hour'] / 2) - this.extraLeft(),
      );
      return d;
    }

    // For day/week/month, centre on TODAY using the same offset logic.
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

  // Pixel offset of the current time from the left edge of the grid.
  // Used to position the today/now vertical line.
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
      // Orders with a 'T' in startDate are hour-view orders (YYYY-MM-DDTHH:mm).
      // Bare date strings (YYYY-MM-DD) are shown in day/week/month views only.
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

    // Convert the order's start/end timestamps to pixel offsets relative to
    // rangeStart. Math.round avoids sub-pixel gaps between adjacent bars.
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
    // Ignore clicks that land on an existing bar — those are handled by
    // WorkOrderBarComponent and should not open the create panel.
    if ((event.target as HTMLElement).closest('app-work-order-bar')) return;

    // Calculate which column the click landed in by combining the event's
    // clientX with the scroll offset, then dividing by column width.
    const row = event.currentTarget as HTMLElement;
    const scrollL = this.rightScrollRef.nativeElement.scrollLeft;
    const xInRow = event.clientX - row.getBoundingClientRect().left + scrollL;
    const colIdx = Math.floor(xInRow / this.colWidth());

    // Translate the column index back to a Date by multiplying by unitMs and
    // adding to rangeStart, then pass it to the service as a pre-fill date.
    const clicked = new Date(
      this.rangeStart().getTime() + colIdx * this.unitMs(),
    );
    this.svc.openCreatePanel(wcId, this.toIsoString(clicked));
  }

  scrollToToday() {
    const el = this.rightScrollRef?.nativeElement;
    if (!el) return;
    // Centre today in the viewport by offsetting by half the container width.
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
    const threshold = 300; // px from edge before loading more columns
    const CHUNK = 12; // columns added per load

    // Right edge: simply append more columns — rangeStart is unchanged.
    if (el.scrollWidth - el.scrollLeft - el.clientWidth < threshold) {
      this.totalCols.update((n) => n + CHUNK);
    }

    // Left edge: prepend columns by incrementing extraLeft so rangeStart
    // shifts backward by CHUNK * unitMs. Then immediately restore the scroll
    // position so the visible area doesn't jump.
    if (el.scrollLeft < threshold) {
      const prevScrollWidth = el.scrollWidth;
      this.totalCols.update((n) => n + CHUNK);
      this.extraLeft.update((n) => n + CHUNK);

      setTimeout(() => {
        const added = el.scrollWidth - prevScrollWidth;
        el.scrollLeft += added;
      }, 0);
    }
  }

  // Returns the duration of one column in milliseconds for the current zoom.
  // Used as the common divisor for all pixel ↔ time conversions.
  private unitMs(): number {
    const z = this.svc.zoom();
    if (z === 'hour') return 3_600_000;
    if (z === 'day') return 86_400_000;
    if (z === 'week') return 7 * 86_400_000;
    return 30 * 86_400_000; // month approximation
  }

  private colDate(i: number): Date {
    return new Date(this.rangeStart().getTime() + i * this.unitMs());
  }

  private isTodayCol(i: number): boolean {
    const d = this.colDate(i);
    const z = this.svc.zoom();

    if (z === 'hour') {
      const now = this.NOW;
      // Match year + month + day + hour — all four must align for the hour view.
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate() &&
        d.getHours() === now.getHours()
      );
    }
    if (z === 'day') return d.toDateString() === this.TODAY.toDateString();
    if (z === 'week') {
      // The "today" column in week view is the week that contains TODAY.
      const end = new Date(d.getTime() + 6 * 86_400_000);
      return this.TODAY >= d && this.TODAY <= end;
    }
    // Month view: match year and month only.
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
      // Show a date badge (e.g. "Mar 6") only on the first hour of a new day,
      // detected by comparing this column's date to the previous column's date.
      const prev = i > 0 ? this.colDate(i - 1) : null;
      if (!prev || prev.getDate() !== d.getDate())
        return this.MONTHS_SHORT[d.getMonth()] + ' ' + d.getDate();
      return '';
    }
    if (z === 'day') return String(d.getDate());
    return '';
  }

  // Serialises a Date to the correct ISO format for the current zoom level.
  // Hour view uses YYYY-MM-DDTHH:mm so the order is treated as an hour-view order.
  // All other views use YYYY-MM-DD bare date strings.
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
