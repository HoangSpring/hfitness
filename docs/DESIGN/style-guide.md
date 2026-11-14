# Design Style Guide — "Dark Industrial Athletic"

> **Scope for the agent:** Use this file ONLY for visual style (colors, typography, components, effects, tone). 
> **Do NOT copy the layout/section structure** of the reference image. Layout, page structure and content must follow the actual project requirements.

---

## 1. Overall Mood

- Dark, aggressive, premium, high-contrast. Gym / fitness / sports / performance brand feel.
- Near-black backgrounds + one strong red accent + off-white text.
- Bold, condensed, uppercase headlines; very little decoration besides red accents.
- Sharp, squared-off UI (no rounded/soft/pastel look). Confident and motivational.

Keywords: *bold, gritty, industrial, powerful, disciplined, cinematic, minimal palette.*

---

## 2. Color Palette

| Role | Name | Hex |
|---|---|---|
| Background (main) | Black | `#0A0A0A` |
| Background (alt section) | Charcoal | `#111111` |
| Surface (cards, panels) | Dark Gray | `#161616` |
| Surface hover | Gray 900 | `#1E1E1E` |
| Border / divider | Gray 800 | `#2A2A2A` |
| Primary accent | **Signal Red** | `#E0301E` |
| Accent hover | Deep Red | `#C42515` |
| Accent pressed / dark | Blood Red | `#A01C10` |
| Text primary | Off-white | `#F2F2F2` |
| Text secondary | Light Gray | `#A3A3A3` |
| Text muted | Mid Gray | `#6B6B6B` |
| Text on red | White | `#FFFFFF` |

Rules:
- Red is the ONLY accent color. Never add blue/green/purple/gradients of other hues.
- Use red sparingly but decisively: CTA buttons, key words in headlines, icons, active nav state, small highlights, underline strokes.
- Backgrounds are never pure white. Light mode is not needed.
- Keep ~70% black/charcoal, ~20% white/gray text, ~10% red.

### CSS variables
```css
:root {
  --bg: #0A0A0A;
  --bg-alt: #111111;
  --surface: #161616;
  --surface-hover: #1E1E1E;
  --border: #2A2A2A;

  --accent: #E0301E;
  --accent-hover: #C42515;
  --accent-dark: #A01C10;

  --text: #F2F2F2;
  --text-secondary: #A3A3A3;
  --text-muted: #6B6B6B;
  --text-on-accent: #FFFFFF;
}
```

### Tailwind (optional)
```js
theme: {
  extend: {
    colors: {
      bg: '#0A0A0A',
      'bg-alt': '#111111',
      surface: '#161616',
      border: '#2A2A2A',
      accent: { DEFAULT: '#E0301E', hover: '#C42515', dark: '#A01C10' },
      text: { DEFAULT: '#F2F2F2', secondary: '#A3A3A3', muted: '#6B6B6B' },
    },
  },
}
```

---

## 3. Typography

### Fonts (Google Fonts) — Vietnamese-safe
> **IMPORTANT:** The site must support Vietnamese. Do NOT use Anton, Bebas Neue, League Gothic or Permanent Marker (no Vietnamese glyphs). Use only fonts with the `vietnamese` subset.

| Use | Font | Fallback |
|---|---|---|
| Headlines / display | **Oswald** 700 (alt: Barlow Condensed 800, Saira Extra Condensed 800) | `'Arial Narrow', sans-serif` |
| Body / UI / nav / buttons | **Barlow** or **Inter** (500–600 for UI) | `system-ui, sans-serif` |
| Accent handwriting (rare) | **Patrick Hand** or **Bangers** (verify Vietnamese rendering) | `cursive` |

```html
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Barlow:wght@400;500;600;700&family=Patrick+Hand&display=swap&subset=vietnamese" rel="stylesheet">
```

Always load the `vietnamese` subset and test with diacritic-heavy uppercase text, e.g. "BỨT PHÁ GIỚI HẠN", "KỶ LUẬT HÔM NAY".

### Type rules
- **Headlines:** ALL CAPS, condensed heavy font, line-height `1.1–1.2` (Vietnamese diacritics on uppercase letters get clipped below this), zero letter-spacing. Very large, with big size contrast against small body text.
- **Two-tone headlines:** white text with one key word or line in red (`--accent`), e.g. "YOUR **STRONGEST** VERSION" where only the keyword is red.
- **Eyebrow / label text:** small, uppercase, wide letter-spacing (`0.1–0.15em`), often red.
- **Nav, buttons, stat labels:** uppercase, small (11–13px), semi-bold, letter-spacing `0.08–0.12em`.
- **Body text:** sentence case, 14–16px, line-height 1.6, color `--text-secondary`.
- **Handwritten accent font (Patrick Hand / Bangers):** only for short tagline/slogan accents (1–5 words), slightly rotated (`-3° to -6°`), red or white. Max once or twice per page.

### Scale (suggested)
```css
--fs-display: clamp(4rem, 10vw, 9rem);   /* hero headline */
--fs-h1: clamp(3rem, 6vw, 5.5rem);
--fs-h2: clamp(2.25rem, 4vw, 3.5rem);
--fs-h3: 1.5rem;                          /* card titles, condensed uppercase */
--fs-body: 1rem;
--fs-small: 0.8125rem;                    /* labels */
--fs-micro: 0.6875rem;                    /* stat labels, nav */
```

---

## 4. Shape, Spacing & Borders

- **Border radius:** `0–2px` everywhere (buttons, cards, inputs). Sharp corners are part of the identity. Exception: circular play button / avatars.
- **Borders:** 1px solid `--border` (`#2A2A2A`) for cards, dividers and outline buttons.
- **Dividers:** thin horizontal/vertical 1px lines in `--border` to separate groups of content.
- **Spacing:** generous. Section padding `96–140px` vertical on desktop. Use an 8px grid.
- **Shadows:** almost none. Depth comes from contrast, borders and overlays. Optional subtle red glow on hover: `0 0 24px rgba(224,48,30,.25)`.

---

## 5. Components

### Primary button (CTA)
- Background `--accent`, text white, uppercase, 12–13px, semi-bold, letter-spacing `0.1em`.
- Padding `16px 28px`, radius `0–2px`.
- Includes a small **arrow icon ↗** (diagonal up-right) on the right side.
- Hover: background `--accent-hover`, arrow nudges `translate(2px,-2px)`.

### Secondary / ghost button
- Transparent background, 1px solid `rgba(255,255,255,.35)` border, white uppercase text, same size as primary.
- Hover: border turns white or red, subtle background `rgba(255,255,255,.05)`.

### Play / video button
- Circular outline (1px white), play triangle inside, next to uppercase small label.

### Navigation
- Transparent over dark background. Links uppercase, 11–12px, letter-spacing `0.1em`, color `--text`.
- Active/hover link: **2px red underline** beneath the text.
- One red CTA button at the right end.

### Cards
- Background `--surface`, 1px `--border`, radius 0–2px.
- Image area with **dark gradient overlay** from bottom (`linear-gradient(to top, rgba(0,0,0,.9), transparent 60%)`).
- Title: condensed uppercase (Oswald), white. Description: small, gray. Small red ↗ arrow at the bottom corner.
- **Icon badge:** small **solid red square** (40–44px) with a white line icon inside, placed at the top-left of the card.
- Hover: slight image zoom (`scale(1.04)`), border turns `rgba(224,48,30,.6)`.

### Stats / metrics
- Red outline icon (line style, ~24–28px) above or beside a **large white number** (condensed font, with "+", "K", "%" suffix).
- Small uppercase gray label under the number.
- Stats separated by thin 1px dividers.

### Icons
- Line/outline icons, 1.5–2px stroke, geometric and sharp (Lucide / Phosphor / Tabler style).
- Colors: red on dark backgrounds, white when inside red badges.

### Forms / inputs
- Background `--surface`, 1px `--border`, white text, radius 0–2px, uppercase small labels.
- Focus: border `--accent`, no soft glow (or a very faint red one).

### Social proof / avatars
- Small circular overlapping avatars with a dark border, next to small uppercase caption text.

---

## 6. Signature Graphic Elements

1. **Red brush-stroke underline** under key headline lines: a hand-painted, slightly uneven horizontal stroke in `--accent`, tapered at the ends (SVG or image). Use under main headline or tagline.
2. **Handwritten marker slogan** (handwritten marker style) overlaid or placed after a headline, slightly rotated.
3. **Distressed/grunge texture** on large white headlines: very subtle noise/scratches (opacity ≤ 15%). Keep text readable.
4. **Chalk dust / particles / smoke** feel in imagery (optional subtle particle overlay).
5. **Thin neon-style light lines or frames** (white or red, 1–2px) as decorative accents — very sparse.

---

## 7. Imagery & Effects

- Photography: dark, moody, cinematic, high contrast, low-key lighting, desaturated tones with red as the only accent color. Subjects are athletic and intense.
- Apply a **dark overlay / vignette** on all photos so text stays legible: `linear-gradient(90deg, rgba(10,10,10,.85) 0%, rgba(10,10,10,.2) 60%, transparent 100%)`.
- Optional: black-and-white or desaturated image filter `grayscale(.3) contrast(1.1)`.
- Section backgrounds: flat `--bg` / `--bg-alt`, optionally with subtle noise texture (3–6% opacity).
- Motion (subtle and fast): fade-up on scroll (400–600ms, ease-out), hover transitions 200ms, arrow nudge, image slow zoom. No bouncy or playful animations.

---

## 8. Voice & Copy Tone (for placeholder text)

- Short, punchy, imperative, motivational. Uppercase headlines.
- Examples of tone: "Built different.", "Stronger every day.", "Discipline today. Dominate tomorrow.", "Your strongest version starts here."
- CTA wording: "Start Training", "Join Now", "Explore Programs", "Watch Video".

---

## 9. Do / Don't

**Do**
- Keep a strict palette: black, off-white, grays, one red.
- Use huge condensed uppercase headlines with a red keyword.
- Keep corners sharp and borders thin.
- Use dark overlays on images for legibility.
- Keep contrast high (WCAG AA minimum for body text: use `--text` or `--text-secondary` on dark backgrounds).

**Don't**
- Don't use rounded pill buttons, pastel colors, soft shadows or glassmorphism.
- Don't use more than one accent color or gradients across multiple hues.
- Don't use thin/light font weights for headlines.
- Don't use lowercase for headlines/buttons/nav.
- Don't overuse the handwritten font or red (it loses impact).
- Don't copy the section order or layout of the reference image; apply only this visual style to whatever layout the project needs.

---

## 10. Quick Checklist

- [ ] Background is `#0A0A0A` / `#111111`
- [ ] Only one accent: red `#E0301E`
- [ ] Headlines: Oswald (Vietnamese-safe), uppercase, line-height 1.1–1.2
- [ ] Body/UI: Barlow or Inter
- [ ] Buttons: solid red, square corners, uppercase, with ↗ arrow
- [ ] Cards: dark surface, 1px border, red square icon badge, gradient overlay on images
- [ ] Brush-stroke underline / marker slogan used sparingly
- [ ] Images dark, moody, high contrast with overlays