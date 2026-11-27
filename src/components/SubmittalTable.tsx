import { useNavigate } from 'react-router-dom'
import { timeAgo, useT } from '../i18n'
import { latestRevision, useStore } from '../store'
import type { Submittal } from '../types'
import { CodeBadge, DeptChip, Empty, SubmittalStatusBadge } from './ui'

export default function SubmittalTable({ items, showProject = true }: { items: Submittal[]; showProject?: boolean }) {
  const { t, lang, tx } = useT()
  const navigate = useNavigate()
  const projects = useStore((s) => s.projects)
  if (!items.length) return <Empty />

  return (
    <>
      <div className="space-y-3 md:hidden">
        {items.map((s) => {
          const r = latestRevision(s)
          const project = projects.find((p) => p.id === s.projectId)
          return (
            <button key={s.id} onClick={() => navigate(`/submittals/${s.id}`)} className="card block w-full text-start transition active:scale-[.99]">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-[11px] font-semibold text-slate-500" dir="ltr">{s.number}</span>
                <span className="shrink-0 font-mono text-[11px] font-bold text-slate-600" dir="ltr">Rev {String(r.rev).padStart(2, '0')}</span>
              </div>
              <div className="mt-1.5 font-semibold leading-snug">{tx(s.title)}</div>
              <div className="mt-0.5 text-xs text-slate-400">
                {t(`st_${s.type}`)} · {timeAgo(r.submittedAt, lang)}
                {showProject && project && <> · {tx(project.name)}</>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <SubmittalStatusBadge s={s} />
                {r.code && <CodeBadge code={r.code} />}
                <DeptChip id={s.departmentId} />
              </div>
            </button>
          )
        })}
      </div>

      <div className="card hidden overflow-x-auto !p-0 md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="p-3 text-start">{t('submittalNo')}</th>
              <th className="p-3 text-start">{t('subject')}</th>
              {showProject && <th className="p-3 text-start">{t('project')}</th>}
              <th className="p-3 text-start">{t('department')}</th>
              <th className="p-3 text-center">{t('revision')}</th>
              <th className="p-3 text-center">{t('reviewResult')}</th>
              <th className="p-3 text-start" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((s) => {
              const r = latestRevision(s)
              const project = projects.find((p) => p.id === s.projectId)
              return (
                <tr key={s.id} onClick={() => navigate(`/submittals/${s.id}`)} className="cursor-pointer hover:bg-teal-50/40">
                  <td className="p-3 font-mono text-xs font-semibold text-slate-600" dir="ltr">{s.number}</td>
                  <td className="p-3">
                    <div className="font-semibold">{tx(s.title)}</div>
                    <div className="text-xs text-slate-400">{t(`st_${s.type}`)} · {timeAgo(r.submittedAt, lang)}</div>
                  </td>
                  {showProject && <td className="p-3 text-xs text-slate-600">{project && tx(project.name)}</td>}
                  <td className="p-3"><DeptChip id={s.departmentId} /></td>
                  <td className="p-3 text-center font-mono text-xs font-bold" dir="ltr">Rev {String(r.rev).padStart(2, '0')}</td>
                  <td className="p-3 text-center">{r.code ? <CodeBadge code={r.code} /> : '—'}</td>
                  <td className="p-3"><SubmittalStatusBadge s={s} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
