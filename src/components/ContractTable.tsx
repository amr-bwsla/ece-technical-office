import { Paperclip } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useT } from '../i18n'
import { paidPercent, useStore } from '../store'
import type { Contract } from '../types'
import { ContractStatusBadge, Empty, formatMoney } from './ui'

export default function ContractTable({ items, showProject = true }: { items: Contract[]; showProject?: boolean }) {
  const { t, lang, tx } = useT()
  const navigate = useNavigate()
  const projects = useStore((s) => s.projects)
  if (!items.length) return <Empty />
  const formatDate = (d: number) => new Intl.DateTimeFormat(lang, { dateStyle: 'medium' }).format(d)

  return (
    <>
      <div className="space-y-3 md:hidden">
        {items.map((c) => {
          const project = projects.find((p) => p.id === c.projectId)
          const paid = paidPercent(c)
          return (
            <button key={c.id} onClick={() => navigate(`/contracts/${c.id}`)} className="card block w-full text-start transition active:scale-[.99]">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-[11px] font-semibold text-slate-500" dir="ltr">{c.number}</span>
                <ContractStatusBadge c={c} />
              </div>
              <div className="mt-1.5 font-semibold leading-snug">{tx(c.title)}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-slate-400">
                {t(`ck_${c.kind}`)} · <Paperclip className="size-3" /> {c.attachments.length}
                {showProject && project && <> · {tx(project.name)}</>}
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] text-slate-400">{t('contractValue')}</div>
                  <div className="font-bold">{formatMoney(c.value, lang)}</div>
                </div>
                <div className="text-end text-[11px] text-slate-400">
                  {t('endsAt')}
                  <div className="font-semibold text-slate-600">{formatDate(c.endsAt)}</div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${paid}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-600">{paid}%</span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="card hidden overflow-x-auto !p-0 md:block">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="p-3 text-start">{t('contractNo')}</th>
              <th className="p-3 text-start">{t('contractTitle')}</th>
              {showProject && <th className="p-3 text-start">{t('project')}</th>}
              <th className="p-3 text-end">{t('contractValue')}</th>
              <th className="p-3 text-start">{t('collected')}</th>
              <th className="p-3 text-start">{t('endsAt')}</th>
              <th className="p-3 text-start" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((c) => {
              const project = projects.find((p) => p.id === c.projectId)
              const paid = paidPercent(c)
              return (
                <tr key={c.id} onClick={() => navigate(`/contracts/${c.id}`)} className="cursor-pointer hover:bg-teal-50/40">
                  <td className="whitespace-nowrap p-3 font-mono text-xs font-semibold text-slate-600" dir="ltr">{c.number}</td>
                  <td className="p-3">
                    <div className="font-semibold">{tx(c.title)}</div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      {t(`ck_${c.kind}`)} · <Paperclip className="size-3" /> {c.attachments.length}
                    </div>
                  </td>
                  {showProject && (
                    <td className="p-3 text-xs">
                      <div className="text-slate-700">{project && tx(project.name)}</div>
                      <div className="text-slate-400">{project && tx(project.client)}</div>
                    </td>
                  )}
                  <td className="whitespace-nowrap p-3 text-end font-semibold">{formatMoney(c.value, lang)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${paid}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-600">{paid}%</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap p-3 text-xs text-slate-600">{formatDate(c.endsAt)}</td>
                  <td className="p-3"><ContractStatusBadge c={c} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
