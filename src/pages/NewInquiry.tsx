import { Send } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AttachmentPicker, Avatar, MultiToggle } from '../components/ui'
import { useT } from '../i18n'
import { departments } from '../seed'
import { deptById, useMe, userById, usersInDepts, useStore } from '../store'
import type { Attachment, Priority } from '../types'

export default function NewInquiry() {
  const { t, l, tx } = useT()
  const me = useMe()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const projects = useStore((s) => s.projects)
  const createInquiry = useStore((s) => s.createInquiry)

  const [projectId, setProjectId] = useState(params.get('project') ?? projects[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [toDeptIds, setToDeptIds] = useState<string[]>([])
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const [priority, setPriority] = useState<Priority>('normal')
  const [attachments, setAttachments] = useState<Attachment[]>([])

  const otherDepts = departments.filter((d) => d.id !== me.departmentId).map((d) => d.id)
  const candidates = usersInDepts(toDeptIds).map((u) => u.id)

  const changeDepts = (ids: string[]) => {
    setToDeptIds(ids)
    setAssigneeIds((prev) => prev.filter((id) => ids.includes(userById(id).departmentId)))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = createInquiry({ projectId, title, text, toDeptIds, assigneeIds, priority, attachments })
    navigate(`/inquiries/${id}`)
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">{t('newInquiry')}</h1>
      <div>
        <label className="label">{t('project')}</label>
        <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {tx(p.name)}</option>)}
        </select>
      </div>
      <div>
        <label className="label">{t('toDepartments')}</label>
        <MultiToggle options={otherDepts} value={toDeptIds} onChange={changeDepts} render={(id) => l(deptById(id).name)} />
      </div>
      {toDeptIds.length > 0 && (
        <div>
          <label className="label">{t('assignees')}</label>
          <MultiToggle
            options={candidates}
            value={assigneeIds}
            onChange={setAssigneeIds}
            render={(id) => (
              <span className="flex items-center gap-1.5">
                <Avatar userId={id} size="sm" /> {l(userById(id).name)}
              </span>
            )}
          />
          {!assigneeIds.length && <p className="mt-1 text-xs text-slate-400">{t('wholeDept')}</p>}
        </div>
      )}
      <div>
        <label className="label">{t('priority')}</label>
        <div className="grid grid-cols-3 gap-2">
          {(['urgent', 'normal', 'low'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`rounded-xl border px-2 py-2 text-xs font-semibold ${priority === p ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-600/20' : 'border-slate-300 text-slate-600'}`}
            >
              {t(`p_${p}`)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">{t('subject')}</label>
        <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="label">{t('details')}</label>
        <textarea className="input min-h-28" required value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <AttachmentPicker value={attachments} onChange={setAttachments} />
      <button className="btn-primary w-full" disabled={!toDeptIds.length || !title || !text || !projectId}>
        <Send className="size-4" /> {t('send')}
      </button>
    </form>
  )
}
