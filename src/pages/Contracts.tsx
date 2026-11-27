import { Upload, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import ContractTable from '../components/ContractTable'
import { Empty, formatMoney } from '../components/ui'
import { type DictKey, useT } from '../i18n'
import { canManageContracts, contractStatus, type ContractStatus, paidPercent, useMe, useStore } from '../store'
import type { Contract, ContractKind } from '../types'

type Filter = 'all' | ContractStatus

export default function Contracts() {
  const { t, lang, tx } = useT()
  const me = useMe()
  const contracts = useStore((s) => s.contracts)
  const projects = useStore((s) => s.projects)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [projectId, setProjectId] = useState('')
  const [kind, setKind] = useState<ContractKind | ''>('')

  if (!canManageContracts(me)) return <Empty text={t('contractsOnly')} />

  const q = query.trim().toLowerCase()
  const base = contracts.filter((c) => {
    const p = projects.find((x) => x.id === c.projectId)
    return (
      (!q || [c.number, c.title, tx(c.title), p?.name, p?.client, p && tx(p.name), p && tx(p.client)].some((v) => v?.toLowerCase().includes(q))) &&
      (!projectId || c.projectId === projectId) &&
      (!kind || c.kind === kind)
    )
  })
  const match = (c: Contract, f: Filter) => f === 'all' || contractStatus(c) === f
  const filters: Filter[] = ['all', 'active', 'expiring', 'expired']
  const label = (f: Filter) => t((f === 'all' ? 'all' : `cs_${f}`) as DictKey)

  const value = base.reduce((s, c) => s + c.value, 0)
  const collected = base.reduce((s, c) => s + (c.value * paidPercent(c)) / 100, 0)
  const share = value ? (collected / value) * 100 : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-bold">{t('contracts')} <span className="text-sm font-normal text-slate-400">({contracts.length})</span></h1>
          <p className="text-xs text-slate-500">{t('contractsHint')}</p>
        </div>
        <Link to="/contracts/new" className="btn-primary"><Upload className="size-4" /> {t('uploadContract')}</Link>
      </div>

      <div className="card space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <div className="text-xs text-slate-500">{t('totalValue')} ({base.length})</div>
            <div className="text-2xl font-bold text-teal-800">{formatMoney(value, lang)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">{t('collected')}</div>
            <div className="text-2xl font-bold text-emerald-700">{formatMoney(collected, lang)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">{t('outstanding')}</div>
            <div className="text-2xl font-bold text-slate-700">{formatMoney(value - collected, lang)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${share}%` }} />
          </div>
          <span className="text-xs font-bold text-emerald-700">{Math.round(share)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        <div className="relative col-span-2 md:col-span-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input !ps-9" placeholder={t('searchContracts')} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">{t('allProjects')}</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {tx(p.name)}</option>)}
        </select>
        <select className="input" value={kind} onChange={(e) => setKind(e.target.value as ContractKind | '')}>
          <option value="">{t('allTypes')}</option>
          {(['design', 'supervision', 'addendum'] as const).map((x) => <option key={x} value={x}>{t(`ck_${x}`)}</option>)}
        </select>
      </div>

      <div className="-mx-4 flex gap-2 no-scrollbar overflow-x-auto px-4 pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${filter === f ? 'bg-teal-700 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
          >
            {label(f)} ({base.filter((c) => match(c, f)).length})
          </button>
        ))}
      </div>

      <ContractTable items={base.filter((c) => match(c, filter))} />
    </div>
  )
}
