import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { supabase, supabaseEnabled } from '../lib/supabaseClient'
import { applyPayload, pullFromCloud, pushToCloud } from '../lib/cloudSync'
import { useAppStore } from '../store/useAppStore'

function debounceMs(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export function CloudSyncPanel() {
  const { t } = useTranslation()
  const isPro = useAppStore((s) => s.entitlements.isPro)
  const openProModal = useAppStore((s) => s.openProModal)
  const settings = useAppStore((s) => s.settings)
  const goals = useAppStore((s) => s.goals)
  const savingsGoals = useAppStore((s) => s.savingsGoals)
  const wageRules = useAppStore((s) => s.wageRules)

  const [email, setEmail] = useState('')
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [cooldownLeft, setCooldownLeft] = useState(0)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(() => localStorage.getItem('tw:lastSyncAt'))

  // Avoid LAN IP churn: allow overriding redirect target for magic link.
  // Example: VITE_PUBLIC_SITE_URL=http://MSI:5173
  const redirectTo = ((import.meta as any).env?.VITE_PUBLIC_SITE_URL as string | undefined)?.trim() || window.location.origin

  useEffect(() => {
    if (cooldownLeft <= 0) return
    const id = window.setInterval(() => {
      setCooldownLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [cooldownLeft])

  useEffect(() => {
    if (!supabaseEnabled || !supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user?.email ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user?.email ?? null)
    })
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  // Auto backup (debounced) when Pro + logged in
  const snapshotKey = useMemo(() => JSON.stringify({ settings, goals, savingsGoals, wageRules }), [settings, goals, savingsGoals, wageRules])

  useEffect(() => {
    if (!isPro) return
    if (!supabaseEnabled || !supabase) return
    if (!sessionEmail) return

    let cancelled = false
    ;(async () => {
      await debounceMs(1500)
      if (cancelled) return
      try {
        const r = await pushToCloud()
        localStorage.setItem('tw:lastSyncAt', r.updatedAt)
        setLastSyncAt(r.updatedAt)
      } catch {
        // silent auto backup
      }
    })()
    return () => {
      cancelled = true
    }
  }, [snapshotKey, isPro, sessionEmail])

  return (
    <div className="mt-4 rounded-2xl border border-zinc-200/70 bg-white/60 p-4 dark:border-zinc-800/70 dark:bg-zinc-950/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{t('cloud.title')}</div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t('cloud.hint')}</div>
        </div>
        {!isPro && (
          <button className="btn btn-primary" type="button" onClick={() => openProModal('pro_cloud')}>
            {t('pro.button')}
          </button>
        )}
      </div>

      {!supabaseEnabled && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
          {t('cloud.notConfigured')}
        </div>
      )}

      <div className={isPro ? 'mt-3 space-y-3' : 'mt-3 space-y-3 opacity-50'}>
        <div className="rounded-xl border border-zinc-200/60 bg-white/60 p-3 dark:border-zinc-800/60 dark:bg-zinc-950/20">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">{t('cloud.account')}</div>
          <div className="mt-1 text-sm font-medium">
            {sessionEmail ? t('cloud.signedInAs', { email: sessionEmail }) : t('cloud.notSignedIn')}
          </div>

          {!sessionEmail ? (
            <div className="mt-2 flex gap-2">
              <input
                className="input flex-1"
                placeholder={t('cloud.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isPro || !supabaseEnabled}
              />
              <button
                className="btn btn-primary"
                type="button"
                disabled={!isPro || !supabaseEnabled || busy || cooldownLeft > 0 || !email.trim()}
                onClick={async () => {
                  if (!isPro) return openProModal('pro_cloud')
                  if (!supabaseEnabled || !supabase) return
                  if (cooldownLeft > 0) return
                  try {
                    setBusy(true)
                    setStatus(null)
                    // Cooldown to reduce rate-limit issues.
                    setCooldownLeft(60)
                    const { error } = await supabase.auth.signInWithOtp({
                      email: email.trim(),
                      options: { emailRedirectTo: redirectTo },
                    })
                    if (error) throw error
                    setStatus(t('cloud.magicLinkSent'))
                  } catch (e: any) {
                    setStatus(String(e?.message || e))
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                {cooldownLeft > 0 ? t('cloud.signInCooldown', { seconds: cooldownLeft }) : t('cloud.signIn')}
              </button>
            </div>
          ) : (
            <div className="mt-2 flex gap-2">
              <button
                className="btn"
                type="button"
                disabled={!isPro || !supabaseEnabled || busy}
                onClick={async () => {
                  if (!supabaseEnabled || !supabase) return
                  setBusy(true)
                  try {
                    await supabase.auth.signOut()
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                {t('cloud.signOut')}
              </button>
              {lastSyncAt && (
                <div className="text-xs text-zinc-500 dark:text-zinc-400 self-center">
                  {t('cloud.lastSync', { at: new Date(lastSyncAt).toLocaleString() })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="btn"
            type="button"
            disabled={!isPro || !supabaseEnabled || !sessionEmail || busy}
            onClick={async () => {
              if (!isPro) return openProModal('pro_cloud')
              setBusy(true)
              setStatus(null)
              try {
                const r = await pushToCloud()
                localStorage.setItem('tw:lastSyncAt', r.updatedAt)
                setLastSyncAt(r.updatedAt)
                setStatus(t('cloud.synced'))
              } catch (e: any) {
                setStatus(String(e?.message || e))
              } finally {
                setBusy(false)
              }
            }}
          >
            {t('cloud.push')}
          </button>
          <button
            className="btn"
            type="button"
            disabled={!isPro || !supabaseEnabled || !sessionEmail || busy}
            onClick={async () => {
              if (!isPro) return openProModal('pro_cloud')
              setBusy(true)
              setStatus(null)
              try {
                const p = await pullFromCloud()
                if (!p) {
                  setStatus(t('cloud.noData'))
                } else {
                  applyPayload(p)
                  setStatus(t('cloud.pulled'))
                }
              } catch (e: any) {
                setStatus(String(e?.message || e))
              } finally {
                setBusy(false)
              }
            }}
          >
            {t('cloud.pull')}
          </button>
        </div>

        {status && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {status}
          </div>
        )}
      </div>
    </div>
  )
}
