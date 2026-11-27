import {
  AlertTriangle,
  BarChart3,
  Bell,
  ClipboardCheck,
  Download,
  FastForward,
  FileSignature,
  FolderKanban,
  GitBranch,
  Home,
  Languages,
  Loader,
  LogOut,
  Menu,
  MessagesSquare,
  RotateCcw,
  Search,
  Share,
  WifiOff,
  X,
} from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { type DictKey, useT } from '../i18n'
import { useInstall, useOnline } from '../pwa'
import { reviewers } from '../seed'
import { canManageContracts, contractStatus, deptById, isRecipient, submittalStatus, useMe, useStore } from '../store'
import DevCredit from './DevCredit'
import EceLogo from './EceLogo'
import { Avatar } from './ui'

const ALERT_CHECK_MS = 30_000

type NavItem = { to: string; key: DictKey; short?: DictKey; icon: typeof Home; adminOnly?: boolean; hidden?: boolean; badge?: number }

function Toast() {
  const { l } = useT()
  const toast = useStore((s) => s.toast)
  const dismiss = useStore((s) => s.dismissToast)
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(dismiss, toast.alert ? 7000 : 4000)
    return () => clearTimeout(id)
  }, [toast, dismiss])
  if (!toast) return null
  return (
    <div className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 md:bottom-6 print:hidden">
      <div
        className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm text-white shadow-2xl ring-1 ring-white/10 ${toast.alert ? 'bg-red-700' : 'bg-slate-900'}`}
      >
        {toast.alert ? <AlertTriangle className="size-4 text-red-200" /> : <Bell className="size-4 text-teal-300" />}
        {l(toast.text)}
      </div>
    </div>
  )
}

export default function Layout() {
  const { t, l, lang } = useT()
  const me = useMe()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { setLang, logout, resetDemo, fastForward, checkDueAlerts, loggedIn } = useStore()
  const unread = useStore((s) => s.notifications.filter((n) => n.userId === me.id && !n.read).length)
  const waiting = useStore((s) => s.inquiries.filter((i) => i.status === 'open' && isRecipient(i, me)).length)
  const isReviewer = reviewers().some((u) => u.id === me.id)
  const submittalTodo = useStore(
    (s) =>
      s.submittals.filter((x) => {
        const status = submittalStatus(x)
        return isReviewer ? status === 'review' : status === 'resubmit' && x.departmentId === me.departmentId
      }).length,
  )
  const expiringContracts = useStore((s) => s.contracts.filter((c) => contractStatus(c) === 'expiring').length)
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [iosHintOpen, setIosHintOpen] = useState(false)
  const { canPrompt, iosHint, install } = useInstall()
  const online = useOnline()
  const onInstall = () => (canPrompt ? install() : setIosHintOpen(true))

  useEffect(() => {
    if (!loggedIn) return
    checkDueAlerts()
    const id = setInterval(checkDueAlerts, ALERT_CHECK_MS)
    return () => clearInterval(id)
  }, [loggedIn, checkDueAlerts, me.id])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.title = `ECE — ${t('appName')}`
  }, [lang, t])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  if (!loggedIn) return <Navigate to="/login" replace />

  const nav: NavItem[] = [
    { to: '/', key: 'dashboard', icon: Home },
    { to: '/projects', key: 'projects', icon: FolderKanban },
    { to: '/inquiries', key: 'inquiries', icon: MessagesSquare, badge: waiting },
    { to: '/submittals', key: 'submittals', short: 'submittalsShort', icon: ClipboardCheck, badge: submittalTodo },
    { to: '/contracts', key: 'contracts', icon: FileSignature, hidden: !canManageContracts(me), badge: expiringContracts },
    { to: '/notifications', key: 'notifications', icon: Bell, badge: unread },
    { to: '/workflows', key: 'workflows', icon: GitBranch, adminOnly: true },
    { to: '/reports', key: 'reports', icon: BarChart3 },
  ]
  const items = nav.filter((n) => !n.hidden && (!n.adminOnly || me.role === 'admin'))
  const mobileItems = items.filter((n) => !['/notifications', '/workflows', '/contracts'].includes(n.to))
  const moreItems = items.filter((n) => ['/workflows', '/contracts'].includes(n.to))

  const search = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/projects?q=${encodeURIComponent(query)}`)
    setQuery('')
  }

  return (
    <div className="min-h-screen overflow-x-clip md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col no-scrollbar overflow-y-auto bg-gradient-to-b from-slate-900 to-slate-950 p-4 text-slate-300 md:flex print:!hidden">
        <div className="mb-4 space-y-3">
          <div className="px-2 pt-2">
            <EceLogo className="h-16" />
          </div>
          <div className="border-t border-white/10 px-2 pt-3">
            <div className="text-base font-bold text-white">{t('appName')}</div>
            <div className="text-[11px] text-slate-400">{t('loginSubtitle')}</div>
          </div>
        </div>
        <nav className="space-y-1">
          {items.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/40' : 'hover:bg-white/5 hover:text-white'}`
              }
            >
              <n.icon className="size-5" />
              <span className="flex-1">{t(n.key)}</span>
              {!!n.badge && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">{n.badge}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3 pt-4">
          {(canPrompt || iosHint) && (
            <button onClick={onInstall} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15">
              <Download className="size-4" /> {t('installApp')}
            </button>
          )}
          <div className="space-y-1.5">
            <button onClick={() => fastForward(4)} className="flex items-center gap-2 px-3 text-xs text-slate-500 hover:text-slate-300">
              <FastForward className="size-3.5 rtl:-scale-x-100" /> {t('fastForward')}
            </button>
            <button onClick={resetDemo} className="flex items-center gap-2 px-3 text-xs text-slate-500 hover:text-slate-300">
              <RotateCcw className="size-3.5" /> {t('resetDemo')}
            </button>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            <Avatar userId={me.id} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-white">{l(me.name)}</div>
              <div className="truncate text-xs text-slate-400">{l(deptById(me.departmentId).name)}</div>
            </div>
            <button onClick={logout} title={t('logout')} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300">
              <LogOut className="size-4 rtl:rotate-180" />
            </button>
          </div>
          <div className="border-t border-white/10 px-1 pt-3">
            <DevCredit />
          </div>
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur-lg print:hidden">
          <div className="flex min-w-0 items-center gap-2 md:hidden">
            <Avatar userId={me.id} />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{l(me.name)}</div>
              <div className="truncate text-xs text-slate-500">{t(`role_${me.role}`)} · {l(deptById(me.departmentId).name)}</div>
            </div>
          </div>
          <form onSubmit={search} className="relative hidden max-w-md flex-1 md:block">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 ps-9 pe-3 text-sm outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
              placeholder={t('search')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>
          <div className="ms-auto flex items-center gap-1">
            <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="btn-ghost !px-2.5 !py-1.5" title="Language">
              <Languages className="size-4" /> {lang === 'ar' ? 'EN' : 'ع'}
            </button>
            <button onClick={() => navigate('/notifications')} className="relative rounded-xl p-2 hover:bg-slate-100">
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -end-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unread}
                </span>
              )}
            </button>
            <button onClick={() => setMenuOpen(true)} title={t('more')} className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 md:hidden">
              <Menu className="size-5" />
            </button>
          </div>
        </header>
        {!online && (
          <div className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-xs font-semibold text-amber-900 print:hidden">
            <WifiOff className="size-4" /> {t('offline')}
          </div>
        )}

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6 print:max-w-none print:p-0">
          <Suspense
            fallback={
              <div className="flex justify-center py-20 text-slate-400">
                <Loader className="size-6 animate-spin" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
        <footer className="border-t border-slate-200 bg-white/60 px-4 py-4 md:hidden print:hidden">
          <DevCredit tone="light" center />
        </footer>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden print:hidden">
        {mobileItems.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) =>
              `relative flex h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${isActive ? 'text-teal-700' : 'text-slate-500'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-teal-700" />}
                <n.icon className="size-5" />
                <span className="max-w-full truncate px-1 leading-none">{t(n.short ?? n.key)}</span>
                {!!n.badge && (
                  <span className="absolute top-2 start-1/2 ms-2 rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-4 text-white">{n.badge}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden print:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/40" />
          <div
            className="absolute inset-x-0 bottom-0 space-y-1 rounded-t-3xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="font-bold">{t('more')}</div>
              <button onClick={() => setMenuOpen(false)} title={t('close')} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                <X className="size-5" />
              </button>
            </div>
            {moreItems.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                <n.icon className="size-5 text-slate-500" />
                <span className="flex-1">{t(n.key)}</span>
                {!!n.badge && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">{n.badge}</span>}
              </NavLink>
            ))}
            {(canPrompt || iosHint) && (
              <button onClick={onInstall} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-teal-700 hover:bg-teal-50">
                <Download className="size-5" /> {t('installApp')}
              </button>
            )}
            <button onClick={() => fastForward(4)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold hover:bg-slate-50">
              <FastForward className="size-5 text-slate-500 rtl:-scale-x-100" /> {t('fastForward')}
            </button>
            <button onClick={resetDemo} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold hover:bg-slate-50">
              <RotateCcw className="size-5 text-slate-500" /> {t('resetDemo')}
            </button>
            <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-600 hover:bg-red-50">
              <LogOut className="size-5 rtl:rotate-180" /> {t('logout')}
            </button>
            <div className="mt-2 border-t border-slate-100 pt-3">
              <DevCredit tone="light" />
            </div>
          </div>
        </div>
      )}

      {iosHintOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center print:hidden" onClick={() => setIosHintOpen(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img src="./apple-touch-icon.png" alt="" className="mx-auto mb-3 size-14 rounded-2xl" />
            <div className="font-bold">{t('installIosTitle')}</div>
            <p className="mt-2 flex items-center justify-center gap-1 text-sm text-slate-600">
              <Share className="size-4 shrink-0 text-sky-600" /> {t('installIosHint')}
            </p>
            <button onClick={() => setIosHintOpen(false)} className="btn-primary mt-4 w-full justify-center">
              {t('close')}
            </button>
          </div>
        </div>
      )}
      <Toast />
    </div>
  )
}
