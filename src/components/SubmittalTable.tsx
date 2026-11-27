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
    <div className="card overflow-x-auto !p-0">
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
  )
}
