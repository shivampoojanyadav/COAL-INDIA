/* WCAG contrast audit for the EcoSankalan-derived palette.

   Alphas are parsed out of the BUILT stylesheet rather than hardcoded, so this
   script cannot silently drift from the real values.

   Run: node scripts/contrast.cjs  (after npm run build) */

const fs = require('fs')
const path = require('path')

const distAssets = path.join(__dirname, '..', 'dist', 'assets')
const cssFile = fs.readdirSync(distAssets).find((f) => f.endsWith('.css'))
if (!cssFile) {
  console.error('No built CSS found. Run `npm run build` first.')
  process.exit(1)
}
const css = fs.readFileSync(path.join(distAssets, cssFile), 'utf8')

function token(name, fallback) {
  const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`).exec(css)
  return m ? m[1] : fallback
}
function alpha(name, fallback) {
  const m = new RegExp(`\\.${name}\\s*\\{[^}]*color:\\s*rgba\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*([\\d.]+)\\s*\\)`).exec(css)
  if (!m) return null
  return [+m[1], +m[2], +m[3], parseFloat(m[4])]
}

function srgb(c) {
  c /= 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}
function lumRGB([r, g, b]) {
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b)
}
function hexRGB(hex) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
function ratio(fg, bg) {
  const L1 = lumRGB(fg)
  const L2 = lumRGB(bg)
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1]
  return (hi + 0.05) / (lo + 0.05)
}
/* composite an rgba() foreground over an opaque background */
function flatten(fg, bg) {
  const a = fg[3] === undefined ? 1 : fg[3]
  if (a >= 1) return fg.slice(0, 3)
  return fg.slice(0, 3).map((c, i) => Math.round(c * a + bg[i] * (1 - a)))
}

const T = {
  canvas: hexRGB(token('color-canvas', '#f7faf3')),
  card: hexRGB(token('color-card', '#ffffff')),
  low: hexRGB(token('color-surface-low', '#ebefe8')),
  ink: hexRGB(token('color-ink', '#181d18')),
  primary: hexRGB(token('color-primary', '#005127')),
  primaryContainer: hexRGB(token('color-primary-container', '#1b6b3a')),
  primaryFixed: hexRGB(token('color-primary-fixed', '#a5f4b6')),
  secondary: hexRGB(token('color-secondary', '#1b6d24')),
  secondaryContainer: hexRGB(token('color-secondary-container', '#a0f399')),
  tertiaryFixed: hexRGB(token('color-tertiary-fixed', '#ffd9dc')),
  muted: hexRGB(token('color-muted', '#404940')),
  danger: hexRGB(token('color-danger', '#ba1a1a')),
  dangerText: hexRGB(token('color-danger-text', '#93000a')),
  outline: hexRGB(token('color-outline', '#707a6f')),
  outlineVariant: hexRGB(token('color-outline-variant', '#bfc9bd')),
  riskLow: hexRGB(token('color-risk-low', '#a0f399')),
  riskMedium: hexRGB(token('color-risk-medium', '#ffd9dc')),
  riskHigh: hexRGB(token('color-risk-high', '#ff8a3d')),
  riskCritical: hexRGB(token('color-risk-critical', '#782c39')),
}

const W = [255, 255, 255]
const pairs = [
  // body copy
  ['ink on canvas', T.ink, T.canvas],
  ['ink on card', T.ink, T.card],
  ['ink on surface-low', T.ink, T.low],
  ['muted on canvas', T.muted, T.canvas],
  ['muted on card', T.muted, T.card],
  ['muted on surface-low', T.muted, T.low],

  // primary button + links
  ['white on primary', W, T.primary],
  ['primary on canvas', T.primary, T.canvas],
  ['primary on card', T.primary, T.card],
  ['primary on surface-low', T.primary, T.low],
  ['primary on primary-fixed (nav active)', T.primary, T.primaryFixed],
  ['primary-light on canvas', hexRGB(token('color-primary-light', '#1b6b3a')), T.canvas],

  // tonal surfaces carry ink
  ['ink on primary-fixed', T.ink, T.primaryFixed],
  ['ink on secondary-container', T.ink, T.secondaryContainer],
  ['ink on tertiary-fixed', T.ink, T.tertiaryFixed],

  // primary-container is white-only by design
  ['white on primary-container', W, T.primaryContainer],

  // risk ramp
  ['ink on risk-low', T.ink, T.riskLow],
  ['ink on risk-medium', T.ink, T.riskMedium],
  ['ink on risk-high', T.ink, T.riskHigh],
  ['white on risk-critical', W, T.riskCritical],

  // danger + outline
  ['dangerText on canvas', T.dangerText, T.canvas],
  ['white on danger', W, T.danger],
  ['outline on canvas (non-text UI)', T.outline, T.canvas],
  ['outline-variant on card (borders)', T.outlineVariant, T.card],

  // the .ink-* ramp, every step, on the worst-case surface
  ...['ink-20', 'ink-30', 'ink-40', 'ink-50', 'ink-60', 'ink-70', 'ink-90']
    .map((c) => [c, alpha(c, [0, 0, 0, 1]), T.low])
    .filter(([, fg]) => fg),
]

console.log('WCAG CONTRAST AUDIT, EcoSankalan palette')
console.log(`built from dist/assets/${cssFile}\n`)

let aaFails = 0
let hardFails = 0
for (const [label, fgRaw, bg] of pairs) {
  if (!fgRaw) continue
  const fg = flatten(fgRaw, bg)
  const r = ratio(fg, bg)
  const aa = r >= 4.5
  const aaLarge = r >= 3.0
  if (!aa) aaFails++
  if (!aaLarge) hardFails++
  if (aa) continue
  console.log(`  ${aaLarge ? 'AA-lg' : 'FAIL '} ${r.toFixed(2).padStart(5)}:1  ${label}`)
}
const total = pairs.filter(([, fg]) => fg).length
console.log(`\n  ${total - aaFails}/${total} pairs meet AA for normal text.`)
console.log(`  ${hardFails} pair(s) below the 3:1 large-text floor.`)

// Guard rail: primary-container must never take ink text.
if (ratio(T.ink, T.primaryContainer) < 3 && !/bg-primary-container[^"]*text-ink|text-ink[^"]*bg-primary-container/.test(fs.readFileSync(path.join(__dirname, '..', 'src', 'App.tsx'), 'utf8'))) {
  console.log('\n  NOTE: ink on primary-container is 2.62:1. primary-container is white-text-only by')
  console.log('        design. No call site currently pairs them, but keep it that way.')
}