import { Plus, Trash2, Upload, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AttachmentView, Empty, FileDropzone, formatMoney } from '../components/ui'
import { useT } from '../i18n'
import { paymentPlans } from '../seed'
import { canManageContracts, useMe, useStore } from '../store'
import type { Attachment, ContractKind } from '../types'

const DAY = 86_400_000
const toInput = (ts: number) => new Date(ts - new Date(ts).getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
const fromInput = (v: string) => new Date(`${v}T12:00:00`).getTime()
const planFor = (kind: ContractKind) => paymentPlans[kind].map(([title, percent]) => ({ title, percent }))

export default function NewContract() {
  const { t, lang, tx } = useT()
  const me = useMe()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const projects = useStore((s) => s.projects)
  const createContract = useStore((s) => s.createContract)

  const initialProject = projects.find((p) => p.id === params.get('project')) ?? projects[0]
  const [projectId, setProjectId] = useState(initialProject?.id ?? '')
  const [kind, setKind] = useState<ContractKind>('design')
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const [signedAt, setSignedAt] = useState(() => toInput(Date.now()))
  const [endsAt, setEndsAt] = useState(() => toInput(Date.now() + 365 * DAY))
  const [scope, setScope] = useState('')
  const [payments, setPayments] = useState(() => planFor('design'))
  const [files, setFiles] = useState<Attachment[]>([])

  if (!canManageContracts(me)) return <Empty text={t('contractsOnly')} />

  const total = payments.reduce((s, m) => s + (Number(m.percent) || 0), 0)
  const amount = Number(value) || 0
  const valid = projectId && title.trim() && amount > 0 && total === 100 && files.length > 0 && fromInput(endsAt) > fromInput(signedAt)

  const pickKind = (k: ContractKind) => {
    setKind(k)
    setPayments(planFor(k))
  }
  const updatePayment = (i: number, patch: Partial<{ title: string; percent: number }>) =>
    setPayments(payments.map((m, j) => (j === i ? { ...m, ...patch } : m)))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = createContract({
      projectId,
      kind,
      title: title.trim(),
      value: amount,
      signedAt: fromInput(signedAt),
      endsAt: fromInput(endsAt),
      scope: scope.trim(),
      payments: payments.map((m) => ({ title: m.title.trim(), percent: Number(m.percent) })),
      attachments: files,
    })
    navigate(`/contracts/${id}`)
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-4">
      <div className="card space-y-4">
        <div>
          <h1 className="text-xl font-bold">{t('uploadContract')}</h1>
          <p className="text-xs text-slate-500">{t('contractsHint')}</p>
        </div>

        <FileDropzone onFiles={(a) => setFiles([...files, ...a])} />
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((a, i) => (
              <span key={i} className="relative">
                <AttachmentView a={a} />
                <button
                  type="button"
                  onClick={() => setFiles(files.filter((_, j) => j !== i))}
                  className="absolute -top-1.5 -end-1.5 rounded-full bg-slate-700 p-0.5 text-white"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">{t('project')}</label>
            <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {tx(p.name)}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">{t('contractKind')}</label>
            <div className="grid grid-cols-3 gap-2">
              {(['design', 'supervision', 'addendum'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => pickKind(k)}
                  className={`rounded-xl border px-2 py-2 text-xs font-semibold ${kind === k ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-600/20' : 'border-slate-300 text-slate-600'}`}
                >
                  {t(`ck_${k}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="label">{t('contractTitle')}</label>
            <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('contractValue')}</label>
            <div className="relative" dir="ltr">
              <input className="input !pe-12" type="number" min={1} required value={value} onChange={(e) => setValue(e.target.value)} />
              <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">EGP</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">{t('signedAt')}</label>
              <input className="input" type="date" required value={signedAt} onChange={(e) => setSignedAt(e.target.value)} />
            </div>
            <div>
              <label className="label">{t('endsAt')}</label>
              <input className="input" type="date" required min={signedAt} value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="label">{t('scope')}</label>
            <textarea className="input min-h-20" value={scope} onChange={(e) => setScope(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{t('payments')}</h2>
          <span className={`text-xs font-bold ${total === 100 ? 'text-emerald-700' : 'text-red-600'}`}>
            {t('percentTotal')}: {total}%
          </span>
        </div>
        {payments.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 text-center text-xs font-bold text-slate-400">{i + 1}</span>
            <input className="input flex-1" required value={m.title} onChange={(e) => updatePayment(i, { title: e.target.value })} />
            <div className="relative w-24 shrink-0" dir="ltr">
              <input
                className="input !pe-7"
                type="number"
                min={1}
                max={100}
                value={m.percent}
                onChange={(e) => updatePayment(i, { percent: Number(e.target.value) })}
              />
              <span className="absolute end-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
            </div>
            <span className="hidden w-32 shrink-0 text-end text-xs text-slate-500 sm:block">
              {formatMoney((amount * (Number(m.percent) || 0)) / 100, lang)}
            </span>
            <button
              type="button"
              disabled={payments.length === 1}
              onClick={() => setPayments(payments.filter((_, j) => j !== i))}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        <button type="button" className="btn-ghost !py-1.5" onClick={() => setPayments([...payments, { title: '', percent: Math.max(0, 100 - total) }])}>
          <Plus className="size-4" /> {t('addMilestone')}
        </button>
        {total !== 100 && <p className="text-xs text-red-600">{t('percentMustBe100')}</p>}
      </div>

      <button className="btn-primary w-full" disabled={!valid}>
        <Upload className="size-4" /> {t('uploadContract')}
      </button>
    </form>
  )
}
