import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import InquiryRow from '../components/InquiryRow'
import { Empty } from '../components/ui'
import { type DictKey, useT } from '../i18n'
import { departments } from '../seed'
import { isOverdue, isRecipient, useMe, useStore } from '../store'
import type { Inquiry, Priority, User } from '../types'

type Filter = 'all' | 'waitingForMe' | 'sentByMe' | 'overdue' | 's_closed'

const filters: Record<Filter, (i: Inquiry, me: User) => boolean> = {
  all: () => true,
  waitingForMe: (i, me) => i.status === 'open' && isRecipient(i, me),
  sentByMe: (i, me) => i.fromUserId === me.id,
  overdue: (i) => isOverdue(i),
  s_closed: (i) => i.status === 'closed',
}

export default function Inquiries() {
  const { t, l, tx } = useT()
  const me = useMe()
  const inquiries = useStore((s) => s.inquiries)
  const projects = useStore((s) => s.projects)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [projectId, setProjectId] = useState('')
  const [deptId, setDeptId] = useState('')
  const [priority, setPriority] = useState<Priority | ''>('')

  const q = query.trim().toLowerCase()
  const base = inquiries.filter(
    (i) =>
      (!q || [i.title, tx(i.title), ...i.messages.flatMap((m) => [m.text, tx(m.text)])].some((v) => v.toLowerCase().includes(q))) &&
      (!projectId || i.projectId === projectId) &&
      (!deptId || i.fromDeptId === deptId || i.toDeptIds.includes(deptId)) &&
      (!priority || i.priority === priority),
  )
  const list = base.filter((i) => filters[filter](i, me))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('inquiries')}</h1>
        <Link to="/inquiries/new" className="btn-primary"><Plus className="size-4" /> {t('newInquiry')}</Link>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="relative col-span-2 md:col-span-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input !ps-9" placeholder={t('searchInquiries')} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="input col-span-2 md:col-span-1" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">{t('allProjects')}</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {tx(p.name)}</option>)}
        </select>
        <select className="input" value={deptId} onChange={(e) => setDeptId(e.target.value)}>
          <option value="">{t('allDepts')}</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{l(d.name)}</option>)}
        </select>
        <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as Priority | '')}>
          <option value="">{t('allPriorities')}</option>
          {(['urgent', 'normal', 'low'] as const).map((p) => <option key={p} value={p}>{t(`p_${p}`)}</option>)}
        </select>
      </div>
      <div className="-mx-4 flex gap-2 no-scrollbar overflow-x-auto px-4 pb-1">
        {(Object.keys(filters) as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${filter === f ? 'bg-teal-700 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
          >
            {t(f as DictKey)} ({base.filter((i) => filters[f](i, me)).length})
          </button>
        ))}
      </div>
      <div className="space-y-2">{list.length ? list.map((i) => <InquiryRow key={i.id} inq={i} />) : <Empty />}</div>
    </div>
  )
}
