import { Check, Trash2, Undo2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AttachmentView, Avatar, ContractStatusBadge, Empty, FileDropzone, formatMoney, NotFound } from '../components/ui'
import { timeAgo, useT } from '../i18n'
import { canManageContracts, paidPercent, useMe, userById, useStore } from '../store'

export default function ContractDetail() {
  const { id } = useParams()
  const { t, l, lang, tx } = useT()
  const me = useMe()
  const contract = useStore((s) => s.contracts.find((c) => c.id === id))
  const projects = useStore((s) => s.projects)
  const togglePayment = useStore((s) => s.togglePayment)
  const addContractFiles = useStore((s) => s.addContractFiles)
  const deleteContract = useStore((s) => s.deleteContract)
  const navigate = useNavigate()

  if (!canManageContracts(me)) return <Empty text={t('contractsOnly')} />
  if (!contract) return <NotFound />

  const project = projects.find((p) => p.id === contract.projectId)
  const paid = paidPercent(contract)
  const collected = (contract.value * paid) / 100
  const date = (ts: number) => new Intl.DateTimeFormat(lang, { dateStyle: 'medium' }).format(ts)
  const money = (v: number) => formatMoney(v, lang)

  return (
    <div className="space-y-5">
      <div className="card space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span className="font-mono" dir="ltr">{contract.number}</span>
              <span className="rounded bg-slate-100 px-1.5 text-slate-500">{t(`ck_${contract.kind}`)}</span>
            </div>
            <h1 className="text-xl font-bold">{tx(contract.title)}</h1>
            {project && (
              <Link to={`/projects/${project.id}`} className="text-sm text-teal-700 hover:underline">
                {tx(project.name)} — {tx(project.client)}
              </Link>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <ContractStatusBadge c={contract} />
            {me.role === 'admin' && (
              <button
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 hover:bg-red-50 hover:text-red-600"
                onClick={() => {
                  if (!confirm(t('confirmDeleteContract'))) return
                  deleteContract(contract.id)
                  navigate('/contracts', { replace: true })
                }}
              >
                <Trash2 className="size-3.5" /> {t('deleteContract')}
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-xs text-slate-400">{t('contractValue')}</div>
            <div className="text-lg font-bold text-teal-800">{money(contract.value)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">{t('signedAt')}</div>
            <div className="font-semibold">{date(contract.signedAt)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">{t('endsAt')}</div>
            <div className="font-semibold">{date(contract.endsAt)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">{t('uploadedBy')}</div>
            <div className="flex items-center gap-1.5 font-semibold">
              <Avatar userId={contract.uploadedBy} size="sm" />
              {l(userById(contract.uploadedBy).name)}
            </div>
            <div className="text-xs text-slate-400">{timeAgo(contract.uploadedAt, lang)}</div>
          </div>
        </div>
        {contract.scope && (
          <div>
            <div className="text-xs text-slate-400">{t('scope')}</div>
            <p className="text-sm leading-relaxed text-slate-700">{tx(contract.scope)}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="card space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">{t('payments')}</h2>
            <span className="text-xs font-bold text-emerald-700">{paid}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${paid}%` }} />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-emerald-700">{t('collected')}: <b>{money(collected)}</b></span>
            <span className="text-slate-500">{t('outstanding')}: <b>{money(contract.value - collected)}</b></span>
          </div>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {contract.payments.map((m, i) => (
              <div key={m.id} className="flex flex-wrap items-center gap-3 p-3">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${m.paidAt ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                  {m.paidAt ? <Check className="size-4" /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{tx(m.title)}</div>
                  <div className="text-xs text-slate-500">
                    {m.percent}% · {money((contract.value * m.percent) / 100)}
                    {m.paidAt && m.paidBy && (
                      <span className="text-emerald-700"> · {t('paid')} {date(m.paidAt)} — {l(userById(m.paidBy).name)}</span>
                    )}
                  </div>
                </div>
                {m.paidAt ? (
                  <button className="btn-ghost !px-2.5 !py-1 text-xs text-slate-500" onClick={() => togglePayment(contract.id, m.id)}>
                    <Undo2 className="size-3.5" /> {t('undoPaid')}
                  </button>
                ) : (
                  <button className="btn-primary !px-3 !py-1.5 text-xs" onClick={() => togglePayment(contract.id, m.id)}>
                    <Check className="size-3.5" /> {t('markPaid')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="card space-y-3">
          <h2 className="font-bold">{t('contractFiles')} <span className="text-sm font-normal text-slate-400">({contract.attachments.length})</span></h2>
          <div className="flex flex-col items-start gap-2">
            {contract.attachments.map((a, i) => <AttachmentView key={i} a={a} />)}
          </div>
          <FileDropzone compact onFiles={(a) => addContractFiles(contract.id, a)} />
        </section>
      </div>
    </div>
  )
}
