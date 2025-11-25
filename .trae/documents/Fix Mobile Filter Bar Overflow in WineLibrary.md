## Issue
On mobile (emulated iPhone), the wine type filter chips (Todos, Favoritos, Tinto, Branco, Rosé, Espumante, Champagne) in the collection page overflow outside the cream/gold demarcated container.

## Root Cause (from code review)
- Filters are rendered inside `WineLibrary.tsx` using `Tabs`, `TabsList`, `TabsTrigger` within a fixed header block.
- The list is likely wider than the container, and children don’t shrink or wrap, causing visual overflow.

## Plan to Fix
### 1) Constrain and make the filter bar horizontally scrollable
- In `src/components/WineLibrary.tsx`, wrap `TabsList` in a container div:
  - `className="w-full overflow-x-auto no-scrollbar rounded-xl bg-[#F7EFE6] px-2 py-2"`
  - Ensure the container width is full and hides overflow; rounded and background match the demarcation.
- Set `TabsList` itself to:
  - `className="inline-flex gap-2 min-w-max"` so it lays out in one row and can scroll.
- For each `TabsTrigger`, add:
  - `className="shrink-0 whitespace-nowrap px-3 py-1 text-sm"` to prevent wrapping and keep a compact size.
- Add a small `scroll-padding` and left/right padding so chips don’t touch edges.

### 2) Optional alternative: allow wrapping to second line (if preferred)
- Instead of scroll, set `TabsList` to `flex flex-wrap gap-2` and remove `min-w-max`.
- Ensure the container auto-expands height and stays within the cream background.
- This provides all chips visible without horizontal scroll but may increase header height.

### 3) Utility to hide scrollbars (mobile-friendly)
- In `src/index.css` (or a shared CSS), add a utility `.no-scrollbar`:
  - `overflow: auto;`
  - `-ms-overflow-style: none; scrollbar-width: none;`
  - `.no-scrollbar::-webkit-scrollbar { display: none; }`
- Apply `.no-scrollbar` to the wrapper div.

### 4) Header spacing and z-index
- Ensure the header block around the filters has enough bottom padding to not overlap content (`pb-6`) and correct stacking (`z-10`).

### 5) Verification
- Test on 375px width (iPhone) and 320px (small phones) to ensure:
  - All chips remain inside the cream/gold demarcated area
  - Horizontal swipe works smoothly
  - No chips clip into the burgundy area.

### 6) Accessibility and UX
- Keep focus styles on `TabsTrigger` visible.
- Optionally enable `scroll-snap-type: x mandatory` on the wrapper and `scroll-snap-align: start` on triggers for nicer snapping.

## Files to Update
- `src/components/WineLibrary.tsx`: wrap and style the filter bar, adjust `TabsList` and `TabsTrigger` classes.
- `src/index.css`: add `.no-scrollbar` utility (if not present).

## Expected Outcome
- On mobile, the entire filter chip row stays within the demarcated cream area and can be scrolled horizontally if wider than the screen.
- Desktop behavior remains unchanged. 