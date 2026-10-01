/* ============================================================================
   TOPBAR, the sticky rail above the content.

   Lusion keeps its header to three things: the wordmark, a right-aligned
   "Menu"/"Contact" pair, and a scroll-progress hairline pinned to the bottom
   edge. We keep the progress hairline and add the things an internal tool needs:
   a search field, an unread-count bell, and a user menu.
   ========================================================================== */

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useScrollProgress } from '@/hooks/useScrollProgress'
import { useScrollY } from '@/hooks/useScrollY'
import { fullName, initials } from '@/lib/format'
import { ROLE_LABELS, type User } from '@/lib/types'
import {
  BellGlyph,
  LogOutGlyph,
  MenuGlyph,
  SearchGlyph,
} from '@/components/primitives/icons'

export function Topbar({
  user,
  unread,
  onOpenMenu,
  onSignOut,
}: {
  user: User
  unread: number
  onOpenMenu: () => void
  onSignOut: () => void
}) {
  const progress = useScrollProgress()
  const scrollY = useScrollY()
  const [stuck, setStuck] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    setStuck(scrollY > 12)
  }, [scrollY])

  // Dismiss the user menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [menuOpen])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    navigate(`/mines?q=${encodeURIComponent(q)}`)
    setQuery('')
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 bg-canvas/85 backdrop-blur-xl transition-shadow duration-300 ease-primary',
        stuck && 'shadow-nav',
      )}
    >
      <div className="flex items-center gap-4 px-[var(--base-padding-x)] py-3.5">
        <button
          type="button"
          onClick={onOpenMenu}
          className="-ml-2 flex items-center gap-2 px-2 py-2 lg:hidden"
          aria-label="Open navigation"
        >
          <MenuGlyph size={20} />
          <span className="eyebrow">Menu</span>
        </button>

        <form onSubmit={submitSearch} role="search" className="ml-auto hidden max-w-sm flex-1 md:block">
          <label className="relative block">
            <span className="sr-only">Search mines</span>
            <SearchGlyph className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the mine register"
              className="field h-11 pl-10"
            />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link
            to="/notifications"
            className="eco-icon-btn relative"
            aria-label={unread ? `${unread} unread notifications` : 'Notifications'}
          >
            <BellGlyph size={20} />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[11px] font-semibold tabular text-white">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors duration-300 ease-primary hover:bg-surface-container"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed text-[12px] font-bold text-ink">
                {initials(user.first_name, user.last_name)}
              </span>
              <span className="hidden text-left lg:block">
                <span className="block text-[13px] font-semibold leading-tight text-ink">
                  {fullName(user)}
                </span>
                <span className="eyebrow block leading-tight">{ROLE_LABELS[user.role]}</span>
              </span>
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-64 rounded-card border border-line bg-card p-2 shadow-modal"
              >
                <div className="border-b border-line px-3 pb-3 pt-2">
                  <p className="text-[14px] font-semibold text-ink">{fullName(user)}</p>
                  <p className="eyebrow mt-1">{user.email}</p>
                </div>

                <Link
                  to="/notifications"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 flex items-center justify-between rounded-xl px-3 py-2.5 text-[14px] text-ink transition-colors duration-200 hover:bg-surface-container"
                >
                  Notifications
                  {unread > 0 && <span className="eco-chip eco-chip--danger">{unread}</span>}
                </Link>

                <button
                  type="button"
                  role="menuitem"
                  onClick={onSignOut}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[14px] text-dangerText transition-colors duration-200 hover:bg-surface-container"
                >
                  <LogOutGlyph size={16} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll-progress hairline, pinned to the header's bottom edge. */}
      <div className="relative h-px w-full bg-line">
        <div
          className="absolute inset-y-0 left-0 bg-primary transition-transform duration-150 ease-linear"
          style={{ transform: `scaleX(${progress})`, transformOrigin: 'left center' }}
        />
      </div>
    </header>
  )
}