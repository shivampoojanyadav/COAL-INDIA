/* ============================================================================
   ENVIRONMENT — one safe place to read Vite env vars.

   `import.meta.env` is replaced at build time by Vite and is always defined in
   the browser, but it is `undefined` under plain `node` (SSR, unit tests, the
   esbuild-based seed harness). Reading it through this module means nothing in
   the app has to defend against that.
   ========================================================================== */

const raw = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}

export const ENV = raw

/** `'mock'` (default) or `'live'`. */
export const DATA_SOURCE: 'mock' | 'live' = raw.VITE_DATA_SOURCE === 'live' ? 'live' : 'mock'

export const API_BASE_URL: string | undefined = raw.VITE_API_BASE_URL || undefined

/** Seed edits survive a reload unless this is explicitly set to `"false"`. */
export const PERSIST_MOCKS = raw.VITE_PERSIST_MOCKS !== 'false'

/** Artificial latency for the mock driver, in ms. Set to `0` for instant data. */
export const MOCK_LATENCY = Number(raw.VITE_MOCK_LATENCY ?? 180)

export const IS_MOCK = DATA_SOURCE === 'mock'