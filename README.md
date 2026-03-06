# Work Order Schedule Timeline

A manufacturing ERP timeline built with Angular 17, matching the NaoLogic design system.
Work centers are displayed as rows on the left; work orders appear as positioned bars
on a scrollable date grid to the right.

---

## Setup

**Prerequisites**

- Node.js 18+
- Angular CLI 17+

```bash
npm install -g @angular/cli   # skip if already installed
```

---

## Running the Application

```bash
npm install
ng serve
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

> **First run tip:** if you have stale data from a previous session, clear it via
> DevTools → Application → Local Storage → delete the `wo_orders` key, then refresh.

---

## Approach

### Component structure

The app is split into four focused standalone components:

| Component                  | Responsibility                                                                   |
| -------------------------- | -------------------------------------------------------------------------------- |
| `AppComponent`             | Shell — NaoLogic nav, page title, zoom dropdown                                  |
| `TimelineComponent`        | Left work-center panel + scrollable date grid with column headers and today line |
| `WorkOrderBarComponent`    | Single positioned bar — label, status badge, three-dot edit/delete menu          |
| `CreateEditPanelComponent` | Fixed overlay form — create or edit a work order with validation                 |

### State management

All shared state lives in a single `TimelineService` using Angular signals.

```
workCenters   — rows in the grid
workOrders    — all orders, persisted to localStorage
zoom          — current zoom level (hour / day / week / month) (hour just has UI and no functionality yet)
panelState    — whether the create/edit panel is open + its payload
activeMenuId  — which bar's three-dot dropdown is open (enforces single-open)
```

### Bar positioning

Every bar is positioned absolutely inside the scrollable grid using:

```
left  = (startMs − rangeStartMs) / unitMs × colWidthPx
width = max(40px, (endMs − startMs) / unitMs × colWidthPx)
```

### Zoom levels

| Level | Column width | Total columns | Unit    |
| ----- | ------------ | ------------- | ------- |
| Hour  | 90px         | 48            | 1 hour  |
| Day   | 56px         | 60            | 1 day   |
| Week  | 110px        | 26            | 7 days  |
| Month | 130px        | 14            | 30 days |

### Hour view vs day/week/month

Orders with a bare date string (`YYYY-MM-DD`) appear in Day / Week / Month views.
Orders with a datetime string (`YYYY-MM-DDTHH:mm`) appear only in Hour view.
Detection: `startDate.includes('T')`.

### Overlap detection

```ts
const toMs = (s) => new Date(s.includes("T") ? s : s + "T00:00:00").getTime();
// overlap = newStart < exEnd && newEnd > exStart
// touching endpoints are NOT considered overlapping
// guards for null / NaN / malformed stored dates
```

### Persistence

Work orders are serialised to `localStorage` under the key `wo_orders` after every
create, update, or delete operation. On load, the stored value is parsed and used as the
initial signal value, falling back to the bundled sample data if nothing is stored.

---

## Libraries Used

| Library             | Version | Why                                                                                                                     |
| ------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------- |
| **@angular/core**   | 17      | Framework — standalone components, signals (`signal`, `computed`, `effect`), dependency injection                       |
| **@angular/forms**  | 17      | `ReactiveFormsModule` for the create/edit form — `FormBuilder`, `Validators`, cross-field validator for end-after-start |
| **@angular/common** | 17      | `NgIf`, `NgFor`, `NgClass`, `DatePipe` for template directives                                                          |
| **TypeScript**      | 5.x     | Type safety across models, service, and components                                                                      |
| **SCSS**            | —       | Nested rules and variables for component styles; no CSS framework                                                       |
