import { useT } from '../i18n'

const SITE = 'https://digitalbwsla.com'
const EMAIL = 'info@digitalbwsla.com'

export default function DevCredit({ tone = 'dark', center = false }: { tone?: 'dark' | 'light'; center?: boolean }) {
  const { t } = useT()
  const muted = tone === 'dark' ? 'text-white/60' : 'text-slate-500'
  const strong = tone === 'dark' ? 'text-white' : 'text-slate-800'
  return (
    <div className={`flex items-center gap-2.5 text-[11px] ${muted} ${center ? 'justify-center' : ''}`}>
      <a href={SITE} target="_blank" rel="noopener" className="shrink-0">
        <img src="./digitalbwsla.png" alt={t('devCompany')} className="size-8 rounded-lg bg-white object-contain p-0.5 shadow-sm" />
      </a>
      <div className="min-w-0 leading-snug">
        <div>
          {t('developedBy')}{' '}
          <a href={SITE} target="_blank" rel="noopener" className={`font-bold ${strong} hover:underline`}>
            {t('devCompany')}
          </a>
        </div>
        <div className="flex flex-wrap gap-x-1.5">
          <a href={SITE} target="_blank" rel="noopener" dir="ltr" className="hover:underline">
            digitalbwsla.com
          </a>
          <span>·</span>
          <a href={`mailto:${EMAIL}`} dir="ltr" className="hover:underline">
            {EMAIL}
          </a>
        </div>
      </div>
    </div>
  )
}
