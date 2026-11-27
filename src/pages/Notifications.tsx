import { AlertTriangle, BellRing, CheckCheck, ClipboardCheck, FileSignature, FolderKanban, GitBranch, MessageCircle, MessagesSquare } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Empty } from '../components/ui'
import { type DictKey, timeAgo, useT } from '../i18n'
import { useMe, useStore } from '../store'
import type { AppNotification, NotificationType } from '../types'

const meta: Record<NotificationType, { icon: typeof BellRing; cls: string }> = {
  project: { icon: FolderKanban, cls: 'bg-teal-100 text-teal-700' },
  inquiry: { icon: MessagesSquare, cls: 'bg-sky-100 text-sky-700' },
  message: { icon: MessageCircle, cls: 'bg-violet-100 text-violet-700' },
  step: { icon: GitBranch, cls: 'bg-amber-100 text-amber-700' },
  overdue: { icon: AlertTriangle, cls: 'bg-red-100 text-red-700' },
  submittal: { icon: ClipboardCheck, cls: 'bg-emerald-100 text-emerald-700' },
  contract: { icon: FileSignature, cls: 'bg-indigo-100 text-indigo-700' },
}

type Filter = 'all' | 'unread' | NotificationType

function dayGroup(ts: number): DictKey {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  if (ts >= start.getTime()) return 'today'
  if (ts >= start.getTime() - 86_400_000) return 'yesterday'
  return 'earlier'
}

export default function Notifications() {
  const { t, l, lang } = useT()
  const me = useMe()
  const navigate = useNavigate()
  const all = useStore((s) => s.notifications)
  const markRead = useStore((s) => s.markRead)
  const markAllRead = useStore((s) => s.markAllRead)
  const [perm, setPerm] = useState(() => ('Notification' in window ? Notification.permission : 'denied'))
  const [filter, setFilter] = useState<Filter>('all')

  const mine = all.filter((n) => n.userId === me.id)
  const match = (n: AppNotification, f: Filter) => f === 'all' || (f === 'unread' ? !n.read : n.type === f)
  const list = mine.filter((n) => match(n, filter))
  const groups = (['today', 'yesterday', 'earlier'] as const)
    .map((g) => ({ g, items: list.filter((n) => dayGroup(n.createdAt) === g) }))
    .filter((x) => x.items.length)

  const filters: Filter[] = ['all', 'unread', 'overdue', 'inquiry', 'message', 'submittal', 'contract', 'step', 'project'].filter(
    (f) => f !== 'contract' || mine.some((n) => n.type === 'contract'),
  ) as Filter[]
  const label = (f: Filter) => (f === 'all' ? t('all') : f === 'unread' ? t('unread') : t(`nt_${f}`))

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">
          {t('notifications')} <span className="text-sm font-normal text-slate-400">({mine.length})</span>
        </h1>
        <div className="flex gap-2">
          {perm === 'default' && (
            <button className="btn-ghost" onClick={() => Notification.requestPermission().then(setPerm)}>
              <BellRing className="size-4" /> {t('enablePush')}
            </button>
          )}
          <button className="btn-ghost" onClick={markAllRead}><CheckCheck className="size-4" /> {t('markAllRead')}</button>
        </div>
      </div>

      <div className="-mx-4 flex gap-2 no-scrollbar overflow-x-auto px-4 pb-1">
        {filters.map((f) => {
          const count = mine.filter((n) => match(n, f)).length
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition ${filter === f ? 'bg-teal-700 text-white shadow' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
            >
              {label(f)} <span className={filter === f ? 'text-teal-100' : 'text-slate-400'}>({count})</span>
            </button>
          )
        })}
      </div>

      {!groups.length && <Empty />}
      {groups.map(({ g, items }) => (
        <section key={g} className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">{t(g)}</h2>
          <div className="card divide-y divide-slate-100 !p-0">
            {items.map((n) => {
              const { icon: Icon, cls } = meta[n.type]
              return (
                <button
                  key={n.id}
                  onClick={() => (markRead(n.id), navigate(n.link))}
                  className={`flex w-full items-start gap-3 p-3.5 text-start transition hover:bg-slate-50 ${n.read ? '' : 'bg-teal-50/50'}`}
                >
                  <span className={`shrink-0 rounded-xl p-2 ${cls}`}><Icon className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm ${n.read ? 'text-slate-600' : 'font-bold text-slate-900'}`}>{l(n.text)}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                      {timeAgo(n.createdAt, lang)}
                      <span className="rounded bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-500">{t(`nt_${n.type}`)}</span>
                    </span>
                  </span>
                  {!n.read && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-teal-600 ring-4 ring-teal-100" />}
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
