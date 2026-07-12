# InterviewX Design System (Foundation)

This file documents **design tokens** only (no UI components).

## How to use
- Prefer `var(--token-...)` CSS variables in custom styles.
- Prefer Tailwind utilities mapped from the token intent (when Tailwind is present).
- Keep UI consistent by using the same token families:
  - Colors: background/surface/text + semantic statuses (success/warning/error)
  - Motion: `--motion-*` for durations/easing
  - Surfaces: `--shadow-*`, `--radius-*`

## Token naming
- Colors: `--color-*`
- Typography: `--font-*` for families and `--text-*` for sizes/line-heights
- Spacing: `--space-*`
- Radius: `--radius-*`
- Shadows: `--shadow-*`
- Motion: `--motion-*`

## Component token intent (for later)
- Buttons: primary/secondary/ghost states use `--color-*` + `--radius-*` + `--shadow-*` + `--motion-*`
- Cards: surface + border + shadow
- Inputs: border + focus ring + disabled styling
- Badges: semantic background + border + text
- Navigation: active/hover styling uses surface and accent

