## 1. Extract inspector content

- [x] 1.1 Extract inspector JSX (lines 81-143) into a shared `inspectorContent` variable
- [x] 1.2 Render `inspectorContent` inside the existing `<aside>` for desktop (add `hidden md:flex` to aside)

## 2. Mobile bottom sheet

- [x] 2.1 Add `useState` for bottom sheet expanded/collapsed toggle
- [x] 2.2 Create bottom sheet container with handle bar + "Card Inspector" title (visible only below `md`)
- [x] 2.3 Implement peek state: fixed to bottom, ~48px height, shows handle + title
- [x] 2.4 Implement expanded state: `max-h-[70vh]` with `translateY` transition, renders `inspectorContent`
- [x] 2.5 Toggle between peek/expanded on handle bar tap

## 3. Layout adjustments

- [x] 3.1 Add bottom padding to card grid on mobile to account for peek bar
- [x] 3.2 Hide floating action palette on mobile (`hidden md:flex`)

## 4. Verification

- [x] 4.1 TypeScript compiles without errors
- [x] 4.2 All existing tests pass
- [x] 4.3 Dev server runs and page loads
