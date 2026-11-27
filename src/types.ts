export type Lang = 'ar' | 'en'
export type Localized = { ar: string; en: string }

export type Role = 'admin' | 'head' | 'engineer'

export type Department = {
  id: string
  name: Localized
  color: string
}

export type User = {
  id: string
  name: Localized
  role: Role
  departmentId: string
}

export type Priority = 'urgent' | 'normal' | 'low'
export type InquiryStatus = 'open' | 'answered' | 'closed'

export type Attachment =
  | { type: 'image'; name: string; url: string }
  | { type: 'file'; name: string; size: number; url?: string }
  | { type: 'link'; url: string }

export type Message = {
  id: string
  senderId: string
  text: string
  attachments: Attachment[]
  createdAt: number
}

export type Inquiry = {
  id: string
  projectId: string
  title: string
  fromUserId: string
  fromDeptId: string
  toDeptIds: string[]
  assigneeIds: string[]
  priority: Priority
  status: InquiryStatus
  createdAt: number
  dueAt: number
  firstResponseAt?: number
  closedAt?: number
  messages: Message[]
}

export type WorkflowStepTemplate = {
  id: string
  title: Localized
  departmentId: string
  slaHours: number
}

export type WorkflowTemplate = {
  id: string
  name: Localized
  steps: WorkflowStepTemplate[]
}

export type StepStatus = 'pending' | 'active' | 'done'

export type WorkflowStep = WorkflowStepTemplate & {
  status: StepStatus
  startedAt?: number
  completedAt?: number
  completedBy?: string
}

export type Project = {
  id: string
  code: string
  name: string
  client: string
  location: string
  category: Localized
  managerId: string
  deadline: number
  createdBy: string
  createdAt: number
  departmentIds: string[]
  templateId?: string
  steps: WorkflowStep[]
  log?: ProjectEvent[]
}

export type ProjectEvent = {
  id: string
  type: 'complete' | 'return'
  stepId: string
  toStepId?: string
  by: string
  at: number
  note?: string
}

export type SubmittalType = 'shop' | 'material' | 'design'
export type ApprovalCode = 'A' | 'B' | 'C' | 'D'

export type SubmittalRevision = {
  rev: number
  submittedBy: string
  submittedAt: number
  note: string
  attachments: Attachment[]
  code?: ApprovalCode
  reviewedBy?: string
  reviewedAt?: number
  comments?: string
}

export type Submittal = {
  id: string
  number: string
  projectId: string
  title: string
  type: SubmittalType
  departmentId: string
  revisions: SubmittalRevision[]
}

export type ContractKind = 'design' | 'supervision' | 'addendum'

export type PaymentMilestone = {
  id: string
  title: string
  percent: number
  paidAt?: number
  paidBy?: string
}

export type Contract = {
  id: string
  number: string
  projectId: string
  kind: ContractKind
  title: string
  value: number
  signedAt: number
  endsAt: number
  scope: string
  payments: PaymentMilestone[]
  attachments: Attachment[]
  uploadedBy: string
  uploadedAt: number
}

export type NotificationType = 'project' | 'inquiry' | 'message' | 'step' | 'overdue' | 'submittal' | 'contract'

export type AppNotification = {
  id: string
  userId: string
  type: NotificationType
  text: Localized
  link: string
  read: boolean
  createdAt: number
}
