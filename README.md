# Work Order Schedule Timeline

Angular 17 standalone component implementation matching the NaoLogic design.

## Setup & Run

```bash
npm install
ng serve
# → http://localhost:4200
```

## File Structure

```
src/app/
  models/index.ts                          — TypeScript interfaces
  data/sample-data.ts                      — 6 work centers, 8 work orders
  services/timeline.service.ts             — Signals-based state management
  components/
    timeline/                              — Main grid (left panel + scrollable timeline)
    work-order-bar/                        — Bar with three-dot menu
    create-edit-panel/                     — Slide-in form panel
  app.component.*                          — Shell: nav, page title, zoom controls
```

## Design Decisions

- **No third-party UI deps** — uses only Angular core + Reactive Forms.
  Native `<input type="date">` for date picking, custom status pill buttons instead of a dropdown.
- **Signals throughout** — `signal()` and `computed()` replace RxJS for all state.
- **Date positioning** — `left = (start − rangeStart) / unitDays * colWidthPx`
- **Overlap detection** — `A.start < B.end && A.end > B.start` (ISO string comparison works because YYYY-MM-DD is lexicographically ordered)
- **localStorage persistence** — work orders survive page refresh; falls back to sample data
