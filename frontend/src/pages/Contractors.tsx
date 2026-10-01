/* ============================================================================
   CONTRACTORS, mirrors `mines/contractor_list.html`,
   `contractor_detail.html` and `contractor_form.html`.

   The point of this screen in the product is document currency: an expired
   contractor document is one of the four inputs to the risk score, so expiry is
   surfaced as a first-class column rather than buried in a detail view.
   ========================================================================== */

import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAsync, useDebounced } from '@/hooks/useAsync'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { CAN_MANAGE_CONTRACTORS } from '@/lib/roles'
import { formatDate, relativeDays } from '@/lib/format'
import type { Contractor, ContractorStatus } from '@/lib/types'
import {
  CONTRACTOR_STATUS_LABELS,
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
} from '@/lib/types'
import { FilterRail, ScreenBody, ScreenHeader, type FilterDef } from '@/components/layout/Screen'
import {
  DataTable,
  DocumentTag,
  Panel,
  StatCard,
  StatusPill,
  type Column,
} from '@/components/data/Data'
import { BarSeries } from '@/components/charts/Charts'
import { PillButton } from '@/components/primitives/Pill'
import { Field, Select, Sheet, TextArea } from '@/components/forms/Sheet'
import { useSheetForm } from '@/components/forms/useSheetForm'

interface ContractorForm {
  company_name: string
  contractor_code: string
  contact_person: string
  phone: string
  email: string
  address: string
  mine: string
  work_description: string
  start_date: string
  end_date: string
  status: Contractor['status']
}

const BLANK: ContractorForm = {
  company_name: '',
  contractor_code: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  mine: '',
  work_description: '',
  start_date: '',
  end_date: '',
  status: 'ACTIVE',
}

function validate(form: ContractorForm): string | null {
  if (!form.company_name.trim()) return 'Name the contracting company.'
  if (!form.contractor_code.trim()) return 'A contractor needs a unique code.'
  if (!form.mine) return 'Choose the mine this contractor works at.'
  if (!form.start_date) return 'Record the engagement start date.'
  if (form.end_date && form.end_date < form.start_date) {
    return 'The end date cannot fall before the start date.'
  }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    return 'That email address does not look valid.'
  }
  return null
}

const STATUS_TONE: Record<ContractorStatus, 'positive' | 'neutral' | 'critical'> = {
  ACTIVE: 'positive',
  INACTIVE: 'neutral',
  SUSPENDED: 'critical',
}

export function Contractors() {
  const { can } = useAuth()
  const [params, setParams] = useSearchParams()
  const [openId, setOpenId] = useState<number | null>(null)
  const editor = useSheetForm<ContractorForm>(BLANK)
  const editable = can(CAN_MANAGE_CONTRACTORS)
  const mines = useAsync(() => api.listMines(), [])

  const filters = useMemo(
    () => ({
      q: params.get('q') ?? '',
      status: params.get('status') ?? '',
    }),
    [params],
  )

  const debouncedQ = useDebounced(filters.q, 250)
  const state = useAsync(() => api.listContractors(), [])
  const all = state.data ?? []

  const rows = useMemo(
    () =>
      all.filter((c) => {
        if (filters.status && c.status !== filters.status) return false
        if (debouncedQ) {
          const hay = `${c.name} ${c.company_name} ${c.contact_person} ${c.mine_name} ${c.contractor_code}`.toLowerCase()
          if (!hay.includes(debouncedQ.toLowerCase())) return false
        }
        return true
      }),
    [all, filters.status, debouncedQ],
  )

  const openIdContractor = openId != null ? all.find((c) => c.id === openId) ?? null : null

  const documents = useAsync(
    () => (openId != null ? api.listDocuments({ contractor: openId }) : Promise.resolve([])),
    [openId],
    { enabled: openId != null },
  )

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const stats = useMemo(() => {
    const active = all.filter((c) => c.status === 'ACTIVE').length
    const flagged = all.filter((c) => c.expiring_document_count > 0).length
    const totalDocs = all.reduce((s, c) => s + c.document_count, 0)
    return { active, flagged, totalDocs, total: all.length }
  }, [all])

  const docSeries = useMemo(() => {
    const docs = documents.data ?? []
    return DOCUMENT_TYPES.map((t) => ({
      label: DOCUMENT_TYPE_LABELS[t],
      value: docs.filter((d) => d.document_type === t).length,
    }))
  }, [documents.data])

  const filterDefs: FilterDef[] = [
    { key: 'q', label: 'Search', kind: 'search', options: [] },
    {
      key: 'status',
      label: 'Status',
      options: (Object.keys(CONTRACTOR_STATUS_LABELS) as ContractorStatus[]).map((s) => ({
        value: s,
        label: CONTRACTOR_STATUS_LABELS[s],
      })),
    },
  ]

  const columns: Column<Contractor>[] = [
    {
      key: 'company',
      header: 'Contractor',
      render: (c) => (
        <div className="min-w-0">
          <p className="truncate text-[15px]">{c.company_name}</p>
          <p className="eyebrow ink-40 mt-1 truncate">
            {c.contractor_code} · {c.contact_person}
          </p>
        </div>
      ),
    },
    { key: 'mine', header: 'Mine', hideBelow: 'md', render: (c) => <span className="text-[14px]">{c.mine_name}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (c) => <StatusPill label={CONTRACTOR_STATUS_LABELS[c.status]} tone={STATUS_TONE[c.status]} />,
    },
    {
      key: 'documents',
      header: 'Documents',
      align: 'right',
      hideBelow: 'sm',
      render: (c) => (
        <span className="text-[14px] tabular">
          {c.document_count}
          {c.expiring_document_count > 0 && (
            <span className="ml-2 text-dangerText">({c.expiring_document_count} flagged)</span>
          )}
        </span>
      ),
    },
    {
      key: 'end',
      header: 'Ends',
      align: 'right',
      hideBelow: 'lg',
      render: (c) => <span className="text-[14px]">{c.end_date ? relativeDays(c.end_date) : 'Open'}</span>,
    },
    ...(editable
      ? [
          {
            key: 'edit',
            header: '',
            align: 'right' as const,
            render: (c: Contractor) => (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenId(null)
                  editor.openEdit(c, contractorToForm(c))
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

  return (
    <>
      <ScreenHeader
        eyebrow="Contractors · third parties"
        titleLines={['Licence, insurance,', 'always current.']}
        lede="Contractor engagement is only as safe as its paperwork. Every document carries an expiry date, and every expiry is a risk input."
        actions={
          editable ? (
            <PillButton variant="filled" onClick={() => editor.openCreate()}>
              Register contractor
            </PillButton>
          ) : undefined
        }
      />

      <div className="grid gap-4 py-8 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Engaged" value={stats.active} meta={`${stats.total} registered`} />
        <StatCard index={1} label="Documents on file" value={stats.totalDocs} meta="Across all contractors" />
        <StatCard index={2} label="Flagged for renewal" value={stats.flagged} tone={stats.flagged ? 'inverse' : 'default'} meta="Expired or expiring within 30 days" />
        <StatCard index={3} label="Mine partners" value={new Set(all.map((c) => c.mine)).size} meta="Distinct mines with contractors" />
      </div>

      <FilterRail
        filters={filterDefs}
        values={filters}
        onChange={setFilter}
        onReset={() => setParams(new URLSearchParams(), { replace: true })}
        resultCount={rows.length}
        totalCount={all.length}
      />

      <ScreenBody
        loading={state.initialLoading}
        error={state.error}
        onRetry={state.reload}
        isEmpty={rows.length === 0}
        emptyMessage="No contractors match the current filters."
      >
        <DataTable
          columns={columns}
          rows={rows}
          onRowClick={(c) => setOpenId(openId === c.id ? null : c.id)}
        />
      </ScreenBody>

      {editor.sheet && (
        <Sheet
          open
          eyebrow={editor.sheet.mode === 'create' ? 'Contractors' : 'Contractors · edit'}
          title={editor.sheet.mode === 'create' ? 'Register a contractor' : 'Edit contractor'}
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
                    void editor.submit(
                      () => null,
                      async () => {
                        await api.deleteContractor(id)
                        state.reload()
                      },
                    )
                  },
                }
              : undefined
          }
          onSubmit={() =>
            void editor.submit(validate, async (form) => {
              const id = editor.sheet?.row?.id
              const payload = {
                company_name: form.company_name.trim(),
                contractor_code: form.contractor_code.trim(),
                contact_person: form.contact_person.trim(),
                phone: form.phone.trim(),
                email: form.email.trim(),
                address: form.address.trim(),
                mine: Number(form.mine),
                work_description: form.work_description.trim(),
                start_date: form.start_date,
                end_date: form.end_date || null,
                status: form.status,
              }
              if (id != null) {
                await api.updateContractor(id, payload as unknown as Partial<Contractor>)
              } else {
                await api.createContractor(payload as unknown as Contractor)
              }
              state.reload()
            })
          }
        >
          <div className="space-y-5">
            <Field
              label="Company"
              required
              value={editor.sheet.form.company_name}
              onChange={(e) => editor.patch({ company_name: e.target.value })}
              placeholder="Bengal Pit Engineering"
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Contractor code"
                required
                value={editor.sheet.form.contractor_code}
                onChange={(e) => editor.patch({ contractor_code: e.target.value })}
                placeholder="BPE-0451"
              />
              <Select
                label="Mine"
                required
                value={editor.sheet.form.mine}
                onChange={(e) => editor.patch({ mine: e.target.value })}
                placeholder="Select a mine"
                options={(mines.data ?? []).map((m) => ({ value: String(m.id), label: m.name }))}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Contact person"
                value={editor.sheet.form.contact_person}
                onChange={(e) => editor.patch({ contact_person: e.target.value })}
              />
              <Field
                label="Phone"
                value={editor.sheet.form.phone}
                onChange={(e) => editor.patch({ phone: e.target.value })}
              />
            </div>

            <Field
              label="Email"
              type="email"
              value={editor.sheet.form.email}
              onChange={(e) => editor.patch({ email: e.target.value })}
            />
            <Field
              label="Address"
              value={editor.sheet.form.address}
              onChange={(e) => editor.patch({ address: e.target.value })}
            />

            <TextArea
              label="Scope of work"
              value={editor.sheet.form.work_description}
              onChange={(e) => editor.patch({ work_description: e.target.value })}
            />

            <div className="grid gap-5 sm:grid-cols-3">
              <Field
                label="Start date"
                type="date"
                required
                value={editor.sheet.form.start_date}
                onChange={(e) => editor.patch({ start_date: e.target.value })}
              />
              <Field
                label="End date"
                type="date"
                value={editor.sheet.form.end_date}
                onChange={(e) => editor.patch({ end_date: e.target.value })}
                hint="Leave blank for open-ended"
              />
              <Select
                label="Status"
                value={editor.sheet.form.status}
                onChange={(e) => editor.patch({ status: e.target.value as Contractor['status'] })}
                options={(['ACTIVE', 'INACTIVE', 'SUSPENDED'] as ContractorStatus[]).map((s) => ({
                  value: s,
                  label: CONTRACTOR_STATUS_LABELS[s],
                }))}
              />
            </div>

            <p className="border-t border-line pt-5 text-[13px] ink-50">
              Document counts are derived from the documents on file and are not editable here. An
              expired licence or insurance certificate feeds the mine risk score directly.
            </p>
          </div>
        </Sheet>
      )}

      {openIdContractor && (
        <ContractorDetail
          contractor={openIdContractor}
          documents={documents.data ?? []}
          loading={documents.initialLoading}
          docSeries={docSeries}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  )
}

function contractorToForm(c: Contractor): ContractorForm {
  return {
    company_name: c.company_name,
    contractor_code: c.contractor_code,
    contact_person: c.contact_person,
    phone: c.phone,
    email: c.email,
    address: c.address,
    mine: String(c.mine),
    work_description: c.work_description,
    start_date: c.start_date,
    end_date: c.end_date ?? '',
    status: c.status,
  }
}

function ContractorDetail({
  contractor,
  documents,
  loading,
  docSeries,
  onClose,
}: {
  contractor: Contractor
  documents: import('@/lib/types').ContractorDocument[]
  loading: boolean
  docSeries: { label: string; value: number }[]
  onClose: () => void
}) {
  return (
    <section className="mt-8 border-t border-line pt-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow ink-40">{contractor.contractor_code}</p>
          <h2 className="mt-3 text-d3 tighten-md font-normal">{contractor.company_name}</h2>
          <p className="mt-3 max-w-prose text-body ink-70">{contractor.work_description}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill label={CONTRACTOR_STATUS_LABELS[contractor.status]} tone={STATUS_TONE[contractor.status]} />
          <PillButton size="sm" variant="outline" onClick={onClose}>
            Close
          </PillButton>
        </div>
      </div>

      <div className="mt-9 grid gap-6 lg:grid-cols-12">
        <Panel title="Engagement" eyebrow="details" className="lg:col-span-5">
          <dl className="space-y-5">
            <Row label="Contact person" value={contractor.contact_person} />
            <Row label="Phone" value={contractor.phone} />
            <Row label="Email" value={contractor.email} />
            <Row label="Address" value={contractor.address} />
            <Row label="Mine" value={contractor.mine_name} />
            <Row label="Engaged from" value={formatDate(contractor.start_date)} />
            <Row label="Engaged until" value={contractor.end_date ? formatDate(contractor.end_date) : 'Open-ended'} />
          </dl>
        </Panel>

        <Panel
          title="Document register"
          eyebrow={`${documents.length} on file`}
          className="lg:col-span-7"
        >
          {loading ? (
            <p className="py-6 text-[14px] ink-50">Loading documents…</p>
          ) : documents.length === 0 ? (
            <p className="py-6 text-[14px] ink-50">No documents have been registered for this contractor.</p>
          ) : (
            <>
              <ul>
                {documents.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center gap-4 border-b border-line py-3.5 last:border-0">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px]">{DOCUMENT_TYPE_LABELS[d.document_type]}</span>
                      <span className="eyebrow ink-40 mt-1 block truncate">
                        {d.document_number} · {d.issuing_authority}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[14px]">{formatDate(d.expiry_date)}</span>
                      <span className="eyebrow ink-40 mt-1 block">{relativeDays(d.expiry_date)}</span>
                    </span>
                    <DocumentTag status={d.calculated_status} />
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <p className="eyebrow ink-40">By document type</p>
                <div className="mt-4">
                  <BarSeries data={docSeries} colorMode="mono" />
                </div>
              </div>
            </>
          )}
        </Panel>
      </div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-line pb-4 last:border-0 last:pb-0">
      <dt className="eyebrow ink-40">{label}</dt>
      <dd className="mt-1.5 text-[15px]">{value}</dd>
    </div>
  )
}