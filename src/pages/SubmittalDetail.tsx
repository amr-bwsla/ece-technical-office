import { ClipboardCheck, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AttachmentPicker, AttachmentView, Avatar, CodeBadge, DeptChip, NotFound, SubmittalStatusBadge } from '../components/ui'
import { formatDuration, useT } from '../i18n'
import { reviewers } from '../seed'
import { latestRevision, reviewDueAt, submittalStatus, useMe, userById, useStore } from '../store'
import type { ApprovalCode, Attachment } from '../types'

export default function SubmittalDetail() {
  const { id } = useParams()
  const { t, l, lang, tx } = useT()
  const me = useMe()
  const sub = useStore((s) => s.submittals.find((x) => x.id === id))
  const project = useStore((s) => s.projects.find((p) => p.id === sub?.projectId))
  const reviewSubmittal = useStore((s) => s.reviewSubmittal)
  const resubmit = useStore((s) => s.resubmit)
  const [code, setCode] = useState<ApprovalCode | null>(null)
  const [comments, setComments] = useState('')
  const [note, setNote] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])

  if (!sub) return <NotFound />

  const status = submittalStatus(sub)
  const last = latestRevision(sub)
  const canReview = status === 'review' && reviewers().some((u) => u.id === me.id)
  const canResubmit = status === 'resubmit' && me.departmentId === sub.departmentId
  const fmt = new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeStyle: 'short' })
  const now = Date.now()

  const review = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code) return
    reviewSubmittal(sub.id, code, comments.trim())
    setCode(null)
    setComments('')
  }

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    resubmit(sub.id, note.trim(), attachments)
    setNote('')
    setAttachments([])
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="card space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-mono text-xs font-semibold text-slate-400" dir="ltr">{sub.number}</div>
            <h1 className="text-xl font-bold">{tx(sub.title)}</h1>
          </div>
          <SubmittalStatusBadge s={sub} />
        </div>
        {project && (
          <Link to={`/projects/${project.id}`} className="block text-sm text-teal-700 hover:underline">
            {project.code} — {tx(project.name)}
          </Link>
        )}
        <div className="grid gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-xs text-slate-400">{t('submittalType')}</div>
            <div className="font-semibold">{t(`st_${sub.type}`)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">{t('department')}</div>
            <DeptChip id={sub.departmentId} />
          </div>
          <div>
            <div className="text-xs text-slate-400">{t('revision')}</div>
            <div className="font-mono font-bold" dir="ltr">Rev {String(last.rev).padStart(2, '0')}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">{t('reviewDue')}</div>
            {last.code ? (
              <div className="font-semibold">—</div>
            ) : (
              <div className={`font-semibold ${now > reviewDueAt(last) ? 'text-red-600' : ''}`}>
                {fmt.format(reviewDueAt(last))}
                <span className="block text-xs font-normal text-slate-500">
                  {now > reviewDueAt(last) ? t('lateBy') : t('remaining')}: {formatDuration(reviewDueAt(last) - now, lang)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {canReview && (
        <form onSubmit={review} className="card space-y-3 border-teal-300">
          <h2 className="flex items-center gap-2 font-bold"><ClipboardCheck className="size-5 text-teal-700" /> {t('reviewResult')}</h2>
          <div className="grid gap-2 sm:grid-cols-4">
            {(['A', 'B', 'C', 'D'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCode(c)}
                className={`rounded-xl border p-2 text-start transition ${code === c ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-600/20' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                <CodeBadge code={c} withLabel />
              </button>
            ))}
          </div>
          <textarea
            className="input min-h-20"
            placeholder={t('reviewComments')}
            required={code !== 'A'}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
          <button className="btn-primary" disabled={!code}>{t('submitReview')}</button>
        </form>
      )}

      {canResubmit && (
        <form onSubmit={send} className="card space-y-3 border-orange-300">
          <h2 className="flex items-center gap-2 font-bold"><RefreshCw className="size-5 text-orange-600" /> {t('resubmitAction')}</h2>
          {last.comments && <p className="rounded-xl bg-orange-50 p-3 text-sm text-orange-900">{last.comments}</p>}
          <textarea className="input min-h-20" required placeholder={t('submitNote')} value={note} onChange={(e) => setNote(e.target.value)} />
          <AttachmentPicker value={attachments} onChange={setAttachments} />
          <button className="btn-primary" disabled={!note.trim()}>{t('submitForReview')}</button>
        </form>
      )}

      <section className="card">
        <h2 className="mb-4 font-bold">{t('revisions')}</h2>
        <ol className="relative space-y-6 border-s-2 border-slate-200 ps-6">
          {[...sub.revisions].reverse().map((r) => (
            <li key={r.rev} className="relative space-y-2">
              <span className="absolute -start-[40px] top-0 flex h-6 w-8 items-center justify-center rounded-md bg-slate-800 font-mono text-[10px] font-bold text-white">
                <bdi>R{String(r.rev).padStart(2, '0')}</bdi>
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <Avatar userId={r.submittedBy} size="sm" />
                <span className="font-semibold text-slate-700">{l(userById(r.submittedBy).name)}</span>
                <span>· {t('submittedBy')} · {fmt.format(r.submittedAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{tx(r.note)}</p>
              {r.attachments.length > 0 && (
                <div className="flex flex-col items-start gap-2">
                  {r.attachments.map((a, i) => <AttachmentView key={i} a={a} />)}
                </div>
              )}
              {r.code && r.reviewedBy && r.reviewedAt && (
                <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CodeBadge code={r.code} withLabel />
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Avatar userId={r.reviewedBy} size="sm" />
                      {l(userById(r.reviewedBy).name)} · {fmt.format(r.reviewedAt)} · {formatDuration(r.reviewedAt - r.submittedAt, lang)}
                    </span>
                  </div>
                  {r.comments && <p className="whitespace-pre-wrap text-sm text-slate-700">{tx(r.comments)}</p>}
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
