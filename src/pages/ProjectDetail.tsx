import { Check, Circle, Loader, MapPin, Plus, Undo2, Upload } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ContractTable from '../components/ContractTable'
import InquiryRow from '../components/InquiryRow'
import { DeadlineLabel, ProjectStatusBadge } from '../components/ProjectCard'
import SubmittalTable from '../components/SubmittalTable'
import { Avatar, DeptChip, Empty, NotFound } from '../components/ui'
import { formatDuration, timeAgo, useT } from '../i18n'
import { canManageContracts, projectProgress, useMe, userById, useStore } from '../store'
import type { Project, ProjectEvent, WorkflowStep } from '../types'

function ReturnForm({ project, step, onDone }: { project: Project; step: WorkflowStep; onDone: () => void }) {
  const { t, l } = useT()
  const returnStep = useStore((s) => s.returnStep)
  const earlier = project.steps.slice(0, project.steps.indexOf(step))
  const [toStepId, setToStepId] = useState(earlier[earlier.length - 1].id)
  const [note, setNote] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    returnStep(project.id, step.id, toStepId, note.trim())
    onDone()
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2 rounded-xl border border-orange-200 bg-orange-50/60 p-3">
      <label className="label">{t('returnTo')}</label>
      <select className="input" value={toStepId} onChange={(e) => setToStepId(e.target.value)}>
        {earlier.map((s) => <option key={s.id} value={s.id}>{l(s.title)}</option>)}
      </select>
      <textarea className="input min-h-20" required placeholder={t('returnReason')} value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex gap-2">
        <button className="btn bg-orange-600 text-white hover:bg-orange-700" disabled={!note.trim()}><Undo2 className="size-4" /> {t('confirmReturn')}</button>
        <button type="button" className="btn-ghost" onClick={onDone}>{t('cancel')}</button>
      </div>
    </form>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const { t, l, lang, tx } = useT()
  const me = useMe()
  const project = useStore((s) => s.projects.find((p) => p.id === id))
  const allInquiries = useStore((s) => s.inquiries)
  const allSubmittals = useStore((s) => s.submittals)
  const allContracts = useStore((s) => s.contracts)
  const completeStep = useStore((s) => s.completeStep)
  const [returning, setReturning] = useState<string | null>(null)
  if (!project) return <NotFound />

  const inquiries = allInquiries.filter((i) => i.projectId === project.id)
  const submittals = allSubmittals.filter((s) => s.projectId === project.id)
  const contracts = allContracts.filter((c) => c.projectId === project.id)
  const events = project.log ?? []
  const unlogged: ProjectEvent[] = project.steps
    .filter((s) => s.completedAt && s.completedBy && !events.some((e) => e.type === 'complete' && e.stepId === s.id && e.at === s.completedAt))
    .map((s) => ({ id: `c-${s.id}`, type: 'complete', stepId: s.id, by: s.completedBy!, at: s.completedAt! }))
  const log = [...events, ...unlogged].sort((a, b) => b.at - a.at)
  const returnsTo = (stepId: string) => (project.log ?? []).filter((e) => e.type === 'return' && e.toStepId === stepId).length
  const stepTitle = (stepId?: string) => l(project.steps.find((s) => s.id === stepId)?.title ?? { ar: '—', en: '—' })
  const now = Date.now()

  return (
    <div className="space-y-5">
      <div className="card space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span dir="ltr">{project.code}</span>
              <span className="rounded bg-slate-100 px-1.5 text-slate-500">{l(project.category)}</span>
            </div>
            <h1 className="text-xl font-bold">{tx(project.name)}</h1>
          </div>
          <ProjectStatusBadge p={project} />
        </div>
        <div className="grid gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-xs text-slate-400">{t('client')}</div>
            <div className="font-semibold">{tx(project.client) || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">{t('location')}</div>
            <div className="flex items-center gap-1 font-semibold"><MapPin className="size-3.5 text-slate-400" />{tx(project.location) || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">{t('projectManager')}</div>
            <div className="flex items-center gap-1.5 font-semibold"><Avatar userId={project.managerId} size="sm" />{l(userById(project.managerId).name)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">{t('deadline')}</div>
            <DeadlineLabel p={project} />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>{t('progress')}</span>
            <span className="font-bold">{projectProgress(project)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-teal-600" style={{ width: `${projectProgress(project)}%` }} />
          </div>
        </div>
        <div className="flex flex-wrap gap-1">{project.departmentIds.map((d) => <DeptChip key={d} id={d} />)}</div>
      </div>

      {project.steps.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-3">
          <section className="card lg:col-span-2">
            <h2 className="mb-4 font-bold">{t('timeline')}</h2>
            <ol className="relative space-y-5 border-s-2 border-slate-200 ps-6">
              {project.steps.map((s, idx) => {
                const canAct = s.status === 'active' && (me.role === 'admin' || me.departmentId === s.departmentId)
                const duration = s.startedAt ? (s.completedAt ?? now) - s.startedAt : 0
                const late = duration > s.slaHours * 3600_000
                const returns = returnsTo(s.id)
                const Icon = s.status === 'done' ? Check : s.status === 'active' ? Loader : Circle
                const iconCls =
                  s.status === 'done'
                    ? 'bg-emerald-600 text-white'
                    : s.status === 'active'
                      ? 'bg-amber-500 text-white'
                      : 'bg-white text-slate-300 border-2 border-slate-200'
                return (
                  <li key={s.id} className="relative">
                    <span className={`absolute -start-[37px] top-0 flex size-6 items-center justify-center rounded-full ${iconCls}`}>
                      <Icon className="size-3.5" />
                    </span>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className={`flex items-center gap-2 font-semibold ${s.status === 'pending' ? 'text-slate-400' : ''}`}>
                          {l(s.title)}
                          {returns > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-700">
                              <Undo2 className="size-3" /> {t('returnedTimes')}: {returns}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <DeptChip id={s.departmentId} />
                          <span>{t(`step_${s.status}`)}</span>
                          <span>· {t('sla')}: {s.slaHours} {t('hours')}</span>
                          {s.startedAt && (
                            <span className={late ? 'font-bold text-red-600' : 'font-semibold text-slate-700'}>
                              · {s.status === 'done' ? t('took') : t('elapsed')}: {formatDuration(duration, lang)}
                            </span>
                          )}
                        </div>
                        {s.completedBy && (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Avatar userId={s.completedBy} size="sm" /> {l(userById(s.completedBy).name)}
                          </div>
                        )}
                      </div>
                      {canAct && returning !== s.id && (
                        <div className="flex gap-2">
                          {idx > 0 && (
                            <button className="btn-ghost !py-1.5 text-orange-700" onClick={() => setReturning(s.id)}>
                              <Undo2 className="size-4" /> {t('returnStep')}
                            </button>
                          )}
                          <button className="btn-primary !py-1.5" onClick={() => completeStep(project.id, s.id)}>
                            <Check className="size-4" /> {t('completeStep')}
                          </button>
                        </div>
                      )}
                    </div>
                    {returning === s.id && <ReturnForm project={project} step={s} onDone={() => setReturning(null)} />}
                  </li>
                )
              })}
            </ol>
          </section>

          <section className="card">
            <h2 className="mb-3 font-bold">{t('activityLog')}</h2>
            {log.length ? (
              <div className="space-y-3">
                {log.map((e) => (
                  <div key={e.id} className="flex items-start gap-2 text-sm">
                    <Avatar userId={e.by} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div>
                        <span className="font-semibold">{l(userById(e.by).name)}</span>{' '}
                        {e.type === 'complete' ? (
                          <span className="text-slate-600">{t('ev_complete')} "{stepTitle(e.stepId)}"</span>
                        ) : (
                          <span className="text-orange-700">
                            {t('ev_return')} "{stepTitle(e.stepId)}" {t('ev_to')} "{stepTitle(e.toStepId)}"
                          </span>
                        )}
                      </div>
                      {e.note && <p className="mt-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">{tx(e.note)}</p>}
                      <div className="text-xs text-slate-400">{timeAgo(e.at, lang)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty />
            )}
          </section>
        </div>
      )}

      {canManageContracts(me) && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">{t('projectContracts')}</h2>
            <Link to={`/contracts/new?project=${project.id}`} className="btn-ghost !py-1.5">
              <Upload className="size-4" /> {t('uploadContract')}
            </Link>
          </div>
          <ContractTable items={contracts} showProject={false} />
        </section>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{t('projectSubmittals')}</h2>
          {me.departmentId !== 'mgmt' && project.departmentIds.includes(me.departmentId) && (
            <Link to={`/submittals/new?project=${project.id}`} className="btn-ghost !py-1.5">
              <Plus className="size-4" /> {t('newSubmittal')}
            </Link>
          )}
        </div>
        <SubmittalTable items={submittals} showProject={false} />
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{t('projectInquiries')}</h2>
          <Link to={`/inquiries/new?project=${project.id}`} className="btn-ghost !py-1.5">
            <Plus className="size-4" /> {t('newInquiry')}
          </Link>
        </div>
        {inquiries.length ? inquiries.map((i) => <InquiryRow key={i.id} inq={i} />) : <Empty />}
      </section>
    </div>
  )
}
