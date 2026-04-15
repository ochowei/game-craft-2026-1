## 1. Responsive board canvas

- [x] 1.1 Change board canvas from `w-[600px] h-[600px]` to `w-full max-w-[600px] aspect-square`
- [x] 1.2 Add padding to canvas container on mobile for breathing room

## 2. Extract inspector content

- [x] 2.1 Extract inspector JSX (aside content) into a shared `inspectorContent` variable
- [x] 2.2 Render `inspectorContent` inside existing `<aside>` with `hidden md:flex`

## 3. Mobile bottom sheet

- [x] 3.1 Add `useState` for bottom sheet expanded/collapsed toggle
- [x] 3.2 Create bottom sheet container with handle bar + "Inspector" title (`md:hidden`)
- [x] 3.3 Implement peek (48px) and expanded (70vh) states with `translateY` transition
- [x] 3.4 Render `inspectorContent` in expanded state

## 4. Layout adjustments

- [x] 4.1 Reposition zoom controls on mobile: `bottom-16 left-4 md:bottom-8 md:left-1/2 md:-translate-x-1/2`
- [x] 4.2 Reposition autosave indicator: `bottom-16 right-4 md:bottom-6 md:right-80`

## 5. Verification

- [x] 5.1 TypeScript compiles without errors
- [x] 5.2 All existing tests pass
- [x] 5.3 Dev server runs and page loads
