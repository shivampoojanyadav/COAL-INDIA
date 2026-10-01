/* ============================================================================
   404, the reference's end-panel treatment, rebuilt on the deep-green hero:
   a full-bleed primary panel with masked display type, the pip row, and the
   rolling 404 counter behind the copy.
   ========================================================================== */

import { Link } from 'react-router-dom'
import { PillLink } from '@/components/primitives/Pill'
import { PipRow } from '@/components/primitives/Sticker'
import { Odometer } from '@/components/primitives/Reveal'

export function NotFound() {
  return (
    <div className="relative -mx-[var(--base-padding-x)] -mt-10 overflow-hidden rounded-t-[40px] bg-primary px-[var(--base-padding-x)] py-24 text-white lg:-mt-10">
      <div aria-hidden="true">
        <PipRow count={4} className="text-primary-fixed" />
      </div>

      <div className="mt-14 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow text-primary-fixed">Error 404</p>
          <h1 className="mt-6 text-d1">
            <span className="block">
              <span className="mask-rise inline-block">Off the</span>
            </span>
            <span className="block">
              <span
                className="mask-rise inline-block text-secondary-container"
                style={{ ['--reveal-delay' as string]: '90ms' }}
              >
                record.
              </span>
            </span>
          </h1>
          <p className="mt-8 max-w-measure text-lead text-white/75">
            That page does not exist in the register. It may have been renamed, or the link that
            brought you here may be out of date.
          </p>
        </div>

        <Odometer value={404} digits={3} className="shrink-0 text-white/20" />
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <PillLink to="/dashboard" variant="tonal">
          Command centre
        </PillLink>
        <PillLink to="/mines" variant="text">
          Mine network
        </PillLink>
      </div>

      <p className="mt-16">
        <Link to="/assistant" className="link-underline eyebrow text-primary-fixed">
          Or ask the assistant what you were looking for
        </Link>
      </p>
    </div>
  )
}