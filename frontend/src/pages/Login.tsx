/* ============================================================================
   LOGIN, the first screen, so it establishes the EcoSankalan language:

     • a deep-green hero carrying the 135° brand gradient, with the blurred
       green blob treatment lifted straight from the reference's hero
     • masked display lines where the final line turns `primary-fixed` lime
     • a ticker band in translucent white
     • a white Material card that overlaps the hero by a negative margin

   The demo-credential list is a real affordance, not a shortcut: for a review
   you need to be able to open five different role dashboards in ten seconds.
   ========================================================================== */

import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { DEMO_LOGINS } from '@/lib/roles'
import { DATA_SOURCE } from '@/lib/api'
import { Dot } from '@/components/primitives/Sticker'
import { Marquee } from '@/components/primitives/Reveal'
import { PillButton } from '@/components/primitives/Pill'
import { Eyebrow } from '@/components/primitives/Section'
import { ArrowRight, LockGlyph, ShieldGlyph } from '@/components/primitives/icons'

const TICKER = [
  'Coal India Limited',
  'Mine Safety & Compliance',
  'Predictive Risk Engine',
  'DGMS Aligned',
  'Real-time Monitoring',
  'Audit Ready',
]

export function Login() {
  const { user, login, error } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const from = (location.state as { from?: string } | null)?.from

  useEffect(() => {
    document.title = 'Sign in, CoaliZEN'
  }, [])

  if (user) return <Navigate to={from ?? '/dashboard'} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await login(username, password)
      navigate(from ?? '/dashboard', { replace: true })
    } catch {
      /* the message is rendered from `error` */
    } finally {
      setBusy(false)
    }
  }

  function useDemo(demoUsername: string, demoPassword: string) {
    setUsername(demoUsername)
    setPassword(demoPassword)
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* ---------------------------------------------------------- hero */}
      <section className="relative overflow-hidden bg-primary text-white">
        {/* The reference's blurred hero blobs, held at low opacity so the
            headline stays the focus. Purely decorative. */}
        <div aria-hidden="true" className="lp-hero-blobs pointer-events-none absolute inset-0">
          <span className="lp-hero-blob lp-hero-blob--1" />
          <span className="lp-hero-blob lp-hero-blob--2" />
        </div>

        <div className="relative px-[var(--base-padding-x)] pb-40 pt-10 lg:pb-48 lg:pt-14">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="font-display text-[20px] font-bold tracking-tight text-white"
              aria-label="CoaliZEN home"
            >
              CoaliZEN
            </Link>
            <Dot className="bg-primary-fixed" />
          </div>

          <div aria-hidden="true" className="mt-16 hidden items-center justify-between lg:flex">
            {Array.from({ length: 5 }, (_, i) => (
              <Dot key={i} className={i === 2 ? 'bg-secondary-container' : 'bg-white/35'} />
            ))}
          </div>

          <h1 className="mt-10 max-w-[16ch] text-d1">
            <span className="block">
              <span className="mask-rise inline-block">Mine</span>
            </span>
            <span className="block">
              <span className="mask-rise inline-block" style={{ ['--reveal-delay' as string]: '90ms' }}>
                Safety,
              </span>
            </span>
            <span className="block">
              <span
                className="mask-rise inline-block text-primary-fixed"
                style={{ ['--reveal-delay' as string]: '180ms' }}
              >
                Regulated.
              </span>
            </span>
          </h1>

          <p className="mt-10 max-w-measure text-lead text-white/75">
            One platform for compliance tracking, risk intelligence and enforcement across the
            Coal India mine network. Every action is audit-logged.
          </p>
        </div>

        {/* ticker band, tucked under the hero */}
        <div className="relative border-t border-white/15 bg-white/[0.06] py-4">
          <Marquee itemClassName="gap-10 pr-10">
            {TICKER.map((t) => (
              <span key={t} className="eyebrow whitespace-nowrap text-white/70">
                {t}
              </span>
            ))}
          </Marquee>
        </div>
      </section>

      {/* --------------------------------------------------------- sheet */}
      <div className="px-[var(--base-padding-x)]">
        <div className="-mt-28 grid gap-12 pb-24 lg:-mt-32 lg:grid-cols-12">
          {/* form */}
          <div className="lg:col-span-7">
            <form onSubmit={onSubmit} className="eco-card p-7 lg:p-10" noValidate>
              <Eyebrow>Authorised access</Eyebrow>
              <h2 className="mt-5 text-d3 font-bold text-ink">Sign in</h2>

              {error && (
                <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl bg-danger/10 p-4 text-[14px] text-dangerOnDark">
                  <LockGlyph size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="mt-8 space-y-5">
                <label className="block">
                  <span className="field-label">Username</span>
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="field mt-2 h-14 w-full"
                    placeholder="e.g. manager1"
                  />
                </label>

                <label className="block">
                  <span className="field-label">Password</span>
                  <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="field mt-2 h-14 w-full"
                    placeholder="••••••••"
                  />
                </label>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <PillButton type="submit" size="lg" disabled={busy}>
                  {busy ? 'Signing in…' : 'Enter platform'}
                </PillButton>
                <p className="eyebrow flex items-center gap-2">
                  <ShieldGlyph size={14} />
                  Role-scoped sessions
                </p>
              </div>

              {DATA_SOURCE === 'mock' && (
                <p className="mt-8 border-t border-line pt-6 text-[13px] leading-relaxed text-muted">
                  Running on the seeded demo dataset, no backend required.
                </p>
              )}
            </form>
          </div>

          {/* demo logins */}
          <aside className="lg:col-span-5">
            <div className="eco-card p-7 lg:p-8">
              <Eyebrow>Demo accounts</Eyebrow>
              <p className="mt-4 text-[14px] leading-relaxed text-muted">
                Each role sees a different navigation set, dashboard and set of permitted actions.
                Select one to fill the form.
              </p>

              <ul className="mt-6">
                {DEMO_LOGINS.map((d) => (
                  <li key={d.username}>
                    <button
                      type="button"
                      onClick={() => useDemo(d.username, d.password)}
                      className="group flex w-full items-center justify-between gap-4 border-b border-line py-4 text-left transition-colors duration-300 ease-primary hover:bg-surface-low"
                    >
                      <span className="min-w-0">
                        <span className="block text-[15px] font-semibold text-ink">{d.label}</span>
                        <span className="eyebrow mt-1 block truncate">
                          {d.username} / {d.password}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 opacity-40 transition-opacity duration-300 group-hover:opacity-100" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}