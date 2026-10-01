import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

/* ============================================================================
   BUTTONS, the reference's four button families.

   Filled is the 135° green gradient with white text (9.52:1). Tonal is the
   light green container with ink. Outlined is a 1.5px primary border. Text is
   primary-coloured with a tonal hover.

   The old expanding-dot CTA is gone: it delayed the colour change by 300ms,
   which made the primary action feel unresponsive on a tool where the click is
   the point.
   ========================================================================== */

type Variant = 'filled' | 'tonal' | 'outlined' | 'text' | 'danger' | 'primary' | 'outline'
type Size = 'md' | 'sm' | 'lg'

interface BaseProps {
  children: ReactNode
  className?: string
  size?: Size
  variant?: Variant
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  title?: string
  'aria-label'?: string
}

/* `primary` and `outline` are kept as accepted spellings of the two variants
   that already existed at these call sites, so both vocabularies coexist
   during the restyle. */
const variantClass: Record<Variant, string> = {
  filled: 'eco-btn--filled',
  tonal: 'eco-btn--tonal',
  outlined: 'eco-btn--outlined',
  text: 'eco-btn--text',
  danger: 'eco-btn--danger',
  primary: 'eco-btn--filled',
  outline: 'eco-btn--outlined',
}

const sizeClass: Record<Size, string> = {
  sm: 'eco-btn--sm',
  md: '',
  lg: 'eco-btn--lg',
}

function cls({
  size,
  variant,
  disabled,
  className,
}: Pick<BaseProps, 'size' | 'variant' | 'disabled' | 'className'>) {
  return cn(
    'eco-btn no-select',
    variantClass[variant ?? 'filled'],
    sizeClass[size ?? 'md'],
    disabled && 'pointer-events-none opacity-55',
    className,
  )
}

export function PillButton({
  children,
  className,
  size = 'md',
  variant = 'filled',
  disabled = false,
  type = 'button',
  onClick,
  title,
  ...rest
}: BaseProps) {
  return (
    <button
      type={type}
      className={cls({ size, variant, disabled, className })}
      onClick={onClick}
      disabled={disabled}
      title={title}
      {...rest}
    >
      {children}
    </button>
  )
}

export function PillLink({
  to,
  children,
  className,
  size = 'md',
  variant = 'filled',
  ...rest
}: Omit<BaseProps, 'onClick' | 'type' | 'disabled'> & { to: string }) {
  return (
    <Link to={to} className={cls({ size, variant, className })} {...rest}>
      {children}
    </Link>
  )
}

/** Anchored variant for downloads (PDF compliance reports) and external links. */
export function PillAnchor({
  href,
  children,
  className,
  size = 'md',
  variant = 'filled',
  external = false,
  download,
  ...rest
}: Omit<BaseProps, 'onClick' | 'type' | 'disabled'> & {
  href: string
  external?: boolean
  download?: boolean
}) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...(download ? { download: true } : {})}
      className={cls({ size, variant, className })}
      {...rest}
    >
      {children}
    </a>
  )
}