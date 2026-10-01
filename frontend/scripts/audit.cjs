const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const srcDir = path.join(root, 'src')
const distDir = path.join(root, 'dist')

const cssFile = fs
  .readdirSync(path.join(distDir, 'assets'))
  .find((f) => f.endsWith('.css'))
const css = fs.readFileSync(path.join(distDir, 'assets', cssFile), 'utf8')
const js = fs
  .readdirSync(path.join(distDir, 'assets'))
  .filter((f) => f.endsWith('.js'))
  .map((f) => fs.readFileSync(path.join(distDir, 'assets', f), 'utf8'))
  .join('\n')

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.(tsx|ts)$/.test(e.name)) out.push(p)
  }
  return out
}

const source = walk(srcDir)
  .map((f) => fs.readFileSync(f, 'utf8'))
  .join('\n')

// ---- 1. class names used in source vs present in built CSS ----------------
const used = new Set()
for (const m of source.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\}|\{'([^']*)'\})/g)) {
  const raw = (m[1] || m[2] || m[3] || '')
  for (const tok of raw.split(/[\s'"`]+/)) {
    const t = tok.trim()
    if (!t) continue
    // skip conditional expression fragments and JS logic
    if (/[{}()?=&|<>:]/.test(t)) continue
    if (!/^[a-zA-Z][a-zA-Z0-9_\-\/:\[\]\.%]*$/.test(t)) continue
    used.add(t)
  }
}
// cn(...) literals
for (const m of source.matchAll(/cn\(\s*(['"`])([\s\S]*?)\1/g)) {
  for (const tok of m[2].split(/\s+/)) {
    const t = tok.trim()
    if (t && !/[{}()?=&|<>:]/.test(t)) used.add(t)
  }
}
for (const m of source.matchAll(/toneClass[^=]*=\s*\{([\s\S]*?)\}/g)) {
  for (const tok of m[1].matchAll(/'([^']+)'/g)) {
    for (const t of tok[1].split(/\s+/)) if (t) used.add(t)
  }
}

const cssClasses = new Set()
// .foo, .foo:hover, .foo[data-x], .md\:foo
for (const m of css.matchAll(/\.((?:\\.|[A-Za-z0-9_-])+)/g)) {
  const name = m[1].replace(/\\(.)/g, '$1')
  if (name.startsWith('\\@')) continue
  cssClasses.add(name)
}

// expand responsive/state variants present in source
const variants = []
for (const u of used) {
  const parts = u.split(':')
  const base = parts.pop()
  let prefix = parts.join(':')
  variants.push(u)
  // md:/lg:/dark: etc
  const m = prefix.match(/^(lg|md|sm|xl|hover|focus|focus-visible|active|disabled|data-\[[^\]]+\])$/)
  if (m) variants.push(base)
}
const dead = [...new Set(variants)].filter((c) => !cssClasses.has(c))
// filter obvious false positives
const deadFiltered = dead.filter((c) => {
  if (/^(group|peer|dark)$/.test(c)) return false
  if (/^(sm|md|lg|xl|2xl):/.test(c)) return false
  if (/^(hover|focus|focus-visible|active|disabled):/.test(c)) return false
  if (/^data-\[/.test(c)) return false
  if (c.includes(':')) return false
  if (/^(grid|flex|block|inline|hidden|relative|absolute|fixed|sticky|static)/.test(c)) return false
  return true
})

console.log('=== CLASSES USED BUT NOT IN BUILT CSS ===')
if (deadFiltered.length === 0) console.log('  (none)')
else deadFiltered.sort().forEach((c) => console.log('  ' + c))

// ---- 2. CSS custom properties defined vs referenced ----------------------
const defined = new Set()
for (const m of css.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) defined.add(m[1])
const referenced = new Set()
for (const m of css.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)) referenced.add(m[1])
const missing = [...referenced].filter((v) => !defined.has(v))
console.log('\n=== CSS VARS REFERENCED BUT NEVER DEFINED ===')
if (missing.length === 0) console.log('  (none)')
else missing.sort().forEach((v) => console.log('  ' + v))

// ---- 3. fonts -------------------------------------------------------------
const fontFaces = [...css.matchAll(/@font-face\{([^}]*)\}/g)].map((m) => {
  const fam = /font-family:([^;]*)/.exec(m[1])
  const w = /font-weight:([^;]*)/.exec(m[1])
  return `${fam ? fam[1].replace(/['"]/g, '') : '?'} ${w ? w[1] : ''}`.trim()
})
console.log('\n=== FONT FACES IN BUILT CSS ===')
console.log('  ' + (fontFaces.join('\n  ') || '(none — fonts must come from index.html)'))

// ---- 4. tailwind arbitrary/utility sanity --------------------------------
console.log('\n=== KEY CUSTOM VARS PRESENT ===')
;['--color-primary', '--color-primary-fixed', '--color-ink', '--radius-card', '--shadow-card']
  .forEach((v) => console.log(`  ${defined.has(v) ? 'OK ' : 'MISSING '}${v}`))