import { LayoutGrid, List, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import ProjectCard, { DeadlineLabel, ProjectStatusBadge } from '../components/ProjectCard'
import { Avatar, DeptChip, Empty } from '../components/ui'
import { useT } from '../i18n'
import { projectProgress, projectStatus, type ProjectStatus, userById, useStore } from '../store'

type Filter = 'all' | ProjectStatus

export default function Projects() {
  const { t, l, tx } = useT()
  const navigate = useNavigate()
  const projects = useStore((s) => s.projects)
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  useEffect(() => setQuery(params.get('q') ?? ''), [params])
  const [filter, setFilter] = useState<Filter>('all')
  const [view, setView] = useState<'grid' | 'table'>('grid')

  const q = query.trim().toLowerCase()
  const matches = projects.filter((p) => !q || [p.name, p.code, p.client, p.location, tx(p.name), tx(p.client), tx(p.location)].some((f) => f.toLowerCase().includes(q)))
  const list = matches.filter((p) => filter === 'all' || projectStatus(p) === filter)
  const count = (f: Filter) => matches.filter((p) => f === 'all' || projectStatus(p) === f).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('projects')} <span className="text-sm font-normal text-slate-400">({projects.length})</span></h1>
        <Link to="/projects/new" className="btn-primary"><Plus className="size-4" /> {t('newProject')}</Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input !ps-9" placeholder={t('search')} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {(['all', 'active', 'late', 'done'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${filter === f ? 'bg-white text-teal-800 shadow' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {f === 'all' ? t('all') : t(`ps_${f}`)} ({count(f)})
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {(['grid', 'table'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              title={t(v === 'grid' ? 'gridView' : 'tableView')}
              className={`rounded-lg p-1.5 ${view === v ? 'bg-white text-teal-800 shadow' : 'text-slate-500'}`}
            >
              {v === 'grid' ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
            </button>
          ))}
        </div>
      </div>

      {!list.length ? (
        <Empty />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => <ProjectCard key={p.id} p={p} />)}
        </div>
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="p-3 text-start">{t('project')}</th>
                <th className="p-3 text-start">{t('client')}</th>
                <th className="p-3 text-start">{t('projectManager')}</th>
                <th className="p-3 text-start">{t('currentStep')}</th>
                <th className="p-3 text-start">{t('progress')}</th>
                <th className="p-3 text-start">{t('deadline')}</th>
                <th className="p-3 text-start" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((p) => {
                const current = p.steps.find((s) => s.status === 'active')
                const pct = projectProgress(p)
                return (
                  <tr key={p.id} onClick={() => navigate(`/projects/${p.id}`)} className="cursor-pointer hover:bg-teal-50/40">
                    <td className="p-3">
                      <div className="font-semibold">{tx(p.name)}</div>
                      <div className="text-xs text-slate-400"><span dir="ltr">{p.code}</span> · {l(p.category)} · {tx(p.location)}</div>
                    </td>
                    <td className="p-3 text-slate-600">{tx(p.client)}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-1.5"><Avatar userId={p.managerId} size="sm" />{l(userById(p.managerId).name)}</span>
                    </td>
                    <td className="p-3">{current ? <DeptChip id={current.departmentId} /> : '—'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-teal-600" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold">{pct}%</span>
                      </div>
                    </td>
                    <td className="p-3"><DeadlineLabel p={p} /></td>
                    <td className="p-3"><ProjectStatusBadge p={p} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
