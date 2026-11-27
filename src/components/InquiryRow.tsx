import { ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { timeAgo, useT } from '../i18n'
import { useStore } from '../store'
import type { Inquiry } from '../types'
import { DeptChip, PriorityDot, ResponseTimer, StatusBadge } from './ui'

export default function InquiryRow({ inq }: { inq: Inquiry }) {
  const { lang, tx } = useT()
  const project = useStore((s) => s.projects.find((p) => p.id === inq.projectId))
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight
  return (
    <Link to={`/inquiries/${inq.id}`} className="card block space-y-2 transition hover:border-teal-300">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <PriorityDot p={inq.priority} />
          <span className="truncate font-semibold">{tx(inq.title)}</span>
        </div>
        <StatusBadge inq={inq} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
        <DeptChip id={inq.fromDeptId} />
        <Arrow className="size-3.5" />
        {inq.toDeptIds.map((d) => <DeptChip key={d} id={d} />)}
        <span className="mx-1">·</span>
        <span className="truncate">{project?.code}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <ResponseTimer inq={inq} />
        <span className="flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-0.5"><MessageCircle className="size-3.5" />{inq.messages.length}</span>
          {timeAgo(inq.createdAt, lang)}
        </span>
      </div>
    </Link>
  )
}
