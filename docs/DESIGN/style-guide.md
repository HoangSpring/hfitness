# Design Style Guide — "Cinematic Dark Red Fitness"

> **Scope for the agent:** Use this file ONLY for visual style (colors, typography, components, effects, tone).
> Layout/section order must follow the project's own requirements. The one exception is `hero.html`, which is the reference implementation of the hero section in this style.

## 1. Mood
- Cinematic, premium, dark, moody. Like a sports-brand film still: black environment, red neon/rim lighting, metallic silver headline.
- High contrast, one red accent, glassy dark UI cards with soft rounded corners.
- Keywords: *cinematic, athletic, premium, dramatic lighting, glossy, minimal UI.*

## 2. Colors
| Role | Hex |
|---|---|
| Background | `#050505` |
| Background alt | `#0B0B0C` |
| Glass surface | `rgba(255,255,255,0.06)` + `backdrop-filter: blur(14px)` |
| Border | `rgba(255,255,255,0.12)` |
| Primary accent (red) | `#F0352B` |
| Accent hover | `#D42A21` |
| Red glow | `rgba(240,53,43,0.45)` |
| Text primary | `#FFFFFF` |
| Text secondary | `#B5B5B8` |
| Text muted | `#77777B` |
| Ghost headline (dark gray) | `rgba(255,255,255,0.12)` |

- Silver headline gradient: `linear-gradient(180deg, #FFFFFF 0%, #BFBFC4 60%, #7C7C82 100%)` applied with `background-clip: text`.
- Red is the only accent. Use for: key headline word, primary icon buttons, small vertical bars, light streaks/glows, active states.
- Imagery brings the red light; UI uses red sparingly.

```css
:root{
  --bg:#050505; --bg-alt:#0B0B0C;
  --glass:rgba(255,255,255,.06); --border:rgba(255,255,255,.12);
  --accent:#F0352B; --accent-hover:#D42A21; --glow:rgba(240,53,43,.45);
  --text:#fff; --text-2:#B5B5B8; --text-muted:#77777B;
  --silver:linear-gradient(180deg,#fff 0%,#bfbfc4 60%,#7c7c82 100%);
  --radius-lg:20px; --radius-md:16px; --radius-pill:999px;
}
```

## 3. Typography (Vietnamese-safe)
Do NOT use fonts without the `vietnamese` subset (Anton, Bebas Neue, Permanent Marker...).

| Use | Font |
|---|---|
| Headlines | **Montserrat** 800/900 |
| Body / UI | **Montserrat** 400–600 |

```html
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap&subset=vietnamese" rel="stylesheet">
```
- **Headline:** ALL CAPS, very heavy, huge (`clamp(3rem, 9vw, 8rem)` (Montserrat is wide, keep it smaller than condensed fonts)), `line-height: 1.1` (Vietnamese diacritics need room), letter-spacing `-0.02em`. Two-line stack: line 1 silver gradient, line 2 red, lines barely overlapping (`margin-top: -0.06em`). A third "ghost" headline in dark translucent gray sits behind/beside, partly hidden by the subject image (depth effect).
- **Eyebrow:** small uppercase, very wide letter-spacing (`0.35em`), light weight, text-secondary.
- **Tagline lines:** 11–12px uppercase, letter-spacing `0.2em`, preceded by a thin **vertical red bar**.
- **Nav / labels:** 11px uppercase, letter-spacing `0.12em`, weight 500.
- **Stats:** number in 24–28px medium white, tiny uppercase gray label below.
- **Gradient text + Vietnamese:** `background-clip:text` clips glyphs to the element box, so stacked diacritics (Ế, Ổ, Ệ) get cut. Always add vertical padding on the gradient line (`padding:.24em 0 .1em; margin-top:-.24em`) and do not overlap lines more than `-.06em`.
- Always test with Vietnamese uppercase: "RÈN LUYỆN BẢN THÂN", "KỶ LUẬT".

## 4. Shape & UI Language
- **Rounded, glassy** (unlike hard-edged brutalist styles): outer frames 20px radius, cards 16px, buttons pill/circle.
- Glass cards: translucent white 6%, 1px border `--border`, `backdrop-filter: blur(14px)`, small thumbnail on the left, tiny label + uppercase title, circular arrow on the right.
- **Circle icon buttons:** 44–56px circles. Dark circle (`rgba(255,255,255,.08)` + border) with white → arrow for secondary; solid red circle with hamburger icon for menu.
- Ghost text-button: arrow circle + uppercase label + thin horizontal line trailing off.
- Thin technical details: 1px vertical/horizontal hairlines, small crosshair ticks, a vertical "SCROLL" text with a dot indicator on the right edge. Keep very faint (≤ 25% opacity).
- Stats row: 3 items separated by 1px vertical dividers.
- No heavy shadows; depth comes from glow, blur and overlays.

## 5. Imagery & Lighting
- Hero/photos: dark gym, athlete mid-action (battle ropes, lifting), **red rim light / red neon tubes** in background, wet floor reflections, chalk/dust/water particles, shallow depth of field, subject lit from the front/side, background nearly black.
- Always overlay gradients so text stays readable: left-to-right `rgba(5,5,5,.85) → transparent`, plus top/bottom vignette.
- Add red light streaks/glows with radial gradients (`radial-gradient(circle, var(--glow), transparent 60%)`).
- Subtle film grain (3–5% noise) optional.
- Page outside the hero frame: blurred, color-matched backdrop of the same photo.

## 6. Motion
- Headline lines slide/fade up (600ms, ease-out, staggered 100ms). Ghost text fades in slowly.
- Hover on cards: border brightens, arrow nudges. Buttons: scale 1.05, red glow.
- Background image: very slow zoom (20s) or subtle parallax. Nothing bouncy.

## 7. Do / Don't
**Do:** black base + one red; silver gradient headline; glass cards; circular buttons; cinematic photography with overlays; keep UI minimal and small, let headline + photo dominate.
**Don't:** pastel/multicolor; flat white backgrounds; thin headline weights; fonts lacking Vietnamese; clutter; heavy drop shadows; stock-looking bright gym photos.



## 8. Checklist
- [ ] `#050505` base, one red `#F0352B`
- [ ] Montserrat for everything (headline 800/900, body 400–600), `vietnamese` subset loaded
- [ ] Headline silver + red, line-height ≥ 1.0
- [ ] Glass cards, rounded 16–20px, circle buttons
- [ ] Image has dark overlays + red lighting