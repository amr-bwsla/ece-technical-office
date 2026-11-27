import { useEffect, useState } from 'react'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: InstallPromptEvent | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((f) => f())

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferred = e as InstallPromptEvent
  emit()
})
window.addEventListener('appinstalled', () => {
  deferred = null
  emit()
})

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export const isMobileDevice = () => isIOS() || /android|mobile/i.test(navigator.userAgent)

const DISMISS_KEY = 'install-banner-dismissed'
const DISMISS_DAYS = 3

export const installBannerDismissed = () => Date.now() - Number(localStorage.getItem(DISMISS_KEY) ?? 0) < DISMISS_DAYS * 86_400_000

export const dismissInstallBanner = () => localStorage.setItem(DISMISS_KEY, String(Date.now()))

function useSubscribe() {
  const [, force] = useState(0)
  useEffect(() => {
    const f = () => force((n) => n + 1)
    listeners.add(f)
    return () => {
      listeners.delete(f)
    }
  }, [])
}

export function useInstall() {
  useSubscribe()
  const standalone = isStandalone()
  return {
    standalone,
    ios: isIOS(),
    canPrompt: !!deferred && !standalone,
    iosHint: !deferred && !standalone && isIOS(),
    install: async () => {
      if (!deferred) return
      await deferred.prompt()
      await deferred.userChoice
      deferred = null
      emit()
    },
  }
}

export function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}
