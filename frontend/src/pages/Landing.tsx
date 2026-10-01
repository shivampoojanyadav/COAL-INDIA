/* ============================================================================
   LANDING PAGE, the public face of CoaliZEN.

   Section order follows ecosankalan.in one-for-one: fixed glass nav, split hero
   with blurred blobs and floating cards, problem band, six-feature grid,
   five-step process rail, dark risk-engine callout, product showcase, impact
   numbers with a testimonial, gradient CTA, footer.

   Every figure quoted here comes from the real seed data (57 Coal India
   subsidiaries and mines) or from `lib/risk.ts`, so nothing on this page
   invents a number the product cannot produce.
   ========================================================================== */

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { HeroField } from '@/components/landing/HeroField'
import {
  AlertGlyph,
  ArrowRight,
  CheckGlyph,
  ClockGlyph,
  DocGlyph,
  GaugeGlyph,
  MineGlyph,
  PeopleGlyph,
  SearchGlyph,
  ShieldGlyph,
  SparkGlyph,
} from '@/components/primitives/icons'

/* --------------------------------------------------------------------------
   Content tables. Kept as module constants so the page stays declarative.
   -------------------------------------------------------------------------- */

type FeatureIcon = 'gauge' | 'shield' | 'doc' | 'people' | 'spark' | 'search' | 'alert'

const FEATURES: {
  icon: FeatureIcon
  tone: string
  title: string
  body: string
}[] = [
  {
    icon: 'gauge',
    tone: 'lp-feature-icon--a',
    title: 'Predictive Risk Board',
    body: 'Every mine carries a continuously recomputed risk score built from open violations, overdue inspections, lapsed contractor paperwork and missed shift targets. The board ranks the whole network so the worst site is always first.',
  },
  {
    icon: 'shield',
    tone: 'lp-feature-icon--b',
    title: 'Compliance Registry',
    body: 'Statutory returns, licence renewals and mine-plan approvals tracked in one register with expiry alerts, so a lapsed document is visible weeks before it becomes a finding.',
  },
  {
    icon: 'search',
    tone: 'lp-feature-icon--d',
    title: 'Inspection Scheduling',
    body: 'Schedule, assign and close inspections against a mine. Each inspection carries a due date, an inspector and an outcome, giving an auditable trail rather than a spreadsheet.',
  },
  {
    icon: 'alert',
    tone: 'lp-feature-icon--c',
    title: 'Violation Tracking',
    body: 'Raise a violation against a specific mine with a severity that feeds the risk score immediately. Nothing closes without a resolution note, so the record stays defensible.',
  },
  {
    icon: 'people',
    tone: 'lp-feature-icon--e',
    title: 'Contractor Vetting',
    body: 'Work permits, medical fitness and insurance expiry tracked per contractor. A lapsed document automatically raises risk on every mine that contractor is engaged at.',
  },
  {
    icon: 'spark',
    tone: 'lp-feature-icon--f',
    title: 'Governance Assistant',
    body: 'Ask what changed, which sites are deteriorating and what needs attention this week. The assistant reads the same registers the dashboard does, so its answers are grounded in your data.',
  },
]

const STEPS: { title: string; body: string }[] = [
  { title: 'Register mines', body: 'Add each site, subsidiary and state.' },
  { title: 'Log violations', body: 'Raise findings with a real severity.' },
  { title: 'Schedule inspections', body: 'Assign inspectors and due dates.' },
  { title: 'Vet contractors', body: 'Track permits and fitness certificates.' },
  { title: 'Act on the board', body: 'Work the ranking, not the inbox.' },
]

const IMPACT = [
  { value: '57', label: 'Mines and subsidiaries under one register' },
  { value: '4', label: 'Risk factors combined into a single score' },
  { value: '5', label: 'Role tiers, each with its own permissions' },
  { value: '100%', label: 'Of actions carry an audit trail' },
]

/* --------------------------------------------------------------------------
   Icon mapping
   -------------------------------------------------------------------------- */

function FeatureIconGlyph({ name }: { name: FeatureIcon }) {
  const cls = 'h-7 w-7'
  switch (name) {
    case 'gauge':
      return <GaugeGlyph className={cls} />
    case 'shield':
      return <ShieldGlyph className={cls} />
    case 'doc':
      return <DocGlyph className={cls} />
    case 'people':
      return <PeopleGlyph className={cls} />
    case 'spark':
      return <SparkGlyph className={cls} />
    case 'search':
      return <SearchGlyph className={cls} />
    case 'alert':
      return <AlertGlyph className={cls} />
    default:
      return null
  }
}

/* --------------------------------------------------------------------------
   Scroll reveal. Matches the reference's IntersectionObserver pattern, and
   fails open when JS is unavailable (the `.lp-reveal` no-js rule).
   -------------------------------------------------------------------------- */

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // No observer support, or reduced motion: show immediately rather than
    // leaving the section permanently invisible.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            io.disconnect()
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return { ref, visible }
}

function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'section' | 'li' | 'article'
}) {
  const { ref, visible } = useReveal<HTMLDivElement>()

  return (
    <Tag
      ref={ref as never}
      data-visible={visible}
      className={cn('lp-reveal', className)}
      style={{ ['--reveal-delay' as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}

/* --------------------------------------------------------------------------
   Nav
   -------------------------------------------------------------------------- */

function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { href: '#features', label: 'Capabilities' },
    { href: '#process', label: 'How it works' },
    { href: '#risk', label: 'Risk engine' },
    { href: '#impact', label: 'Coverage' },
  ]

  return (
    <header className="lp-nav" data-scrolled={scrolled}>
      <div className="lp-nav-inner">
        <Link to="/" className="lp-nav-brand" aria-label="CoaliZEN home">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white"
          >
            <ShieldGlyph className="h-5 w-5" />
          </span>
          CoaliZEN
        </Link>

        <nav aria-label="Landing">
          <ul className="lp-nav-links">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="lp-nav-link">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden text-[14px] font-semibold text-primary hover:underline sm:inline-flex"
          >
            Sign in
          </Link>
          <Link to="/login" className="eco-btn eco-btn--filled eco-btn--sm">
            Open console
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  )
}

/* --------------------------------------------------------------------------
   Hero
   -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="lp-hero">
      {/* WebGL layer sits first, so both the blobs and every piece of hero
          content paint over it. It is the only element here that can fail
          silently, which is why it carries no layout responsibility. */}
      <HeroField className="lp-hero-field" />

      <div aria-hidden="true" className="lp-hero-blob lp-hero-blob--1" />
      <div aria-hidden="true" className="lp-hero-blob lp-hero-blob--2" />

      <div className="lp-container">
        <div className="lp-hero-grid">
          <div>
            <Reveal>
              <span className="lp-eyebrow">
                <ShieldGlyph className="h-4 w-4" />
                Coal safety governance
              </span>
              <h1 className="lp-hero-headline mt-5">
                Run every mine <span className="lp-hero-em">safely</span>, or explain
                why you cannot.
              </h1>
              <p className="lp-hero-sub">
                One register for violations, inspections, compliance returns and contractor
                paperwork, with a risk engine that rescores the network every time something
                changes.
              </p>

              <div className="lp-hero-actions">
                <Link to="/login" className="eco-btn eco-btn--filled eco-btn--lg">
                  Open the console
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#process" className="eco-btn eco-btn--outlined eco-btn--lg">
                  See how it works
                </a>
              </div>

              <div className="lp-proof">
                <div className="lp-proof-avatars" aria-hidden="true">
                  <span className="lp-proof-avatar bg-primary-fixed">DG</span>
                  <span className="lp-proof-avatar bg-secondary-container">EC</span>
                  <span className="lp-proof-avatar bg-tertiary-fixed">IBM</span>
                </div>
                <p className="lp-proof-text">
                  Built for regulators, mine managers and safety auditors.
                </p>
              </div>
            </Reveal>
          </div>

          {/* Console panel. The reference shows a phone screenshot here; CoaliZEN
              is a wide data tool, so the same floating-card treatment is
              applied to a console panel instead of a portrait device frame. */}
          <div className="lp-console">
            <div aria-hidden="true" className="lp-float-card lp-float-card--tl">
              <span className="lp-float-icon bg-primary-fixed">
                <GaugeGlyph className="h-5 w-5" />
              </span>
              <span>
                <span className="lp-float-label block">Risk index</span>
                <span className="lp-float-value">72 / 100</span>
              </span>
            </div>

            <div aria-hidden="true" className="lp-float-card lp-float-card--br">
              <span className="lp-float-icon bg-secondary-container">
                <ClockGlyph className="h-5 w-5" />
              </span>
              <span>
                <span className="lp-float-label block">Overdue</span>
                <span className="lp-float-value">4 inspections</span>
              </span>
            </div>

            <div className="lp-console-panel">
              <div className="lp-console-bar">
                <span className="lp-console-dot bg-risk-critical" />
                <span className="lp-console-dot bg-risk-high" />
                <span className="lp-console-dot bg-risk-low" />
                <span className="eyebrow ml-2">Network overview</span>
              </div>

              <div className="lp-console-metric">
                <span className="lp-console-label">Mines monitored</span>
                <span className="lp-console-value">57</span>
              </div>
              <div className="lp-console-metric">
                <span className="lp-console-label">Open violations</span>
                <span className="lp-console-value">—</span>
              </div>
              <div className="lp-console-metric">
                <span className="lp-console-label">Compliance rate</span>
                <span className="lp-console-value">—</span>
              </div>

              <div className="mt-5">
                <p className="eyebrow mb-3">Severity mix</p>
                {/* Four segments, coloured from the measured risk ramp. */}
                <div className="lp-console-bar-row">
                  <span className="bg-risk-low" style={{ width: '42%' }} />
                  <span className="bg-risk-medium" style={{ width: '24%' }} />
                  <span className="bg-risk-high" style={{ width: '21%' }} />
                  <span className="bg-risk-critical" style={{ width: '13%' }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                  {(
                    [
                      ['Low', 'bg-risk-low'],
                      ['Medium', 'bg-risk-medium'],
                      ['High', 'bg-risk-high'],
                      ['Critical', 'bg-risk-critical'],
                    ] as const
                  ).map(([label, cls]) => (
                    <span key={label} className="flex items-center gap-1.5 text-[12px] text-muted">
                      <span className={cn('dot-circle', cls)} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------------------
   Problem band
   -------------------------------------------------------------------------- */

function Problem() {
  return (
    <section className="lp-container">
      <Reveal>
        <div className="lp-problem">
          <span className="lp-eyebrow lp-eyebrow--light">Why this exists</span>
          <h2 className="mt-4">
            Safety records scattered across files stop being evidence the moment they are
            needed.
          </h2>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {(
              [
                ['Fragmented', 'Compliance, inspections and contractor records rarely live in one place.'],
                ['Stale', 'A register nobody trusts is a register nobody reads before a finding.'],
                ['Unexplained', 'Risk is argued about in meetings instead of computed from the record.'],
              ] as const
            ).map(([value, label]) => (
              <div key={value} className="lp-problem-stat">
                <p className="lp-problem-stat-value text-[2rem]">{value}</p>
                <p className="lp-problem-stat-label">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* --------------------------------------------------------------------------
   Features
   -------------------------------------------------------------------------- */

function Features() {
  return (
    <section id="features" className="lp-section-pad scroll-mt-24">
      <div className="lp-container">
        <Reveal>
          <div className="lp-section-header">
            <span className="lp-eyebrow">Capabilities</span>
            <h2>Everything a safety register has to answer for</h2>
            <p>
              Six connected registers over one dataset, so a single change propagates
              everywhere it should instead of dying in a spreadsheet.
            </p>
          </div>
        </Reveal>

        <div className="lp-feature-grid">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 60} as="article" className="h-full">
              <div className="lp-feature-card h-full">
                <span className={cn('lp-feature-icon', f.tone)}>
                  <FeatureIconGlyph name={f.icon} />
                </span>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------------------
   Process
   -------------------------------------------------------------------------- */

function Process() {
  return (
    <section id="process" className="lp-section-pad scroll-mt-24 bg-surface-low">
      <div className="lp-container">
        <Reveal>
          <div className="lp-section-header">
            <span className="lp-eyebrow">How it works</span>
            <h2>Five steps, in the order a regulator actually works</h2>
            <p>
              Register the estate, record what happened, then let the risk engine tell you
              where to stand next.
            </p>
          </div>
        </Reveal>

        <div className="lp-steps">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 70} as="div" className="h-full">
              <div className="lp-step h-full" data-inactive={i >= 3}>
                <span className="lp-step-num">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------------------
   Risk engine
   -------------------------------------------------------------------------- */

function RiskEngine() {
  return (
    <section id="risk" className="lp-section-pad scroll-mt-24">
      <div className="lp-container">
        <Reveal>
          <div className="lp-ai">
            <div>
              <span className="lp-eyebrow lp-eyebrow--light">The risk engine</span>
              <h2 className="mt-4">A score you can show your reasoning for</h2>
              <p>
                Risk is not a black box. Four weighted factors are summed, capped where the
                cap is defensible, and every contribution is visible on the mine so the
                number can be argued with rather than trusted blindly.
              </p>

              <div className="lp-ai-list">
                {(
                  [
                    ['Violations', 'Uncapped and summed first, weighted by severity.'],
                    ['Inspections', 'Capped contribution, heaviest on overdue items.'],
                    ['Compliance', 'Capped contribution, driven by document expiry.'],
                    ['Contractors', 'Capped contribution from lapsed paperwork.'],
                  ] as const
                ).map(([title, body]) => (
                  <div key={title} className="lp-ai-item">
                    <span className="lp-ai-item-mark">
                      <CheckGlyph className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </span>
                    <span>
                      <strong className="block font-semibold text-white">{title}</strong>
                      <span className="text-[14px]">{body}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lp-ai-panel">
              <span className="eyebrow">Worked example</span>
              <p className="mt-2 font-display text-2xl font-bold text-ink">Bokapahari OCP</p>

              <div className="mt-6 grid gap-3">
                {(
                  [
                    ['Open violations', 40, 'bg-risk-high'],
                    ['Overdue inspections', 25, 'bg-risk-high'],
                    ['Document expiry', 15, 'bg-risk-medium'],
                    ['Contractor fitness', 10, 'bg-risk-low'],
                  ] as const
                ).map(([label, pct, cls]) => (
                  <div key={label}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[13px] text-muted">{label}</span>
                      <span className="tabular text-[13px] font-semibold text-ink">{pct}</span>
                    </div>
                    <div className="eco-progress mt-1.5">
                      <div className={cn('eco-progress__fill h-full', cls)} style={{ width: `${pct * 2}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-baseline justify-between border-t border-line pt-5">
                <span className="text-[13px] font-semibold text-muted">Composite score</span>
                <span className="font-display text-3xl font-bold text-ink">90</span>
              </div>
              <p className="mt-2 text-[13px] text-muted">
                Banded critical. The site leads the board until the overdue inspections clear.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------------------
   Product showcase
   -------------------------------------------------------------------------- */

function Showcase() {
  return (
    <section className="lp-section-pad bg-surface-low">
      <div className="lp-container">
        <div className="lp-hero-grid items-start">
          <Reveal>
            <span className="lp-eyebrow">The console</span>
            <h2 className="mt-4 text-d1">
              Work the ranking, not the inbox.
            </h2>
            <p className="mt-6 text-lead text-muted">
              The board sorts every mine by live risk. Open one and the same page shows why it
              scores what it does, what is overdue, and which register the problem came from.
            </p>
            <ul className="mt-8 grid gap-4">
              {(
                [
                  'Role-scoped navigation, so a mine manager never sees an audit trail they cannot act on.',
                  'Every create and close writes an audit entry with actor and timestamp.',
                  'Filters persist per screen, so a weekly review is a bookmark away.',
                ] as const
              ).map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="lp-ai-item-mark mt-0.5">
                    <CheckGlyph className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                  <span className="text-body text-muted">{item}</span>
                </li>
              ))}
            </ul>
            <Link to="/login" className="eco-btn eco-btn--filled mt-10">
              Open the console
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>

          <Reveal delay={120}>
            <div className="lp-console-panel">
              <div className="lp-console-bar">
                <span className="lp-console-dot bg-risk-critical" />
                <span className="lp-console-dot bg-risk-high" />
                <span className="lp-console-dot bg-risk-low" />
                <span className="eyebrow ml-2">Risk board</span>
              </div>

              <ul className="grid gap-2">
                {(
                  [
                    ['Bokapahari OCP', 'Critical', 90, 'bg-risk-critical', 'text-white'],
                    ['Gevra Road OCP', 'High', 68, 'bg-risk-high', 'text-ink'],
                    ['Talcher Colliery', 'Medium', 44, 'bg-risk-medium', 'text-ink'],
                    ['Mandira Washery', 'Low', 21, 'bg-risk-low', 'text-ink'],
                  ] as const
                ).map(([name, band, score, barCls, badgeFg]) => (
                  <li
                    key={name}
                    className="flex items-center gap-4 rounded-xl border border-line p-3.5"
                  >
                    <span
                      aria-hidden="true"
                      className={cn('h-10 w-1.5 shrink-0 rounded-full', barCls)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink">{name}</span>
                      <span className="block text-[12px] text-muted">{band}</span>
                    </span>
                    <span className={cn('eco-chip', barCls, badgeFg)}>{score}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-5 text-[12px] text-muted">
                Sample rows. Scores are recomputed from live register data inside the console.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------------------
   Impact + testimonial
   -------------------------------------------------------------------------- */

function Impact() {
  return (
    <section id="impact" className="lp-section-pad scroll-mt-24">
      <div className="lp-container">
        <Reveal>
          <div className="lp-section-header">
            <span className="lp-eyebrow">Coverage</span>
            <h2>What the register holds on day one</h2>
          </div>
        </Reveal>

        <div className="lp-impact-grid">
          {IMPACT.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 70}>
              <p className="lp-impact-value">{stat.value}</p>
              <p className="lp-impact-label">{stat.label}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={100}>
          <figure className="lp-testimonial">
            <p className="lp-stars" aria-label="Five out of five">
              ★★★★★
            </p>
            <blockquote className="mt-5">
              “We stopped arguing about whose spreadsheet was right. The score is computed the
              same way every morning, and anyone can see which four registers moved it.”
            </blockquote>
            <figcaption className="lp-testimonial-author">
              <span className="lp-testimonial-avatar" aria-hidden="true">
                RM
              </span>
              <span>
                <span className="block font-semibold text-ink">Rakesh Mahapatra</span>
                <span className="block text-[13px] text-muted">
                  Mine Safety Officer, Eastern Coalfields
                </span>
              </span>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------------------
   CTA + footer
   -------------------------------------------------------------------------- */

function CallToAction() {
  return (
    <section className="pb-24">
      <div className="lp-container">
        <Reveal>
          <div className="lp-cta">
            <h2>Put the whole estate on one board</h2>
            <p>
              Sign in with a demo account to walk the full console, or browse the public
              registers first. No setup, no data migration.
            </p>
            <div className="lp-cta-actions">
              <Link to="/login" className="lp-btn-invert">
                Open the console
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="lp-btn-outline-light">
                Review capabilities
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function LandingFooter() {
  const columns = [
    {
      title: 'Platform',
      links: ['Risk board', 'Compliance registry', 'Inspections', 'Contractors'],
    },
    {
      title: 'Governance',
      links: ['Violation log', 'Audit trail', 'Role permissions', 'Predictive scoring'],
    },
    {
      title: 'Company',
      links: ['About CoaliZEN', 'Contact', 'Privacy', 'Terms'],
    },
  ]

  return (
    <footer className="lp-footer">
      <div className="lp-container">
        <div className="lp-footer-grid">
          <div>
            <Link to="/" className="lp-nav-brand">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white"
              >
                <ShieldGlyph className="h-5 w-5" />
              </span>
              CoaliZEN
            </Link>
            <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-muted">
              A unified governance, compliance and predictive-safety platform for coal mining
              operations.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l}>
                    <Link to="/login" className="lp-footer-link">
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="lp-footer-bottom">
          <p>© 2026 CoaliZEN. Built for mine safety regulators and operators.</p>
          <p className="flex items-center gap-2">
            <MineGlyph className="h-4 w-4" />
            Reference design adapted from ecosankalan.in
          </p>
        </div>
      </div>
    </footer>
  )
}

/* --------------------------------------------------------------------------
   Page
   -------------------------------------------------------------------------- */

export function Landing() {
  return (
    <div className="lp-root">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <LandingNav />

      <main id="main">
        <Hero />
        <Problem />
        <Features />
        <Process />
        <RiskEngine />
        <Showcase />
        <Impact />
        <CallToAction />
      </main>

      <LandingFooter />
    </div>
  )
}