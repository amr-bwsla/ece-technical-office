import { Send } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AttachmentPicker, Empty } from '../components/ui'
import { useT } from '../i18n'
import { useMe, useStore } from '../store'
import type { Attachment, SubmittalType } from '../types'

export default function NewSubmittal() {
  const { t, tx } = useT()
  const me = useMe()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const projects = useStore((s) => s.projects).filter((p) => p.departmentIds.includes(me.departmentId))
  const createSubmittal = useStore((s) => s.createSubmittal)

  const [projectId, setProjectId] = useState(params.get('project') ?? projects[0]?.id ?? '')
  const [type, setType] = useState<SubmittalType>('design')
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])

  if (me.departmentId === 'mgmt') return <Empty text={t('reviewerHint')} />

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/submittals/${createSubmittal({ projectId, title, type, note, attachments })}`)
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-bold">{t('newSubmittal')}</h1>
        <p className="text-xs text-slate-500">{t('reviewerHint')}</p>
      </div>
      <div>
        <label className="label">{t('project')}</label>
        <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {tx(p.name)}</option>)}
        </select>
      </div>
      <div>
        <label className="label">{t('submittalType')}</label>
        <div className="grid grid-cols-3 gap-2">
          {(['design', 'shop', 'material'] as const).map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => setType(x)}
              className={`rounded-xl border px-2 py-2 text-xs font-semibold ${type === x ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-600/20' : 'border-slate-300 text-slate-600'}`}
            >
              {t(`st_${x}`)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">{t('subject')}</label>
        <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="label">{t('submitNote')}</label>
        <textarea className="input min-h-24" required value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <AttachmentPicker value={attachments} onChange={setAttachments} />
      <button className="btn-primary w-full" disabled={!projectId || !title || !note}>
        <Send className="size-4" /> {t('submitForReview')}
      </button>
    </form>
  )
}
