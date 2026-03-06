import {
  Component,
  Input,
  inject,
  signal,
  HostListener,
  ElementRef,
} from '@angular/core';
import { NgIf, NgClass } from '@angular/common';
import { WorkOrderDocument } from '../../models';
import { TimelineService } from '../../services/timeline.service';

@Component({
  selector: 'app-work-order-bar',
  standalone: true,
  imports: [NgIf, NgClass],
  templateUrl: './work-order-bar.component.html',
  styleUrls: ['./work-order-bar.component.scss'],
})
export class WorkOrderBarComponent {
  @Input() workOrder!: WorkOrderDocument;
  @Input() showBadge = true;

  svc = inject(TimelineService);
  el = inject(ElementRef);

  dropdownPos = signal({ top: 0, left: 0 });

  // Derive open state from the service rather than a local boolean so only
  // one bar menu can ever be open at a time across the entire grid.
  get menuOpen(): boolean {
    return this.svc.activeMenuId() === this.workOrder.docId;
  }

  get statusLabel(): string {
    const map: Record<string, string> = {
      open: 'Open',
      'in-progress': 'In progress',
      complete: 'Complete',
      blocked: 'Blocked',
    };
    return map[this.workOrder.data.status] ?? this.workOrder.data.status;
  }

  onBarClick(e: MouseEvent) {
    // Ignore clicks that originated inside the three-dot button so opening
    // the menu doesn't simultaneously trigger an edit panel open.
    if ((e.target as HTMLElement).closest('.menu-btn')) return;
    this.svc.openEditPanel(this.workOrder);
  }

  toggleMenu(e: MouseEvent) {
    // stopPropagation() prevents the document:click listener below from
    // immediately closing the menu on the same event that opens it.
    e.stopPropagation();
    if (this.menuOpen) {
      this.svc.closeMenu();
    } else {
      // Capture the button's viewport rect at click time and store as fixed
      // coordinates. The dropdown uses position:fixed with these values so it
      // is never clipped by overflow:hidden/auto on any ancestor element.
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

  // Close the menu when the user clicks anywhere outside this component's
  // host element. Using nativeElement.contains() rather than stopPropagation()
  // on the menu itself keeps the event flow clean for other listeners on the page.
  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!this.el.nativeElement.contains(e.target as Node)) {
      this.svc.closeMenu();
    }
  }
}
