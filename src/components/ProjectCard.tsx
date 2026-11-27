import { CalendarClock, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useT } from '../i18n'
import { projectProgress, projectStatus, type ProjectStatus, userById, useStore } from '../store'
import type { Project } from '../types'
import { Avatar, DeptChip } from './ui'

const statusCls: Record<ProjectStatus, string> = {
  active: 'bg-sky-100 text-sky-800',
  late: 'bg-red-100 text-red-700',
  done: 'bg-emerald-100 text-emerald-800',
}
const barCls: Record<ProjectStatus, string> = { active: 'bg-teal-600', late: 'bg-red-500', done: 'bg-emerald-500' }

export function ProjectStatusBadge({ p }: { p: Project }) {
  const { t } = useT()
  const s = projectStatus(p)
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${statusCls[s]}`}>{t(`ps_${s}`)}</span>
}

export function DeadlineLabel({ p }: { p: Project }) {
  const { t, lang } = useT()
  const days = Math.ceil((p.deadline - Date.now()) / 86_400_000)
  const done = projectStatus(p) === 'done'
  const date = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' }).format(p.deadline)
  const cls = done ? 'text-slate-500' : days < 0 ? 'text-red-600' : days <= 5 ? 'text-orange-600' : 'text-slate-500'
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${cls}`}>
      <CalendarClock className="size-3.5" />
      {date}
      {!done && <> · {Math.abs(days)} {t(`${Math.abs(days) === 1 ? 'day' : 'days'}${days < 0 ? 'Late' : 'Left'}`)}</>}
    </span>
  )
}

export default function ProjectCard({ p }: { p: Project }) {
  const { t, l, tx } = useT()
  const openInq = useStore((s) => s.inquiries.filter((i) => i.projectId === p.id && i.status === 'open').length)
  const status = projectStatus(p)
  const pct = projectProgress(p)
  const current = p.steps.find((s) => s.status === 'active')
  const manager = userById(p.managerId)

  return (
    <Link
      to={`/projects/${p.id}`}
      className={`card flex flex-col gap-3 border-t-4 transition hover:-translate-y-0.5 hover:shadow-lg ${status === 'late' ? 'border-t-red-500' : status === 'done' ? 'border-t-emerald-500' : 'border-t-teal-600'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span dir="ltr">{p.code}</span>
            <span className="rounded bg-slate-100 px-1.5 text-slate-500">{l(p.category)}</span>
          </div>
          <div className="truncate font-bold">{tx(p.name)}</div>
          <div className="truncate text-xs text-slate-500">{tx(p.client)}</div>
        </div>
        <ProjectStatusBadge p={p} />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="flex min-w-0 items-center gap-1 text-slate-500">
            {current && <DeptChip id={current.departmentId} />}
            <span className="truncate">{current ? l(current.title) : t('ps_done')}</span>
          </span>
          <span className="font-bold">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full transition-all ${barCls[status]}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
        <span className="flex items-center gap-1.5 text-xs text-slate-600">
          <Avatar userId={manager.id} size="sm" /> {l(manager.name)}
        </span>
        <span className="flex items-center gap-3">
          <span className="hidden items-center gap-1 text-xs text-slate-500 sm:inline-flex"><MapPin className="size-3.5" />{tx(p.location)}</span>
          <DeadlineLabel p={p} />
        </span>
      </div>
      {openInq > 0 && (
        <span className="-mt-1 self-start rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
          {openInq} {t('s_open')}
        </span>
      )}
    </Link>
  )
}
