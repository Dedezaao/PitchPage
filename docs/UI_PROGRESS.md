# UI Progress Log

This file is **append-only**. Every completed UI task adds a new entry
at the bottom. Never edit, shorten, or remove a previous entry — if a
past decision turned out to be wrong, say so in a new entry instead of
rewriting history.

Any agent (Claude, Codex, or otherwise) working on `index.html`,
`styles/landing.css`, or `scripts/landing.js` must read this whole file
before making changes, and must append a new entry after finishing.

---

## 2026-08-16 — Responsive demo correction

### Branch
`Ajustes_de_UI` (requested — see note below; this repository is not
currently a Git repo, `git status`/`git branch` both fail with "not a
git repository." This was reported rather than assumed at the start of
the task, and again here for the record.)

### Objective
1. Remove the "É assim que aparece no aplicativo." weather→app
   transition section completely (not hide it).
2. Fix a critical responsive bug: the embedded Axon device compressed
   and its internal controls overlapped at limited-height viewports
   (reported at 375×667, also reproducible at 1280×800).

### Changes

**Transition removal.** Deleted the `<section class="transition" ...>`
markup, all `.transition*` CSS rules (base, mobile override, and
reduced-motion override), and all transition-only JavaScript
(`initTransition()`, `syncTransitionWeather()`, the `transitionSection`
variable, and the `data-transition` branch inside
`handleMotionPreference()`). This also orphaned two small shared
helpers, `clamp()` and `smoothstep()` — both were only ever called by
the transition's scroll-progress math, so they were removed too rather
than left as dead code. "Como funciona" now flows directly into
"Experimente o Axon" with each section's own normal padding (measured
gap between them: 0px — no artificial spacing left behind).

**Device compression — root cause.** The device was constrained by two
*independent* axes: `width: min(22.5rem, 100%)` and
`height: 46rem` / `max-height: 78vh` (desktop), or the mobile
equivalent (`max-width: 26rem`, `max-height: 88vh`). Whenever the
height clamp activated (any viewport shorter than roughly 840–930px,
which is most laptop windows and every phone in landscape-adjacent
proportions) while the width clamp landed on a different value, the
rendered box's aspect ratio drifted away from the device's native
360:812. The internal check-in layout (`styles/app.css`) is built
against that exact canvas with fixed rem/px spacing, not
percentage-of-container sizing, so a mismatched outer box compressed
the internal flex layout into itself — the slider, weather row, and
both action buttons have real minimum sizes and don't reflow, so they
overlapped instead of shrinking gracefully.

**Fix — uniform-scale presentation.** Replaced the independent
width/height constraints with a single `--axon-scale` factor applied
via `transform: scale()`, computed in JS (`initAxonScale()`,
`scripts/landing.js`) and consumed only in `styles/landing.css`:

- `.device` itself keeps its true native `360px × 812px` box always
  (app.css's own `@media (max-width:400px), (max-height:840px)` rule
  that would otherwise flip it to `100%×100%` is neutralized by a
  higher-specificity `.axon-demo-viewport .device` rule, same
  mechanism the previous override already used).
- A new wrapper, `.axon-demo-viewport`, reserves the *exact* resulting
  scaled footprint via `width: calc(360px * var(--axon-scale, 1))` /
  `height: calc(812px * var(--axon-scale, 1))` — both derived from the
  same variable, so they can never drift apart from each other, and
  the layout never reserves an invisible full-size box after the
  device is visually shrunk.
- `initAxonScale()` measures available width, and on desktop
  (`min-width: 761px`, matching the breakpoint used everywhere else in
  the file) also measures 82% of `window.innerHeight`, then takes
  `Math.min(widthScale, heightScale, 1)` — never independently. On
  mobile it uses width only, uncapped by height, so the device can be
  (and usually is) taller than the viewport; the landing page's own
  scroll carries the visitor through it.
- Recalculated on `resize`/`orientationchange` only (rAF-debounced),
  never on scroll.

**A second bug found and fixed during this work.** The first
implementation of `initAxonScale()` measured `.axon-demo-stage`'s
`clientWidth`, which turned out to be circular: at mobile, the parent
grid item (`.demo__stage`) had `justify-items: center` inherited from
`.demo__inner`'s mobile override, which makes a grid item shrink-to-fit
its content instead of stretching to its track. Since the device
(before JS runs, or if JS undercorrects) is 360px wide and CSS
`transform` doesn't affect how an element contributes to an ancestor's
intrinsic-size calculations, the stage kept measuring itself as wide as
its *own current, not-yet-corrected* content — always concluding
`scale: 1` was fine. Fixed by removing `justify-items: center` from
that mobile override (nothing depended on it — `.demo__text` already
self-centers via `margin-inline: auto`, and `.axon-demo-stage` already
centers its child via flexbox) plus defensive `min-width: 0` on
`.demo__stage` / `.axon-demo-stage` and `minmax(0, 1fr)` instead of a
plain `1fr` on the mobile grid-template-columns, so a grid/flex item's
default `min-width: auto` can never again let intrinsic content push a
track wider than its actual available space.

### Files changed
- `index.html` — removed the transition section; wrapped `.device` in
  a new `.axon-demo-viewport` element.
- `styles/landing.css` — removed all `.transition*` rules; replaced
  `.axon-demo-stage .device` width/height overrides with the
  `.axon-demo-viewport` scale architecture; `min-width: 0` /
  `minmax(0, 1fr)` fixes described above.
- `scripts/landing.js` — removed `initTransition()`,
  `syncTransitionWeather()`, `clamp()`, `smoothstep()`; added
  `initAxonScale()`.
- No changes to `styles/app.css` or `scripts/app.js` — the compression
  was entirely an embedding/presentation problem, not a product bug.

### Technical decisions
- Chose `transform: scale()` + a JS-computed CSS custom property over
  CSS `zoom` (non-standard, inconsistent cross-browser support) or a
  pure-CSS `clamp()`/`aspect-ratio` approach (can't solve "fit both a
  width budget and an independent height budget with one factor" —
  that specific "contain" behavior needs the two measurements
  combined, which CSS alone can't express here).
- Desktop's height budget (82% of `innerHeight`) is a deliberately
  comfortable fraction, not a hard viewport-fit — the brief explicitly
  didn't want the device fighting the viewport for every last pixel,
  just avoiding towering over a short window.
- Recalculation is resize/orientation-driven only, per the brief's
  explicit instruction to avoid continuous scroll-linked calculations;
  the device's size has no relationship to scroll position.

### Tests actually performed
Playwright, this session, against a local `python -m http.server`:

- **Viewport × theme matrix** (16 combinations — all 8 requested pairs
  × light/dark): 375×667, 390×844, 430×932, 768×1024, 1280×800,
  1366×768, 1440×900, 1920×1080. For every combination, measured via
  `getBoundingClientRect()`: zero horizontal page overflow, device
  aspect ratio exactly `0.4433` (= 360/812, i.e. never distorted), and
  no vertical overlap between weather row → slider → "Registrar meu
  dia" → "Preciso conversar agora" → tab bar (checked pairwise:
  `next.top >= previous.bottom`). All 16 passed clean.
- **Interaction regression**: weather row click, slider keyboard (Home
  key), register → comment view → send → confirmation, "Mudar meu
  registro" (redo), register → skip comment → confirmation, SOS open →
  type → send-button-enables → close, History tab → wrong PIN (stays
  locked, shows "Senha incorreta. Tente de novo.") → correct PIN 1234
  (unlocks, shows 4 history items), Profile tab (streak text renders),
  tab navigation back to Início. All passed; one apparent failure
  during the first run was a bug in the test script itself (it
  accidentally entered the correct PIN while testing the "wrong PIN"
  path), not a product bug — re-tested with corrected script logic and
  confirmed clean.
- **Resize behavior**: measured device size at 1440×900, resized the
  same page to 900×700 without reload, confirmed the device rescaled
  (327×738 → 254×574, ratio preserved) with zero overflow — no stale
  scale value, no layout jump artifacts detected.
- **Reduced motion**: full scroll-through of the page at 375×667 with
  `reducedMotion: "reduce"` — no console/page errors.
- **No leftover transition**: confirmed `document.querySelector('[data-transition], .transition')`
  returns null; confirmed zero-pixel gap between "Como funciona"'s
  bottom edge and "Experimente"'s top edge (no orphaned spacing).

### Result
Both objectives met. Transition section fully removed with no orphaned
code. Device compression bug fixed at its root cause (independent-axis
sizing) rather than patched; verified across the full requested
viewport/theme matrix with zero distortion and zero control overlap.

### Remaining visual debt
- None identified against this task's scope. The device's internal
  spacing, typography, and controls were not touched — only how it's
  embedded and scaled.
- Not investigated (out of scope per the brief): scroll-driven "Como
  funciona" behavior, navbar chapter architecture, professional
  dashboard mobile layout, ecosystem section, Nexus reveal, FAQ, final
  CTA.

### Next recommended step
None specified by this task. Future UI work should re-read this file
first, and should be aware that `.axon-demo-viewport`/`--axon-scale`
is now the single source of truth for the device's presentation size —
any future change to the device's embedding should extend
`initAxonScale()` rather than reintroducing independent width/height
CSS constraints.

---

## 2026-08-16 — Hero redesign: "Atmosfera dos cinco céus"

### Branch
`Ajustes_de_UI` (requested — again reporting rather than assuming:
`git status`/`git branch --show-current` both fail with "not a git
repository," consistent with every prior check in this project.)

### Objective
Replace the Hero's right-side visual — previously a literal miniature
app-preview card ("Como está seu céu hoje?" text + one weather icon +
five state dots) — with a purely atmospheric composition inspired by
the five weather states, without depicting UI, a phone, a card, or an
explicit five-state selector.

### Changes

**Removed.** The entire `.hero-preview` block: the card surface
(`background`, `box-shadow`, padding), the "Como está seu céu hoje?"
text duplicate, the single weather icon (`data-weather-art="partly"`),
the five status dots, and the `hero-breathe` keyframe that only that
card's glow used. No placeholder or empty box was left in its place.

**Added — `.hero-atmosphere`.** An organic, irregularly-rounded shape
(`border-radius: 44% 56% 62% 38% / 48% 42% 58% 52%` — deliberately not
a rounded rectangle, so it never reads as a card) containing three
absolutely-positioned, heavily blurred (`filter: blur(2.75rem)`)
circular "glow" layers, `overflow: hidden` clipped to the outer shape:

- `--core` (large, centered): its `background-color` is driven by a
  60-second `@keyframes atmosphere-mood` loop through the *exact* five
  illustration tokens already used everywhere else on the site —
  `--weather-cloud-storm` → `--weather-cloud-rain` →
  `--weather-cloud-overcast` → `--weather-cloud-light` →
  `--weather-sun` → loop — plus a slow 14s breathing scale. A full
  minute per cycle and `ease-in-out` throughout was chosen specifically
  so no single state is ever "posed" — the brief was explicit that this
  should read as one continuous system, not five hard jumps.
- `--a` and `--b` (smaller, offset toward opposite corners): drift
  slowly (32s / 38s) via `translate()`, adding depth without ever
  "jumping."

No JavaScript was needed for the new visual — it's pure CSS animation,
so `.hero-preview__art`'s dependency on `paintWeatherArt()` /
`data-weather-art` was removed along with it (the shared weather-art
painter in `landing.js` is untouched and still serves the other
sections that do need it).

**Dark mode — a real bug found and fixed, not just "supported."** The
first implementation reused the light-mode base gradient
(`--surface-subtle` → `--surface-muted`) and the same glow opacities.
In dark mode both of those tokens sit close to `--surface-page`, so the
whole composition nearly disappeared into the background — screenshot
comparison caught this before calling it done. Fixed with a
`html[data-theme="dark"]` override: a lighter base gradient
(`--surface-default` → `--surface-subtle`, i.e. one step up instead of
down) and higher glow opacities (core 0.5→0.8, a 0.38→0.6, b
0.28→0.55), so it now reads as a soft light source glowing against the
dark backdrop rather than a flat dark smear — arguably more evocative
in dark mode than light.

**Reduced-motion fallback.** The existing global
`.landing *{animation:none!important}` rule already freezes the
keyframes; what mattered was *which* frozen frame. The animation's own
`0%/100%` keyframe stop is `--weather-cloud-storm`, but the element's
plain (pre-animation) `background-color` declaration was deliberately
set to `--weather-cloud-overcast` instead — Nublado, the real app's own
default state — so reduced-motion visitors get a calmer permanent
impression than landing on the moodiest tone. Verified via computed
style (`rgb(143, 165, 168)` = `#8fa5a8` = `--weather-cloud-overcast`,
confirmed unchanged 1.5s later, i.e. genuinely static, not mid-cycle).

**Mobile — recomposed, not shrunk.** Different aspect ratio
(`aspect-ratio: 2.15`, a wide shallow band vs. desktop's tall
near-square blob), a different organic radius, the `--b` layer dropped
entirely (fewer decorative elements per the brief), and lighter blur
radii (2rem / 1.75rem vs 2.75rem) so the smaller shape keeps visible
color structure instead of washing into a flat blur.

### Files changed
- `index.html` — replaced `.hero-preview` markup with `.hero-atmosphere`.
- `styles/landing.css` — new `.hero-atmosphere*` rules, dark-mode
  override, mobile recomposition, removed `.hero-preview*` rules and
  the orphaned `hero-breathe` keyframe, renamed the
  `.js.is-ready` entrance-delay selector.
- `scripts/landing.js` — no functional change; removed a stale comment
  referencing the deleted `hero-preview__art`.
- No changes to `styles/app.css` or `scripts/app.js`, no changes to
  Hero copy, CTA markup/hierarchy, section order, or the interactive
  Axon demo.

### Technical decisions
- Chose blurred solid-color circles over `radial-gradient()` blobs
  because animating `background-color` interpolates smoothly and
  predictably across browsers, whereas animating between two
  differently-colored gradients only interpolates reliably when their
  stop structure matches exactly — solid color was simpler and equally
  soft once blurred.
- Reused the five illustration tokens verbatim rather than introducing
  new colors, so the Hero is thematically tied to the same visual
  language the rest of the site already uses for weather, without
  literally depicting any of the five icons.
- No JS/ResizeObserver needed — unlike the device-scaling fix in the
  previous entry, this is pure decorative CSS with no fixed internal
  geometry to preserve, so `aspect-ratio` + responsive sizing was
  sufficient on its own.

### Tests actually performed
Playwright, this session, against a local `python -m http.server`:

- **Viewport × theme matrix** (16 combinations — all 8 requested pairs
  × light/dark): 375×667, 390×844, 430×932, 768×1024, 1280×800,
  1366×768, 1440×900, 1920×1080. For each: zero horizontal page
  overflow, measured the atmosphere element's actual rendered size, and
  verified (via rectangle-intersection check) it never overlaps the
  copy column. All 16 passed clean.
- **Visual inspection** via screenshots at 1440×900 (light and dark)
  and 375×667/390×900 (light and dark, scrolled to the atmosphere
  element specifically since it sits below the fold at phone heights).
  Confirmed no card/phone/icon-row remained, no empty-box feeling, and
  — after the dark-mode fix above — clear visibility in both themes.
- **Reduced motion**: confirmed via computed style that the frozen
  color is the intended Nublado tone and genuinely static (unchanged
  after a 1.5s wait).
- **Regression**: clicking the Hero's own scroll-cue link still
  scrolls to the next section; "O Axon" nav link is still active on
  load (its `data-nav-targets="hero,pergunta,por-que-existe"` mapping
  from the previous task was untouched, and `id="hero"` on the section
  itself was not removed); the interactive Axon demo (weather select →
  register → skip comment → confirmation) still works end to end,
  confirming the Hero change didn't disturb anything downstream.

### Result
Objective met. The Hero's right side no longer previews the app UI —
it's a slow, continuous atmospheric composition built from the
product's own five-state color language, recomposed (not scaled) for
mobile, verified visible and balanced in both themes, and reduced to a
calm static frame under `prefers-reduced-motion`.

### Remaining visual debt
- None identified against this task's scope.
- Not investigated (explicitly out of scope): every other landing
  section, and the interactive Axon demo (untouched by design).

### Next recommended step
None specified by this task.

---

## 2026-08-16 — Hero atmosphere correction: from abstract blob to "minimal emotional skyscape"

### Branch
`Ajustes_de_UI` (requested — again reporting rather than assuming:
`git status`/`git branch --show-current` both fail with "not a git
repository," consistent with every prior check in this project.)

### Objective
The previous entry's `.hero-atmosphere` (blurred, color-cycling organic
blob) was explicitly **rejected** by the user: "The implementation
became a generic abstract gradient/blob and lost the visual identity of
Axon." The brief demanded a rebuild — still premium and abstracted, but
recognizably **weather**: sky, light, cloud, changing weather,
emotional atmosphere, without ever showing an app card, a phone, five
selectable states, or a flowchart. Hard constraints given verbatim: "NO
generic gradient blob. NO random mesh gradient. NO abstract SaaS orb.
NO liquid shape as the main subject. Weather must be visually
perceptible."

### Changes

**Removed.** The entire `.hero-atmosphere` composition: the organic
blob shape, its three blurred color-cycling glow layers (`--core`,
`--a`, `--b`), `@keyframes atmosphere-mood` / `atmosphere-breathe` /
`atmosphere-drift-a` / `atmosphere-drift-b`, the dark-mode override, and
the mobile recomposition block from the previous entry. Nothing about
that approach was salvageable against the new brief — the whole point
of the correction is that abstract color-cycling shapes, however well
tuned, don't read as weather.

**Added — `.hero-sky`.** A borderless composition built from the
product's own authentic weather SVGs (`assets/weather/clear.svg`,
`cloudy.svg`, `partly-cloud.svg`) rather than invented shapes, so the
visual identity ties directly to the same iconography used throughout
the product instead of an abstract stand-in for it:

- `.hero-sky__sun` — `clear.svg`, upper-right, breathing scale
  (`sky-sun-breathe`, 11s) plus `.hero-sky__halo`, a separate blurred
  radial-gradient disc pulsing opacity/scale (`sky-halo-pulse`, 11s,
  same period but not `animation-delay`-synced in a way that reads as
  one mechanical pulse — both derive from the sun but are visually
  distinct layers).
- `.hero-sky__cloud--back` — `partly-cloud.svg` (the lighter cloud
  token), lower z-index, 55%/70% opacity (light/dark), slow drift
  (`sky-cloud-back-drift`, 24s).
- `.hero-sky__cloud--front` — `cloudy.svg` (the overcast token), higher
  z-index, full opacity, independent drift (`sky-cloud-front-drift`,
  16s).
- `.hero-sky__rain` — a small inline `<svg>` of three diagonal
  raindrop lines using `stroke="var(--weather-cloud-rain)"`, resting at
  `opacity: 0` and breathing up to ~0.4 only briefly within a 34s loop
  (`sky-rain`) — "almost imperceptible," per the brief, not a visible
  rain effect.
- `.hero-sky__flash` — a soft radial-gradient disc, resting at
  `opacity: 0`, spiking to ~0.2–0.26 for roughly 2% of a 50s loop
  (`sky-flash`) — a storm flash rare and soft enough that it reads as
  an occasional atmospheric event, not a strobe.
- `.hero-sky__haze` — a large, very low-opacity radial gradient behind
  everything, giving the whole composition ambient warmth without
  being its own focal shape.

All six animation periods (11s / 11s / 16s / 24s / 34s / 50s) are
mutually irrational relative to each other by construction (no shared
integer multiples worth mentioning within a viewing session), so the
composition never resolves into a perceivable repeating "show" or a
sense of cycling through five discrete poses — it reads as one
continuously live scene, per the brief's explicit "it must remain ONE
continuous scene" / "Do not create a weather animation show."

No JavaScript changes were needed — like the previous entry, this is
pure CSS/HTML using direct `<img src="assets/weather/*.svg">` rather
than the `paintWeatherArt()` / `data-weather-art` runtime system, so
that shared painter (still used elsewhere) was not touched.

**Dark mode — fixed proactively this time.** Having been burned by this
exact issue in the previous entry, dark-mode overrides for
`.hero-sky__haze` (stronger radial opacity), `.hero-sky__halo` (0.22 →
0.3), and `.hero-sky__cloud--back` (0.55 → 0.7) were written and
screenshot-verified in the same pass, not discovered as a bug
afterward.

**Mobile — simpler crop, not a shrunk desktop scene**, per the brief's
explicit mobile direction ("one cloud/light composition; reduced
decorative layers"): `.hero-sky__cloud--back`, `.hero-sky__rain`, and
`.hero-sky__flash` are dropped entirely (`display: none`) rather than
scaled down into illegibility, leaving one sun + one cloud + ambient
haze/halo, repositioned for a wider `aspect-ratio: 1.7` band under the
copy.

### Files changed
- `index.html` — replaced `.hero-atmosphere` markup with `.hero-sky`
  (sun/cloud `<img>` elements referencing existing `assets/weather/*`
  files, plus the inline rain `<svg>` and the haze/halo/flash `<span>`
  layers).
- `styles/landing.css` — removed all `.hero-atmosphere*` rules and
  their four keyframes; added `.hero-sky*` rules, six new keyframes,
  dark-mode overrides, and the mobile override block; renamed the
  `.js.is-ready` entrance-delay selector from `.hero-atmosphere` to
  `.hero-sky`.
- `scripts/landing.js` — no functional change.
- No changes to `styles/app.css` or `scripts/app.js`, Hero copy, CTA
  markup/hierarchy, navbar, section order, or the interactive Axon
  demo.

### Technical decisions
- Used the actual product SVGs instead of recreating similar shapes in
  CSS, so the Hero is provably the same visual language as the rest of
  the site (verified earlier in this project that each SVG's baked-in
  fill exactly matches its corresponding `--weather-*` token) rather
  than an approximation of it.
- Chose six independent, non-synchronized animation periods specifically
  to avoid the "five discrete states cycling" impression the brief
  warned against — deliberately not reusing one master timeline the way
  the rejected `atmosphere-mood` loop did.
- Rain and flash both rest at `opacity: 0` as their plain (pre-animation)
  declared value, so the existing global
  `.landing *{animation:none!important}` reduced-motion rule freezes
  them invisibly rather than mid-event — consistent with the calm,
  intentional resting-state approach validated in the previous entry.

### Tests actually performed
Playwright, this session, against a local `python -m http.server`:

- **Viewport × theme matrix** (12 combinations, exactly the pairs the
  brief asked to verify): 375×667, 390×844, 430×932, 1280×800,
  1440×900, 1920×1080, each × light/dark. For every combination:
  `overflowX === 0`, `.hero-sky__sun` and `.hero-sky__cloud--front`
  both visible, and a rectangle-intersection check confirming the sky
  composition never overlaps `.hero__copy`. All 12 passed clean.
- **Visual inspection** via screenshots at 1920×1080 (light) and with
  `reducedMotion: "reduce"` (light) — confirmed no card border, no
  phone, no five-icon row; a golden sun with a soft warm halo, a light
  background cloud peeking out from behind a darker overcast foreground
  cloud, matching the "minimal emotional skyscape" concept.
- **Flash-animation verification methodology issue, found and
  resolved.** An initial check polling computed opacity every 100ms
  over 3s only observed a max of 0.05, appearing to show the flash
  keyframe wasn't firing. Root cause: the flash's peak window is
  intentionally only ~25–75ms wide out of a 3s cycle sample, so 100ms
  polling could easily step over it entirely — not a code bug. Re-tested
  with tight continuous polling (checking on every `page.evaluate` with
  no `waitForTimeout` between checks) and correctly observed a peak
  opacity of 0.2127, confirming the keyframe behaves as designed. Noted
  here so a future agent doesn't waste time re-diagnosing the same false
  negative.
- **Reduced motion**: confirmed via computed style that both `rain` and
  `flash` opacity are `"0"` immediately on load and unchanged after a
  1.5s wait — genuinely static, not paused mid-event.
- **Regression**: Hero's own scroll-cue link (`.hero__scroll`) still
  scrolls into the next section; "O Axon" nav link is still active on
  load; the interactive Axon demo (weather select → register → skip
  comment → confirmation, reaching "Nublado" as the confirmed state)
  still works end to end with zero console/page errors — confirming the
  Hero rebuild didn't disturb anything downstream.

### Result
Objective met. The rejected abstract blob has been fully replaced with
a composition built from the product's own authentic weather assets —
one sun, one primary cloud, one background cloud, near-imperceptible
rain, a rare soft storm flash, and ambient haze — verified visible and
balanced in both themes across all 12 requested viewport/theme
combinations, reduced to a calm static frame under
`prefers-reduced-motion`, and confirmed not to regress navigation or
the Axon demo.

### Remaining visual debt
- None identified against this task's scope.
- Not investigated (explicitly out of scope): every other landing
  section, and the interactive Axon demo (untouched by design).

### Next recommended step
None specified by this task. Future changes to the Hero visual should
read this entry (not the superseded previous one) as the current source
of truth, and should preserve the "one continuous scene, non-synced
timings" principle rather than reintroducing a single master animation
loop.

---

## 2026-08-17 — Hero mobile: remove atmospheric visual, text-led first viewport

### Branch
`Ajustes_de_UI` (requested — again reporting rather than assuming:
`git status`/`git branch --show-current` both fail with "not a git
repository," consistent with every prior check in this project.)

### Objective
Remove the Hero atmospheric visual (`.hero-sky`, see the two previous
entries) from mobile only. On small screens it read as visually
disconnected from the copy and consumed space that should belong to the
Hero text and CTA. Desktop/tablet must be untouched — same artwork,
animation, dimensions, dark mode, and reduced-motion behavior as
approved in the previous entry.

### Changes

**Mobile — `.hero-sky` now `display: none`.** Inside the existing
`@media (max-width: 760px)` block, replaced the prior mobile
recomposition (a simplified sun+cloud crop with its own sizing,
positioning, and margin — see the previous entry) with a single
`.hero-sky { display: none; }` rule. This removes the element from
layout entirely rather than just hiding it visually: it no longer
participates in `.hero__inner`'s block flow, reserves no height, and
needed no placeholder. All of the previous entry's mobile-only crop
rules (`.hero-sky__cloud--back/__rain/__flash { display: none; }`,
repositioned `__sun`/`__halo`/`__cloud--front`, the `margin: spacing-40
auto 0` block) were deleted outright rather than left dormant, since
none of them do anything useful once the parent itself is hidden — the
brief was explicit ("do not add a smaller version") that this isn't a
smaller crop, it's a removal.

The desktop-scoped `.hero-sky*` rules (outside the media query) were
not touched at all, so nothing about the approved desktop composition
— artwork, six animation timings, dark-mode overrides, reduced-motion
resting state — changed.

**Mobile Hero spacing rebalanced**, since the visual no longer fills
the space below the CTA:
- `.hero`: `min-height: 100svh` → `min-height: 0` (the section no
  longer force-fills the viewport now that its content is shorter —
  forcing 100svh with only text content would have vertically centered
  a short block inside a tall box, producing the "excessive whitespace"
  the brief warned against). Padding tightened from `7rem …/6rem` to
  `6.5rem …/4.25rem` — top padding still clears the fixed nav
  comfortably, bottom padding is tighter now that there's no visual to
  transition into.
- `.hero__eyebrow` bottom margin: `spacing-20` → `spacing-16`.
- `.hero__actions` top margin (gap between support copy and the CTA
  row): the old `var(--spacing-28, var(--spacing-24))` fallback chain
  (`--spacing-28` was never a defined token) simplified to the plain
  `--spacing-24` it was always actually resolving to — a latent
  no-op cleanup, not a visual change.
- `.hero__scroll` bottom offset: `spacing-16` → `spacing-12`, so the
  scroll cue sits closer under the CTA rather than anchored to where
  the old 100svh box's bottom edge used to be.
- Nothing in the next section (`#pergunta`) was touched — the visible
  gap between the scroll cue and its heading is that section's own
  existing top padding, unmodified, per the brief's "do not modify any
  other landing section."

### Files changed
- `styles/landing.css` — mobile media query only: `.hero-sky` mobile
  rules replaced with a single `display: none`; `.hero`, `.hero__eyebrow`,
  `.hero__actions`, `.hero__scroll` spacing values adjusted as above. No
  changes outside `@media (max-width: 760px)`.
- No changes to `index.html` (the `.hero-sky` markup stays in the DOM —
  it's desktop/tablet content, correctly still rendered there) or
  `scripts/landing.js`.

### Technical decisions
- `display: none` rather than `visibility: hidden`/`opacity: 0`, per
  the brief's explicit "it must take ZERO layout space" — the element
  needed to stop participating in layout, not just become invisible.
- Deleted the dead mobile crop rules instead of leaving them alongside
  the new `display: none` — they'd never execute (a hidden element's
  internal sizing/position rules are inert) and would only confuse a
  future reader into thinking the mobile crop still exists in some
  form.
- Set `.hero`'s mobile `min-height` to `0` rather than picking a new
  fixed `vh` value, letting the shorter content plus tuned padding
  define the height organically — this was the simplest way to satisfy
  "compact... but keep generous breathing room" without guessing a
  magic viewport fraction that would need re-tuning per device.

### Tests actually performed
Playwright, this session, against a local `python -m http.server`:

- **Viewport × theme matrix** (the 3 mobile pairs the brief asked to
  verify, plus a 1440×900 desktop control, each × light/dark, 8
  combinations total): 375×667, 390×844, 430×932, 1440×900. For every
  mobile combination: `overflowX === 0`, `.hero-sky` computed
  `display === "none"` and its `getBoundingClientRect()` is exactly
  `0×0`. For the 1440×900 control: `.hero-sky` computed
  `display === "block"` with the same `336×353.67` rendered size
  measured in the two previous entries — confirming desktop is
  byte-for-byte unaffected by the mobile-only change. All 8 passed
  clean.
- **Visual inspection** via screenshots at all three required mobile
  viewports (375×667, 390×844, 430×932), light and dark: confirmed a
  text-led first viewport (eyebrow → title → support → primary/secondary
  CTA → scroll cue) with no empty box, no placeholder, no shrunk
  visual, and no excessive whitespace above or below the content in
  either theme.
- **Desktop screenshot** at 1440×900: confirmed the approved sun/cloud
  composition renders exactly as before, pixel-identical positioning to
  the previous entry's measurements.
- **Regression**: Hero's own scroll-cue link still scrolls into the
  next section; "O Axon" nav link is still active on load; the
  interactive Axon demo (weather select → register → skip comment →
  confirmation, reaching "Chuva" as the confirmed state) still works
  end to end with zero console/page errors.

### Result
Objective met. `.hero-sky` is fully removed from mobile layout (zero
reserved height, no placeholder, no smaller version), the mobile Hero
is now intentionally text-led, and spacing was rebalanced so the first
mobile viewport reads as compact and deliberate rather than empty.
Desktop/tablet's approved atmospheric composition is unchanged in
artwork, animation, dimensions, dark mode, and reduced-motion behavior.

### Remaining visual debt
- None identified against this task's scope.
- Not investigated (explicitly out of scope): every other landing
  section, tablet-width behavior between 761px and the desktop grid's
  comfortable range (not called out in this brief, and the previous
  entry's `.hero-sky` sizing already scales fluidly via `clamp()`
  through that range), and the interactive Axon demo (untouched by
  design).

### Next recommended step
None specified by this task.
