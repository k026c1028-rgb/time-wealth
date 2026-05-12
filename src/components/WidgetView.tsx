import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { calcEarned, calcPerSecond } from '../lib/calc'
import { formatMoney } from '../lib/format'
import { useAppStore } from '../store/useAppStore'

/**
 * 小组件视图：只显示「已赚到」与「每秒」。
 * 用于：?widget=1、小窗/置顶 PiP 模式。
 */
export function WidgetView({ compact }: { compact?: boolean }) {
  const { t } = useTranslation()
  const settings = useAppStore((s) => s.settings)
  const timer = useAppStore((s) => s.timer)

  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [])

  const earned = useMemo(() => calcEarned(settings, timer, nowMs), [settings, timer, nowMs])
  const perSecond = useMemo(() => calcPerSecond(settings), [settings])

  return (
    <div
      className={[
        'card',
        'w-full',
        compact ? 'p-3' : 'p-4',
        'bg-white/70 dark:bg-zinc-950/40',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
            {t('earned.title')}
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {formatMoney(earned, settings.currency)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 animate-breathe" />
          <span className="text-xs text-zinc-600 dark:text-zinc-300">{t('earned.perSec')}</span>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-zinc-200/60 bg-white/70 px-3 py-2 text-sm dark:border-zinc-800/60 dark:bg-zinc-950/30">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{t('earned.perSec')}</div>
        <div className="mt-0.5 font-medium">{formatMoney(perSecond, settings.currency)}</div>
      </div>
    </div>
  )
}

