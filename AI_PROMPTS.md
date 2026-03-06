# AI Prompts & Decisions Log

This file documents key decisions made with AI assistance.

## 1. Component Architecture

**Prompt:**
> "What's the cleanest way to share state between a timeline grid, work order bars, and a slide panel in Angular 17 using standalone components?"

**Decision:** Use a single `TimelineService` with Angular `signal()` for all shared state.
- `workOrders` signal = source of truth for all bar rendering
- `panelState` signal = drives the slide panel open/closed/mode
- `zoom` signal = controls column widths and labels
- No NgModules, no BehaviorSubjects, no subscriptions to manage

## 2. Timeline Positioning Algorithm

**Prompt:**
> "How do I convert start/end ISO dates to CSS left/width pixel values for a timeline bar?"

**Decision:**
```typescript
const rangeStart = today - (totalCols/2 * unitDays);
left  = (startDate - rangeStart) / (unitDays * ms) * colWidthPx;
width = (endDate - startDate)   / (unitDays * ms) * colWidthPx;
```
Simple linear interpolation. Works for all three zoom levels by swapping `unitDays` (1, 7, 30) and `colWidthPx` (52, 120, 160).

## 3. Overlap Detection

**Prompt:**
> "What's the most reliable formula to detect if two date ranges overlap?"

**Decision:** Standard interval overlap: `A.start < B.end AND A.end > B.start`.
Implemented using ISO string comparison (lexicographic order == chronological for YYYY-MM-DD).

## 4. Reactive Forms Cross-Field Validation

**Prompt:**
> "How do I validate that endDate > startDate in Angular Reactive Forms?"

**Decision:** Use a FormGroup-level validator:
```typescript
function endAfterStart(form: AbstractControl) {
  const start = form.get('startDate')?.value;
  const end   = form.get('endDate')?.value;
  return end > start ? null : { endBeforeStart: true };
}
```
Applied at the `fb.group()` level so both fields trigger it.

## 5. Dark Industrial Aesthetic

**Prompt:**
> "Design a dark manufacturing ERP timeline that feels precision-engineered rather than consumer SaaS."

**Decision:** Deep navy/slate backgrounds (`#0f1117`, `#171b26`) with blue accent (`#4f6ef7`).
Status colors use a restricted palette: blue (open), purple (in-progress), green (complete), amber (blocked).
All bars use translucent fills with colored borders — avoids the heavy "paint" look of solid bars.
