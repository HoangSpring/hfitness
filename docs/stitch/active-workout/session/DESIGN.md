---
name: Performance Precision
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f21'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#e4beba'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#313032'
  outline: '#ab8986'
  outline-variant: '#5b403e'
  surface-tint: '#ffb3ad'
  primary: '#ffb3ad'
  on-primary: '#68000a'
  primary-container: '#ff5451'
  on-primary-container: '#5c0008'
  inverse-primary: '#b91a24'
  secondary: '#c8c6c9'
  on-secondary: '#303033'
  secondary-container: '#47464a'
  on-secondary-container: '#b6b4b8'
  tertiary: '#ffb3ad'
  on-tertiary: '#68000a'
  tertiary-container: '#ff5451'
  on-tertiary-container: '#5c0008'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad7'
  primary-fixed-dim: '#ffb3ad'
  on-primary-fixed: '#410004'
  on-primary-fixed-variant: '#930013'
  secondary-fixed: '#e4e1e5'
  secondary-fixed-dim: '#c8c6c9'
  on-secondary-fixed: '#1b1b1e'
  on-secondary-fixed-variant: '#47464a'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  metric-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 3.5rem
    fontWeight: '800'
    lineHeight: 3.75rem
    letterSpacing: -0.04em
  metric-display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.5rem
    fontWeight: '800'
    lineHeight: 2.75rem
    letterSpacing: -0.03em
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: '700'
    lineHeight: 2rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: 1.5rem
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.05em
  data-mono:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.8125rem
    fontWeight: '700'
    lineHeight: 1rem
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-desktop: 2rem
  margin: 1rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

The design system projects athletic intensity tempered by computational precision. Built for disciplined individuals who approach training and nutrition through analytical measurement, the aesthetic rejects gamified badges, cartoonish avatars, and decorative clutter. Instead, it mirrors high-end biometric laboratory instruments and Formula 1 telemetry dashboards: dark, focused, high-contrast, and deliberate.

The visual style blends **Technical Minimalism** with **Atmospheric Layering**:
- Deep obsidian and charcoal backdrops establish an immersive, eye-level focus on high-impact metrics.
- Razor-sharp typographic hierarchy elevates biometric numbers to heroic focal points.
- Strategic kinetic red accents channel visceral energy, applied solely to live state indicators, critical effort rings, and target completion thresholds.
- Surfaces feel monolithic yet light, separated by hairline zinc divisions rather than muddy drop shadows.

## Colors

The palette is engineered around dark-spectrum contrast ratios exceeding WCAG AAA standards for core telemetry.

- **Base Canvas (`#0B0B0D`)**: A calibrated obsidian that avoids pure digital black `#000000` to prevent harsh OLED trailing while keeping contrast stark.
- **Card & Surface Layers (`#18181B`)**: Zinc dark finish providing physical separation from the base canvas.
- **Borders & Dividers (`#27272A`)**: Hairline structure defining component boundaries with precision.
- **Kinetic Accent (`#EF4444`)**: High-chroma racing red reserved for primary CTA states, active workout trackers, heart rate zones, and critical nutritional thresholds.
- **Muted Accent Fill (`rgba(239, 68, 68, 0.15)`)**: Subdued red aura used for selected chip backgrounds, progress track underlays, and data pill containers.
- **Typography Matrix**:
  - Primary Readouts & Headers: `#F4F4F5` (Zinc 100) for uncompromised legibility.
  - Secondary Labels & Meta: `#A1A1AA` (Zinc 400) for structural context and measurement units.
  - Tertiary / Inactive: `#71717A` (Zinc 500) for grid axis lines and disabled actions.

## Typography

The type system relies on **Plus Jakarta Sans**, utilizing its geometric proportions and athletic cut to convey authority without sacrificing operational clarity.

- **Metric Display (`metric-display`)**: Reserved exclusively for key quantitative data—such as total daily calories, lifting volume, heart rate max, and macro breakdowns. Its heavy weight and tight tracking give numbers architectural weight.
- **Uppercase Data Labels (`label-md`)**: Used for micro-copy, unit indicators (KCAL, BPM, LBS, G), and chart axes. Always tracked wide (`+0.05em`) and rendered in secondary zinc (`#A1A1AA`) for immediate identification.
- **Hierarchy Rules**: Numerical figures should sit beside their unit tags in a distinct size tier (e.g., `2,840` in `metric-display`, with `KCAL` in `label-md` baseline-aligned).

## Layout & Spacing

The application architecture utilizes an asymmetric desktop layout anchored by a fixed left-hand telemetry rail, accompanied by an adaptive multi-column content dashboard.

### Canvas Grid Model
- **Persistent Sidebar Navigation**: Fixed width at `280px` on desktop screen widths (`>=1280px`), collapsible to an `80px` icon dock between `1024px` and `1279px`, transforming to a bottom thumb bar on mobile viewports (`<768px`).
- **Main Canvas Grid**: A fluid 12-column grid system inside the content viewport, governed by `2rem` gutters and `2.5rem` outer margins.
- **Metric Grids**: Core stats flow into 4-column widgets on wide screens, 2-column on tablet viewports, and 1-column cards on mobile.

### Vertical Rhythm
Component interiors enforce strict breathing room. Primary metric containers use `space-lg` (`1.5rem`) internal padding to prevent high-density data clusters from feeling cramped. Gaps between chart elements adhere strictly to the `8pt` scale (`space-sm`, `space-md`, `space-xl`).

## Elevation & Depth

Visual hierarchy rejects exaggerated, cloudy drop shadows in favor of **structural containment** and **chromatic depth**.

- **Base Layer (Ground)**: Deep canvas `#0B0B0D`.
- **Level 1 (Cards, Modules, Sidebars)**: Fill `#18181B` enclosed by a 1px solid border of `#27272A`. Zero blur, absolute structural separation.
- **Level 2 (Hovered Cards, Dropdowns, Popovers)**: Fill `#1F1F23`, border `#3F3F46`, complemented by a focused dark shadow: `0 8px 24px -4px rgba(0, 0, 0, 0.65)`.
- **Active / Energy Glow**: Applied strictly to dynamic states—such as active workout timers or completed milestone rings—using a controlled red ambient wash: `0 0 20px -2px rgba(239, 68, 68, 0.25)`.
- **Modals & Flyouts**: Backed by a high-intensity backdrop blur (`backdrop-blur-md` with `rgba(11, 11, 13, 0.8)`), isolating the task modal with a crisp `#27272A` perimeter.

## Shapes

The geometry uses balanced radii that project modern athletic industrial design: confident curves without entering soft or toy-like territory.

- **Primary Cards & Containers**: Use `rounded-2xl` (`1rem` / `16px`) for expansive dashboards, data widgets, and modular cards.
- **Controls & Internal Components**: Use `rounded-xl` (`0.75rem` / `12px`) on form fields, input boxes, dropdown selectors, and secondary actions.
- **Interactive Badges & Pills**: Status indicators, workout sets, and macro tags utilize full circular pills (`rounded-full`) to contrast against the rectangular module grids.
- **Data Rings & Circular Gauges**: Strict circular SVG paths with `stroke-linecap="round"` on dynamic progress indicators.

## Components

### Buttons
- **Primary CTA**: Solid `#EF4444` background with `#FFFFFF` text. Weight `600`, tracking tight, padding `0.75rem 1.5rem`, `rounded-xl`. Hover transitions to `#DC2626` with a soft energetic bloom.
- **Secondary**: Surface fill `#18181B`, border `1px solid #27272A`, text `#F4F4F5`. Hover elevates background to `#27272A` and border to `#3F3F46`.
- **Ghost / Utility**: Transparent background, text `#A1A1AA`. Hover changes to text `#F4F4F5` and subtle fill `rgba(255, 255, 255, 0.05)`.

### Cards & Data Modules
- Root background `#18181B`, border `1px solid #27272A`, `rounded-2xl`, internal padding `space-lg`.
- Headers feature title text in `headline-md` paired with a status tag or period selector right-aligned.
- Dividers between card sections are styled with `border-t border-[#27272A]`.

### Chips & Filter Pills
- Inactive: Background `#18181B`, border `1px solid #27272A`, text `#A1A1AA`, `rounded-full`, padding `0.375rem 0.875rem`.
- Active: Background `rgba(239, 68, 68, 0.15)`, border `1px solid #EF4444`, text `#EF4444`.

### Biometric Progress Rings & Telemetry Gauges
- Track background: `#27272A` with stroke width of `8px` or `12px`.
- Active indicator: `#EF4444` stroke with clean round caps.
- Interior cluster: Centered numerical metric (`metric-display`) with descriptive label directly underneath in uppercase `label-md`.

### Input Fields & Selectors
- Container height `48px`, background `#111114`, border `1px solid #27272A`, `rounded-xl`, padding `0 1rem`.
- Text color `#F4F4F5`, placeholder color `#71717A`.
- Active focus state: Border snaps to `#EF4444`, accompanied by an outline ring of `rgba(239, 68, 68, 0.2)`.

### Lists & Telemetry Logs
- Alternating or border-separated rows with `border-b border-[#27272A]`.
- Row items use flex layouts aligning timestamp/exercise set names on the left and numeric values (weight, reps, calories) in `data-mono` on the right.
- Hover states across table/list rows apply a subtle highlight of `rgba(255, 255, 255, 0.02)`.

### Checkboxes & Segmented Controls
- Checkboxes: 20x20px box, `rounded-md`, border `1.5px solid #27272A`, unchecked fill `#111114`. Checked state snaps fill to `#EF4444` and border to `#EF4444` with a crisp white check icon.
- Segmented Control: Enclosing pill container in `#111114` with `4px` padding. Active indicator slides behind text with fill `#27272A`, border `1px solid #3F3F46`, and text `#F4F4F5`.