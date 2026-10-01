/* ============================================================================
   SIDEBAR, the left rail.

   Built on the reference's Material 3 navigation pattern: a quiet list of
   tonal pills that fill green when active. The reference has no sidebar (it
   uses a glass top bar and a bottom nav), but CoaliZEN has fifteen routes and
   five role tiers, which needs a persistent rail on desktop. The visual
   language is the same as its nav rows.
   ========================================================================== */

import { Link, useLocation, useNavigate } from 'react-router-dom'
import { navForRole, type NavGroup } from '@/lib/roles'
import { ROLE_SHORT } from '@/lib/types'
// @ts-ignore
import BranchedMenu from './BranchedMenu'
import { ShieldGlyph } from '@/components/primitives/icons'
import type { Role } from '@/lib/types'
import { 
  CursorPointer01Icon, 
  Layers01Icon, 
  Notification03Icon, 
  Settings02Icon, 
  PaintBoardIcon 
} from '@hugeicons/core-free-icons'

export function Sidebar({
  role,
  counts,
  onNavigate,
  footer,
}: {
  role: Role
  counts?: Partial<Record<string, number>>
  onNavigate?: () => void
  footer?: React.ReactNode
}) {
  const groups: NavGroup[] = navForRole(role)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <div className="flex h-full flex-col bg-surface-low">
      <div className="flex items-center px-6 pb-7 pt-7">
        <Link to="/" className="flex items-center gap-2.5" onClick={onNavigate} aria-label="CoaliZEN home">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-pill"
          >
            <ShieldGlyph className="h-5 w-5" />
          </span>
          <span className="font-display text-[19px] font-bold tracking-tight text-primary">CoaliZEN</span>
        </Link>
      </div>

      <nav aria-label="Main" className="min-h-0 flex-1 overflow-y-auto px-1 pb-6">
        <BranchedMenu
          items={groups.map(group => ({
            label: group.title,
            children: group.items.map(item => ({
              value: item.to,
              label: item.label + (counts?.[item.key] ? ` (${counts[item.key]})` : ''),
              // Optional: You can map icons based on item.key if desired
              icon: item.key.includes('dashboard') ? PaintBoardIcon :
                    item.key.includes('notification') ? Notification03Icon :
                    item.key.includes('mine') ? Layers01Icon :
                    item.key.includes('setting') ? Settings02Icon :
                    CursorPointer01Icon
            }))
          }))}
          defaultOpen={groups.map((_, i) => i)}
          defaultActive={pathname}
          onSelect={(value: string) => {
            navigate(value)
            if (onNavigate) onNavigate()
          }}
          color="#181d18"
          accentColor="#963a14"
          lineColor="#e0e4dd"
          width={272}
          rowHeight={38}
          indent={36}
          trunk={14}
          radius={12}
          lineWidth={1.5}
          fontSize={15}
          drawDuration={300}
          foldDuration={300}
        />
      </nav>

      <div className="border-t border-line px-6 py-5">
        <p className="eyebrow">
          Signed in as <span className="text-ink">{ROLE_SHORT[role]}</span>
        </p>
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </div>
  )
}