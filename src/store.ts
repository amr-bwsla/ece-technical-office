import { create } from 'zustand'
import { en } from './content'
import { clearFiles } from './files'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  contractManagers,
  contractNumber,
  departments,
  deptCode,
  dueAlerts,
  H,
  kindCode,
  latestRevision,
  reviewers,
  SLA_HOURS,
  seedData,
  submittalNumber,
  typeCode,
  users,
} from './seed'
import type {
  AppNotification,
  ApprovalCode,
  Attachment,
  Contract,
  Inquiry,
  Lang,
  Localized,
  NotificationType,
  Priority,
  Project,
  ProjectEvent,
  Submittal,
  SubmittalType,
  User,
  WorkflowTemplate,
} from './types'

export { latestRevision, reviewDueAt, submittalStatus, type SubmittalStatus } from './seed'
export { canManageContracts, contractStatus, paidPercent, type ContractStatus } from './seed'

export const ICON = `${import.meta.env.BASE_URL}icon.svg`
export const LOGO = `${import.meta.env.BASE_URL}ece-logo.jpg`

const uid = () => Math.random().toString(36).slice(2, 10)

export const userById = (id: string) => users.find((u) => u.id === id)!
export const deptById = (id: string) => departments.find((d) => d.id === id)!
export const usersInDepts = (deptIds: string[]) => users.filter((u) => deptIds.includes(u.departmentId))

export function inquiryRecipients(inq: Inquiry): User[] {
  return inq.assigneeIds.length ? inq.assigneeIds.map(userById) : usersInDepts(inq.toDeptIds)
}

export function isRecipient(inq: Inquiry, user: User) {
  return inq.assigneeIds.length
    ? inq.assigneeIds.includes(user.id) || (user.role === 'head' && inq.toDeptIds.includes(user.departmentId))
    : inq.toDeptIds.includes(user.departmentId)
}

export function isOverdue(inq: Inquiry, now = Date.now()) {
  return !inq.firstResponseAt && inq.status !== 'closed' && now > inq.dueAt
}

export function respondedLate(inq: Inquiry) {
  return !!inq.firstResponseAt && inq.firstResponseAt > inq.dueAt
}

export type ProjectStatus = 'active' | 'late' | 'done'

export function projectStatus(p: Project, now = Date.now()): ProjectStatus {
  if (p.steps.length && p.steps.every((s) => s.status === 'done')) return 'done'
  const active = p.steps.find((s) => s.status === 'active')
  const stepLate = !!active?.startedAt && now - active.startedAt > active.slaHours * H
  return stepLate || now > p.deadline ? 'late' : 'active'
}

export function projectProgress(p: Project) {
  return p.steps.length ? Math.round((p.steps.filter((s) => s.status === 'done').length / p.steps.length) * 100) : 0
}

type Toast = { text: Localized; at: number; alert?: boolean }

type NewNotification = { userIds: string[]; type: NotificationType; text: Localized; link: string }

type State = ReturnType<typeof seedData> & {
  lang: Lang
  currentUserId: string
  loggedIn: boolean
  toast: Toast | null
}

type Actions = {
  setLang: (lang: Lang) => void
  login: (id: string) => void
  logout: () => void
  resetDemo: () => void
  fastForward: (hours: number) => void
  dismissToast: () => void
  createProject: (
    p: Pick<Project, 'name' | 'code' | 'client' | 'location' | 'category' | 'managerId' | 'deadline' | 'departmentIds' | 'templateId'>,
  ) => string
  completeStep: (projectId: string, stepId: string) => void
  returnStep: (projectId: string, stepId: string, toStepId: string, note: string) => void
  checkDueAlerts: () => void
  createSubmittal: (s: { projectId: string; title: string; type: SubmittalType; note: string; attachments: Attachment[] }) => string
  reviewSubmittal: (id: string, code: ApprovalCode, comments: string) => void
  resubmit: (id: string, note: string, attachments: Attachment[]) => void
  createContract: (
    c: Pick<Contract, 'projectId' | 'kind' | 'title' | 'value' | 'signedAt' | 'endsAt' | 'scope' | 'attachments'> & {
      payments: { title: string; percent: number }[]
    },
  ) => string
  addContractFiles: (id: string, attachments: Attachment[]) => void
  deleteContract: (id: string) => void
  togglePayment: (contractId: string, milestoneId: string) => void
  reopenInquiry: (inquiryId: string) => void
  createInquiry: (i: {
    projectId: string
    title: string
    text: string
    toDeptIds: string[]
    assigneeIds: string[]
    priority: Priority
    attachments: Attachment[]
  }) => string
  sendMessage: (inquiryId: string, text: string, attachments: Attachment[]) => void
  closeInquiry: (inquiryId: string) => void
  saveTemplate: (t: WorkflowTemplate) => void
  deleteTemplate: (id: string) => void
  markRead: (id: string) => void
  markAllRead: () => void
}

const TIME_FIELDS = new Set([
  'createdAt',
  'dueAt',
  'firstResponseAt',
  'closedAt',
  'startedAt',
  'completedAt',
  'deadline',
  'at',
  'submittedAt',
  'reviewedAt',
  'signedAt',
  'endsAt',
  'uploadedAt',
  'paidAt',
])

function shiftTimes<T>(value: T, ms: number): T {
  if (Array.isArray(value)) return value.map((v) => shiftTimes(v, ms)) as T
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, TIME_FIELDS.has(k) && typeof v === 'number' ? v - ms : shiftTimes(v, ms)]),
  ) as T
}

function pushDeviceNotification(text: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    navigator.serviceWorker?.getRegistration().then((reg) => {
      if (reg) reg.showNotification('ECE — Technical Office', { body: text, icon: ICON })
      else new Notification('ECE — Technical Office', { body: text, icon: ICON })
    })
  }
}

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => {
      const notify = ({ userIds, type, text, link }: NewNotification) => {
        const me = get().currentUserId
        const targets = [...new Set(userIds)].filter((id) => id !== me)
      if (!targets.length) return
      const now = Date.now()
        const created: AppNotification[] = targets.map((userId) => ({
          id: uid(),
          userId,
          type,
          text,
          link,
          read: false,
          createdAt: now,
        }))
        const names = (lang: Lang) => {
          const shown = targets.slice(0, 4).map((id) => userById(id).name[lang]).join('، ')
          const rest = targets.length - 4
          return rest > 0 ? `${shown} ${lang === 'ar' ? `+${rest} آخرين` : `+${rest} more`}` : shown
        }
        const toastText = { ar: `تم إرسال إشعار إلى: ${names('ar')}`, en: `Notified: ${names('en')}` }
        set((s) => ({ notifications: [...created, ...s.notifications], toast: { text: toastText, at: now } }))
        pushDeviceNotification(text[get().lang])
      }

      return {
        ...seedData(),
        lang: 'en',
        currentUserId: 'u-civil-1',
        loggedIn: false,
        toast: null,

        setLang: (lang) => set({ lang }),
        login: (id) => set({ currentUserId: id, loggedIn: true }),
        logout: () => set({ loggedIn: false }),
        resetDemo: () => {
          clearFiles()
          set({ ...seedData(), toast: null })
        },
        fastForward: (hours) => {
          const ms = hours * H
          set((s) => ({
            projects: shiftTimes(s.projects, ms),
            inquiries: shiftTimes(s.inquiries, ms),
            submittals: shiftTimes(s.submittals, ms),
            contracts: shiftTimes(s.contracts, ms),
            notifications: shiftTimes(s.notifications, ms),
          }))
          get().checkDueAlerts()
        },
        dismissToast: () => set({ toast: null }),

        createProject: (p) => {
          const now = Date.now()
          const me = get().currentUserId
          const template = get().templates.find((t) => t.id === p.templateId)
          const project: Project = {
            ...p,
            id: uid(),
            createdBy: me,
            createdAt: now,
            steps: (template?.steps ?? []).map((s, i) => ({
              ...s,
              status: i === 0 ? 'active' : 'pending',
              startedAt: i === 0 ? now : undefined,
            })),
          }
          set((s) => ({ projects: [project, ...s.projects] }))
          notify({
            userIds: usersInDepts(p.departmentIds).map((u) => u.id),
            type: 'project',
            text: { ar: `مشروع جديد بدأ: ${p.name}`, en: `New project started: ${en(p.name)}` },
            link: `/projects/${project.id}`,
          })
          return project.id
        },

        completeStep: (projectId, stepId) => {
          const now = Date.now()
          const me = get().currentUserId
          const project = get().projects.find((p) => p.id === projectId)!
          const idx = project.steps.findIndex((s) => s.id === stepId)
          const steps = project.steps.map((s, i) => {
            if (i === idx) return { ...s, status: 'done' as const, completedAt: now, completedBy: me }
            if (i === idx + 1) return { ...s, status: 'active' as const, startedAt: now }
            return s
          })
          const event: ProjectEvent = { id: uid(), type: 'complete', stepId, by: me, at: now }
          set((s) => ({
            projects: s.projects.map((p) => (p.id === projectId ? { ...p, steps, log: [...(p.log ?? []), event] } : p)),
          }))
          const next = steps[idx + 1]
          if (next) {
            notify({
              userIds: [...usersInDepts([next.departmentId]).map((u) => u.id), project.createdBy],
              type: 'step',
              text: {
                ar: `دورك: بدأت خطوة "${next.title.ar}" في ${project.name}`,
                en: `Your turn: step "${next.title.en}" started on ${en(project.name)}`,
              },
              link: `/projects/${projectId}`,
            })
          } else {
            notify({
              userIds: usersInDepts(project.departmentIds).map((u) => u.id),
              type: 'step',
              text: { ar: `اكتمل مسار العمل في ${project.name}`, en: `Workflow completed on ${en(project.name)}` },
              link: `/projects/${projectId}`,
            })
          }
        },

        returnStep: (projectId, stepId, toStepId, note) => {
          const now = Date.now()
          const me = get().currentUserId
          const project = get().projects.find((p) => p.id === projectId)!
          const from = project.steps.findIndex((s) => s.id === stepId)
          const to = project.steps.findIndex((s) => s.id === toStepId)
          const steps = project.steps.map((s, i) => {
            if (i === to) return { ...s, status: 'active' as const, startedAt: now, completedAt: undefined, completedBy: undefined }
            if (i > to && i <= from) return { ...s, status: 'pending' as const, startedAt: undefined, completedAt: undefined, completedBy: undefined }
            return s
          })
          const event: ProjectEvent = { id: uid(), type: 'return', stepId, toStepId, by: me, at: now, note }
          set((s) => ({
            projects: s.projects.map((p) => (p.id === projectId ? { ...p, steps, log: [...(p.log ?? []), event] } : p)),
          }))
          const target = steps[to]
          const source = steps[from]
          notify({
            userIds: [...usersInDepts([target.departmentId]).map((u) => u.id), project.managerId],
            type: 'step',
            text: {
              ar: `تم إرجاع "${target.title.ar}" إليكم من مرحلة "${source.title.ar}" في ${project.name}: ${note}`,
              en: `"${target.title.en}" was returned to you from "${source.title.en}" on ${en(project.name)}: ${note}`,
            },
            link: `/projects/${projectId}`,
          })
        },

        checkDueAlerts: () => {
          const { projects, inquiries, submittals, contracts, alerted, currentUserId, lang } = get()
          const sent = new Set(alerted)
          const fresh = dueAlerts(projects, inquiries, submittals, contracts, Date.now()).filter((a) => !sent.has(a.key))
          if (!fresh.length) return
          const now = Date.now()
          const created: AppNotification[] = fresh.flatMap((a) =>
            [...new Set(a.userIds)].map((userId) => ({ id: uid(), userId, type: 'overdue' as const, text: a.text, link: a.link, read: false, createdAt: now })),
          )
          const forMe = fresh.filter((a) => a.userIds.includes(currentUserId))
          set((s) => ({
            notifications: [...created, ...s.notifications],
            alerted: [...s.alerted, ...fresh.map((a) => a.key)],
            toast: forMe.length ? { text: forMe[0].text, at: now, alert: true } : s.toast,
          }))
          for (const a of forMe) pushDeviceNotification(a.text[lang])
        },

        createSubmittal: ({ projectId, title, type, note, attachments }) => {
          const now = Date.now()
          const me = userById(get().currentUserId)
          const project = get().projects.find((p) => p.id === projectId)!
          const prefix = `${project.code}/${typeCode[type]}-${deptCode[me.departmentId]}-`
          const seq = get().submittals.filter((s) => s.number.startsWith(prefix)).length + 1
          const submittal: Submittal = {
            id: uid(),
            number: submittalNumber(project.code, type, me.departmentId, seq),
            projectId,
            title,
            type,
            departmentId: me.departmentId,
            revisions: [{ rev: 0, submittedBy: me.id, submittedAt: now, note, attachments }],
          }
          set((s) => ({ submittals: [submittal, ...s.submittals] }))
          notify({
            userIds: reviewers().map((u) => u.id),
            type: 'submittal',
            text: { ar: `تقديم جديد للمراجعة: ${submittal.number} — ${title}`, en: `New submittal for review: ${submittal.number} — ${en(title)}` },
            link: `/submittals/${submittal.id}`,
          })
          return submittal.id
        },

        reviewSubmittal: (id, code, comments) => {
          const now = Date.now()
          const me = get().currentUserId
          const sub = get().submittals.find((s) => s.id === id)!
          const revisions = sub.revisions.map((r, i) =>
            i === sub.revisions.length - 1 ? { ...r, code, comments, reviewedBy: me, reviewedAt: now } : r,
          )
          set((s) => ({ submittals: s.submittals.map((x) => (x.id === id ? { ...x, revisions } : x)) }))
          notify({
            userIds: [...usersInDepts([sub.departmentId]).map((u) => u.id), latestRevision(sub).submittedBy],
            type: 'submittal',
            text: { ar: `نتيجة المراجعة (كود ${code}): ${sub.number} — ${sub.title}`, en: `Review result (code ${code}): ${sub.number} — ${en(sub.title)}` },
            link: `/submittals/${id}`,
          })
        },

        resubmit: (id, note, attachments) => {
          const now = Date.now()
          const me = get().currentUserId
          const sub = get().submittals.find((s) => s.id === id)!
          const rev = latestRevision(sub).rev + 1
          set((s) => ({
            submittals: s.submittals.map((x) =>
              x.id === id ? { ...x, revisions: [...x.revisions, { rev, submittedBy: me, submittedAt: now, note, attachments }] } : x,
            ),
          }))
          notify({
            userIds: reviewers().map((u) => u.id),
            type: 'submittal',
            text: { ar: `إعادة تقديم للمراجعة: ${sub.number} (Rev ${rev})`, en: `Resubmitted for review: ${sub.number} (Rev ${rev})` },
            link: `/submittals/${id}`,
          })
        },

        createContract: ({ payments, ...c }) => {
          const now = Date.now()
          const me = get().currentUserId
          const project = get().projects.find((p) => p.id === c.projectId)!
          const prefix = `${project.code}/${kindCode[c.kind]}-`
          const seq = get().contracts.filter((x) => x.number.startsWith(prefix)).length + 1
          const contract: Contract = {
            ...c,
            id: uid(),
            number: contractNumber(project.code, c.kind, seq),
            payments: payments.map((m) => ({ ...m, id: uid() })),
            uploadedBy: me,
            uploadedAt: now,
          }
          set((s) => ({ contracts: [contract, ...s.contracts] }))
          notify({
            userIds: [...contractManagers().map((u) => u.id), project.managerId],
            type: 'contract',
            text: { ar: `تم رفع عقد جديد: ${contract.number} — ${c.title}`, en: `New contract uploaded: ${contract.number} — ${en(c.title)}` },
            link: `/contracts/${contract.id}`,
          })
          return contract.id
        },

        addContractFiles: (id, attachments) =>
          set((s) => ({
            contracts: s.contracts.map((c) => (c.id === id ? { ...c, attachments: [...c.attachments, ...attachments] } : c)),
          })),

        deleteContract: (id) => set((s) => ({ contracts: s.contracts.filter((c) => c.id !== id) })),

        togglePayment: (contractId, milestoneId) => {
          const me = get().currentUserId
          set((s) => ({
            contracts: s.contracts.map((c) =>
              c.id !== contractId
                ? c
                : {
                    ...c,
                    payments: c.payments.map((m) =>
                      m.id !== milestoneId ? m : m.paidAt ? { ...m, paidAt: undefined, paidBy: undefined } : { ...m, paidAt: Date.now(), paidBy: me },
                    ),
                  },
            ),
          }))
        },

        reopenInquiry: (inquiryId) => {
          const inq = get().inquiries.find((x) => x.id === inquiryId)!
          const me = userById(get().currentUserId)
          set((s) => ({
            inquiries: s.inquiries.map((x) =>
              x.id === inquiryId ? { ...x, status: x.firstResponseAt ? ('answered' as const) : ('open' as const), closedAt: undefined } : x,
            ),
          }))
          notify({
            userIds: [inq.fromUserId, ...inquiryRecipients(inq).map((u) => u.id)],
            type: 'message',
            text: { ar: `أعاد ${me.name.ar} فتح الاستفسار: ${inq.title}`, en: `${me.name.en} reopened: ${en(inq.title)}` },
            link: `/inquiries/${inquiryId}`,
          })
        },

        createInquiry: (i) => {
          const now = Date.now()
          const me = userById(get().currentUserId)
          const inquiry: Inquiry = {
            id: uid(),
            projectId: i.projectId,
            title: i.title,
            fromUserId: me.id,
            fromDeptId: me.departmentId,
            toDeptIds: i.toDeptIds,
            assigneeIds: i.assigneeIds,
            priority: i.priority,
            status: 'open',
            createdAt: now,
            dueAt: now + SLA_HOURS[i.priority] * H,
            messages: [{ id: uid(), senderId: me.id, text: i.text, attachments: i.attachments, createdAt: now }],
          }
          set((s) => ({ inquiries: [inquiry, ...s.inquiries] }))
          const dept = deptById(me.departmentId).name
          notify({
            userIds: inquiryRecipients(inquiry).map((u) => u.id),
            type: 'inquiry',
            text: { ar: `استفسار جديد من ${dept.ar}: ${i.title}`, en: `New inquiry from ${dept.en}: ${en(i.title)}` },
            link: `/inquiries/${inquiry.id}`,
          })
          return inquiry.id
        },

        sendMessage: (inquiryId, text, attachments) => {
          const now = Date.now()
          const me = userById(get().currentUserId)
          const inq = get().inquiries.find((x) => x.id === inquiryId)!
          const fromRecipientSide = me.departmentId !== inq.fromDeptId && isRecipient(inq, me)
          const updated: Inquiry = {
            ...inq,
            messages: [...inq.messages, { id: uid(), senderId: me.id, text, attachments, createdAt: now }],
            status: fromRecipientSide ? 'answered' : inq.status === 'closed' ? 'closed' : 'open',
            firstResponseAt: inq.firstResponseAt ?? (fromRecipientSide ? now : undefined),
          }
          set((s) => ({ inquiries: s.inquiries.map((x) => (x.id === inquiryId ? updated : x)) }))
          const participants = [inq.fromUserId, ...inquiryRecipients(inq).map((u) => u.id), ...inq.messages.map((m) => m.senderId)]
          notify({
            userIds: participants,
            type: 'message',
            text: { ar: `رد جديد من ${me.name.ar}: ${inq.title}`, en: `New reply from ${me.name.en}: ${en(inq.title)}` },
            link: `/inquiries/${inquiryId}`,
          })
        },

        closeInquiry: (inquiryId) =>
          set((s) => ({
            inquiries: s.inquiries.map((x) => (x.id === inquiryId ? { ...x, status: 'closed', closedAt: Date.now() } : x)),
          })),

        saveTemplate: (t) =>
          set((s) => ({
            templates: s.templates.some((x) => x.id === t.id)
              ? s.templates.map((x) => (x.id === t.id ? t : x))
              : [...s.templates, t],
          })),

        deleteTemplate: (id) => set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

        markRead: (id) =>
          set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),

        markAllRead: () =>
          set((s) => ({
            notifications: s.notifications.map((n) => (n.userId === s.currentUserId ? { ...n, read: true } : n)),
          })),
      }
    },
    {
      name: 'tech-office-demo',
      version: 8,
      migrate: () => ({ ...seedData(), lang: 'en' as Lang, currentUserId: 'u-civil-1', loggedIn: false }),
      partialize: ({ toast: _toast, ...rest }) => rest,
      storage: createJSONStorage(() => ({
        getItem: (k) => localStorage.getItem(k),
        removeItem: (k) => localStorage.removeItem(k),
        setItem: (k, v) => {
          try {
            localStorage.setItem(k, v)
          } catch {
            console.warn('Demo storage is full; large attachments will not survive a reload.')
          }
        },
      })),
    },
  ),
)

export const useMe = () => userById(useStore((s) => s.currentUserId))
export { uid }
