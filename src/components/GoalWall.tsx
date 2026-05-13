import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { calcEarned, calcPerSecond } from '../lib/calc'
import { formatDateTime, formatDuration, formatMoney } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import type { Category } from '../types'
import type { SupportedLang } from '../i18n/init'

const categories: Array<{ key: Category | 'All'; label: string }> = [
  { key: 'All', label: 'common.all' },
  { key: 'Tech', label: 'categories.Tech' },
  { key: 'Watches', label: 'categories.Watches' },
  { key: 'Cars', label: 'categories.Cars' },
  { key: 'Travel', label: 'categories.Travel' },
  { key: 'Property', label: 'categories.Property' },
  { key: 'Hobbies', label: 'categories.Hobbies' },
  { key: 'Custom', label: 'categories.Custom' },
]

export function GoalWall() {
  const { t, i18n } = useTranslation()
  const settings = useAppStore((s) => s.settings)
  const timer = useAppStore((s) => s.timer)
  const goals = useAppStore((s) => s.goals)
  const selectedCategory = useAppStore((s) => s.selectedCategory)
  const setSelectedCategory = useAppStore((s) => s.setSelectedCategory)
  const addGoal = useAppStore((s) => s.addGoal)
  const removeGoal = useAppStore((s) => s.removeGoal)

  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [])

  const earned = useMemo(() => calcEarned(settings, timer, nowMs), [settings, timer, nowMs])
  const perSecond = useMemo(() => calcPerSecond(settings), [settings])

  const filtered = useMemo(() => {
    if (selectedCategory === 'All') return goals
    return goals.filter((g) => g.category === selectedCategory)
  }, [goals, selectedCategory])

  return (
    <section className="card">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{t('goals.title')}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            {t('goals.subtitle')}
          </p>
        </div>
        <AddGoalInline onAdd={(g) => addGoal(g)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.key}
            type="button"
            className={c.key === selectedCategory ? 'btn btn-primary' : 'btn'}
            onClick={() => setSelectedCategory(c.key)}
          >
            {t(c.label)}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {filtered.map((g) => {
          const remaining = Math.max(0, g.price - earned)
          const secondsNeeded = perSecond > 0 ? remaining / perSecond : Infinity
          const eta = timer.isRunning && Number.isFinite(secondsNeeded) ? nowMs + secondsNeeded * 1000 : null
          const done = remaining <= 0.00001
          const pct = g.price > 0 ? Math.min(1, earned / g.price) : 0
          const lang = (i18n.language || 'en') as SupportedLang
          const displayName =
            (g.nameI18n && g.nameI18n[lang]) ||
            (g.nameKey ? t(`presets.${g.nameKey}`, { defaultValue: g.name }) : g.name)

          return (
            <div key={g.id} className="rounded-2xl border border-zinc-200/70 bg-white p-4 dark:border-zinc-800/70 dark:bg-zinc-950/60">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{displayName}</div>
                  <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {t(`categories.${g.category}`)} · {t('goals.target', { amount: formatMoney(g.price, settings.currency) })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn" type="button" onClick={() => removeGoal(g.id)} title={t('common.remove')}>
                    {t('common.remove')}
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{t('goals.progress')}</span>
                  <span>{Math.round(pct * 100)}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                  <div
                    className="h-2 rounded-full bg-fuchsia-600 transition-[width] duration-300"
                    style={{ width: `${Math.round(pct * 100)}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <Stat
                  label={t('goals.remaining')}
                  value={done ? t('common.done') : formatMoney(remaining, settings.currency)}
                />
                <Stat
                  label={t('goals.timeNeeded')}
                  value={done ? '—' : Number.isFinite(secondsNeeded) ? formatDuration(secondsNeeded) : '—'}
                />
                <Stat
                  label={t('goals.dailyPace')}
                  value={perSecond > 0 ? formatMoney(perSecond * 3600 * settings.hoursPerDay, settings.currency) : '—'}
                />
                <Stat
                  label={t('goals.eta')}
                  value={eta ? formatDateTime(eta) : timer.isRunning ? '—' : t('goals.startTimer')}
                />
              </div>
            </div>
          )
        })}
      </div>

      {!filtered.length && (
        <div className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
          {t('goals.none')}
        </div>
      )}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200/60 bg-white/60 px-3 py-2 dark:border-zinc-800/60 dark:bg-zinc-950/20">
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  )
}

function AddGoalInline({
  onAdd,
}: {
  onAdd: (goal: { name: string; price: number; category: Category }) => boolean
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState<number>(0)
  const [category, setCategory] = useState<Category>('Custom')

  function submit() {
    const cleanName = name.trim()
    if (!cleanName) return
    if (!Number.isFinite(price) || price <= 0) return
    const ok = onAdd({
      name: cleanName,
      price,
      category,
    })
    if (!ok) return
    setName('')
    setPrice(0)
    setCategory('Custom')
    setOpen(false)
  }

  if (!open) {
    return (
      <button className="btn btn-primary" type="button" onClick={() => setOpen(true)}>
        {t('goals.add')}
      </button>
    )
  }

  return (
    <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-end">
      <div className="md:w-[220px]">
        <div className="label">{t('goals.name')}</div>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('goals.examplePlaceholder')}
        />
      </div>
      <div className="md:w-[140px]">
        <div className="label">{t('goals.price')}</div>
        <input
          className="input"
          type="number"
          inputMode="decimal"
          value={price || ''}
          onChange={(e) => setPrice(Number(e.target.value))}
          min={0}
        />
      </div>
      <div className="md:w-[140px]">
        <div className="label">{t('goals.category')}</div>
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
          {categories
            .filter((c) => c.key !== 'All')
            .map((c) => (
              <option key={c.key} value={c.key}>
                {t(c.label)}
              </option>
            ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button className="btn btn-primary" type="button" onClick={submit}>
          {t('common.save')}
        </button>
        <button className="btn" type="button" onClick={() => setOpen(false)}>
          {t('common.cancel')}
        </button>
      </div>
    </div>
  )
}
