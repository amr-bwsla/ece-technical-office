import { AlertTriangle, CheckCircle2, Clock, ExternalLink, FileText, ImageIcon, Link2, Paperclip, UploadCloud, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FILE_REF, loadFile, saveFile } from '../files'
import { formatDuration, useT } from '../i18n'
import {
  contractStatus,
  type ContractStatus,
  deptById,
  isOverdue,
  latestRevision,
  respondedLate,
  reviewDueAt,
  submittalStatus,
  type SubmittalStatus,
  userById,
} from '../store'
import type { ApprovalCode, Attachment, Contract, Inquiry, Lang, Localized, Submittal } from '../types'

export function DeptChip({ id }: { id: string }) {
  const { l } = useT()
  const d = deptById(id)
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: d.color + '1a', color: d.color }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: d.color }} />
      {l(d.name)}
    </span>
  )
}

export function Avatar({ userId, size = 'md' }: { userId: string; size?: 'sm' | 'md' }) {
  const { l } = useT()
  const u = userById(userId)
  const d = deptById(u.departmentId)
  const initials = l(u.name).replace(/^(م\.|Eng\.)\s*/, '').slice(0, 1)
  return (
    <span
      title={l(u.name)}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ${size === 'sm' ? 'size-6 text-xs' : 'size-9 text-sm'}`}
      style={{ backgroundColor: d.color }}
    >
      {initials}
    </span>
  )
}

export function StatusBadge({ inq }: { inq: Inquiry }) {
  const { t } = useT()
  if (isOverdue(inq))
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
        <AlertTriangle className="size-3" /> {t('overdue')}
      </span>
    )
  const styles = {
    open: 'bg-amber-100 text-amber-800',
    answered: 'bg-emerald-100 text-emerald-800',
    closed: 'bg-slate-200 text-slate-600',
  }
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${styles[inq.status]}`}>{t(`s_${inq.status}`)}</span>
}

export function PriorityDot({ p }: { p: Inquiry['priority'] }) {
  const c = { urgent: 'bg-red-500', normal: 'bg-sky-500', low: 'bg-slate-400' }[p]
  return <span className={`inline-block size-2 shrink-0 rounded-full ${c}`} />
}

export function ResponseTimer({ inq }: { inq: Inquiry }) {
  const { t, lang } = useT()
  const now = Date.now()
  if (inq.firstResponseAt) {
    const late = respondedLate(inq)
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${late ? 'text-orange-600' : 'text-emerald-700'}`}>
        <CheckCircle2 className="size-3.5" />
        {t('responseTime')}: {formatDuration(inq.firstResponseAt - inq.createdAt, lang)}
      </span>
    )
  }
  if (inq.status === 'closed') return null
  const overdue = isOverdue(inq, now)
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${overdue ? 'text-red-600' : 'text-slate-500'}`}>
      <Clock className="size-3.5" />
      {overdue ? t('lateBy') : t('remaining')}: {formatDuration(inq.dueAt - now, lang)}
    </span>
  )
}

export function AttachmentView({ a }: { a: Attachment }) {
  if (a.type === 'image')
    return (
      <a href={a.url} target="_blank" rel="noreferrer" className="block">
        <img src={a.url} alt={a.name} className="max-h-48 rounded-xl border border-slate-200 object-cover" />
      </a>
    )
  if (a.type === 'link')
    return (
      <a
        href={a.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex max-w-full items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800 hover:bg-sky-100"
      >
        <Link2 className="size-4 shrink-0" />
        <span className="truncate" dir="ltr">{a.url}</span>
        <ExternalLink className="size-3.5 shrink-0" />
      </a>
    )
  const body = (
    <>
      <FileText className="size-5 shrink-0 text-slate-500" />
      <span className="min-w-0">
        <span className="block truncate font-semibold" dir="ltr">{a.name}</span>
        <span className="text-xs text-slate-500" dir="ltr">{(a.size / 1_000_000).toFixed(2)} MB</span>
      </span>
    </>
  )
  return <FileLink a={a} body={body} />
}

function FileLink({ a, body }: { a: Extract<Attachment, { type: 'file' }>; body: React.ReactNode }) {
  const url = useFileUrl(a.url)
  const cls = 'inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm'
  if (!url) return <span className={cls}>{body}</span>
  const viewable = /\.(pdf|png|jpe?g)$/i.test(a.name)
  return (
    <a
      href={url}
      {...(viewable ? { target: '_blank', rel: 'noreferrer' } : { download: a.name })}
      className={cls + ' hover:border-teal-300 hover:bg-teal-50/50'}
    >
      {body}
    </a>
  )
}

/** Resolves IndexedDB file references to object URLs for the lifetime of the component. */
function useFileUrl(ref?: string) {
  const stored = !!ref?.startsWith(FILE_REF)
  const [resolved, setResolved] = useState<{ ref: string; url: string }>()
  useEffect(() => {
    if (!ref || !stored) return
    let objectUrl: string | undefined
    let alive = true
    loadFile(ref)
      .then((blob) => {
        if (!blob || !alive) return
        objectUrl = URL.createObjectURL(blob)
        setResolved({ ref, url: objectUrl })
      })
      .catch(() => undefined)
    return () => {
      alive = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [ref, stored])
  if (!stored) return ref
  return resolved && resolved.ref === ref ? resolved.url : undefined
}

const readAsDataURL = (file: Blob) =>
  new Promise<string>((resolve) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.readAsDataURL(file)
  })

async function compressImage(file: File) {
  const img = new Image()
  img.src = await readAsDataURL(file)
  await img.decode()
  const scale = Math.min(1, 1024 / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = img.width * scale
  canvas.height = img.height * scale
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.7)
}

async function storeFile(file: File) {
  try {
    return await saveFile(file)
  } catch {
    return file.size < 300_000 ? await readAsDataURL(file) : undefined
  }
}

export async function fileToAttachment(file: File): Promise<Attachment> {
  if (file.type.startsWith('image/')) return { type: 'image', name: file.name, url: await compressImage(file) }
  return { type: 'file', name: file.name, size: file.size, url: await storeFile(file) }
}

export function AttachmentPicker({ value, onChange }: { value: Attachment[]; onChange: (a: Attachment[]) => void }) {
  const { t } = useT()
  const fileRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLInputElement>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [link, setLink] = useState('')

  const addFiles = async (files: FileList | null) => {
    if (!files) return
    const added = await Promise.all([...files].map(fileToAttachment))
    onChange([...value, ...added])
  }

  const addLink = () => {
    const url = link.trim()
    if (!url) return
    onChange([...value, { type: 'link', url: /^https?:\/\//.test(url) ? url : `https://${url}` }])
    setLink('')
    setLinkOpen(false)
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((a, i) => (
            <span key={i} className="relative">
              {a.type === 'image' ? (
                <img src={a.url} className="size-16 rounded-lg object-cover" />
              ) : (
                <span className="inline-flex max-w-52 items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs" dir="ltr">
                  {a.type === 'link' ? <Link2 className="size-3" /> : <FileText className="size-3" />}
                  <span className="truncate">{a.type === 'link' ? a.url : a.name}</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -end-1.5 rounded-full bg-slate-700 p-0.5 text-white"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {linkOpen && (
        <div className="flex gap-2">
          <input
            className="input"
            dir="ltr"
            autoFocus
            placeholder={t('pasteLink')}
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
          />
          <button type="button" className="btn-primary" onClick={addLink}>{t('add')}</button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-ghost !px-3 !py-1.5" onClick={() => imgRef.current?.click()}>
          <ImageIcon className="size-4" /> {t('attachImage')}
        </button>
        <button type="button" className="btn-ghost !px-3 !py-1.5" onClick={() => fileRef.current?.click()}>
          <Paperclip className="size-4" /> {t('attachFile')}
        </button>
        <button type="button" className="btn-ghost !px-3 !py-1.5" onClick={() => setLinkOpen((v) => !v)}>
          <Link2 className="size-4" /> {t('addLink')}
        </button>
      </div>
      <input ref={imgRef} type="file" accept="image/*" multiple hidden onChange={(e) => (addFiles(e.target.files), (e.target.value = ''))} />
      <input ref={fileRef} type="file" multiple hidden onChange={(e) => (addFiles(e.target.files), (e.target.value = ''))} />
    </div>
  )
}

export function FileDropzone({ onFiles, compact }: { onFiles: (a: Attachment[]) => void; compact?: boolean }) {
  const { t } = useT()
  const ref = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const add = async (files: FileList | null) => {
    if (files?.length) onFiles(await Promise.all([...files].map(fileToAttachment)))
  }
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => ref.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && ref.current?.click()}
      onDragOver={(e) => (e.preventDefault(), setOver(true))}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => (e.preventDefault(), setOver(false), add(e.dataTransfer.files))}
      className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed text-center transition ${compact ? 'p-3' : 'p-6'} ${over ? 'border-teal-600 bg-teal-50' : 'border-slate-300 bg-slate-50 hover:border-teal-500 hover:bg-teal-50/40'}`}
    >
      <UploadCloud className={`text-teal-700 ${compact ? 'size-5' : 'size-8'}`} />
      <div className="text-sm font-semibold text-slate-700">{compact ? t('addFiles') : t('dropContract')}</div>
      {!compact && <div className="text-xs text-slate-400">{t('dropHint')}</div>}
      <input
        ref={ref}
        type="file"
        multiple
        hidden
        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
        onChange={(e) => (add(e.target.files), (e.target.value = ''))}
      />
    </div>
  )
}

export function MultiToggle<T extends string>({
  options,
  value,
  onChange,
  render,
}: {
  options: T[]
  value: T[]
  onChange: (v: T[]) => void
  render: (o: T) => React.ReactNode
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o)
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={`rounded-xl border px-3 py-1.5 text-sm transition ${on ? 'border-teal-600 bg-teal-50 font-semibold text-teal-800 ring-2 ring-teal-600/20' : 'border-slate-300 bg-white text-slate-600'}`}
          >
            {render(o)}
          </button>
        )
      })}
    </div>
  )
}

const statusStyle: Record<SubmittalStatus, string> = {
  review: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  resubmit: 'bg-orange-100 text-orange-800',
  rejected: 'bg-red-100 text-red-700',
}

export function SubmittalStatusBadge({ s }: { s: Submittal }) {
  const { t } = useT()
  const status = submittalStatus(s)
  const r = latestRevision(s)
  if (status === 'review' && Date.now() > reviewDueAt(r))
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
        <AlertTriangle className="size-3" /> {t('overdue')}
      </span>
    )
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusStyle[status]}`}>{t(`ss_${status}`)}</span>
}

const codeStyle: Record<ApprovalCode, string> = {
  A: 'bg-emerald-600',
  B: 'bg-teal-500',
  C: 'bg-orange-500',
  D: 'bg-red-600',
}

export function CodeBadge({ code, withLabel }: { code: ApprovalCode; withLabel?: boolean }) {
  const { t } = useT()
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
      <span className={`inline-flex size-6 items-center justify-center rounded-md font-bold text-white ${codeStyle[code]}`}>{code}</span>
      {withLabel && t(`code_${code}`)}
    </span>
  )
}

const contractStyle: Record<ContractStatus, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  expiring: 'bg-amber-100 text-amber-800',
  expired: 'bg-slate-200 text-slate-600',
}

export function ContractStatusBadge({ c }: { c: Contract }) {
  const { t } = useT()
  const status = contractStatus(c)
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${contractStyle[status]}`}>{t(`cs_${status}`)}</span>
}

export function formatMoney(value: number, lang: Lang) {
  return `${Math.round(value).toLocaleString('en')} ${lang === 'ar' ? 'ج.م' : 'EGP'}`
}

export function NotFound() {
  const { t } = useT()
  return (
    <div className="mx-auto max-w-md space-y-3 py-16 text-center">
      <div className="text-6xl font-bold text-slate-200">404</div>
      <h1 className="text-xl font-bold">{t('notFound')}</h1>
      <p className="text-sm text-slate-500">{t('notFoundHint')}</p>
      <Link to="/" className="btn-primary">{t('backHome')}</Link>
    </div>
  )
}

export function Empty({ text }: { text?: Localized | string }) {
  const { t, l } = useT()
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
      {text ? (typeof text === 'string' ? text : l(text)) : t('noItems')}
    </div>
  )
}
