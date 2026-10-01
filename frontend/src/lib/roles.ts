/* ============================================================================
   Roles & permissions, a single source of truth mirroring the role ladders
   that are currently duplicated six times across `mines/views.py` and
   `accounts/views.py`.

   Backend truth:
     mine_list / mine_create / mine_edit / mine_delete  -> ADMIN, MANAGER
     mine_detail / mine_map / *_list / *_detail        -> ADMIN, MANAGER,
                                                          INSPECTOR, SAFETY_OFFICER,
                                                          REGULATOR
     compliance_create                                  -> ADMIN, MANAGER
     inspection_create                                  -> ADMIN, MANAGER
     violation_create                                   -> ADMIN, MANAGER, INSPECTOR
     contractor_create / document_create               -> ADMIN, MANAGER
     audit_logs                                         -> ADMIN
   ========================================================================== */

import type { Role } from './types'
import { ROLES } from './types'

/** Can open the mine registry at all. */
export const CAN_VIEW_MINES: Role[] = ['ADMIN', 'MANAGER', 'INSPECTOR', 'SAFETY_OFFICER', 'REGULATOR']

/** Can create / edit / delete mines. */
export const CAN_MANAGE_MINES: Role[] = ['ADMIN', 'MANAGER']

export const CAN_VIEW_COMPLIANCE: Role[] = [...CAN_VIEW_MINES]
export const CAN_MANAGE_COMPLIANCE: Role[] = ['ADMIN', 'MANAGER']

export const CAN_VIEW_INSPECTIONS: Role[] = [...CAN_VIEW_MINES]
export const CAN_MANAGE_INSPECTIONS: Role[] = ['ADMIN', 'MANAGER']

export const CAN_VIEW_VIOLATIONS: Role[] = [...CAN_VIEW_MINES]
export const CAN_MANAGE_VIOLATIONS: Role[] = ['ADMIN', 'MANAGER', 'INSPECTOR']

export const CAN_VIEW_CONTRACTORS: Role[] = [...CAN_VIEW_MINES]
export const CAN_MANAGE_CONTRACTORS: Role[] = ['ADMIN', 'MANAGER']

/**
 * Contractor and mine compliance documents. Reading them follows the register;
 * writing them is restricted, because an uploaded document is evidence in an
 * audit and must not be editable by an inspector.
 */
export const CAN_MANAGE_DOCUMENTS: Role[] = ['ADMIN', 'MANAGER']

export const CAN_VIEW_RISK: Role[] = [...CAN_VIEW_MINES]
export const CAN_VIEW_ANALYTICS: Role[] = [...CAN_VIEW_MINES]
export const CAN_VIEW_AUDIT: Role[] = ['ADMIN']

/** The AI assistant reads operational aggregates, which contractors must not see. */
export const CAN_USE_ASSISTANT: Role[] = ['ADMIN', 'MANAGER', 'INSPECTOR', 'SAFETY_OFFICER', 'REGULATOR']

export function hasRole(userRole: Role | null | undefined, allowed: Role[]): boolean {
  return !!userRole && allowed.includes(userRole)
}

export const HOME_FOR_ROLE: Record<Role, string> = {
  ADMIN: '/dashboard/admin',
  MANAGER: '/dashboard/manager',
  INSPECTOR: '/dashboard/inspector',
  SAFETY_OFFICER: '/dashboard/safety',
  CONTRACTOR: '/dashboard/contractor',
  REGULATOR: '/dashboard/regulator',
}

export interface NavItem {
  /** Stable identifier, used for badge lookups (`Sidebar` counts). */
  key: string
  label: string
  to: string
  roles: Role[]
  /** bullet-joined metadata, lusion style: `concept • web • 3d` */
  meta?: string
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { key: 'dashboard', label: 'Command Centre', to: '/dashboard', roles: [...ROLES] },
      { key: 'risk', label: 'Risk Intelligence', to: '/risk', roles: CAN_VIEW_RISK, meta: 'rules • ml • ai' },
      { key: 'analytics', label: 'Analytics', to: '/analytics', roles: CAN_VIEW_ANALYTICS, meta: 'fleet • compliance' },
      { key: 'mines', label: 'Mine Network', to: '/mines', roles: CAN_VIEW_MINES, meta: 'registry • geospatial' },
    ],
  },
  {
    title: 'Assurance',
    items: [
      { key: 'inspections', label: 'Inspections', to: '/inspections', roles: CAN_VIEW_INSPECTIONS, meta: 'routine • surprise' },
      { key: 'violations', label: 'Violations', to: '/violations', roles: CAN_VIEW_VIOLATIONS, meta: 'severity graded' },
      { key: 'compliance', label: 'Compliance', to: '/compliance', roles: CAN_VIEW_COMPLIANCE, meta: 'due • overdue' },
    ],
  },
  {
    title: 'Third Parties',
    items: [
      { key: 'contractors', label: 'Contractors', to: '/contractors', roles: CAN_VIEW_CONTRACTORS, meta: 'licence • insurance' },
      { key: 'audit', label: 'Audit Trail', to: '/audit', roles: CAN_VIEW_AUDIT, meta: 'immutable' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { key: 'assistant', label: 'AI Assistant', to: '/assistant', roles: CAN_USE_ASSISTANT, meta: 'natural language' },
      { key: 'notifications', label: 'Notifications', to: '/notifications', roles: [...ROLES], meta: 'alerts' },
    ],
  },
]

export function navForRole(role: Role): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0)
}

/** Flat list used by the header's scroll-to menu. */
export function flatNavForRole(role: Role): NavItem[] {
  return NAV_GROUPS.flatMap((g) => g.items).filter((item) => item.roles.includes(role))
}

export const DEMO_LOGINS: { role: Role; username: string; password: string; label: string }[] = [
  { role: 'ADMIN', username: 'admin', password: 'admin123', label: 'Administrator' },
  { role: 'MANAGER', username: 'manager1', password: 'manager123', label: 'Mine Manager' },
  { role: 'INSPECTOR', username: 'inspector1', password: 'inspector123', label: 'Inspector' },
  { role: 'SAFETY_OFFICER', username: 'safety1', password: 'safety123', label: 'Safety Officer' },
  { role: 'CONTRACTOR', username: 'contractor1', password: 'contractor123', label: 'Contractor' },
  { role: 'REGULATOR', username: 'regulator1', password: 'regulator123', label: 'Regulator' },
]
