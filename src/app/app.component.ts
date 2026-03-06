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
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild(TimelineComponent) timeline!: TimelineComponent;
  svc = inject(TimelineService);

  dropdownOpen = false;

  get zoom() { return this.svc.zoom(); }

  get zoomLabel(): string {
    const labels: Record<ZoomLevel, string> = {
      hour: 'Hour', day: 'Day', week: 'Week', month: 'Month'
    };
    return labels[this.zoom];
  }

  setZoom(z: ZoomLevel) {
    this.svc.setZoom(z);
    this.dropdownOpen = false;
  }

  toggleDropdown(e: MouseEvent) {
    e.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  goToToday() { this.timeline?.scrollToToday(); }

  @HostListener('document:keydown.escape')
  onEsc() {
    this.svc.closePanel();
    this.dropdownOpen = false;
  }

  // Close dropdown when clicking anywhere outside it
  @HostListener('document:click')
  onDocClick() {
    this.dropdownOpen = false;
  }
}
