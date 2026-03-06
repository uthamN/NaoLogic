# Work Order Timeline — Prompt Log & Key Decisions

A record of every prompt in the session and the architectural or design decision made in response.

---

## 1. Initial Build
**Prompt:** *(From compacted session)* What to use in an Angular 17 work order timeline matching the NaoLogic wireframe — light theme, work centers as rows, work orders as positioned bars, zoom levels (hour/day/week/month), create/edit panel.

**Key decisions:**
- Angular 17 standalone components with no third-party UI deps
- Signals (`signal`, `computed`, `effect`) for all state — no RxJS or NgRx
- `TimelineService` as single source of truth injected directly into components
- Four zoom levels with fixed column widths: `hour=90px`, `day=56px`, `week=110px`, `month=130px`
- Bar positioning formula: `left = (startMs − rangeStartMs) / unitMs × colWidthPx`
- `YYYY-MM-DD` orders for day/week/month views; `YYYY-MM-DDTHH:mm` orders for hour view, detected via `.includes('T')`
- `localStorage` under key `wo_orders` for persistence, falling back to sample data

---

## 2. Right Panel Redesign
**Prompt:** right panel design discussion — give me the modal code or structure.

**Key decisions:**
- Panel with `transform: translateX(100%)` slide-in
- Backdrop added with `backdrop-filter: blur(3px)` behind the panel
- Header: title + subtitle on the left, Cancel + Create buttons on the right — no close X
- Status field uses a custom dropdown
- `app.component.html` updated to place `<app-create-edit-panel>` outside the flex layout so it doesn't affect grid width

---


## 3. Multiple Dropdowns Open Simultaneously
**Prompt:** I am able to open multiple dropdowns at the same time. What could be the cause and how can I address it? **Put some code**

**Key decisions:**
- Root cause: each bar had its own local `menuOpen = signal(false)` — no coordination between instances
- Fix: moved open state to `TimelineService` as `activeMenuId = signal<string | null>(null)`
- `menuOpen` on the bar became a getter: `return this.svc.activeMenuId() === this.workOrder.docId`
- Since only one `docId` can match at a time, opening any bar automatically closes all others
- `openCreatePanel` and `openEditPanel` also call `activeMenuId.set(null)` so menus close when the panel opens

---

## 4. Dropdown Toggle Class Instead of ngIf
**Prompt:** Toggle class and use ngIf — [showed status trigger HTML].

**Key decisions:**
- Replaced `*ngIf="statusOpen()"` on the dropdown div with `[class.is-visible]="statusOpen()`
- Element stays in the DOM permanently so `[style.top/left/width]` bindings from `getBoundingClientRect()` are always evaluated — eliminates the one-frame flicker where the menu appeared at `top:0 left:0` before styles applied
- Hidden state: `opacity: 0; pointer-events: none; transform: translateY(-6px)`
- Visible state: `opacity: 1; pointer-events: auto; transform: translateY(0)` with CSS transition

---

## 5. Infinite Scroll on Right Grid
**Prompt:** How can I get infinite scroll in right grid?

**Key decisions:**
- `totalCols` changed from `computed()` to `signal()` so the scroll handler can mutate it without triggering a zoom reset
- `extraLeft = signal(0)` tracks prepended columns; `rangeStart` subtracts `extraLeft * unitMs` to shift the origin backward
- Right edge: append `CHUNK=12` columns — `rangeStart` unchanged
- Left edge: append columns AND increment `extraLeft`, then use `setTimeout(() => el.scrollLeft += added, 0)` to restore scroll position after Angular updates the DOM — prevents visible jump
- `effect()` in the constructor resets both signals when zoom changes

---


## 6. Sample Data Update
**Prompt:** Update sample data — 5+ work centers, 8+ work orders, all 4 status types, multiple orders on same work center (non-overlapping).

**Key decisions:**
- Expanded to 7 work centers (added Apex Logistics)
- 16 day/week/month orders — Genesis Hardware and Konsulting Inc each have 3 non-overlapping orders to demonstrate multi-bar rows
- All four statuses (`open`, `in-progress`, `complete`, `blocked`) appear in both date and hour-view orders
- 8 hour-view orders, one per work center (wc-1 gets two)
- Date offsets chosen to ensure no two orders on the same work center overlap

---