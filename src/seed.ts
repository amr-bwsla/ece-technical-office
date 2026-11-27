import { en } from './content'
import type {
  AppNotification,
  Contract,
  ContractKind,
  Department,
  Inquiry,
  Localized,
  Message,
  Priority,
  Project,
  Submittal,
  SubmittalRevision,
  SubmittalType,
  User,
  WorkflowStep,
  WorkflowTemplate,
} from './types'

export const H = 3600_000
const D = 24 * H

export const departments: Department[] = [
  { id: 'arch', name: { ar: 'المعماري', en: 'Architecture' }, color: '#7c3aed' },
  { id: 'civil', name: { ar: 'المدني / الإنشائي', en: 'Civil / Structural' }, color: '#0369a1' },
  { id: 'mech', name: { ar: 'التكييف والتهوية', en: 'HVAC' }, color: '#c2410c' },
  { id: 'plumb', name: { ar: 'الصحي والحريق', en: 'Plumbing & Fire Fighting' }, color: '#be185d' },
  { id: 'elec', name: { ar: 'الكهرباء والتيار الخفيف', en: 'Electrical & ELV' }, color: '#ca8a04' },
  { id: 'mgmt', name: { ar: 'الإدارة الفنية والجودة', en: 'Technical Management & QA' }, color: '#003164' },
]

export const users: User[] = [
  { id: 'u-admin', name: { ar: 'م. أحمد فؤاد', en: 'Eng. Ahmed Fouad' }, role: 'admin', departmentId: 'mgmt' },
  { id: 'u-pm1', name: { ar: 'م. هشام رضا', en: 'Eng. Hesham Reda' }, role: 'head', departmentId: 'mgmt' },
  { id: 'u-pm2', name: { ar: 'م. دينا مصطفى', en: 'Eng. Dina Mostafa' }, role: 'engineer', departmentId: 'mgmt' },
  { id: 'u-arch', name: { ar: 'م. عمر نبيل', en: 'Eng. Omar Nabil' }, role: 'head', departmentId: 'arch' },
  { id: 'u-arch-1', name: { ar: 'م. نورهان علي', en: 'Eng. Nourhan Aly' }, role: 'engineer', departmentId: 'arch' },
  { id: 'u-civil-head', name: { ar: 'م. محمد سامي', en: 'Eng. Mohamed Samy' }, role: 'head', departmentId: 'civil' },
  { id: 'u-civil-1', name: { ar: 'م. سارة حسن', en: 'Eng. Sara Hassan' }, role: 'engineer', departmentId: 'civil' },
  { id: 'u-civil-2', name: { ar: 'م. كريم عبد الله', en: 'Eng. Karim Abdallah' }, role: 'engineer', departmentId: 'civil' },
  { id: 'u-mech-head', name: { ar: 'م. خالد عادل', en: 'Eng. Khaled Adel' }, role: 'head', departmentId: 'mech' },
  { id: 'u-mech-1', name: { ar: 'م. يوسف طارق', en: 'Eng. Youssef Tarek' }, role: 'engineer', departmentId: 'mech' },
  { id: 'u-plumb-head', name: { ar: 'م. طارق الشافعي', en: 'Eng. Tarek El-Shafei' }, role: 'head', departmentId: 'plumb' },
  { id: 'u-plumb-1', name: { ar: 'م. ريم عادل', en: 'Eng. Reem Adel' }, role: 'engineer', departmentId: 'plumb' },
  { id: 'u-elec', name: { ar: 'م. منى إبراهيم', en: 'Eng. Mona Ibrahim' }, role: 'head', departmentId: 'elec' },
  { id: 'u-elec-1', name: { ar: 'م. إسلام محمود', en: 'Eng. Eslam Mahmoud' }, role: 'engineer', departmentId: 'elec' },
]

export const SLA_HOURS = { urgent: 4, normal: 24, low: 72 } as const
export const SUBMITTAL_REVIEW_HOURS = 72

export type SubmittalStatus = 'review' | 'approved' | 'resubmit' | 'rejected'

export const latestRevision = (s: Submittal) => s.revisions[s.revisions.length - 1]

export function submittalStatus(s: Submittal): SubmittalStatus {
  const code = latestRevision(s).code
  if (!code) return 'review'
  return code === 'A' || code === 'B' ? 'approved' : code === 'C' ? 'resubmit' : 'rejected'
}

export const reviewDueAt = (r: SubmittalRevision) => r.submittedAt + SUBMITTAL_REVIEW_HOURS * H

export const reviewers = () => users.filter((u) => u.departmentId === 'mgmt')

const headOf = (deptId: string) => users.find((u) => u.departmentId === deptId && u.role !== 'engineer')!.id

const templates: WorkflowTemplate[] = [
  {
    id: 't-mep',
    name: { ar: 'تصميم كامل وإشراف — أعمال كهروميكانيكية', en: 'MEP full design & supervision' },
    steps: [
      { id: 'm1', title: { ar: 'استلام الخلفيات المعمارية ومعايير التصميم', en: 'Architectural backgrounds & design criteria' }, departmentId: 'arch', slaHours: 48 },
      { id: 'm2', title: { ar: 'تصميم التكييف والتهوية', en: 'HVAC design' }, departmentId: 'mech', slaHours: 96 },
      { id: 'm3', title: { ar: 'تصميم الصحي ومكافحة الحريق', en: 'Plumbing & fire fighting design' }, departmentId: 'plumb', slaHours: 72 },
      { id: 'm4', title: { ar: 'التصميم الكهربائي والتيار الخفيف', en: 'Electrical & ELV design' }, departmentId: 'elec', slaHours: 72 },
      { id: 'm5', title: { ar: 'مراجعة التصميم الداخلية (Peer Review)', en: 'Peer design review' }, departmentId: 'mgmt', slaHours: 24 },
      { id: 'm6', title: { ar: 'مستندات الطرح والمواصفات', en: 'Tender documents & specifications' }, departmentId: 'mgmt', slaHours: 48 },
    ],
  },
  {
    id: 't-integrated',
    name: { ar: 'تصميم متكامل (معماري - إنشائي - كهروميكانيكا) وإشراف', en: 'Integrated ARCH-CIVIL-MEP design & supervision' },
    steps: [
      { id: 'g1', title: { ar: 'التصميم المعماري', en: 'Architectural design' }, departmentId: 'arch', slaHours: 96 },
      { id: 'g2', title: { ar: 'التصميم الإنشائي', en: 'Structural design' }, departmentId: 'civil', slaHours: 96 },
      { id: 'g3', title: { ar: 'تصميم التكييف والتهوية', en: 'HVAC design' }, departmentId: 'mech', slaHours: 72 },
      { id: 'g4', title: { ar: 'تصميم الصحي ومكافحة الحريق', en: 'Plumbing & fire fighting design' }, departmentId: 'plumb', slaHours: 72 },
      { id: 'g5', title: { ar: 'التصميم الكهربائي والتيار الخفيف', en: 'Electrical & ELV design' }, departmentId: 'elec', slaHours: 72 },
      { id: 'g6', title: { ar: 'مراجعة التصميم الداخلية (Peer Review)', en: 'Peer design review' }, departmentId: 'mgmt', slaHours: 24 },
      { id: 'g7', title: { ar: 'التراخيص والموافقات الحكومية', en: 'Statutory approvals' }, departmentId: 'mgmt', slaHours: 72 },
    ],
  },
  {
    id: 't-ve',
    name: { ar: 'مراجعة تصميم وهندسة قيمية', en: 'Design review & value engineering' },
    steps: [
      { id: 'v1', title: { ar: 'مراجعة أعمال التكييف', en: 'HVAC review' }, departmentId: 'mech', slaHours: 24 },
      { id: 'v2', title: { ar: 'مراجعة الصحي والحريق', en: 'Plumbing & FF review' }, departmentId: 'plumb', slaHours: 24 },
      { id: 'v3', title: { ar: 'مراجعة الكهرباء', en: 'Electrical review' }, departmentId: 'elec', slaHours: 24 },
      { id: 'v4', title: { ar: 'تقرير الهندسة القيمية', en: 'Value engineering report' }, departmentId: 'mgmt', slaHours: 16 },
    ],
  },
]

/** Builds step history backwards from "now": the active step started `activeHoursAgo`, earlier steps took `durations` hours each. */
function buildSteps(templateId: string, activeIdx: number, activeHoursAgo: number, durations: number[], now: number): WorkflowStep[] {
  const tpl = templates.find((t) => t.id === templateId)!
  const steps: WorkflowStep[] = tpl.steps.map((s) => ({ ...s, status: 'pending' }))
  let cursor = now - activeHoursAgo * H
  if (activeIdx < steps.length) steps[activeIdx] = { ...steps[activeIdx], status: 'active', startedAt: cursor }
  for (let i = Math.min(activeIdx, steps.length) - 1; i >= 0; i--) {
    const completedAt = cursor
    cursor -= durations[i] * H
    steps[i] = { ...steps[i], status: 'done', startedAt: cursor, completedAt, completedBy: headOf(steps[i].departmentId) }
  }
  return steps
}

type ProjectSeed = Omit<Project, 'createdAt' | 'createdBy' | 'steps' | 'deadline' | 'departmentIds'> & {
  deadlineInDays: number
  departmentIds?: string[]
  flow: [activeIdx: number, activeHoursAgo: number, durations: number[]]
}

export const cat = {
  industrial: { ar: 'صناعي', en: 'Industrial' },
  fmcg: { ar: 'صناعات غذائية ومشروبات', en: 'FMCG & beverages' },
  pharma: { ar: 'مصانع أدوية', en: 'Pharmaceutical' },
  logistics: { ar: 'لوجستي ومستودعات', en: 'Logistics & warehouses' },
  medical: { ar: 'طبي', en: 'Healthcare' },
  commercial: { ar: 'تجاري وترفيهي', en: 'Commercial & entertainment' },
  hospitality: { ar: 'فندقي', en: 'Hospitality' },
  admin: { ar: 'إداري', en: 'Administrative' },
} satisfies Record<string, Localized>

const MEP_ONLY = ['arch', 'mech', 'plumb', 'elec', 'mgmt']
const REVIEW_ONLY = ['mech', 'plumb', 'elec', 'mgmt']

const projectSeeds: ProjectSeed[] = [
  { id: 'p1', code: 'ECE-KSA-26-031', name: 'مصنع السويدي إليكتريك — الدمام', client: 'السويدي إليكتريك', location: 'الدمام — السعودية', category: cat.industrial, managerId: 'u-pm1', templateId: 't-integrated', deadlineInDays: 20, flow: [3, 30, [90, 100, 60]] },
  { id: 'p2', code: 'ECE-EG-26-118', name: 'مركز أسوان للقلب — مراجعة وهندسة قيمية', client: 'مؤسسة مجدي يعقوب للقلب', location: 'أسوان', category: cat.medical, managerId: 'u-pm2', templateId: 't-ve', departmentIds: REVIEW_ONLY, deadlineInDays: 3, flow: [1, 30, [20]] },
  { id: 'p3', code: 'ECE-EG-26-104', name: 'مستشفى الحرية — كربة', client: 'مستشفى الحرية', location: 'كربة، مصر الجديدة', category: cat.medical, managerId: 'u-pm1', templateId: 't-mep', departmentIds: MEP_ONLY, deadlineInDays: 25, flow: [2, 50, [40, 110]] },
  { id: 'p4', code: 'ECE-KSA-26-027', name: 'فندق فوكو — الرياض', client: 'VOCO Hotels (IHG)', location: 'الرياض — السعودية', category: cat.hospitality, managerId: 'u-admin', templateId: 't-mep', departmentIds: MEP_ONLY, deadlineInDays: 6, flow: [4, 20, [50, 90, 70, 60]] },
  { id: 'p5', code: 'ECE-EG-26-097', name: 'مونديليز — خط إنتاج الحلوى (BEA Candy)', client: 'مونديليز إيجيبت', location: 'مصنع BEA', category: cat.fmcg, managerId: 'u-pm1', templateId: 't-mep', deadlineInDays: 14, flow: [1, 100, [45]] },
  { id: 'p6', code: 'ECE-KSA-26-033', name: 'تامر لوجستيكس — مستودعات سدير', client: 'مجموعة تامر', location: 'سدير — السعودية', category: cat.logistics, managerId: 'u-pm2', templateId: 't-integrated', deadlineInDays: 50, flow: [0, 60, []] },
  { id: 'p7', code: 'ECE-EG-26-082', name: 'كورونا — المصنع الجديد', client: 'كورونا', location: 'مصر', category: cat.fmcg, managerId: 'u-pm2', templateId: 't-mep', deadlineInDays: -2, flow: [6, 200, [40, 90, 60, 70, 20, 45]] },
  { id: 'p8', code: 'ECE-EG-26-121', name: 'شيبسي أسيوط — خط Amix', client: 'شيبسي (بيبسيكو)', location: 'أسيوط', category: cat.fmcg, managerId: 'u-pm1', templateId: 't-ve', departmentIds: REVIEW_ONLY, deadlineInDays: 1, flow: [3, 10, [20, 22, 18]] },
  { id: 'p9', code: 'ECE-EG-26-109', name: 'سنو سيتي — سيتي ستارز', client: 'عبدالله العثيم للترفيه', location: 'سيتي ستارز، مدينة نصر', category: cat.commercial, managerId: 'u-pm2', templateId: 't-mep', deadlineInDays: 10, flow: [3, 80, [40, 85, 70]] },
  { id: 'p10', code: 'ECE-EG-26-101', name: 'كورنرستون — ذا كيرف', client: 'كورنرستون للتطوير', location: 'ذا كيرف، العاصمة الإدارية', category: cat.admin, managerId: 'u-pm1', templateId: 't-integrated', deadlineInDays: 4, flow: [5, 30, [90, 95, 70, 65, 75]] },
  { id: 'p11', code: 'ECE-EG-26-115', name: 'فور سيزونز — العائمة النيلية الأولى', client: 'فور سيزونز', location: 'النيل، القاهرة', category: cat.hospitality, managerId: 'u-pm2', templateId: 't-mep', departmentIds: MEP_ONLY, deadlineInDays: 30, flow: [2, 20, [45, 90]] },
  { id: 'p12', code: 'ECE-EG-26-112', name: 'حورس للأدوية — مبنى الإنتاج', client: 'حورس فارما', location: 'مصر', category: cat.pharma, managerId: 'u-admin', templateId: 't-integrated', deadlineInDays: 40, flow: [1, 40, [100]] },
  { id: 'p13', code: 'ECE-KSA-26-036', name: 'صدر لوجستيكس — مركز الرياض', client: 'صدر لوجستيكس', location: 'الرياض — السعودية', category: cat.logistics, managerId: 'u-pm1', templateId: 't-mep', deadlineInDays: 70, flow: [0, 10, []] },
  { id: 'p14', code: 'ECE-EG-26-074', name: 'الأهرام للمشروبات — غرفة التبريد والكمبروسورات', client: 'الأهرام للمشروبات', location: 'مصر', category: cat.fmcg, managerId: 'u-pm2', templateId: 't-mep', deadlineInDays: -12, flow: [6, 400, [40, 80, 60, 60, 20, 40]] },
  { id: 'p15', code: 'ECE-EG-26-069', name: 'ابن سينا فارما — مستودع طنطا', client: 'ابن سينا فارما', location: 'طنطا', category: cat.logistics, managerId: 'u-pm1', templateId: 't-ve', departmentIds: REVIEW_ONLY, deadlineInDays: -20, flow: [4, 500, [22, 20, 23, 14]] },
  { id: 'p16', code: 'ECE-EG-26-106', name: 'جي دبليو ماريوت — قاعة الحفلات', client: 'جي دبليو ماريوت القاهرة', location: 'القاهرة', category: cat.hospitality, managerId: 'u-admin', templateId: 't-mep', departmentIds: MEP_ONLY, deadlineInDays: 2, flow: [5, 30, [45, 95, 70, 70, 20]] },
]

type InqSeed = {
  id: string
  projectId: string
  from: string
  to: string[]
  assignees?: string[]
  priority: Priority
  hoursAgo: number
  title: string
  text: string
  reply?: { by: string; afterMin: number; text: string }
  closedAfterH?: number
}

const inqSeeds: InqSeed[] = [
  { id: 'i3', projectId: 'p1', from: 'u-elec', to: ['mech'], assignees: ['u-mech-head'], priority: 'normal', hoursAgo: 3, title: 'أحمال التكييف لصالة اختبار المحولات', text: 'برجاء إرسال القدرة الكهربائية لوحدات التكييف المركزية في صالة الاختبار لتحديد مقاس المحول الداخلي واللوحة الرئيسية.' },
  { id: 'i4', projectId: 'p1', from: 'u-arch', to: ['civil'], assignees: ['u-civil-head'], priority: 'low', hoursAgo: 120, title: 'البحور الإنشائية لصالة الإنتاج', text: 'هل البحور 30 م نهائية؟ محتاجين نثبت أماكن الأوناش العلوية ومسارات الحركة.', reply: { by: 'u-civil-head', afterMin: 40, text: 'البحور 30 م نهائية، مع كمرات أوناش 20 طن على المحورين B و E.' }, closedAfterH: 24 },
  { id: 'i5', projectId: 'p12', from: 'u-civil-head', to: ['arch'], assignees: ['u-arch'], priority: 'normal', hoursAgo: 50, title: 'مناسيب أرضيات المناطق النظيفة (Clean Rooms)', text: 'محتاجين منسوب التشطيب النهائي للمناطق النظيفة لتحديد الـ drop في البلاطة.', reply: { by: 'u-arch', afterMin: 30 * 60, text: 'المنسوب +0.10 مع drop 5 سم لأرضيات الإيبوكسي.' } },
  { id: 'i6', projectId: 'p9', from: 'u-elec-1', to: ['mech'], assignees: ['u-mech-1'], priority: 'urgent', hoursAgo: 9, title: 'أماكن لوحات التحكم لوحدات تبريد صالة الجليد', text: 'محتاجين أماكن لوحات التحكم الخاصة بوحدات الـ Chillers لصالة الجليد لتحديد مسارات الكابلات.', reply: { by: 'u-mech-1', afterMin: 95, text: 'اللوحات على الحائط الشرقي لغرفة المعدات، ومرفق المسقط المحدث.' } },
  { id: 'i7', projectId: 'p9', from: 'u-pm2', to: ['elec'], priority: 'urgent', hoursAgo: 5, title: 'تأخير التصميم الكهربائي — سنو سيتي', text: 'التصميم الكهربائي متجاوز المدة المحددة وموعد التسليم بعد 10 أيام. برجاء تحديد موعد نهائي للتسليم اليوم.' },
  { id: 'i8', projectId: 'p3', from: 'u-plumb-1', to: ['arch'], assignees: ['u-arch-1'], priority: 'normal', hoursAgo: 20, title: 'غرفة مانيفولد الأكسجين', text: 'محتاجين غرفة 3×4 م لمانيفولد الأكسجين بالدور الأرضي مع تهوية طبيعية، برجاء تحديد مكانها.', reply: { by: 'u-arch-1', afterMin: 180, text: 'تم تحديدها بجوار المدخل الخدمي الخلفي — اللوحة A-102.' } },
  { id: 'i9', projectId: 'p12', from: 'u-civil-head', to: ['mech', 'plumb'], priority: 'normal', hoursAgo: 14, title: 'فتحات الكمرات لمجاري الهواء ومواسير المياه النقية', text: 'برجاء تحديد كل الفتحات المطلوبة في الكمرات الرئيسية لمبنى الإنتاج قبل نهاية الأسبوع لإنهاء لوحات التسليح.' },
  { id: 'i10', projectId: 'p14', from: 'u-mech-head', to: ['civil'], assignees: ['u-civil-head'], priority: 'urgent', hoursAgo: 260, title: 'قواعد الكمبروسورات وغرفة التبريد', text: 'محتاجين تصميم قواعد لـ 3 كمبروسورات أمونيا وزن كل واحد 5 طن مع عزل الاهتزازات.', reply: { by: 'u-civil-head', afterMin: 150, text: 'تم التصميم والرسومات على السيرفر.' }, closedAfterH: 30 },
  { id: 'i11', projectId: 'p4', from: 'u-admin', to: ['arch', 'mech', 'plumb', 'elec'], priority: 'normal', hoursAgo: 8, title: 'ملاحظات الـ Peer Review — فندق فوكو الرياض', text: 'مرفق ملاحظات المراجعة الداخلية. برجاء كل قسم الرد على البنود الخاصة به قبل إصدار مستندات الطرح.', reply: { by: 'u-mech-head', afterMin: 70, text: 'بنود التكييف تم تعديلها بالكامل.' } },
  { id: 'i12', projectId: 'p6', from: 'u-arch-1', to: ['civil'], priority: 'low', hoursAgo: 4, title: 'نوع الأساسات للمستودعات', text: 'هل الأساسات منفصلة ولا لبشة؟ محتاجين نعرف علشان منسوب أرضية المستودع ورصيف التحميل.' },
  { id: 'i13', projectId: 'p10', from: 'u-civil-1', to: ['mech'], assignees: ['u-mech-head'], priority: 'urgent', hoursAgo: 7, title: 'أوزان وحدات التكييف على السطح', text: 'محتاجين أوزان وحدات الـ Packaged Units على سطح المبنى لمراجعة البلاطة.' },
  { id: 'i14', projectId: 'p1', from: 'u-elec-1', to: ['arch'], priority: 'normal', hoursAgo: 30, title: 'غرف المحولات والمولدات', text: 'محتاجين غرفة محولات 6×8 م وغرفة مولد 5×7 م، برجاء تحديد مكانهما في الموقع العام.', reply: { by: 'u-arch', afterMin: 300, text: 'تم إضافتهما في الركن الجنوبي الغربي بجوار البوابة الخدمية.' }, closedAfterH: 10 },
  { id: 'i15', projectId: 'p4', from: 'u-plumb-1', to: ['elec'], assignees: ['u-elec'], priority: 'low', hoursAgo: 55, title: 'مصدر تغذية طلمبات الحريق', text: 'هل طلمبات الحريق على مولد الطوارئ؟', reply: { by: 'u-elec', afterMin: 600, text: 'نعم على المولد مع ATS مستقل حسب NFPA 20.' } },
  { id: 'i16', projectId: 'p5', from: 'u-mech-1', to: ['civil'], priority: 'normal', hoursAgo: 30, title: 'نقاط تعليق خطوط الهواء المضغوط', text: 'محتاجين نقاط تعليق لخطوط الهواء المضغوط في سقف صالة خط الحلوى. مرفق المسقط المبدئي.' },
  { id: 'i17', projectId: 'p3', from: 'u-arch-1', to: ['mech'], assignees: ['u-mech-head'], priority: 'low', hoursAgo: 60, title: 'أماكن الوحدات الخارجية على السطح', text: 'برجاء تحديد أماكن الوحدات الخارجية علشان نعمل ساتر معماري مناسب.', reply: { by: 'u-mech-head', afterMin: 240, text: 'الوحدات في الركن الجنوبي الشرقي، مساحة 6×8 م.' } },
  { id: 'i18', projectId: 'p11', from: 'u-pm2', to: ['mech'], assignees: ['u-mech-head', 'u-mech-1'], priority: 'urgent', hoursAgo: 2, title: 'حدود الوزن لمعدات التكييف على سطح العائمة', text: 'إدارة العائمة طلبت تقليل وزن المعدات على السطح العلوي. برجاء مراجعة البدائل بشكل عاجل.' },
  { id: 'i19', projectId: 'p16', from: 'u-elec-1', to: ['arch'], assignees: ['u-arch-1'], priority: 'normal', hoursAgo: 16, title: 'تنسيق الإضاءة في قاعة الحفلات الكبرى', text: 'هل السقف المعلق مستوى واحد ولا مستويات؟ محتاجين نحدد نوع الكشافات وأنظمة التحكم.', reply: { by: 'u-arch-1', afterMin: 120, text: 'مستويين: 4.20 و 5.00 م. التفاصيل في لوحة الأسقف A-301.' } },
  { id: 'i20', projectId: 'p16', from: 'u-admin', to: ['elec'], assignees: ['u-elec'], priority: 'urgent', hoursAgo: 3, title: 'موعد تسليم مستندات الطرح — ماريوت', text: 'العميل طالب مستندات الطرح الكهربائية يوم الخميس. هل نقدر نلتزم؟', reply: { by: 'u-elec', afterMin: 35, text: 'نعم، هنسلم الأربعاء آخر اليوم.' } },
  { id: 'i21', projectId: 'p13', from: 'u-civil-2', to: ['plumb'], priority: 'normal', hoursAgo: 40, title: 'أوزان خزانات مياه الحريق الأرضية', text: 'محتاجين أوزان وأبعاد خزانات مياه الحريق لتصميم البلاطة الخرسانية.', reply: { by: 'u-plumb-head', afterMin: 900, text: 'خزانين سعة 600 م³ لكل خزان، الأبعاد في الملف على السيرفر.' } },
  { id: 'i22', projectId: 'p13', from: 'u-mech-head', to: ['elec'], priority: 'normal', hoursAgo: 10, title: 'تغذية مراوح شفط الدخان في المستودعات', text: 'برجاء التأكيد إن مراوح شفط الدخان على تغذية طوارئ بكابلات مقاومة للحريق.' },
  { id: 'i23', projectId: 'p6', from: 'u-civil-1', to: ['arch'], priority: 'normal', hoursAgo: 8, title: 'ارتفاع أبواب رصيف التحميل (Dock Doors)', text: 'ما هو الارتفاع النهائي لأبواب الرصيف؟ محتاجينه لتصميم الكمرات العلوية.' },
  { id: 'i24', projectId: 'p13', from: 'u-arch', to: ['civil', 'mech', 'plumb', 'elec'], priority: 'low', hoursAgo: 20, title: 'اجتماع تنسيقي — بداية صدر لوجستيكس', text: 'اجتماع تنسيقي يوم الأحد الساعة 11 (أونلاين مع فريق الرياض) لمراجعة المخطط العام. برجاء تأكيد الحضور.', reply: { by: 'u-civil-head', afterMin: 60, text: 'تم التأكيد من قسم المدني.' } },
  { id: 'i25', projectId: 'p14', from: 'u-pm1', to: ['mech'], priority: 'low', hoursAgo: 300, title: 'أرشفة اللوحات النهائية', text: 'برجاء رفع كل اللوحات النهائية المعتمدة على الأرشيف.', reply: { by: 'u-mech-head', afterMin: 120, text: 'تم الرفع بالكامل.' }, closedAfterH: 48 },
  { id: 'i26', projectId: 'p9', from: 'u-mech-1', to: ['civil'], assignees: ['u-civil-1'], priority: 'urgent', hoursAgo: 1, title: 'تعارض دكت التكييف مع كمرة المحور 5', text: 'الدكت الرئيسي لصالة الجليد بيتعارض مع الكمرة عند المحور 5. هل ممكن عمل فتحة 60×40؟' },
  { id: 'i27', projectId: 'p1', from: 'u-civil-2', to: ['elec'], priority: 'normal', hoursAgo: 12, title: 'مسار كابلات الجهد المتوسط', text: 'برجاء تحديد مسار كابلات الجهد المتوسط علشان نراجع الخنادق وغرف التفتيش.', reply: { by: 'u-elec-1', afterMin: 200, text: 'المسار في خندق خرساني على الجانب الغربي — مرفق المقطع.' } },
  { id: 'i28', projectId: 'p2', from: 'u-pm2', to: ['plumb'], assignees: ['u-plumb-head'], priority: 'urgent', hoursAgo: 6, title: 'مقترح الهندسة القيمية لشبكة الرشاشات', text: 'برجاء الرد على مقترح تقليل أقطار شبكة الرشاشات في الدور الثاني (حساب هيدروليكي) قبل إرسال التقرير للعميل.' },
]

type RevSeed = { ago: number; note: string; review?: { code: SubmittalRevision['code']; by: string; afterH: number; comments: string } }
type SubSeed = { id: string; projectId: string; type: SubmittalType; by: string; title: string; revs: RevSeed[] }

const subSeeds: SubSeed[] = [
  { id: 'sb1', projectId: 'p4', type: 'design', by: 'u-mech-head', title: 'لوحات التكييف — الأدوار المتكررة', revs: [
    { ago: 200, note: 'الإصدار الأول لمساقط التكييف وحسابات الأحمال.', review: { code: 'C', by: 'u-pm1', afterH: 20, comments: 'برجاء إعادة حساب أحمال الأجنحة حسب ASHRAE 90.1 وتوحيد مقاسات الدكت في الممرات.' } },
    { ago: 150, note: 'تم تعديل الأحمال وتوحيد مقاسات الدكت.', review: { code: 'B', by: 'u-pm1', afterH: 10, comments: 'معتمد مع ملاحظة: مراجعة منسوب الدكت أعلى غرف الخدمة.' } },
  ] },
  { id: 'sb2', projectId: 'p1', type: 'design', by: 'u-civil-head', title: 'لوحات تسليح صالة الإنتاج', revs: [{ ago: 30, note: 'لوحات التسليح بعد تنسيق فتحات التكييف والكهرباء.' }] },
  { id: 'sb3', projectId: 'p9', type: 'shop', by: 'u-mech-1', title: 'رسومات تنفيذية لمسارات الدكت — صالة الجليد', revs: [
    { ago: 120, note: 'المسارات الرئيسية والفرعية للدكت.', review: { code: 'C', by: 'u-pm2', afterH: 18, comments: 'تعارض مع كمرة المحور 5، برجاء التنسيق مع المدني وإعادة التقديم.' } },
    { ago: 90, note: 'تم تعديل المسار عند المحور 5 بعد موافقة المدني على فتحة 60×40.' },
  ] },
  { id: 'sb4', projectId: 'p9', type: 'material', by: 'u-elec', title: 'اعتماد لوحات التوزيع الرئيسية (MDB)', revs: [
    { ago: 60, note: 'كتالوج المورد وشهادات المطابقة واختبارات النوع.', review: { code: 'A', by: 'u-pm2', afterH: 6, comments: 'معتمد.' } },
  ] },
  { id: 'sb5', projectId: 'p16', type: 'design', by: 'u-elec', title: 'لوحات الإضاءة والقوى — قاعة الحفلات', revs: [
    { ago: 100, note: 'توزيع الإضاءة ومخطط التحكم (DALI) ولوحات القوى.', review: { code: 'B', by: 'u-admin', afterH: 24, comments: 'معتمد مع ملاحظة: إضافة دوائر طوارئ لإضاءة المخارج.' } },
  ] },
  { id: 'sb6', projectId: 'p4', type: 'material', by: 'u-mech-head', title: 'اعتماد وحدات التبريد Chiller', revs: [
    { ago: 80, note: 'الموديل المقترح من المورد مع جداول الأداء.', review: { code: 'D', by: 'u-admin', afterH: 30, comments: 'الموديل لا يحقق معامل الكفاءة المطلوب في المواصفات (SASO). مرفوض.' } },
  ] },
  { id: 'sb7', projectId: 'p16', type: 'design', by: 'u-plumb-head', title: 'لوحات مكافحة الحريق — المناطق العامة', revs: [{ ago: 10, note: 'شبكة الرشاشات وصناديق الحريق والحسابات الهيدروليكية.' }] },
  { id: 'sb8', projectId: 'p14', type: 'design', by: 'u-mech-head', title: 'لوحات غرفة الكمبروسورات والتبريد', revs: [
    { ago: 300, note: 'مخطط غرفة الكمبروسورات ومسارات خطوط الأمونيا.', review: { code: 'A', by: 'u-pm1', afterH: 12, comments: 'معتمد.' } },
  ] },
  { id: 'sb9', projectId: 'p12', type: 'material', by: 'u-mech-1', title: 'اعتماد فلاتر HEPA للمناطق النظيفة', revs: [
    { ago: 50, note: 'كتالوج الفلاتر وبيانات الكفاءة.', review: { code: 'C', by: 'u-pm1', afterH: 8, comments: 'مطلوب شهادات الاختبار وفق ISO 14644 و EN 1822 قبل الاعتماد.' } },
  ] },
  { id: 'sb10', projectId: 'p3', type: 'shop', by: 'u-plumb-1', title: 'مسارات الغازات الطبية — الدور الأول', revs: [{ ago: 20, note: 'مسارات الأكسجين والفاكيوم بعد تنسيق الفتحات.' }] },
  { id: 'sb11', projectId: 'p5', type: 'design', by: 'u-mech-head', title: 'لوحات الهواء المضغوط — خط الحلوى', revs: [{ ago: 40, note: 'شبكة الهواء المضغوط وغرفة الكمبروسورات والمجففات.' }] },
]

export const deptCode: Record<string, string> = { arch: 'ARC', civil: 'STR', mech: 'HVC', plumb: 'PFF', elec: 'ELE', mgmt: 'MGT' }
export const typeCode: Record<SubmittalType, string> = { design: 'DD', shop: 'SD', material: 'MS' }

export function submittalNumber(projectCode: string, type: SubmittalType, deptId: string, seq: number) {
  return `${projectCode}/${typeCode[type]}-${deptCode[deptId]}-${String(seq).padStart(3, '0')}`
}

function buildSubmittals(projects: Project[], now: number): Submittal[] {
  const seq: Record<string, number> = {}
  return subSeeds.map((s) => {
    const project = projects.find((p) => p.id === s.projectId)!
    const deptId = userOf(s.by).departmentId
    const key = `${s.projectId}-${s.type}-${deptId}`
    seq[key] = (seq[key] ?? 0) + 1
    return {
      id: s.id,
      number: submittalNumber(project.code, s.type, deptId, seq[key]),
      projectId: s.projectId,
      title: s.title,
      type: s.type,
      departmentId: deptId,
      revisions: s.revs.map((r, rev) => {
        const submittedAt = now - r.ago * H
        return {
          rev,
          submittedBy: s.by,
          submittedAt,
          note: r.note,
          attachments: [{ type: 'file', name: `${s.id.toUpperCase()}-R${rev}.pdf`, size: 1_800_000 + rev * 250_000 }],
          ...(r.review && {
            code: r.review.code,
            reviewedBy: r.review.by,
            reviewedAt: submittedAt + r.review.afterH * H,
            comments: r.review.comments,
          }),
        }
      }),
    }
  })
}

export const CONTRACT_EXPIRY_DAYS = 30
export type ContractStatus = 'active' | 'expiring' | 'expired'

export function contractStatus(c: Contract, now = Date.now()): ContractStatus {
  if (now > c.endsAt) return 'expired'
  return c.endsAt - now < CONTRACT_EXPIRY_DAYS * D ? 'expiring' : 'active'
}

export const paidPercent = (c: Contract) => c.payments.reduce((sum, m) => sum + (m.paidAt ? m.percent : 0), 0)
export const contractManagers = () => users.filter((u) => u.departmentId === 'mgmt')
export const canManageContracts = (u: User) => u.departmentId === 'mgmt'

export const kindCode: Record<ContractKind, string> = { design: 'DC', supervision: 'SC', addendum: 'AD' }

export function contractNumber(projectCode: string, kind: ContractKind, seq: number) {
  return `${projectCode}/${kindCode[kind]}-${String(seq).padStart(2, '0')}`
}

export const paymentPlans: Record<ContractKind, [string, number][]> = {
  design: [
    ['دفعة مقدمة عند التوقيع', 20],
    ['اعتماد التصميم المبدئي', 25],
    ['التصميم النهائي واللوحات التنفيذية', 35],
    ['مستندات المناقصة', 20],
  ],
  supervision: [
    ['دفعة مقدمة', 15],
    ['أقساط شهرية خلال التنفيذ', 60],
    ['الاستلام الابتدائي', 15],
    ['الاستلام النهائي', 10],
  ],
  addendum: [
    ['عند التوقيع', 50],
    ['عند تسليم الأعمال الإضافية', 50],
  ],
}

const VE_PLAN: [string, number][] = [
  ['دفعة مقدمة', 30],
  ['تقرير مراجعة التصميم', 50],
  ['تقرير الهندسة القيمية النهائي', 20],
]

type ContractSeed = {
  id: string
  projectId: string
  kind: ContractKind
  title: string
  value: number
  signedDaysAgo: number
  endsInDays: number
  paid: number
  scope: string
  plan?: [string, number][]
  by?: string
}

const contractSeeds: ContractSeed[] = [
  { id: 'c1', projectId: 'p1', kind: 'design', title: 'عقد التصميم المتكامل — مصنع الدمام', value: 30_500_000, signedDaysAgo: 120, endsInDays: 150, paid: 2, scope: 'التصميم المعماري والإنشائي والكهروميكانيكي الكامل للمصنع والمباني الإدارية، واستخراج التراخيص من الدفاع المدني والبلدية.' },
  { id: 'c2', projectId: 'p2', kind: 'design', title: 'عقد مراجعة التصميم والهندسة القيمية', value: 1_450_000, signedDaysAgo: 40, endsInDays: 20, paid: 2, plan: VE_PLAN, scope: 'مراجعة تصميمات التكييف والصحي والحريق والكهرباء للمبنى الجديد وتقديم بدائل هندسة قيمية مع تقدير الوفر.' },
  { id: 'c3', projectId: 'p4', kind: 'design', title: 'عقد تصميم الأعمال الكهروميكانيكية — فندق فوكو', value: 15_300_000, signedDaysAgo: 200, endsInDays: 25, paid: 3, by: 'u-admin', scope: 'تصميم أعمال التكييف والصحي والحريق والكهرباء والتيار الخفيف للفندق (220 غرفة) ومستندات المناقصة.' },
  { id: 'c4', projectId: 'p4', kind: 'addendum', title: 'ملحق رقم 1 — إضافة السبا وقاعة الاجتماعات', value: 1_900_000, signedDaysAgo: 20, endsInDays: 25, paid: 1, by: 'u-admin', scope: 'تصميم الأعمال الكهروميكانيكية الإضافية للسبا وقاعة الاجتماعات بالدور الأرضي بناءً على طلب المالك.' },
  { id: 'c5', projectId: 'p5', kind: 'design', title: 'عقد تصميم خط إنتاج الحلوى', value: 3_200_000, signedDaysAgo: 90, endsInDays: 200, paid: 1, scope: 'تصميم التكييف الصناعي والهواء المضغوط والتغذية الكهربائية ولوحات MCC لخط الإنتاج الجديد.' },
  { id: 'c6', projectId: 'p7', kind: 'design', title: 'عقد تصميم المصنع الجديد', value: 2_750_000, signedDaysAgo: 300, endsInDays: -10, paid: 4, scope: 'التصميم الكهروميكانيكي الكامل للمصنع الجديد ومستندات المناقصة.' },
  { id: 'c7', projectId: 'p9', kind: 'design', title: 'عقد تصميم الأعمال الكهروميكانيكية — سنو سيتي', value: 4_100_000, signedDaysAgo: 150, endsInDays: 120, paid: 2, scope: 'تصميم أنظمة التبريد الخاصة بصالة الثلج والتكييف والحريق والكهرباء داخل سيتي ستارز.' },
  { id: 'c8', projectId: 'p10', kind: 'design', title: 'عقد التصميم المتكامل — ذا كيرف', value: 6_800_000, signedDaysAgo: 180, endsInDays: 90, paid: 2, scope: 'التصميم المعماري والإنشائي والكهروميكانيكي للمبنى الإداري التجاري في العاصمة الإدارية.' },
  { id: 'c9', projectId: 'p10', kind: 'supervision', title: 'عقد الإشراف على التنفيذ — ذا كيرف', value: 5_200_000, signedDaysAgo: 30, endsInDays: 540, paid: 1, scope: 'الإشراف الكامل على تنفيذ الأعمال الإنشائية والكهروميكانيكية واعتماد الرسومات التنفيذية والخامات ومستخلصات المقاول.' },
  { id: 'c10', projectId: 'p12', kind: 'design', title: 'عقد تصميم مبنى الإنتاج — حورس فارما', value: 3_900_000, signedDaysAgo: 60, endsInDays: 260, paid: 1, by: 'u-admin', scope: 'التصميم المتكامل لمبنى الإنتاج وفق متطلبات GMP شاملاً الغرف النظيفة وأنظمة HVAC والمياه النقية.' },
  { id: 'c11', projectId: 'p16', kind: 'design', title: 'عقد تجديد أنظمة قاعة الحفلات', value: 1_950_000, signedDaysAgo: 70, endsInDays: 45, paid: 3, by: 'u-admin', scope: 'إعادة تصميم التكييف والإضاءة والصوت وأنظمة الحريق لقاعة الحفلات الكبرى.' },
  { id: 'c12', projectId: 'p14', kind: 'design', title: 'عقد تصميم غرفة التبريد والكمبروسورات', value: 2_100_000, signedDaysAgo: 400, endsInDays: -60, paid: 4, scope: 'تصميم غرفة الكمبروسورات وشبكات الأمونيا ومخازن التبريد.' },
]

function buildContracts(projects: Project[], now: number): Contract[] {
  const seq: Record<string, number> = {}
  return contractSeeds.map((c) => {
    const project = projects.find((p) => p.id === c.projectId)!
    const key = `${c.projectId}-${c.kind}`
    seq[key] = (seq[key] ?? 0) + 1
    const number = contractNumber(project.code, c.kind, seq[key])
    const signedAt = now - c.signedDaysAgo * D
    const plan = c.plan ?? paymentPlans[c.kind]
    const span = (now - signedAt) / Math.max(c.paid, 1)
    const fileBase = number.replace('/', '-')
    return {
      id: c.id,
      number,
      projectId: c.projectId,
      kind: c.kind,
      title: c.title,
      value: c.value,
      signedAt,
      endsAt: now + c.endsInDays * D,
      scope: c.scope,
      payments: plan.map(([title, percent], i) => ({
        id: `${c.id}-m${i}`,
        title,
        percent,
        ...(i < c.paid && { paidAt: signedAt + Math.round(span * i + 2 * D), paidBy: 'u-admin' }),
      })),
      attachments: [
        { type: 'file', name: `${fileBase}-Signed.pdf`, size: 2_400_000 + c.value % 900_000 },
        ...(c.kind !== 'addendum' ? [{ type: 'file' as const, name: `${fileBase}-Scope-of-Work.docx`, size: 380_000 }] : []),
      ],
      uploadedBy: c.by ?? 'u-pm1',
      uploadedAt: signedAt + D,
    }
  })
}

function userOf(id: string) {
  return users.find((u) => u.id === id)!
}

function buildInquiry(s: InqSeed, now: number): Inquiry {
  const createdAt = now - s.hoursAgo * H
  const messages: Message[] = [{ id: s.id + '-m1', senderId: s.from, text: s.text, attachments: [], createdAt }]
  const firstResponseAt = s.reply ? createdAt + s.reply.afterMin * 60_000 : undefined
  if (s.reply) messages.push({ id: s.id + '-m2', senderId: s.reply.by, text: s.reply.text, attachments: [], createdAt: firstResponseAt! })
  return {
    id: s.id,
    projectId: s.projectId,
    title: s.title,
    fromUserId: s.from,
    fromDeptId: userOf(s.from).departmentId,
    toDeptIds: s.to,
    assigneeIds: s.assignees ?? [],
    priority: s.priority,
    status: s.closedAfterH ? 'closed' : s.reply ? 'answered' : 'open',
    createdAt,
    dueAt: createdAt + SLA_HOURS[s.priority] * H,
    firstResponseAt,
    closedAt: s.closedAfterH ? createdAt + s.closedAfterH * H : undefined,
    messages,
  }
}

export function seedData() {
  const now = Date.now()

  const projects: Project[] = projectSeeds.map(({ flow, deadlineInDays, departmentIds, ...p }) => {
    const steps = buildSteps(p.templateId!, flow[0], flow[1], flow[2], now)
    return {
      ...p,
      departmentIds: departmentIds ?? departments.map((d) => d.id),
      deadline: now + deadlineInDays * D,
      createdBy: 'u-admin',
      createdAt: steps[0].startedAt ?? now,
      steps,
      log: p.id === 'p4'
        ? [{ id: 'p4-r1', type: 'return' as const, stepId: 'm3', toStepId: 'm2', by: 'u-plumb-head', at: now - 170 * H, note: 'مسارات الدكت الرئيسية في الممرات تتعارض مع مسارات مواسير الرشاشات، برجاء رفع منسوب الدكت أو تعديل المسار.' }]
        : [],
    }
  })

  const i1Start = now - 26 * H
  const i2Start = now - 6 * H
  const inquiries = ([
    {
      id: 'i1',
      projectId: 'p5',
      title: 'أحمال وحدات مناولة الهواء لصالة خط الحلوى',
      fromUserId: 'u-elec-1',
      fromDeptId: 'elec',
      toDeptIds: ['mech'],
      assigneeIds: ['u-mech-head', 'u-mech-1'],
      priority: 'normal',
      status: 'answered',
      createdAt: i1Start,
      dueAt: i1Start + 24 * H,
      firstResponseAt: i1Start + 2 * H + 15 * 60_000,
      messages: [
        {
          id: 'm1',
          senderId: 'u-elec-1',
          text: 'محتاجين القدرة الكهربائية لكل وحدة AHU وعدد مراوح الطرد في صالة خط الحلوى لتحديد مقاس لوحة الـ MCC. مرفق مخطط اللوحات المبدئي.',
          attachments: [{ type: 'file', name: 'Candy-Line-MCC-R0.pdf', size: 2_450_000 }],
          createdAt: i1Start,
        },
        {
          id: 'm2',
          senderId: 'u-mech-head',
          text: 'إجمالي 6 وحدات AHU بقدرة 22 ك.و لكل وحدة + 4 مراوح طرد 5.5 ك.و، وكلها بـ VFD. التفاصيل في جدول المعدات على الرابط.',
          attachments: [{ type: 'link', url: 'https://drive.google.com/mondelez-candy-equipment-schedule' }],
          createdAt: i1Start + 2 * H + 15 * 60_000,
        },
        {
          id: 'm3',
          senderId: 'u-elec-1',
          text: 'تمام، هنحدّث اللوحة ونرسل النسخة المعدلة للمراجعة.',
          attachments: [],
          createdAt: i1Start + 3 * H,
        },
      ],
    },
    {
      id: 'i2',
      projectId: 'p12',
      title: 'فتحات في البلاطة لصواعد الحريق والصرف — مبنى الإنتاج',
      fromUserId: 'u-plumb-1',
      fromDeptId: 'plumb',
      toDeptIds: ['civil', 'elec'],
      assigneeIds: [],
      priority: 'urgent',
      status: 'open',
      createdAt: i2Start,
      dueAt: i2Start + 4 * H,
      messages: [
        {
          id: 'm4',
          senderId: 'u-plumb-1',
          text: 'محتاجين 4 فتحات 30×30 سم في البلاطات بجوار الشفت الشمالي لصواعد الحريق والصرف. هل فيه تعارض مع التسليح أو مسارات الكابلات؟',
          attachments: [{ type: 'file', name: 'Horus-Shaft-Openings.dwg', size: 1_120_000 }],
          createdAt: i2Start,
        },
      ],
    },
    ...inqSeeds.map((s) => buildInquiry(s, now)),
  ] satisfies Inquiry[] as Inquiry[]).sort((a, b) => b.createdAt - a.createdAt)

  const submittals = buildSubmittals(projects, now)
  const contracts = buildContracts(projects, now)
  const alerts = dueAlerts(projects, inquiries, submittals, contracts, now)

  return {
    templates,
    projects,
    inquiries,
    submittals,
    contracts,
    notifications: buildNotifications(projects, inquiries, submittals, contracts, alerts, now),
    alerted: alerts.map((a) => a.key),
  }
}

export type DueAlert = { key: string; userIds: string[]; text: Localized; link: string; at: number }

/** Every delay/escalation the system should have raised by `now`. Keys are stable so each alert fires once. */
export function dueAlerts(projects: Project[], inquiries: Inquiry[], submittals: Submittal[], contracts: Contract[], now: number): DueAlert[] {
  const out: DueAlert[] = []
  const deptUsers = (ids: string[]) => users.filter((u) => ids.includes(u.departmentId)).map((u) => u.id)
  const add = (a: DueAlert) => a.at <= now && out.push(a)

  for (const p of projects) {
    const link = `/projects/${p.id}`
    const done = p.steps.length > 0 && p.steps.every((s) => s.status === 'done')
    for (const s of p.steps) {
      if (s.status !== 'active' || !s.startedAt) continue
      add({
        key: `step:${p.id}:${s.id}:${p.log?.length ?? 0}`,
        userIds: [...deptUsers([s.departmentId]), p.managerId, 'u-admin'],
        text: { ar: `تأخير: مرحلة "${s.title.ar}" في ${p.name} تجاوزت ${s.slaHours} ساعة`, en: `Delay: "${s.title.en}" on ${en(p.name)} exceeded ${s.slaHours}h` },
        link,
        at: s.startedAt + s.slaHours * H,
      })
    }
    if (done) continue
    add({
      key: `due:${p.id}`,
      userIds: [p.managerId, 'u-admin'],
      text: { ar: `تنبيه: موعد تسليم ${p.name} خلال 3 أيام`, en: `Heads-up: ${en(p.name)} is due within 3 days` },
      link,
      at: Math.max(p.deadline - 3 * D, p.createdAt),
    })
    add({
      key: `late:${p.id}`,
      userIds: [p.managerId, 'u-admin', ...deptUsers(p.departmentIds).filter((id) => userOf(id).role === 'head')],
      text: { ar: `تجاوز موعد التسليم: ${p.name}`, en: `Deadline missed: ${en(p.name)}` },
      link,
      at: p.deadline,
    })
  }

  for (const inq of inquiries) {
    if (inq.firstResponseAt || inq.status === 'closed') continue
    const link = `/inquiries/${inq.id}`
    const recipients = inq.assigneeIds.length ? inq.assigneeIds : deptUsers(inq.toDeptIds)
    const heads = users.filter((u) => inq.toDeptIds.includes(u.departmentId) && u.role === 'head').map((u) => u.id)
    add({
      key: `inq:${inq.id}`,
      userIds: [...recipients, inq.fromUserId],
      text: { ar: `استفسار متأخر عن الرد: ${inq.title}`, en: `Inquiry overdue: ${en(inq.title)}` },
      link,
      at: inq.dueAt,
    })
    add({
      key: `esc:${inq.id}`,
      userIds: [...heads, 'u-admin'],
      text: { ar: `تصعيد: استفسار لقسمك تجاوز المدة المحددة — ${inq.title}`, en: `Escalation: inquiry to your department is overdue — ${en(inq.title)}` },
      link,
      at: inq.dueAt + H,
    })
  }

  for (const s of submittals) {
    const r = latestRevision(s)
    if (r.code) continue
    add({
      key: `sub:${s.id}:${r.rev}`,
      userIds: [...reviewers().map((u) => u.id), r.submittedBy],
      text: { ar: `تقديم متأخر في المراجعة: ${s.number} — ${s.title}`, en: `Submittal review overdue: ${s.number} — ${en(s.title)}` },
      link: `/submittals/${s.id}`,
      at: reviewDueAt(r),
    })
  }

  for (const c of contracts) {
    const manager = projects.find((p) => p.id === c.projectId)?.managerId
    add({
      key: `ctr:${c.id}`,
      userIds: [...contractManagers().map((u) => u.id), ...(manager ? [manager] : [])],
      text: { ar: `عقد ينتهي خلال ${CONTRACT_EXPIRY_DAYS} يوم: ${c.number} — ${c.title}`, en: `Contract ends within ${CONTRACT_EXPIRY_DAYS} days: ${c.number}` },
      link: `/contracts/${c.id}`,
      at: c.endsAt - CONTRACT_EXPIRY_DAYS * D,
    })
  }

  return out
}

/** Replays every event in the seed data as the notifications the system would have sent. */
function buildNotifications(projects: Project[], inquiries: Inquiry[], submittals: Submittal[], contracts: Contract[], alerts: DueAlert[], now: number): AppNotification[] {
  const out: AppNotification[] = []
  const deptUsers = (ids: string[]) => users.filter((u) => ids.includes(u.departmentId)).map((u) => u.id)
  const push = (userIds: string[], type: AppNotification['type'], text: Localized, link: string, at: number, exclude?: string) => {
    for (const userId of new Set(userIds)) {
      if (userId === exclude || at > now) continue
      out.push({ id: `n${out.length}`, userId, type, text, link, createdAt: at, read: now - at > 20 * H })
    }
  }
  const deptName = (id: string) => departments.find((d) => d.id === id)!.name

  for (const p of projects) {
    const link = `/projects/${p.id}`
    push(deptUsers(p.departmentIds), 'project', { ar: `مشروع جديد بدأ: ${p.name}`, en: `New project started: ${en(p.name)}` }, link, p.createdAt, p.createdBy)
    p.steps.forEach((s, i) => {
      if (s.startedAt && i > 0)
        push(deptUsers([s.departmentId]), 'step', { ar: `دورك: بدأت مرحلة "${s.title.ar}" في ${p.name}`, en: `Your turn: "${s.title.en}" started on ${en(p.name)}` }, link, s.startedAt)
      if (s.completedAt)
        push([p.managerId, 'u-admin'], 'step', { ar: `${deptName(s.departmentId).ar} أنهى "${s.title.ar}" في ${p.name}`, en: `${deptName(s.departmentId).en} completed "${s.title.en}" on ${en(p.name)}` }, link, s.completedAt, s.completedBy)
    })
    for (const e of p.log ?? []) {
      const step = p.steps.find((s) => s.id === e.stepId)!
      const target = p.steps.find((s) => s.id === e.toStepId)
      if (e.type === 'return' && target)
        push([...deptUsers([target.departmentId]), p.managerId], 'step', { ar: `تم إرجاع "${target.title.ar}" من مرحلة "${step.title.ar}" في ${p.name}`, en: `"${target.title.en}" was returned from "${step.title.en}" on ${en(p.name)}` }, link, e.at, e.by)
    }
  }

  for (const inq of inquiries) {
    const link = `/inquiries/${inq.id}`
    const recipients = inq.assigneeIds.length ? inq.assigneeIds : deptUsers(inq.toDeptIds)
    const from = deptName(inq.fromDeptId)
    push(recipients, 'inquiry', { ar: `استفسار جديد من ${from.ar}: ${inq.title}`, en: `New inquiry from ${from.en}: ${en(inq.title)}` }, link, inq.createdAt, inq.fromUserId)
    for (const m of inq.messages.slice(1)) {
      const sender = users.find((u) => u.id === m.senderId)!
      push([inq.fromUserId, ...recipients], 'message', { ar: `رد جديد من ${sender.name.ar}: ${inq.title}`, en: `New reply from ${sender.name.en}: ${en(inq.title)}` }, link, m.createdAt, m.senderId)
    }
    if (inq.closedAt) push(recipients, 'message', { ar: `تم إغلاق الاستفسار: ${inq.title}`, en: `Inquiry closed: ${en(inq.title)}` }, link, inq.closedAt, inq.fromUserId)
  }

  for (const s of submittals) {
    const link = `/submittals/${s.id}`
    for (const r of s.revisions) {
      push(reviewers().map((u) => u.id), 'submittal', { ar: `تقديم جديد للمراجعة: ${s.number} (Rev ${r.rev})`, en: `New submittal for review: ${s.number} (Rev ${r.rev})` }, link, r.submittedAt, r.submittedBy)
      if (r.code && r.reviewedAt)
        push(deptUsers([s.departmentId]), 'submittal', { ar: `نتيجة المراجعة (كود ${r.code}): ${s.number}`, en: `Review result (code ${r.code}): ${s.number}` }, link, r.reviewedAt, r.reviewedBy)
    }
  }

  for (const c of contracts) {
    const manager = projects.find((p) => p.id === c.projectId)!.managerId
    push([...contractManagers().map((u) => u.id), manager], 'contract', { ar: `تم رفع عقد جديد: ${c.number} — ${c.title}`, en: `New contract uploaded: ${c.number}` }, `/contracts/${c.id}`, c.uploadedAt, c.uploadedBy)
  }

  for (const a of alerts) push(a.userIds, 'overdue', a.text, a.link, a.at)

  return out.sort((a, b) => b.createdAt - a.createdAt)
}
