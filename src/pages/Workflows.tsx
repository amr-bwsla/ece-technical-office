import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { DeptChip, Empty } from '../components/ui'
import { useT } from '../i18n'
import { departments } from '../seed'
import { uid, useMe, useStore } from '../store'
import type { WorkflowTemplate } from '../types'

const blank = (): WorkflowTemplate => ({
  id: uid(),
  name: { ar: '', en: '' },
  steps: [{ id: uid(), title: { ar: '', en: '' }, departmentId: departments[0].id, slaHours: 24 }],
})

function Editor({ initial, onDone }: { initial: WorkflowTemplate; onDone: () => void }) {
  const { t, l, lang } = useT()
  const saveTemplate = useStore((s) => s.saveTemplate)
  const [tpl, setTpl] = useState(initial)

  const setName = (v: string) => setTpl({ ...tpl, name: { ...tpl.name, [lang]: v } })
  const updateStep = (i: number, patch: Partial<WorkflowTemplate['steps'][number]>) =>
    setTpl({ ...tpl, steps: tpl.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) })
  const move = (i: number, dir: -1 | 1) => {
    const steps = [...tpl.steps]
    ;[steps[i], steps[i + dir]] = [steps[i + dir], steps[i]]
    setTpl({ ...tpl, steps })
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const fill = <T extends { ar: string; en: string }>(v: T) => ({ ar: v.ar || v.en, en: v.en || v.ar })
    saveTemplate({ ...tpl, name: fill(tpl.name), steps: tpl.steps.map((s) => ({ ...s, title: fill(s.title) })) })
    onDone()
  }

  return (
    <form onSubmit={save} className="card space-y-4 border-teal-300">
      <div>
        <label className="label">{t('templateName')}</label>
        <input className="input" required value={tpl.name[lang]} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="label">{t('steps')}</label>
        {tpl.steps.map((s, i) => (
          <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">{i + 1}</span>
            <input
              className="input min-w-40 flex-1"
              required
              placeholder={t('stepTitle')}
              value={s.title[lang]}
              onChange={(e) => updateStep(i, { title: { ...s.title, [lang]: e.target.value } })}
            />
            <select className="input !w-auto" value={s.departmentId} onChange={(e) => updateStep(i, { departmentId: e.target.value })}>
              {departments.map((d) => <option key={d.id} value={d.id}>{l(d.name)}</option>)}
            </select>
            <label className="flex items-center gap-1 text-xs text-slate-500">
              <input
                type="number"
                min={1}
                className="input !w-20"
                value={s.slaHours}
                onChange={(e) => updateStep(i, { slaHours: Number(e.target.value) })}
              />
              {t('hours')}
            </label>
            <div className="flex">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="rounded-lg p-1.5 hover:bg-slate-200 disabled:opacity-30"><ArrowUp className="size-4" /></button>
              <button type="button" disabled={i === tpl.steps.length - 1} onClick={() => move(i, 1)} className="rounded-lg p-1.5 hover:bg-slate-200 disabled:opacity-30"><ArrowDown className="size-4" /></button>
              <button
                type="button"
                disabled={tpl.steps.length === 1}
                onClick={() => setTpl({ ...tpl, steps: tpl.steps.filter((_, j) => j !== i) })}
                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn-ghost"
          onClick={() =>
            setTpl({ ...tpl, steps: [...tpl.steps, { id: uid(), title: { ar: '', en: '' }, departmentId: departments[0].id, slaHours: 24 }] })
          }
        >
          <Plus className="size-4" /> {t('addStep')}
        </button>
      </div>
      <div className="flex gap-2">
        <button className="btn-primary">{t('save')}</button>
        <button type="button" className="btn-ghost" onClick={onDone}>{t('cancel')}</button>
      </div>
    </form>
  )
}

export default function Workflows() {
  const { t, l } = useT()
  const me = useMe()
  const templates = useStore((s) => s.templates)
  const deleteTemplate = useStore((s) => s.deleteTemplate)
  const [editing, setEditing] = useState<WorkflowTemplate | null>(null)

  if (me.role !== 'admin') return <Empty text={t('adminOnly')} />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('workflows')}</h1>
        {!editing && (
          <button className="btn-primary" onClick={() => setEditing(blank())}>
            <Plus className="size-4" /> {t('newTemplate')}
          </button>
        )}
      </div>
      {editing && <Editor key={editing.id} initial={editing} onDone={() => setEditing(null)} />}
      {templates.map((tpl) => (
        <div key={tpl.id} className="card space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold">{l(tpl.name)}</h2>
            <div className="flex">
              <button onClick={() => setEditing(tpl)} className="rounded-lg p-2 hover:bg-slate-100"><Pencil className="size-4" /></button>
              <button onClick={() => confirm(t('confirmDeleteTemplate')) && deleteTemplate(tpl.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="size-4" /></button>
            </div>
          </div>
          <ol className="flex flex-wrap items-stretch gap-2">
            {tpl.steps.map((s, i) => (
              <li key={s.id} className="flex items-center gap-2">
                {i > 0 && <span className="inline-block text-slate-300 rtl:rotate-180">›</span>}
                <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="text-sm font-semibold">{i + 1}. {l(s.title)}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <DeptChip id={s.departmentId} /> {s.slaHours} {t('hours')}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  )
}
