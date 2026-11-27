import { FileSpreadsheet, Printer } from 'lucide-react'
import { useState } from 'react'
import { Avatar, formatMoney } from '../components/ui'
import { type DictKey, formatDuration, useT } from '../i18n'
import { departments, H, users } from '../seed'
import { canManageContracts, isOverdue, paidPercent, respondedLate, submittalStatus, useMe, useStore } from '../store'

type Period = 'last7' | 'last30' | 'last90' | 'allTime'
const periodDays: Record<Period, number> = { last7: 7, last30: 30, last90: 90, allTime: Infinity }

type Section = { title: string; headers: string[]; rows: (string | number)[][] }

function downloadCsv(filename: string, sections: Section[]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const body = sections
    .map((s) => [esc(s.title), s.headers.map(esc).join(','), ...s.rows.map((r) => r.map(esc).join(','))].join('\r\n'))
    .join('\r\n\r\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF' + body], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : null)

function Pct({ v }: { v: number | null }) {
  if (v === null) return <>—</>
  const cls = v >= 80 ? 'bg-emerald-100 text-emerald-800' : v >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${cls}`}>{v}%</span>
}

export default function Reports() {
  const { t, l, lang, tx } = useT()
  const allInquiries = useStore((s) => s.inquiries)
  const projects = useStore((s) => s.projects)
  const allSubmittals = useStore((s) => s.submittals)
  const contracts = useStore((s) => s.contracts)
  const showContracts = canManageContracts(useMe())
  const [period, setPeriod] = useState<Period>('last30')

  const now = Date.now()
  const since = now - periodDays[period] * 24 * H
  const inquiries = allInquiries.filter((i) => i.createdAt >= since)
  const submittals = allSubmittals.filter((s) => s.revisions[0].submittedAt >= since)
  const dur = (ms: number) => (ms ? formatDuration(ms, lang) : '—')

  const deptRows = departments.map((d) => {
    const received = inquiries.filter((i) => i.toDeptIds.includes(d.id))
    const answered = received.filter((i) => i.firstResponseAt)
    const onTime = received.filter((i) => i.firstResponseAt && !respondedLate(i)).length
    const breached = received.filter((i) => respondedLate(i) || isOverdue(i)).length
    return {
      d,
      received: received.length,
      avg: avg(answered.map((i) => i.firstResponseAt! - i.createdAt)),
      compliance: pct(onTime, onTime + breached),
      open: received.filter((i) => i.status === 'open').length,
    }
  })

  const stageRows = departments.map((d) => {
    const done = projects.flatMap((p) => p.steps).filter((s) => s.departmentId === d.id && s.completedAt && s.startedAt && s.completedAt >= since)
    const durations = done.map((s) => s.completedAt! - s.startedAt!)
    const late = done.filter((s) => s.completedAt! - s.startedAt! > s.slaHours * H).length
    const returns = projects.reduce(
      (n, p) => n + (p.log ?? []).filter((e) => e.type === 'return' && e.at >= since && p.steps.find((s) => s.id === e.toStepId)?.departmentId === d.id).length,
      0,
    )
    return { d, done: done.length, avg: avg(durations), compliance: pct(done.length - late, done.length), returns }
  })

  const engineerRows = users
    .map((u) => {
      const firsts = inquiries.filter((i) => i.firstResponseAt && i.messages.find((m) => m.createdAt === i.firstResponseAt)?.senderId === u.id)
      return {
        u,
        replies: firsts.length,
        avg: avg(firsts.map((i) => i.firstResponseAt! - i.createdAt)),
        compliance: pct(firsts.filter((i) => !respondedLate(i)).length, firsts.length),
      }
    })
    .filter((r) => r.replies > 0)
    .sort((a, b) => b.replies - a.replies)

  const submittalRows = departments
    .filter((d) => d.id !== 'mgmt')
    .map((d) => {
      const list = submittals.filter((s) => s.departmentId === d.id)
      const firstReviewed = list.filter((s) => s.revisions[0].code)
      const firstApproved = firstReviewed.filter((s) => ['A', 'B'].includes(s.revisions[0].code!))
      const reviewTimes = list.flatMap((s) => s.revisions.filter((r) => r.reviewedAt).map((r) => r.reviewedAt! - r.submittedAt))
      return {
        d,
        total: list.length,
        review: list.filter((s) => submittalStatus(s) === 'review').length,
        approved: list.filter((s) => submittalStatus(s) === 'approved').length,
        firstTime: pct(firstApproved.length, firstReviewed.length),
        avgReview: avg(reviewTimes),
      }
    })

  const collectionRows = showContracts
    ? projects
        .map((p) => {
          const list = contracts.filter((c) => c.projectId === p.id)
          const value = list.reduce((s, c) => s + c.value, 0)
          const collected = list.reduce((s, c) => s + (c.value * paidPercent(c)) / 100, 0)
          return { p, count: list.length, value, collected, share: pct(collected, value) }
        })
        .filter((r) => r.count)
        .sort((a, b) => b.value - b.collected - (a.value - a.collected))
    : []

  const maxAvg = Math.max(...deptRows.map((r) => r.avg), 1)
  const overallAvg = avg(inquiries.filter((i) => i.firstResponseAt).map((i) => i.firstResponseAt! - i.createdAt))

  const kpis = [
    { label: t('totalInquiries'), value: inquiries.length },
    { label: t('openCount'), value: inquiries.filter((i) => i.status === 'open').length },
    { label: t('overdue'), value: inquiries.filter((i) => isOverdue(i)).length },
    { label: t('overallAvg'), value: dur(overallAvg) },
  ]

  const exportExcel = () => {
    const pc = (v: number | null) => (v === null ? '—' : `${v}%`)
    downloadCsv(`technical-office-report-${new Date().toISOString().slice(0, 10)}.csv`, [
      { title: `${t('reports')} — ${t(period)}`, headers: kpis.map((k) => k.label), rows: [kpis.map((k) => k.value)] },
      {
        title: t('slaCompliance'),
        headers: [t('department'), t('received'), t('openCount'), t('avgShort'), t('slaCompliance')],
        rows: deptRows.map((r) => [l(r.d.name), r.received, r.open, dur(r.avg), pc(r.compliance)]),
      },
      {
        title: t('stagePerformance'),
        headers: [t('department'), t('stagesDone'), t('avgStage'), t('slaCompliance'), t('returnedTimes')],
        rows: stageRows.map((r) => [l(r.d.name), r.done, dur(r.avg), pc(r.compliance), r.returns]),
      },
      {
        title: t('engineerPerformance'),
        headers: [t('engineer'), t('department'), t('replies'), t('avgShort'), t('slaCompliance')],
        rows: engineerRows.map((r) => [l(r.u.name), l(departments.find((d) => d.id === r.u.departmentId)!.name), r.replies, dur(r.avg), pc(r.compliance)]),
      },
      {
        title: t('submittalStats'),
        headers: [t('department'), t('submittals'), t('ss_review'), t('ss_approved'), t('firstTimeApproval'), t('avgShort')],
        rows: submittalRows.map((r) => [l(r.d.name), r.total, r.review, r.approved, pc(r.firstTime), dur(r.avgReview)]),
      },
      ...(showContracts
        ? [
            {
              title: t('collectionByProject'),
              headers: [t('projectCode'), t('project'), t('client'), t('contractsCount'), t('contractValue'), t('collected'), t('outstanding'), '%'],
              rows: collectionRows.map((r) => [r.p.code, tx(r.p.name), tx(r.p.client), r.count, Math.round(r.value), Math.round(r.collected), Math.round(r.value - r.collected), pc(r.share)]),
            },
          ]
        : []),
    ])
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-xl font-bold">{t('reports')}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {(Object.keys(periodDays) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${period === p ? 'bg-white text-teal-800 shadow' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t(p as DictKey)}
              </button>
            ))}
          </div>
          <button className="btn-ghost" onClick={exportExcel}><FileSpreadsheet className="size-4" /> {t('exportExcel')}</button>
          <button className="btn-ghost" onClick={() => window.print()}><Printer className="size-4" /> {t('exportPdf')}</button>
        </div>
      </div>

      <div className="hidden border-b-2 border-teal-700 pb-3 print:block">
        <h1 className="text-2xl font-bold">{t('appName')} — {t('reports')}</h1>
        <p className="text-sm text-slate-600">
          {t('period')}: {t(period)} · {t('reportDate')}: {new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeStyle: 'short' }).format(now)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="card">
            <div className="text-2xl font-bold">{k.value}</div>
            <div className="text-xs text-slate-500">{k.label}</div>
          </div>
        ))}
      </div>

      <section className="card space-y-4 break-inside-avoid">
        <h2 className="font-bold">{t('avgResponse')}</h2>
        {deptRows.map((r) => (
          <div key={r.d.id} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-semibold">{l(r.d.name)}</span>
              <span className="text-slate-500">{dur(r.avg)} · {r.received} {t('received')}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full" style={{ width: `${(r.avg / maxAvg) * 100}%`, backgroundColor: r.d.color }} />
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-5 lg:grid-cols-2 print:grid-cols-1">
        <section className="card overflow-x-auto break-inside-avoid">
          <h2 className="mb-3 font-bold">{t('slaCompliance')}</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="py-2 text-start">{t('department')}</th>
                <th className="py-2 text-center">{t('received')}</th>
                <th className="py-2 text-center">{t('openCount')}</th>
                <th className="py-2 text-center">{t('slaCompliance')}</th>
              </tr>
            </thead>
            <tbody>
              {deptRows.map((r) => (
                <tr key={r.d.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 font-semibold">{l(r.d.name)}</td>
                  <td className="py-2 text-center">{r.received}</td>
                  <td className="py-2 text-center">{r.open}</td>
                  <td className="py-2 text-center"><Pct v={r.compliance} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card overflow-x-auto break-inside-avoid">
          <h2 className="mb-3 font-bold">{t('stagePerformance')}</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="py-2 text-start">{t('department')}</th>
                <th className="py-2 text-center">{t('stagesDone')}</th>
                <th className="py-2 text-center">{t('avgStage')}</th>
                <th className="py-2 text-center">{t('slaCompliance')}</th>
                <th className="py-2 text-center">{t('returnedTimes')}</th>
              </tr>
            </thead>
            <tbody>
              {stageRows.map((r) => (
                <tr key={r.d.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 font-semibold">{l(r.d.name)}</td>
                  <td className="py-2 text-center">{r.done}</td>
                  <td className="py-2 text-center">{dur(r.avg)}</td>
                  <td className="py-2 text-center"><Pct v={r.compliance} /></td>
                  <td className={`py-2 text-center ${r.returns ? 'font-bold text-orange-700' : ''}`}>{r.returns}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card overflow-x-auto break-inside-avoid">
          <h2 className="mb-3 font-bold">{t('engineerPerformance')}</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="py-2 text-start">{t('engineer')}</th>
                <th className="py-2 text-center">{t('replies')}</th>
                <th className="py-2 text-center">{t('avgShort')}</th>
                <th className="py-2 text-center">{t('slaCompliance')}</th>
              </tr>
            </thead>
            <tbody>
              {engineerRows.map((r) => (
                <tr key={r.u.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2">
                    <span className="flex items-center gap-2 font-semibold"><Avatar userId={r.u.id} size="sm" />{l(r.u.name)}</span>
                  </td>
                  <td className="py-2 text-center">{r.replies}</td>
                  <td className="py-2 text-center">{dur(r.avg)}</td>
                  <td className="py-2 text-center"><Pct v={r.compliance} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card overflow-x-auto break-inside-avoid">
          <h2 className="mb-3 font-bold">{t('submittalStats')}</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="py-2 text-start">{t('department')}</th>
                <th className="py-2 text-center">{t('submittals')}</th>
                <th className="py-2 text-center">{t('ss_review')}</th>
                <th className="py-2 text-center">{t('firstTimeApproval')}</th>
                <th className="py-2 text-center">{t('avgShort')}</th>
              </tr>
            </thead>
            <tbody>
              {submittalRows.map((r) => (
                <tr key={r.d.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 font-semibold">{l(r.d.name)}</td>
                  <td className="py-2 text-center">{r.total}</td>
                  <td className="py-2 text-center">{r.review}</td>
                  <td className="py-2 text-center"><Pct v={r.firstTime} /></td>
                  <td className="py-2 text-center">{dur(r.avgReview)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {showContracts && (
        <section className="card overflow-x-auto break-inside-avoid">
          <h2 className="mb-3 font-bold">{t('collectionByProject')}</h2>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-xs text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="py-2 text-start">{t('project')}</th>
                <th className="py-2 text-center">{t('contractsCount')}</th>
                <th className="py-2 text-end">{t('contractValue')}</th>
                <th className="py-2 text-end">{t('collected')}</th>
                <th className="py-2 text-end">{t('outstanding')}</th>
                <th className="py-2 text-center">%</th>
              </tr>
            </thead>
            <tbody>
              {collectionRows.map((r) => (
                <tr key={r.p.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2">
                    <div className="font-semibold">{tx(r.p.name)}</div>
                    <div className="text-xs text-slate-400">{tx(r.p.client)}</div>
                  </td>
                  <td className="py-2 text-center">{r.count}</td>
                  <td className="whitespace-nowrap py-2 text-end">{formatMoney(r.value, lang)}</td>
                  <td className="whitespace-nowrap py-2 text-end text-emerald-700">{formatMoney(r.collected, lang)}</td>
                  <td className="whitespace-nowrap py-2 text-end font-semibold">{formatMoney(r.value - r.collected, lang)}</td>
                  <td className="py-2 text-center"><Pct v={r.share} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
