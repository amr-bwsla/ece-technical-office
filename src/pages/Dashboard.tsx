import { AlertTriangle, ArrowUpLeft, CalendarClock, CheckCircle2, Clock, FileSignature, FolderKanban, Inbox, Plus, Send, Timer } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import InquiryRow from '../components/InquiryRow'
import ProjectCard, { DeadlineLabel, ProjectStatusBadge } from '../components/ProjectCard'
import { Avatar, DeptChip, Empty, formatMoney } from '../components/ui'
import { formatDuration, timeAgo, useT } from '../i18n'
import { departments } from '../seed'
import {
  canManageContracts,
  contractStatus,
  isOverdue,
  isRecipient,
  paidPercent,
  projectProgress, projectStatus, type ProjectStatus, useMe, userById, useStore } from '../store'

function ContractsPanel() {
  const { t, lang, tx } = useT()
  const contracts = useStore((s) => s.contracts)
  const projects = useStore((s) => s.projects)
  const value = contracts.reduce((s, c) => s + c.value, 0)
  const collected = contracts.reduce((s, c) => s + (c.value * paidPercent(c)) / 100, 0)
  const share = value ? (collected / value) * 100 : 0
  const ending = contracts.filter((c) => contractStatus(c) === 'expiring').sort((a, b) => a.endsAt - b.endsAt)

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <Link to="/contracts" className="card group space-y-3 transition hover:shadow-lg lg:col-span-2">
        <h2 className="flex items-center gap-2 font-bold">
          <FileSignature className="size-5 text-teal-700" /> {t('contractsSummary')}
          <ArrowUpLeft className="ms-auto size-4 text-slate-300 transition group-hover:text-teal-600 ltr:-scale-x-100" />
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <div className="text-xs text-slate-500">{t('totalValue')} ({contracts.length})</div>
            <div className="text-xl font-bold text-teal-800">{formatMoney(value, lang)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">{t('collected')}</div>
            <div className="text-xl font-bold text-emerald-700">{formatMoney(collected, lang)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">{t('outstanding')}</div>
            <div className="text-xl font-bold text-slate-700">{formatMoney(value - collected, lang)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${share}%` }} />
          </div>
          <span className="text-xs font-bold text-emerald-700">{Math.round(share)}%</span>
        </div>
      </Link>
      <div className="card space-y-2">
        <h2 className="font-bold">{t('endingSoon')} <span className="text-sm font-normal text-slate-400">({ending.length})</span></h2>
        {ending.length ? (
          ending.slice(0, 4).map((c) => {
            const days = Math.ceil((c.endsAt - Date.now()) / 86_400_000)
            return (
              <Link key={c.id} to={`/contracts/${c.id}`} className="block rounded-xl border border-amber-100 bg-amber-50/50 p-2.5 hover:border-amber-300">
                <div className="truncate text-sm font-semibold">{tx(c.title)}</div>
                <div className="flex justify-between gap-2 text-xs text-slate-500">
                  <span className="truncate">{tx(projects.find((p) => p.id === c.projectId)?.client ?? '')}</span>
                  <span className="shrink-0 font-bold text-amber-700">
                    {days} {t(days === 1 ? 'dayToEnd' : 'daysToEnd')}
                  </span>
                </div>
              </Link>
            )
          })
        ) : (
          <Empty />
        )}
      </div>
    </section>
  )
}

const statusOrder = { late: 0, active: 1, done: 2 }
const statusColor: Record<ProjectStatus, string> = { active: '#1a4d85', late: '#ef4444', done: '#10b981' }

export default function Dashboard() {
  const { t, l, lang, tx } = useT()
  const me = useMe()
  const inquiries = useStore((s) => s.inquiries)
  const projects = useStore((s) => s.projects)
  const [tab, setTab] = useState<'all' | ProjectStatus>('all')

  const mine = projects
    .filter((p) => me.departmentId === 'mgmt' || p.departmentIds.includes(me.departmentId))
    .sort((a, b) => statusOrder[projectStatus(a)] - statusOrder[projectStatus(b)] || a.deadline - b.deadline)
  const shown = mine.filter((p) => tab === 'all' || projectStatus(p) === tab)
  const countBy = (s: ProjectStatus) => mine.filter((p) => projectStatus(p) === s).length

  const waiting = inquiries.filter((i) => i.status === 'open' && isRecipient(i, me))
  const sent = inquiries.filter((i) => i.fromUserId === me.id && i.status !== 'closed')
  const overdueAll = inquiries.filter((i) => isOverdue(i))
  const answered = inquiries.filter((i) => i.firstResponseAt)
  const avgResponse = answered.length ? answered.reduce((s, i) => s + i.firstResponseAt! - i.createdAt, 0) / answered.length : 0
  const myTasks = projects.flatMap((p) =>
    p.steps.filter((s) => s.status === 'active' && s.departmentId === me.departmentId).map((s) => ({ p, s })),
  )
  const activity = inquiries
    .flatMap((i) => i.messages.map((m, idx) => ({ i, m, first: idx === 0 })))
    .sort((a, b) => b.m.createdAt - a.m.createdAt)
    .slice(0, 7)
  const upcoming = mine
    .filter((p) => projectStatus(p) !== 'done')
    .sort((a, b) => a.deadline - b.deadline)
    .slice(0, 5)

  const pieData = (['active', 'late', 'done'] as const).map((s) => ({ name: t(`ps_${s}`), value: countBy(s), color: statusColor[s] }))
  const workload = departments.map((d) => ({
    name: l(d.name).split(' ')[0],
    [t('openCount')]: inquiries.filter((i) => i.status === 'open' && i.toDeptIds.includes(d.id)).length,
    [t('activeSteps')]: projects.filter((p) => p.steps.some((s) => s.status === 'active' && s.departmentId === d.id)).length,
  }))

  const hour = new Date().getHours()
  const kpis = [
    { label: t('waitingForMe'), value: waiting.length, icon: Inbox, tone: 'from-amber-500 to-orange-500', to: '/inquiries' },
    { label: t('overdue'), value: overdueAll.length, icon: AlertTriangle, tone: 'from-rose-500 to-red-600', to: '/inquiries' },
    { label: t('sentByMe'), value: sent.length, icon: Send, tone: 'from-sky-500 to-blue-600', to: '/inquiries' },
    { label: t('overallAvg'), value: formatDuration(avgResponse, lang), icon: Timer, tone: 'from-violet-500 to-purple-600', to: '/reports' },
  ]

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 p-6 text-white shadow-xl md:p-8">
        <div className="absolute -top-16 -end-16 size-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 end-40 size-48 rounded-full bg-teal-400/10" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-2">
            <p className="text-sm text-teal-100">
              {new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
            </p>
            <h1 className="text-2xl font-bold md:text-3xl">
              {hour < 12 ? t('goodMorning') : t('goodEvening')}{lang === 'ar' ? '، ' : ', '}{l(me.name)}
            </h1>
            <p className="text-teal-100">{t('dashSubtitle')}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link to="/inquiries/new" className="btn bg-white text-teal-800 shadow hover:bg-teal-50"><Plus className="size-4" /> {t('newInquiry')}</Link>
              <Link to="/projects/new" className="btn bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20"><Plus className="size-4" /> {t('newProject')}</Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { v: countBy('active'), label: t('ps_active'), icon: FolderKanban },
              { v: countBy('late'), label: t('ps_late'), icon: Clock },
              { v: countBy('done'), label: t('ps_done'), icon: CheckCircle2 },
            ].map((x) => (
              <div key={x.label} className="rounded-2xl bg-white/10 px-4 py-3 text-center ring-1 ring-white/15 backdrop-blur">
                <x.icon className="mx-auto mb-1 size-5 text-teal-200" />
                <div className="text-2xl font-bold">{x.v}</div>
                <div className="text-xs text-teal-100">{x.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} to={k.to} className="card group relative overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500">{k.label}</div>
                <div className="mt-1 text-2xl font-bold">{k.value}</div>
              </div>
              <span className={`rounded-xl bg-gradient-to-br p-2.5 text-white shadow-md ${k.tone}`}><k.icon className="size-5" /></span>
            </div>
            <ArrowUpLeft className="absolute bottom-3 end-3 size-4 text-slate-300 transition group-hover:text-teal-600 ltr:-scale-x-100" />
          </Link>
        ))}
      </div>

      {canManageContracts(me) && <ContractsPanel />}

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card">
          <h2 className="mb-2 font-bold">{t('projectsStatus')}</h2>
          <div className="relative h-52">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3} stroke="none">
                  {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{mine.length}</span>
              <span className="text-xs text-slate-500">{t('projects')}</span>
            </div>
          </div>
          <div className="flex justify-center gap-4 text-xs">
            {pieData.map((d) => (
              <span key={d.name} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: d.color }} />{d.name} ({d.value})</span>
            ))}
          </div>
        </section>

        <section className="card">
          <h2 className="mb-2 font-bold">{t('deptWorkload')}</h2>
          <div className="h-60" dir="ltr">
            <ResponsiveContainer>
              <BarChart data={workload} margin={{ left: -20, right: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} reversed={lang === 'ar'} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} orientation={lang === 'ar' ? 'right' : 'left'} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey={t('openCount')} fill="#f59e0b" radius={[6, 6, 0, 0]} />
                <Bar dataKey={t('activeSteps')} fill="#1a4d85" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card">
          <h2 className="mb-3 flex items-center gap-2 font-bold"><CalendarClock className="size-5 text-teal-700" /> {t('upcomingDeadlines')}</h2>
          <div className="space-y-2">
            {upcoming.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="block rounded-xl border border-slate-100 p-2.5 transition hover:border-teal-200 hover:bg-teal-50/40">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{tx(p.name)}</span>
                  <ProjectStatusBadge p={p} />
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <DeadlineLabel p={p} />
                  <span className="text-xs font-bold text-slate-500">{projectProgress(p)}%</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{t('managedProjects')} <span className="text-sm font-normal text-slate-400">({mine.length})</span></h2>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {(['all', 'active', 'late', 'done'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTab(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${tab === f ? 'bg-white text-teal-800 shadow' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {f === 'all' ? t('all') : t(`ps_${f}`)} ({f === 'all' ? mine.length : countBy(f)})
              </button>
            ))}
          </div>
        </div>
        {shown.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((p) => <ProjectCard key={p.id} p={p} />)}
          </div>
        ) : (
          <Empty />
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-2">
          <h2 className="font-bold">{t('waitingForMe')} <span className="text-sm font-normal text-slate-400">({waiting.length})</span></h2>
          {waiting.length ? waiting.map((i) => <InquiryRow key={i.id} inq={i} />) : <Empty />}
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">{t('myTasks')}</h2>
          {myTasks.length ? (
            myTasks.map(({ p, s }) => {
              const elapsed = Date.now() - (s.startedAt ?? Date.now())
              const ratio = Math.min(1, elapsed / (s.slaHours * 3600_000))
              const late = ratio >= 1
              return (
                <Link key={p.id + s.id} to={`/projects/${p.id}`} className="card block space-y-2 hover:border-teal-300">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{l(s.title)}</div>
                      <div className="truncate text-xs text-slate-500">{p.code} · {tx(p.name)}</div>
                    </div>
                    <span className={`shrink-0 text-xs font-bold ${late ? 'text-red-600' : 'text-slate-500'}`}>
                      {formatDuration(elapsed, lang)} / {s.slaHours}{lang === 'ar' ? 'س' : 'h'}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${late ? 'bg-red-500' : ratio > 0.7 ? 'bg-amber-500' : 'bg-teal-500'}`} style={{ width: `${ratio * 100}%` }} />
                  </div>
                </Link>
              )
            })
          ) : (
            <Empty />
          )}
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">{t('sentByMe')} <span className="text-sm font-normal text-slate-400">({sent.length})</span></h2>
          {sent.length ? sent.map((i) => <InquiryRow key={i.id} inq={i} />) : <Empty />}
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">{t('teamActivity')}</h2>
          <div className="card !p-0">
            {activity.map(({ i, m, first }, idx) => {
              const u = userById(m.senderId)
              return (
                <Link key={m.id} to={`/inquiries/${i.id}`} className="relative flex items-start gap-3 p-3 hover:bg-slate-50">
                  {idx < activity.length - 1 && <span className="absolute start-[30px] top-12 bottom-0 w-px bg-slate-200" />}
                  <Avatar userId={u.id} />
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="font-semibold">{l(u.name)}</span>
                      <DeptChip id={u.departmentId} />
                      <span className="text-slate-500">{first ? t('asked') : t('repliedTo')}</span>
                    </div>
                    <div className="truncate text-slate-600">{tx(i.title)}</div>
                    <div className="text-xs text-slate-400">{timeAgo(m.createdAt, lang)}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
