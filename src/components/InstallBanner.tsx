import { Download, Share, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useT } from '../i18n'
import { dismissInstallBanner, installBannerDismissed, isMobileDevice, useInstall } from '../pwa'

const SHOW_DELAY_MS = 1500

export default function InstallBanner() {
  const { t, lang } = useT()
  const { standalone, ios, canPrompt, install } = useInstall()
  const [visible, setVisible] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    if (standalone || !isMobileDevice() || installBannerDismissed()) return
    const id = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    return () => clearTimeout(id)
  }, [standalone])

  if (!visible || standalone) return null

  const close = () => {
    dismissInstallBanner()
    setVisible(false)
  }
  const onInstall = async () => {
    await install()
    setVisible(false)
  }

  return (
    <div
      className={`fixed inset-x-3 z-50 animate-[slide-up_.35s_ease-out] md:hidden print:hidden ${pathname === '/login' ? 'bottom-[calc(0.75rem+env(safe-area-inset-bottom))]' : 'bottom-[calc(5rem+env(safe-area-inset-bottom))]'}`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="flex items-start gap-3 rounded-2xl bg-white p-3.5 shadow-2xl ring-1 ring-slate-900/10">
        <img src="./apple-touch-icon.png" alt="" className="size-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">{t('installTitle')}</div>
          <p className="mt-0.5 text-xs text-slate-500">
            {canPrompt ? (
              t('installPitch')
            ) : ios ? (
              <>
                <Share className="me-1 inline size-3.5 align-[-2px] text-sky-600" />
                {t('installIosHint')}
              </>
            ) : (
              t('installAndroidHint')
            )}
          </p>
          <div className="mt-2.5 flex gap-2">
            {canPrompt && (
              <button onClick={onInstall} className="btn-primary !px-3 !py-1.5 text-xs">
                <Download className="size-3.5" /> {t('install')}
              </button>
            )}
            <button onClick={close} className="btn-ghost !px-3 !py-1.5 text-xs">
              {t('notNow')}
            </button>
          </div>
        </div>
        <button onClick={close} title={t('close')} className="-m-1 rounded-lg p-1 text-slate-400 hover:bg-slate-100">
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
