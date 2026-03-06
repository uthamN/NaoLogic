# Work Order Schedule Timeline

Angular 17 standalone application matching the NaoLogic design system.

## Setup & Run

```bash
npm install
ng serve
# → http://localhost:4200
```

## File Structure

```
src/app/
  models/index.ts                          — TypeScript interfaces + type aliases
  data/sample-data.ts                      — 6 work centers, 14 work orders
  services/timeline.service.ts             — Signals-based global state
  components/
    timeline/                              — Left panel + scrollable right grid
    work-order-bar/                        — Positioned bar with 3-dot dropdown
    create-edit-panel/                     — Fixed overlay form panel
  app.component.*                          — Shell: NaoLogic nav, page title, zoom dropdown
src/styles.scss                            — Global styles, Circular Std font
```

## Features

- **Four zoom levels** — Hour, Day, Week, Month. Column widths and date headers adapt per zoom.
- **Today line** — 1px indigo line spanning the full grid height, with a "Current month" pill above today's column.
- **Click to create** — Clicking an empty row cell opens the Create panel pre-filled with the work center.
- **Edit & Delete** — Three-dot menu on each bar. Opens Edit panel or removes the order.
- **Overlap detection** — Prevents two orders on the same work center from overlapping dates.
- **Blur backdrop** — Panel opens as a fixed overlay with `backdrop-filter: blur` behind it.
- **localStorage persistence** — Work orders survive page refresh; falls back to sample data on first load.

## Architecture

### State management
All state lives in `TimelineService` using Angular signals — no RxJS, no NgRx.

| Signal | Purpose |
|---|---|
| `workCenters` | List of work center rows |
| `workOrders` | All work orders (persisted to localStorage) |
| `zoom` | Current zoom level |
| `panelState` | Whether the create/edit panel is open + its mode and data |
| `activeMenuId` | Which bar's 3-dot dropdown is currently open (ensures only one at a time) |

### Bar positioning
```
left  = (startMs − rangeStartMs) / unitMs * colWidthPx
width = max(40, (endMs − startMs) / unitMs * colWidthPx)
```

### Zoom configuration
| Level | Col width | Total cols | Unit |
|---|---|---|---|
| hour  | 90px  | 48  | 1 hour |
| day   | 56px  | 60  | 1 day |
| week  | 110px | 26  | 7 days |
| month | 130px | 14  | 30 days |

### Overlap detection
```ts
const toMs = (s) => new Date(s.includes('T') ? s : s + 'T00:00:00').getTime();
// Ranges overlap iff: newStart < exEnd && newEnd > exStart
// Touching endpoints are NOT considered overlapping
// Guards for null / NaN / malformed stored dates
```

### Hour view vs day/week/month
Orders with an ISO datetime string (`YYYY-MM-DDTHH:mm`) are shown only in Hour view.
Orders with a bare date string (`YYYY-MM-DD`) are shown in Day / Week / Month views.
Detection: `startDate.includes('T')`.

### Dropdown positioning
The 3-dot menu and status dropdown both use `position: fixed` with coordinates
from `getBoundingClientRect()` at click time. This ensures they are never clipped
by `overflow: auto` on any ancestor element.

## Key Design Decisions

- **No third-party UI deps** — zero `ng-select`, `ng-bootstrap`, `@angular/animations`.
  All dropdowns, date inputs, and transitions are hand-rolled.
- **`visibility: hidden` for 3-dot button** — hides the icon while preserving its
  layout space so the bar width doesn't shift on hover.
- **CSS class toggle instead of `*ngIf` for status dropdown** — element stays in the
  DOM so `[style.top/left/width]` bindings are always evaluated; shown/hidden via
  `opacity` + `pointer-events`.
- **Single `activeMenuId` signal** — guarantees only one bar menu can be open at a
  time without any inter-component communication.