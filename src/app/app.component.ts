import { Component, inject, ViewChild, HostListener } from '@angular/core';
import { NgIf } from '@angular/common';
import { TimelineComponent } from './components/timeline/timeline.component';
import { CreateEditPanelComponent } from './components/create-edit-panel/create-edit-panel.component';
import { TimelineService } from './services/timeline.service';
import { ZoomLevel } from './models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgIf, TimelineComponent, CreateEditPanelComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  @ViewChild(TimelineComponent) timeline!: TimelineComponent;
  svc = inject(TimelineService);

  dropdownOpen = false;

  get zoom() {
    return this.svc.zoom();
  }

  get zoomLabel(): string {
    const labels: Record<ZoomLevel, string> = {
      hour: 'Hour',
      day: 'Day',
      week: 'Week',
      month: 'Month',
    };
    return labels[this.zoom];
  }

  setZoom(z: ZoomLevel) {
    this.svc.setZoom(z);
    this.dropdownOpen = false;
  }

  toggleDropdown(e: MouseEvent) {
    // stopPropagation() prevents the document:click listener below from
    // immediately closing the dropdown on the same event that opens it.
    e.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  goToToday() {
    // Delegate to the timeline's scrollToToday() — the app shell doesn't
    // need to know how centering works, only that the child exposes it.
    this.timeline?.scrollToToday();
  }

  // Global escape key closes both the panel and the zoom dropdown,
  // giving users a reliable one-key exit from any open overlay.
  @HostListener('document:keydown.escape')
  onEsc() {
    this.svc.closePanel();
    this.dropdownOpen = false;
  }

  // Any click that reaches the document (i.e. not stopped by a child)
  // collapses the zoom dropdown. The toggleDropdown handler stops propagation
  // so clicking the button itself doesn't trigger this.
  @HostListener('document:click')
  onDocClick() {
    this.dropdownOpen = false;
  }
}
