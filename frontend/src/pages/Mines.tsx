/* ============================================================================
   MINE NETWORK — the register. Mirrors `mines/mine_list.html` plus the
   geospatial view. Registration is role-gated to admin and mine managers, which
   is enforced twice: `can()` hides the affordance and `api.guard()` rejects
   the write.
   ========================================================================== */

import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAsync, useDebounced } from '@/hooks/useAsync'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { CAN_MANAGE_MINES } from '@/lib/roles'
import { formatCompact, formatNumber } from '@/lib/format'
import type { Mine } from '@/lib/types'
import { MINE_STATUSES, MINE_STATUS_LABELS } from '@/lib/types'
import { FilterRail, ScreenBody, ScreenHeader, type FilterDef } from '@/components/layout/Screen'
import { DataTable, RISK_STYLE, RiskTag, StatCard, StatusPill, type Column } from '@/components/data/Data'
import { RiskGauge } from '@/components/charts/Charts'
import { PillButton } from '@/components/primitives/Pill'
import { Dot } from '@/components/primitives/Sticker'
import { Field, Select, Sheet } from '@/components/forms/Sheet'
import { useSheetForm } from '@/components/forms/useSheetForm'

type ViewMode = 'table' | 'map'

/** The editable slice of a mine. Everything else is derived server-side. */
interface MineForm {
  name: string
  mine_code: string
  subsidiary: string
  location: string
  district: string
  state: string
  latitude: string
  longitude: string
  production_capacity: string
  status: Mine['status']
}

const BLANK_MINE: MineForm = {
  name: '',
  mine_code: '',
  subsidiary: 'CCL',
  location: '',
  district: '',
  state: 'Jharkhand',
  latitude: '',
  longitude: '',
  production_capacity: '',
  status: 'ACTIVE',
}

const STATES = [
  'Jharkhand',
  'Odisha',
  'Chhattisgarh',
  'West Bengal',
  'Karnataka',
  'Telangana',
  'Madhya Pradesh',
  'Maharashtra',
  'Assam',
]

function validateMine(form: MineForm): string | null {
  if (!form.name.trim()) return 'A mine needs a name.'
  if (!form.mine_code.trim()) return 'A mine needs a unique code.'
  if (!form.location.trim()) return 'A mine needs a location.'
  const lat = Number(form.latitude)
  const lon = Number(form.longitude)
  if (form.latitude && (Number.isNaN(lat) || lat < -90 || lat > 90)) return 'Latitude must be between -90 and 90.'
  if (form.longitude && (Number.isNaN(lon) || lon < -180 || lon > 180)) return 'Longitude must be between -180 and 180.'
  if (form.production_capacity && Number.isNaN(Number(form.production_capacity))) {
    return 'Capacity must be a number.'
  }
  return null
}

export function Mines() {
  const { can } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [mode, setMode] = useState<ViewMode>('table')
  const editor = useSheetForm<MineForm>(BLANK_MINE)
  const manageable = can(CAN_MANAGE_MINES)

  const filters = useMemo(
    () => ({
      q: params.get('q') ?? '',
      status: params.get('status') ?? '',
      subsidiary: params.get('subsidiary') ?? '',
      state: params.get('state') ?? '',
    }),
    [params],
  )

  const debouncedQ = useDebounced(filters.q, 250)

  const state = useAsync(() => api.listMines(), [])

  const all = state.data ?? []

  const subsidiaries = useMemo(
    () => [...new Set(all.map((m) => m.subsidiary))].sort(),
    [all],
  )
  const states = useMemo(() => [...new Set(all.map((m) => m.state))].sort(), [all])

  const rows = useMemo(
    () =>
      all.filter((m) => {
        if (filters.status && m.status !== filters.status) return false
        if (filters.subsidiary && m.subsidiary !== filters.subsidiary) return false
        if (filters.state && m.state !== filters.state) return false
        if (debouncedQ) {
          const needle = debouncedQ.toLowerCase()
          const hay = `${m.name} ${m.mine_code} ${m.location} ${m.district} ${m.state}`.toLowerCase()
          if (!hay.includes(needle)) return false
        }
        return true
      }),
    [all, filters.status, filters.subsidiary, filters.state, debouncedQ],
  )

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  function reset() {
    setParams(new URLSearchParams(), { replace: true })
  }

  const filterDefs: FilterDef[] = [
    { key: 'q', label: 'Search', kind: 'search', options: [] },
    { key: 'status', label: 'Status', options: MINE_STATUSES.map((s) => ({ value: s, label: MINE_STATUS_LABELS[s] })) },
    { key: 'subsidiary', label: 'Subsidiary', options: subsidiaries.map((s) => ({ value: s, label: s })) },
    { key: 'state', label: 'State', options: states.map((s) => ({ value: s, label: s })) },
  ]

  const columns: Column<Mine>[] = [
    {
      key: 'name',
      header: 'Mine',
      render: (m) => (
        <div className="min-w-0">
          <p className="truncate text-[15px]">{m.name}</p>
          <p className="eyebrow ink-40 mt-1 truncate">
            {m.mine_code} · {m.location}, {m.state}
          </p>
        </div>
      ),
    },
    { key: 'subsidiary', header: 'Subsidiary', hideBelow: 'md', render: (m) => m.subsidiary },
    {
      key: 'status',
      header: 'Status',
      render: (m) => (
        <StatusPill
          label={MINE_STATUS_LABELS[m.status]}
          tone={m.status === 'ACTIVE' ? 'positive' : m.status === 'MAINTENANCE' ? 'warn' : 'neutral'}
        />
      ),
    },
    {
      key: 'capacity',
      header: 'Capacity',
      align: 'right',
      hideBelow: 'lg',
      render: (m) => <span className="text-[14px]">{formatCompact(m.production_capacity)} t</span>,
    },
    {
      key: 'manager',
      header: 'Manager',
      hideBelow: 'lg',
      render: (m) => <span className="text-[14px]">{m.manager_name ?? '—'}</span>,
    },
    {
      key: 'risk',
      header: 'Risk',
      align: 'right',
      render: (m) => (
        <div className="flex items-center justify-end gap-3">
          <span className="hidden sm:block">
            <RiskGauge score={Number(m.risk_score)} level={m.risk_level} size={44} />
          </span>
          <RiskTag level={m.risk_level} />
        </div>
      ),
    },
    ...(manageable
      ? [
          {
            key: 'edit',
            header: '',
            align: 'right' as const,
            render: (m: Mine) => (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  editor.openEdit(m, mineToForm(m))
                }}
                className="eyebrow ink-50 hover:text-ink"
              >
                Edit
              </button>
            ),
          },
        ]
      : []),
  ]

  const stats = useMemo(() => {
    const active = all.filter((m) => m.status === 'ACTIVE').length
    const capacity = all.reduce((s, m) => s + Number(m.production_capacity), 0)
    const flagged = all.filter((m) => m.risk_level === 'HIGH' || m.risk_level === 'CRITICAL').length
    return { active, capacity, flagged, total: all.length }
  }, [all])

  return (
    <>
      <ScreenHeader
        eyebrow="Mine network · registry"
        titleLines={['Every mine,', 'one register.']}
        lede="Geospatial, operational and compliance state for every Coal India subsidiary holding a mining lease."
        actions={
          manageable ? (
            <PillButton variant="filled" onClick={() => editor.openCreate()}>
              Register mine
            </PillButton>
          ) : undefined
        }
      />

      <div className="grid gap-4 py-8 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Registered mines" value={stats.total} meta={`${stats.active} in production`} />
        <StatCard index={1} label="Combined capacity" value={Math.round(stats.capacity / 1e6)} suffix="Mt" meta="Annual rated production capacity" />
        <StatCard index={2} label="Elevated risk" value={stats.flagged} meta="Rated high or critical" tone={stats.flagged ? 'inverse' : 'default'} to="/risk" />
        <StatCard index={3} label="Subsidiaries" value={subsidiaries.length} meta={subsidiaries.join(' · ')} />
      </div>

      <FilterRail
        filters={filterDefs}
        values={filters}
        onChange={setFilter}
        onReset={reset}
        resultCount={rows.length}
        totalCount={all.length}
      />

      <div className="flex items-center justify-between gap-4 py-5">
        <p className="eyebrow ink-40">View</p>
        <div className="flex gap-2">
          {(['table', 'map'] as ViewMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`pill-tag ${mode === m ? 'pill-tag--active' : ''}`}
              aria-pressed={mode === m}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <ScreenBody
        loading={state.initialLoading}
        error={state.error}
        onRetry={state.reload}
        isEmpty={rows.length === 0}
        emptyMessage="No mines match the current filters."
      >
        {mode === 'table' ? (
          <DataTable columns={columns} rows={rows} onRowClick={(m) => navigate(`/mines/${m.id}`)} />
        ) : (
          <MineMap mines={rows} onSelect={(m) => navigate(`/mines/${m.id}`)} />
        )}
      </ScreenBody>

      {editor.sheet && (
        <Sheet
          open
          eyebrow={editor.sheet.mode === 'create' ? 'Mine network' : 'Mine network · edit'}
          title={editor.sheet.mode === 'create' ? 'Register a mine' : `Edit ${editor.sheet.form.name}`}
          onClose={editor.close}
          submitLabel={editor.sheet.mode === 'create' ? 'Register' : 'Save changes'}
          error={editor.sheet.error}
          deleting={
            editor.sheet.mode === 'edit' && editor.sheet.row
              ? {
                  label: 'Deregister',
                  onDelete: () => {
                    const id = editor.sheet?.row?.id
                    if (id == null) return
                    // Routed through the same submit path so a failed delete
                    // reports its reason instead of closing the sheet silently.
                    void editor.submit(
                      () => null,
                      async () => {
                        await api.deleteMine(id)
                        state.reload()
                      },
                    )
                  },
                }
              : undefined
          }
          onSubmit={() =>
            void editor.submit(validateMine, async (form) => {
              const id = editor.sheet?.row?.id
              if (id != null) {
                await api.updateMine(id, form as unknown as Partial<Mine>)
              } else {
                await api.createMine(form as unknown as Mine)
              }
              state.reload()
            })
          }
        >
          <div className="space-y-5">
            <Field
              label="Mine name"
              required
              value={editor.sheet.form.name}
              onChange={(e) => editor.patch({ name: e.target.value })}
              placeholder="Jharia Colliery"
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Mine code"
                required
                value={editor.sheet.form.mine_code}
                onChange={(e) => editor.patch({ mine_code: e.target.value })}
                placeholder="CCL-JHA-01"
              />
              <Select
                label="Subsidiary"
                value={editor.sheet.form.subsidiary}
                onChange={(e) => editor.patch({ subsidiary: e.target.value })}
                options={subsidiaries.map((s) => ({ value: s, label: s }))}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Location"
                required
                value={editor.sheet.form.location}
                onChange={(e) => editor.patch({ location: e.target.value })}
                placeholder="Dhanbad"
              />
              <Field
                label="District"
                value={editor.sheet.form.district}
                onChange={(e) => editor.patch({ district: e.target.value })}
                placeholder="Dhanbad"
              />
            </div>

            <Select
              label="State"
              value={editor.sheet.form.state}
              onChange={(e) => editor.patch({ state: e.target.value })}
              options={STATES.map((s) => ({ value: s, label: s }))}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Latitude"
                inputMode="decimal"
                value={editor.sheet.form.latitude}
                onChange={(e) => editor.patch({ latitude: e.target.value })}
                placeholder="23.7975"
                hint="WGS84 decimal degrees"
              />
              <Field
                label="Longitude"
                inputMode="decimal"
                value={editor.sheet.form.longitude}
                onChange={(e) => editor.patch({ longitude: e.target.value })}
                placeholder="86.4304"
                hint="WGS84 decimal degrees"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Rated capacity"
                inputMode="numeric"
                value={editor.sheet.form.production_capacity}
                onChange={(e) => editor.patch({ production_capacity: e.target.value })}
                placeholder="1500000"
                hint="Tonnes per annum"
              />
              <Select
                label="Status"
                value={editor.sheet.form.status}
                onChange={(e) => editor.patch({ status: e.target.value as Mine['status'] })}
                options={MINE_STATUSES.map((s) => ({ value: s, label: MINE_STATUS_LABELS[s] }))}
              />
            </div>

            <p className="border-t border-line pt-5 text-[13px] ink-50">
              Risk is not entered by hand. The score and band are recalculated from the records
              attached to this mine whenever it is saved.
            </p>
          </div>
        </Sheet>
      )}
    </>
  )
}

function mineToForm(m: Mine): MineForm {
  return {
    name: m.name,
    mine_code: m.mine_code,
    subsidiary: m.subsidiary,
    location: m.location,
    district: m.district,
    state: m.state,
    latitude: m.latitude ?? '',
    longitude: m.longitude ?? '',
    production_capacity: m.production_capacity ?? '',
    status: m.status,
  }
}

/* ------------------------------------------------------------------- map */

/**
 * Equirectangular plot of India with every mine positioned by its real
 * coordinates. Drawn as SVG rather than pulled from a map library: it costs no
 * dependency, no API key and no network call, and the bounding box of the
 * coal belt fits one hand-tuned view.
 */
function MineMap({ mines, onSelect }: { mines: Mine[]; onSelect: (m: Mine) => void }) {
  const W = 1000
  const H = 1160

  // Rough bounding box of the coal belt (Jharkhand → Maharashtra, Odisha → MP).
  const bounds = { minLat: 17.5, maxLat: 25.8, minLon: 77.0, maxLon: 88.5 }

  function project(lat: number, lon: number) {
    const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * W
    const y = H - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * H
    return { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 }
  }

  const highest = Math.max(1, ...mines.map((m) => Number(m.risk_score)))

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card p-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Mine locations by risk level">
        {/* graticule */}
        {[0.25, 0.5, 0.75].map((f) => (
          <g key={f} stroke="rgba(0,0,0,0.06)" strokeWidth="1">
            <line x1={W * f} y1="0" x2={W * f} y2={H} />
            <line x1="0" y1={H * f} x2={W} y2={H * f} />
          </g>
        ))}

        {mines.map((m) => {
          const { x, y } = project(Number(m.latitude), Number(m.longitude))
          const r = 6 + (Number(m.risk_score) / highest) * 22
          return (
            <g
              key={m.id}
              onClick={() => onSelect(m)}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect(m)
              }}
            >
              <title>{`${m.name} — risk ${m.risk_score} (${m.risk_level})`}</title>
              <circle cx={x} cy={y} r={r + 6} fill={RISK_STYLE[m.risk_level].fg} opacity="0.12" />
              <circle cx={x} cy={y} r={r} fill={RISK_STYLE[m.risk_level].fg} opacity="0.9" />
            </g>
          )
        })}
      </svg>

      <div className="pointer-events-none absolute bottom-6 left-6 flex flex-wrap items-center gap-4">
        <Dot />
        <span className="eyebrow ink-50">Bubble size and colour both encode risk score</span>
      </div>

      <p className="eyebrow ink-40 mt-4">
        {formatNumber(mines.length)} sites plotted · WGS84 · {bounds.minLat}°–{bounds.maxLat}° N
      </p>
    </div>
  )
}