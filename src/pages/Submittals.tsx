import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import SubmittalTable from '../components/SubmittalTable'
import { type DictKey, useT } from '../i18n'
import { departments, reviewers } from '../seed'
import { submittalStatus, type SubmittalStatus, useMe, useStore } from '../store'
import type { Submittal, SubmittalType } from '../types'

type Filter = 'all' | 'pendingMyReview' | SubmittalStatus

export default function Submittals() {
  const { t, l, tx } = useT()
  const me = useMe()
  const submittals = useStore((s) => s.submittals)
  const projects = useStore((s) => s.projects)
  const isReviewer = reviewers().some((u) => u.id === me.id)

  const [filter, setFilter] = useState<Filter>(isReviewer ? 'pendingMyReview' : 'all')
  const [query, setQuery] = useState('')
  const [projectId, setProjectId] = useState('')
  const [deptId, setDeptId] = useState('')
  const [type, setType] = useState<SubmittalType | ''>('')

  const q = query.trim().toLowerCase()
  const base = submittals.filter(
    (s) =>
      (!q || s.number.toLowerCase().includes(q) || s.title.toLowerCase().includes(q) || tx(s.title).toLowerCase().includes(q)) &&
      (!projectId || s.projectId === projectId) &&
      (!deptId || s.departmentId === deptId) &&
      (!type || s.type === type),
  )
  const match = (s: Submittal, f: Filter) =>
    f === 'all' || (f === 'pendingMyReview' ? isReviewer && submittalStatus(s) === 'review' : submittalStatus(s) === f)
  const filters: Filter[] = [...(isReviewer ? (['pendingMyReview'] as const) : []), 'all', 'review', 'resubmit', 'approved', 'rejected']
  const label = (f: Filter) => t((f === 'all' || f === 'pendingMyReview' ? f : `ss_${f}`) as DictKey)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">{t('submittals')} <span className="text-sm font-normal text-slate-400">({submittals.length})</span></h1>
          <p className="text-xs text-slate-500">{t('reviewerHint')}</p>
        </div>
        {me.departmentId !== 'mgmt' && (
          <Link to="/submittals/new" className="btn-primary"><Plus className="size-4" /> {t('newSubmittal')}</Link>
        )}
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        <div className="relative md:col-span-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input !ps-9" placeholder={t('searchSubmittals')} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">{t('allProjects')}</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {tx(p.name)}</option>)}
        </select>
        <select className="input" value={deptId} onChange={(e) => setDeptId(e.target.value)}>
          <option value="">{t('allDepts')}</option>
          {departments.filter((d) => d.id !== 'mgmt').map((d) => <option key={d.id} value={d.id}>{l(d.name)}</option>)}
        </select>
        <select className="input" value={type} onChange={(e) => setType(e.target.value as SubmittalType | '')}>
          <option value="">{t('allTypes')}</option>
          {(['design', 'shop', 'material'] as const).map((x) => <option key={x} value={x}>{t(`st_${x}`)}</option>)}
        </select>
      </div>

      <div className="-mx-4 flex gap-2 no-scrollbar overflow-x-auto px-4 pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${filter === f ? 'bg-teal-700 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
          >
            {label(f)} ({base.filter((s) => match(s, f)).length})
          </button>
        ))}
      </div>

      <SubmittalTable items={base.filter((s) => match(s, filter))} />
    </div>
  )
}
