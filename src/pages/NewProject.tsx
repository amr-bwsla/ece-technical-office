import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DeptChip, MultiToggle } from '../components/ui'
import { useT } from '../i18n'
import { cat, departments, users } from '../seed'
import { deptById, useStore } from '../store'

const managers = users.filter((u) => u.departmentId === 'mgmt' || u.role === 'head')
const categories = Object.values(cat)

export default function NewProject() {
  const { t, l } = useT()
  const navigate = useNavigate()
  const templates = useStore((s) => s.templates)
  const createProject = useStore((s) => s.createProject)
  const count = useStore((s) => s.projects.length)

  const [name, setName] = useState('')
  const [code, setCode] = useState(`ECE-EG-26-${130 + count}`)
  const [client, setClient] = useState('')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState(0)
  const [managerId, setManagerId] = useState(managers[0].id)
  const [deadline, setDeadline] = useState(() => new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10))
  const [deptIds, setDeptIds] = useState(departments.map((d) => d.id))
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '')

  const pickTemplate = (id: string) => {
    setTemplateId(id)
    const tpl = templates.find((x) => x.id === id)
    if (tpl) setDeptIds((prev) => [...new Set([...prev, ...tpl.steps.map((s) => s.departmentId)])])
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = createProject({
      name,
      code,
      client,
      location,
      category: categories[category],
      managerId,
      deadline: new Date(deadline).getTime(),
      departmentIds: deptIds,
      templateId: templateId || undefined,
    })
    navigate(`/projects/${id}`)
  }

  const tpl = templates.find((x) => x.id === templateId)

  return (
    <form onSubmit={submit} className="card mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">{t('newProject')}</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="label">{t('projectName')}</label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('projectCode')}</label>
          <input className="input" dir="ltr" required value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="label">{t('client')}</label>
          <input className="input" value={client} onChange={(e) => setClient(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('location')}</label>
          <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('category')}</label>
          <select className="input" value={category} onChange={(e) => setCategory(Number(e.target.value))}>
            {categories.map((c, i) => <option key={i} value={i}>{l(c)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t('deadline')}</label>
          <input className="input" type="date" required value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">{t('projectManager')}</label>
        <select className="input" value={managerId} onChange={(e) => setManagerId(e.target.value)}>
          {managers.map((u) => <option key={u.id} value={u.id}>{l(u.name)} — {l(deptById(u.departmentId).name)}</option>)}
        </select>
      </div>
      <div>
        <label className="label">{t('workflowTemplate')}</label>
        <select className="input" value={templateId} onChange={(e) => pickTemplate(e.target.value)}>
          <option value="">{t('none')}</option>
          {templates.map((x) => <option key={x.id} value={x.id}>{l(x.name)}</option>)}
        </select>
        {tpl && (
          <ol className="mt-2 flex flex-wrap items-center gap-1 text-xs text-slate-500">
            {tpl.steps.map((s, i) => (
              <li key={s.id} className="flex items-center gap-1">
                {i > 0 && <span className="inline-block rtl:rotate-180">›</span>}
                <DeptChip id={s.departmentId} />
              </li>
            ))}
          </ol>
        )}
      </div>
      <div>
        <label className="label">{t('departments')}</label>
        <MultiToggle options={departments.map((d) => d.id)} value={deptIds} onChange={setDeptIds} render={(id) => l(departments.find((d) => d.id === id)!.name)} />
      </div>
      <button className="btn-primary w-full" disabled={!name || !deptIds.length}>{t('startProject')}</button>
    </form>
  )
}
