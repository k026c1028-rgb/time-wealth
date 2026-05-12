import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { calcEarned } from '../lib/calc'
import { formatMoney } from '../lib/format'
import { useAppStore } from '../store/useAppStore'

const defaultMilestones = [10_000, 25_000, 50_000, 100_000]

export function Milestones() {
  const { t } = useTranslation()
  const settings = useAppStore((s) => s.settings)
  const timer = useAppStore((s) => s.timer)

  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [])

  const earned = useMemo(() => calcEarned(settings, timer, nowMs), [settings, timer, nowMs])

  return (
    <section className="card">
      <h2 className="text-lg font-semibold tracking-tight">{t('milestones.title')}</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        {defaultMilestones.map((m) => {
          const pct = m > 0 ? Math.min(1, earned / m) : 0
          const remaining = Math.max(0, m - earned)
          return (
            <div
              key={m}
              className="rounded-2xl border border-zinc-200/70 bg-white p-4 dark:border-zinc-800/70 dark:bg-zinc-950/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-semibold">{formatMoney(m, settings.currency)}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">{Math.round(pct * 100)}%</div>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                <div
                  className="h-2 rounded-full bg-emerald-600 transition-[width] duration-300"
                  style={{ width: `${Math.round(pct * 100)}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {remaining <= 0
                  ? t('common.completed')
                  : t('milestones.toGo', { amount: formatMoney(remaining, settings.currency) })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
