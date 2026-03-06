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

  dropdownPos = signal({ top: 0, left: 0 });

  get menuOpen(): boolean {
    return this.svc.activeMenuId() === this.workOrder.docId;
  }

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

  toggleMenu(e: MouseEvent) {
    e.stopPropagation();
    if (this.menuOpen) {
      this.svc.closeMenu();
    } else {
      const btn = (e.currentTarget as HTMLElement).getBoundingClientRect();
      this.dropdownPos.set({ top: btn.bottom + 4, left: btn.left - 108 });
      this.svc.openMenu(this.workOrder.docId);
    }
  }

  edit() {
    this.svc.closeMenu();
    this.svc.openEditPanel(this.workOrder);
  }

  delete() {
    this.svc.closeMenu();
    this.svc.deleteOrder(this.workOrder.docId);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!this.el.nativeElement.contains(e.target as Node)) {
      this.svc.closeMenu();
    }
  }
}
