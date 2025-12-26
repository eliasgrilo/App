# Deep Detail Refinement Plan

The goal is to move from "functional" to "Apple-level Masterpiece".

## 1. Recipes: Shared Element Zoom
Current: The lightbox is a simple modal pop.
Detail: Implement `layoutId` so the image morphs from the recipe card directly into the full-screen view. This is a signature Apple transition.

## 2. Recipes: Micro-Interactions
Detail: Add subtle haptic-like scale on buttons, refined glassmorphism on the "Change Image" button (adding blurred borders, proper shadow).

## 3. Kanban: "No Ghost" Fluidity
Current: Placeholders are removed, transitions might feel "empty".
Detail: 
- Instead of a "dashed box", use a subtle "displacement shadow" or simply refine the layout shift physics to be ultra-high-velocity (less friction, more inertia).
- Bring back the "Glass Sheen" on the dragged card but with a much more sophisticated gradient that responds to movement (simulated light).

## 4. UI Polish (The "Final 1%")
- Refine all `spring` configurations to be even more organic (lower mass, high stiffness, perfectly tuned damping).
- Audit all border colors to ensure they are dynamic (changing slightly on hover/active).
- Ensure all scrollbars are custom and minimal.

## 5. Verification
- Manual verification of every transition speed and easing.
- Check for "flash of unstyled content" or popping.
