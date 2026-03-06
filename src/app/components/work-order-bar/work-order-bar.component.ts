import { Component, Input, inject, signal, HostListener, ElementRef } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';
import { WorkOrderDocument } from '../../models';
import { TimelineService } from '../../services/timeline.service';

@Component({
  selector: 'app-work-order-bar',
  standalone: true,
  imports: [NgIf, NgClass],
  templateUrl: './work-order-bar.component.html',
  styleUrls: ['./work-order-bar.component.scss']
})
export class WorkOrderBarComponent {
  @Input() workOrder!: WorkOrderDocument;
  @Input() showBadge = true;

  svc = inject(TimelineService);
  el  = inject(ElementRef);
  menuOpen = signal(false);

  get statusLabel(): string {
    const map: Record<string, string> = {
      'open': 'Open', 'in-progress': 'In progress',
      'complete': 'Complete', 'blocked': 'Blocked'
    };
    return map[this.workOrder.data.status] ?? this.workOrder.data.status;
  }

  onBarClick(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('.menu-btn')) return;
    this.svc.openEditPanel(this.workOrder);
  }

  dropdownPos = signal({ top: 0, left: 0 });

  toggleMenu(e: MouseEvent) {
    e.stopPropagation();
    if (!this.menuOpen()) {
      const btn  = (e.currentTarget as HTMLElement).getBoundingClientRect();
      this.dropdownPos.set({ top: btn.bottom + 4, left: btn.left - 100 });
    }
    this.menuOpen.update(v => !v);
  }

  edit()   { this.menuOpen.set(false); this.svc.openEditPanel(this.workOrder); }
  delete() { this.menuOpen.set(false); this.svc.deleteOrder(this.workOrder.docId); }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!this.el.nativeElement.contains(e.target as Node)) {
      this.menuOpen.set(false);
    }
  }
}