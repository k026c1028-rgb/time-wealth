import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { formatMoney } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import type { SavingsCadence, SavingsGoal } from '../types'

const cadenceOptions: Array<{ value: SavingsCadence; key: string }> = [
  { value: 'daily', key: 'savings.cadenceDaily' },
  { value: 'weekly', key: 'savings.cadenceWeekly' },
  { value: 'monthly', key: 'savings.cadenceMonthly' },
]

export function SavingsPlanner() {
  const { t } = useTranslation()
  const currency = useAppStore((s) => s.settings.currency)
  const goals = useAppStore((s) => s.savingsGoals)
  const isPro = useAppStore((s) => s.entitlements.isPro)
  const add = useAppStore((s) => s.addSavingsGoal)
  const update = useAppStore((s) => s.updateSavingsGoal)
  const remove = useAppStore((s) => s.removeSavingsGoal)

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState<number>(0)
  const [savedAmount, setSavedAmount] = useState<number>(0)
  const [formError, setFormError] = useState<string | null>(null)
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 3)
    return d.toISOString().slice(0, 10)
  })
  const [cadence, setCadence] = useState<SavingsCadence>('weekly')

  function resetForm() {
    setName('')
    setTargetAmount(0)
    setSavedAmount(0)
    setFormError(null)
    const d = new Date()
    d.setMonth(d.getMonth() + 3)
    setTargetDate(d.toISOString().slice(0, 10))
    setCadence('weekly')
  }

  function submit() {
    setFormError(null)
    const cleanName = name.trim()
    if (!cleanName) return setFormError(t('savings.errorNameRequired'))
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) return setFormError(t('savings.errorTargetAmount'))
    if (!targetDate) return setFormError(t('savings.errorTargetDate'))

    const ok = add({
      name: cleanName,
      currency,
      targetAmount,
      savedAmount: Number.isFinite(savedAmount) ? savedAmount : 0,
      targetDate,
      cadence,
    })
    if (!ok) return setFormError(t('pro.reasonSavingsLimit', { n: 3 }))
    resetForm()
    setOpen(false)
  }

  return (
    <section className="card">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{t('savings.title')}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{t('savings.subtitle')}</p>
          {!isPro && (
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {t('savings.limitNote', { used: goals.length, n: 3 })}
            </p>
          )}
        </div>
        {!open ? (
          <button className="btn btn-primary" type="button" onClick={() => setOpen(true)}>
            {t('savings.add')}
          </button>
        ) : null}
      </div>

      {open && (
        <div className="mt-4 rounded-2xl border border-zinc-200/70 bg-white/60 p-4 dark:border-zinc-800/70 dark:bg-zinc-950/30">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="label">{t('savings.name')}</div>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('savings.namePlaceholder')} />
            </div>
            <div>
              <div className="label">{t('savings.targetAmount')}</div>
              <input
                className="input"
                type="number"
                inputMode="decimal"
                value={targetAmount || ''}
                onChange={(e) => setTargetAmount(Number(e.target.value))}
                min={0}
              />
            </div>
            <div>
              <div className="label">{t('savings.savedAmount')}</div>
              <input
                className="input"
                type="number"
                inputMode="decimal"
                value={savedAmount || ''}
                onChange={(e) => setSavedAmount(Number(e.target.value))}
                min={0}
              />
            </div>
            <div>
              <div className="label">{t('savings.targetDate')}</div>
              <input className="input" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
            <div>
              <div className="label">{t('savings.cadence')}</div>
              <select className="input" value={cadence} onChange={(e) => setCadence(e.target.value as SavingsCadence)}>
                {cadenceOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t(o.key)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 md:col-span-2 md:justify-end">
              <button className="btn" type="button" onClick={() => { setOpen(false); resetForm() }}>
                {t('common.cancel')}
              </button>
              <button className="btn btn-primary" type="button" onClick={submit}>
                {t('common.save')}
              </button>
            </div>
            {formError && (
              <div className="md:col-span-4 text-xs text-rose-600 dark:text-rose-300">
                {formError}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {goals.map((g) => (
          <SavingsCard key={g.id} goal={g} onUpdate={(p) => update(g.id, p)} onRemove={() => remove(g.id)} />
        ))}
      </div>

      {!goals.length && (
        <div className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">{t('savings.none')}</div>
      )}
    </section>
  )
}

function SavingsCard({
  goal,
  onUpdate,
  onRemove,
}: {
  goal: SavingsGoal
  onUpdate: (patch: Partial<SavingsGoal>) => void
  onRemove: () => void
}) {
  const { t } = useTranslation()

  const today = new Date()
  const target = new Date(goal.targetDate + 'T00:00:00')
  const msLeft = target.getTime() - today.setHours(0, 0, 0, 0)
  const daysLeft = Math.ceil(msLeft / 86400000)

  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount)
  const pct = goal.targetAmount > 0 ? Math.min(1, goal.savedAmount / goal.targetAmount) : 0

  const recommended = useMemo(() => {
    if (remaining <= 0) return { daily: 0, weekly: 0, monthly: 0 }
    if (!Number.isFinite(daysLeft) || daysLeft <= 0) return { daily: remaining, weekly: remaining, monthly: remaining }
    const daily = remaining / daysLeft
    const weekly = daily * 7
    const monthly = daily * 30
    return { daily, weekly, monthly }
  }, [remaining, daysLeft])

  const cadenceAmount =
    goal.cadence === 'daily' ? recommended.daily : goal.cadence === 'weekly' ? recommended.weekly : recommended.monthly

  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 dark:border-zinc-800/70 dark:bg-zinc-950/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{goal.name}</div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {t('savings.target')}: {formatMoney(goal.targetAmount, goal.currency)} · {t('savings.deadline')}: {goal.targetDate}
          </div>
        </div>
        <button className="btn" type="button" onClick={onRemove} title={t('common.remove')}>
          {t('common.remove')}
        </button>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>{t('savings.progress')}</span>
          <span>{Math.round(pct * 100)}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
          <div className="h-2 rounded-full bg-sky-600 transition-[width] duration-300" style={{ width: `${Math.round(pct * 100)}%` }} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <Stat label={t('savings.saved')} value={formatMoney(goal.savedAmount, goal.currency)} />
        <Stat label={t('savings.remaining')} value={remaining <= 0 ? t('common.done') : formatMoney(remaining, goal.currency)} />
        <Stat label={t('savings.daysLeft')} value={daysLeft <= 0 ? t('savings.overdue') : t('savings.days', { count: daysLeft })} />
        <Stat
          label={t('savings.recommended', { cadence: t(cadenceOptions.find((c) => c.value === goal.cadence)?.key || '') })}
          value={formatMoney(cadenceAmount, goal.currency)}
        />
      </div>

      <div className="mt-3 rounded-xl border border-zinc-200/60 bg-white/60 p-3 dark:border-zinc-800/60 dark:bg-zinc-950/20">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">{t('savings.updateSaved')}</div>
          <input
            className="input !w-[140px]"
            type="number"
            inputMode="decimal"
            value={goal.savedAmount}
            onChange={(e) => onUpdate({ savedAmount: Number(e.target.value) })}
            min={0}
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">{t('savings.cadence')}</div>
          <select
            className="input !w-[140px]"
            value={goal.cadence}
            onChange={(e) => onUpdate({ cadence: e.target.value as SavingsCadence })}
          >
            {cadenceOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.key)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
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
