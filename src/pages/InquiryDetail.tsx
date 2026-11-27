import { Lock, LockOpen, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AttachmentPicker, AttachmentView, Avatar, DeptChip, NotFound, PriorityDot, ResponseTimer, StatusBadge } from '../components/ui'
import { useT } from '../i18n'
import { deptById, inquiryRecipients, useMe, userById, useStore } from '../store'
import type { Attachment } from '../types'

export default function InquiryDetail() {
  const { id } = useParams()
  const { t, l, lang, tx } = useT()
  const me = useMe()
  const inq = useStore((s) => s.inquiries.find((i) => i.id === id))
  const project = useStore((s) => s.projects.find((p) => p.id === inq?.projectId))
  const sendMessage = useStore((s) => s.sendMessage)
  const closeInquiry = useStore((s) => s.closeInquiry)
  const reopenInquiry = useStore((s) => s.reopenInquiry)
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [inq?.messages.length])

  if (!inq) return <NotFound />

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() && !attachments.length) return
    sendMessage(inq.id, text.trim(), attachments)
    setText('')
    setAttachments([])
  }

  const fmt = new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeStyle: 'short' })
  const isOwner = inq.fromUserId === me.id || me.role === 'admin'
  const canClose = inq.status !== 'closed' && isOwner

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h1 className="flex items-center gap-2 text-lg font-bold"><PriorityDot p={inq.priority} /> {tx(inq.title)}</h1>
          <StatusBadge inq={inq} />
        </div>
        {project && (
          <Link to={`/projects/${project.id}`} className="block text-sm text-teal-700 hover:underline">
            {project.code} — {tx(project.name)}
          </Link>
        )}
        <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500">{t('from')}:</span>
            <Avatar userId={inq.fromUserId} size="sm" /> {l(userById(inq.fromUserId).name)}
            <DeptChip id={inq.fromDeptId} />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500">{t('to')}:</span>
            {inq.toDeptIds.map((d) => <DeptChip key={d} id={d} />)}
            <span className="flex -space-x-1.5 rtl:space-x-reverse">
              {inquiryRecipients(inq).map((u) => <Avatar key={u.id} userId={u.id} size="sm" />)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <span>{t('createdAt')}: {fmt.format(inq.createdAt)}</span>
          <span>{t('sla')}: {fmt.format(inq.dueAt)}</span>
          <ResponseTimer inq={inq} />
        </div>
      </div>

      <div className="space-y-3">
        {inq.messages.map((m) => {
          const mine = m.senderId === me.id
          const sender = userById(m.senderId)
          return (
            <div key={m.id} className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
              <Avatar userId={m.senderId} />
              <div className={`max-w-[85%] space-y-2 rounded-2xl px-4 py-2.5 ${mine ? 'bg-teal-700 text-white' : 'border border-slate-200 bg-white'}`}>
                <div className={`text-xs font-semibold ${mine ? 'text-teal-100' : 'text-slate-500'}`}>
                  {l(sender.name)} · {l(deptById(sender.departmentId).name)}
                </div>
                {m.text && <p className="whitespace-pre-wrap text-sm leading-relaxed">{tx(m.text)}</p>}
                {m.attachments.length > 0 && (
                  <div className="flex flex-col items-start gap-2 text-slate-800">
                    {m.attachments.map((a, i) => <AttachmentView key={i} a={a} />)}
                  </div>
                )}
                <div className={`text-[10px] ${mine ? 'text-teal-200' : 'text-slate-400'}`}>{fmt.format(m.createdAt)}</div>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {inq.status === 'closed' ? (
        <div className="flex items-center justify-center gap-3 rounded-xl bg-slate-100 p-3 text-sm text-slate-500">
          <Lock className="size-4" /> {t('s_closed')}
          {isOwner && (
            <button className="btn-ghost !bg-white !py-1" onClick={() => reopenInquiry(inq.id)}>
              <LockOpen className="size-4" /> {t('reopenInquiry')}
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={send} className="card sticky bottom-20 space-y-2 md:bottom-4">
          <textarea
            className="input min-h-20"
            placeholder={t('typeMessage')}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <AttachmentPicker value={attachments} onChange={setAttachments} />
          <div className="flex gap-2">
            <button className="btn-primary flex-1" disabled={!text.trim() && !attachments.length}>
              <Send className="size-4" /> {t('send')}
            </button>
            {canClose && (
              <button type="button" className="btn-ghost" onClick={() => closeInquiry(inq.id)}>
                <Lock className="size-4" /> {t('closeInquiry')}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
