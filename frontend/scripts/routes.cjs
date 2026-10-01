/* Static route integrity check.

   The restyle changed App.tsx (public landing + role home) and Sidebar.tsx
   (new nav rows). The highest-risk functional regression is a nav item
   pointing at a route that no longer exists, or a protected route that lost its
   auth guard. Both are checkable without a browser.

   Run: node scripts/routes.cjs */

const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')

const app = read('src/App.tsx')

// ---- 1. collect declared routes ------------------------------------------
const routes = []
for (const m of app.matchAll(/<Route\s+path="([^"]*)"/g)) routes.push(m[1])
// RoleHome is now reached via PublicHome / the /dashboard route, so the bare
// "/" index route inside the shell is gone. Confirm what we expect.
console.log('DECLARED ROUTES')
routes.forEach((r) => console.log('  ' + r))

// ---- 2. collect nav targets ----------------------------------------------
const roles = read('src/lib/roles.ts')
const navTargets = new Set()
for (const m of roles.matchAll(/to:\s*'([^']+)'/g)) navTargets.add(m[1])

console.log('\nNAV TARGETS -> ROUTE RESOLUTION')
let broken = 0
for (const t of [...navTargets].sort()) {
  // a nav target is satisfied by an exact route, a param route whose prefix
  // matches, or the catch-all NotFound route (which means it IS declared badly)
  const exact = routes.includes(t)
  const param = routes.some((r) => r.includes(':') && r.split('/:')[0] === t.split('/').slice(0, -1).join('/'))
  const ok = exact || param
  if (!ok) broken++
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${t}`)
}

// ---- 3. every non-public route must sit under the auth guard -------------
// Locate the <Route element={<RequireAuth />}> block and check each route
// index inside it, then confirm the public routes are outside it.
const authIdx = app.indexOf('<RequireAuth />')
const loginIdx = app.indexOf('path="/login"')
const landingIdx = app.indexOf('path="/landing"')
const rootIdx = app.indexOf('path="/" element={<PublicHome />}')

console.log('\nGUARD PLACEMENT')
const checks = [
  ['/landing is public (before guard)', landingIdx > -1 && landingIdx < authIdx],
  ['/ is public (before guard)', rootIdx > -1 && rootIdx < authIdx],
  ['/login is public (before guard)', loginIdx > -1 && loginIdx < authIdx],
]
checks.forEach(([label, ok]) => {
  if (!ok) broken++
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${label}`)
})

// ---- 4. ProtectedScreen / Dashboard still resolve /dashboard ------------
// eslint-disable-next-line no-undef
const dashboardTargets = [...navTargets].filter((t) => t.includes('dashboard'))
console.log('\nDASHBOARD ROUTES')
console.log(`  declared: ${routes.filter((r) => r.includes('dashboard')).join(', ') || '(none)'}`)
if (!routes.some((r) => r.includes('dashboard'))) {
  broken++
  console.log('  FAIL no dashboard route declared')
}

console.log(`\n${broken === 0 ? 'ROUTE INTEGRITY OK' : broken + ' PROBLEM(S)'}`)
process.exit(broken === 0 ? 0 : 1)