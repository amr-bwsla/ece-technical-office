import { Languages, LogIn } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DevCredit from '../components/DevCredit'
import { Avatar } from '../components/ui'
import { useT } from '../i18n'
import { departments, users } from '../seed'
import { LOGO, useStore } from '../store'
import type { User } from '../types'

export const emailOf = (u: User) => u.name.en.replace(/^Eng\.\s*/, '').toLowerCase().replace(/\s+/g, '.') + '@ece-eg.com'
const DEMO_PASSWORD = '123456'

export default function Login() {
  const { t, l, lang } = useT()
  const navigate = useNavigate()
  const login = useStore((s) => s.login)
  const setLang = useStore((s) => s.setLang)
  const [email, setEmail] = useState(emailOf(users[0]))
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [error, setError] = useState(false)

  const enter = (id: string) => {
    login(id)
    navigate('/')
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const u = users.find((x) => emailOf(x) === email.trim().toLowerCase())
    if (!u || password !== DEMO_PASSWORD) return setError(true)
    enter(u.id)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-800 via-teal-700 to-slate-800 p-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md space-y-4">
        <div className="flex justify-end">
          <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20">
            <Languages className="size-4" /> {lang === 'ar' ? 'EN' : 'ع'}
          </button>
        </div>
        <div className="space-y-3 rounded-3xl bg-white px-6 py-5 text-center shadow-2xl">
          <img src={LOGO} alt="Elite Consolidated Engineers" className="mx-auto h-20 object-contain" />
          <div className="border-t border-slate-100 pt-3">
            <div className="text-lg font-bold text-teal-700">{t('appName')}</div>
            <div className="text-sm text-slate-500">{t('loginSubtitle')}</div>
          </div>
        </div>

        <form onSubmit={submit} className="card space-y-3 !p-6">
          <h1 className="text-lg font-bold">{t('login')}</h1>
          <div>
            <label className="label">{t('email')}</label>
            <input className="input" dir="ltr" type="email" value={email} onChange={(e) => (setEmail(e.target.value), setError(false))} />
          </div>
          <div>
            <label className="label">{t('password')}</label>
            <input className="input" dir="ltr" type="password" value={password} onChange={(e) => (setPassword(e.target.value), setError(false))} />
          </div>
          {error && <p className="text-sm font-semibold text-red-600">{t('wrongLogin')}</p>}
          <button className="btn-primary w-full"><LogIn className="size-4" /> {t('login')}</button>
        </form>

        <div className="card space-y-3">
          <div className="text-sm font-semibold text-slate-500">{t('demoAccounts')}</div>
          <div className="max-h-72 space-y-3 overflow-y-auto">
            {departments.map((d) => (
              <div key={d.id} className="space-y-1">
                <div className="text-xs font-bold" style={{ color: d.color }}>{l(d.name)}</div>
                {users
                  .filter((u) => u.departmentId === d.id)
                  .map((u) => (
                    <button
                      key={u.id}
                      onClick={() => enter(u.id)}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-start hover:bg-slate-100"
                    >
                      <Avatar userId={u.id} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{l(u.name)}</span>
                        <span className="block truncate text-xs text-slate-400" dir="ltr">{emailOf(u)}</span>
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{t(`role_${u.role}`)}</span>
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <DevCredit center />
        </div>
      </div>
    </div>
  )
}
