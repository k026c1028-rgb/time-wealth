import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { calcEarned, calcHourlyRate, calcPerSecond } from '../lib/calc'
import { formatHours, formatJPY, formatMoney } from '../lib/format'
import { calcDailyWage, calcWageEarned } from '../lib/wageCalc'
import { useAppStore } from '../store/useAppStore'
import { LanguageSwitcher } from './LanguageSwitcher'
import { openWidget } from '../widget/openWidget'
import { SharePosterButton } from './SharePoster'
import { CloudSyncPanel } from './CloudSyncPanel'
import type { CurrencyCode } from '../types'

const currencyOptions: CurrencyCode[] = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CNY',
  'AUD',
  'CAD',
  'CHF',
  'HKD',
  'SGD',
]

export function TimerPanel() {
  const { t } = useTranslation()
  const settings = useAppStore((s) => s.settings)
  const timer = useAppStore((s) => s.timer)
  const setSettings = useAppStore((s) => s.setSettings)
  const wageRules = useAppStore((s) => s.wageRules)
  const setWageRules = useAppStore((s) => s.setWageRules)
  const start = useAppStore((s) => s.start)
  const pause = useAppStore((s) => s.pause)
  const reset = useAppStore((s) => s.reset)
  const isPro = useAppStore((s) => s.entitlements.isPro)
  const openProModal = useAppStore((s) => s.openProModal)

  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [])

  const earned = useMemo(() => calcEarned(settings, timer, nowMs), [settings, timer, nowMs])
  const hourly = useMemo(() => calcHourlyRate(settings), [settings])
  const perSecond = useMemo(() => calcPerSecond(settings), [settings])

  // Pro: Wage rules (after-tax/night/overtime)
  const wage = useMemo(() => calcDailyWage(wageRules), [wageRules])
  const wageTotalSeconds = Math.max(1, wage.actualHours * 3600)
  const workedSeconds = useMemo(() => {
    if (!timer.isRunning || !timer.startedAtMs) return timer.elapsedMs / 1000
    return (timer.elapsedMs + (nowMs - timer.startedAtMs)) / 1000
  }, [timer, nowMs])
  const wageEarned = useMemo(
    () =>
      calcWageEarned({
        mode: wageRules.displayMode,
        workedSeconds,
        totalSeconds: wageTotalSeconds,
        grossPay: wage.grossPay,
        netPay: wage.netPay,
      }),
    [wageRules.displayMode, workedSeconds, wageTotalSeconds, wage.grossPay, wage.netPay],
  )

  return (
    <section className="card">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                <span className="bg-gradient-to-r from-fuchsia-600 via-violet-600 to-sky-600 bg-clip-text text-transparent">
                  {t('app.name')}
                </span>
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                {t('app.tagline')}
              </p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-zinc-200/70 bg-white/60 px-3 py-1 text-xs text-zinc-600 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/30 dark:text-zinc-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 animate-breathe" />
                <span>{t('app.microcalm')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <button
                className="btn"
                type="button"
                onClick={() => {
                  if (!isPro) return openProModal('pro_widget')
                  return openWidget()
                }}
              >
                {t('common.widget')}
              </button>
              <SharePosterButton />
              <button
                className={isPro ? 'btn btn-primary' : 'btn'}
                type="button"
                onClick={() => openProModal('open_pro')}
                title={t('pro.title')}
              >
                {isPro ? t('pro.pro') : t('pro.button')}
              </button>
              {timer.isRunning ? (
                <button className="btn" onClick={pause} type="button">
                  {t('common.pause')}
                </button>
              ) : (
                <button className="btn btn-primary" onClick={start} type="button">
                  {t('common.start')}
                </button>
              )}
              <button className="btn" onClick={reset} type="button">
                {t('common.reset')}
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-200/70 bg-gradient-to-br from-white to-fuchsia-50 p-4 dark:border-zinc-800/70 dark:from-zinc-950 dark:to-fuchsia-950/20">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {t('earned.title')}
              </div>
              {isPro && (
                <div className="inline-flex overflow-hidden rounded-full border border-zinc-200/70 bg-white/60 text-xs dark:border-zinc-800/70 dark:bg-zinc-950/30">
                  <button
                    type="button"
                    className={
                      wageRules.displayMode === 'gross'
                        ? 'px-3 py-1.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950'
                        : 'px-3 py-1.5'
                    }
                    onClick={() => setWageRules({ displayMode: 'gross' })}
                  >
                    {t('wage.gross')}
                  </button>
                  <button
                    type="button"
                    className={
                      wageRules.displayMode === 'net'
                        ? 'px-3 py-1.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950'
                        : 'px-3 py-1.5'
                    }
                    onClick={() => setWageRules({ displayMode: 'net' })}
                  >
                    {t('wage.net')}
                  </button>
                </div>
              )}
            </div>
            <div className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
              {isPro ? formatJPY(wageEarned) : formatMoney(earned, settings.currency)}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              {isPro ? (
                <>
                  <Rate label={t('wage.todayGross')} value={formatJPY(wage.grossPay)} />
                  <Rate label={t('wage.todayTax')} value={formatJPY(wage.taxAmount)} />
                  <Rate label={t('wage.todayNet')} value={formatJPY(wage.netPay)} />
                  <Rate
                    label={t('earned.perSec')}
                    value={formatJPY((wageRules.displayMode === 'net' ? wage.netPay : wage.grossPay) / wageTotalSeconds)}
                  />
                </>
              ) : (
                <>
                  <Rate label={t('earned.perSec')} value={formatMoney(perSecond, settings.currency)} />
                  <Rate label={t('earned.perMin')} value={formatMoney(perSecond * 60, settings.currency)} />
                  <Rate label={t('earned.perHour')} value={formatMoney(hourly, settings.currency)} />
                  <Rate
                    label={t('earned.perDayWithHours', { hours: settings.hoursPerDay })}
                    value={formatMoney(hourly * settings.hoursPerDay, settings.currency)}
                  />
                </>
              )}
            </div>
          </div>

          {/* 今日工资计算（Pro） */}
          <div className="mt-4 rounded-2xl border border-zinc-200/70 bg-white/60 p-4 dark:border-zinc-800/70 dark:bg-zinc-950/30">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{t('wage.todayTitle')}</div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t('wage.todayHint')}</div>
              </div>
              {!isPro && (
                <button className="btn btn-primary" type="button" onClick={() => openProModal('pro_wage')}>
                  {t('pro.button')}
                </button>
              )}
            </div>

            <div className={isPro ? 'mt-3 grid grid-cols-2 gap-3 text-sm' : 'mt-3 grid grid-cols-2 gap-3 text-sm opacity-50'}>
              <Rate label={t('wage.actualHours')} value={`${formatHours(wage.actualHours)}h`} />
              <Rate label={t('wage.normalHours')} value={`${formatHours(wage.normalHours)}h`} />
              <Rate label={t('wage.nightHours')} value={`${formatHours(wage.nightHours)}h`} />
              <Rate label={t('wage.overtimeHours')} value={`${formatHours(wage.overtimeHours)}h`} />
              <Rate label={t('wage.todayGross')} value={formatJPY(wage.grossPay)} />
              <Rate label={t('wage.todayTax')} value={formatJPY(wage.taxAmount)} />
              <div className="col-span-2">
                <Rate label={t('wage.todayNet')} value={formatJPY(wage.netPay)} />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-[320px]">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <div className="label">{t('settings.currency')}</div>
              <select
                className="input"
                value={settings.currency}
                onChange={(e) => setSettings({ currency: e.target.value })}
              >
                {currencyOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <div className="label">{t('settings.annualSalary')}</div>
              <input
                className="input"
                type="number"
                inputMode="decimal"
                value={settings.annualSalary}
                onChange={(e) => setSettings({ annualSalary: Number(e.target.value) })}
                min={0}
              />
            </div>

            <div>
              <div className="label">{t('settings.workDaysPerYear')}</div>
              <input
                className="input"
                type="number"
                inputMode="numeric"
                value={settings.workDaysPerYear}
                onChange={(e) => setSettings({ workDaysPerYear: Number(e.target.value) })}
                min={1}
              />
            </div>

            <div>
              <div className="label">{t('settings.hoursPerDay')}</div>
              <input
                className="input"
                type="number"
                inputMode="decimal"
                value={settings.hoursPerDay}
                onChange={(e) => setSettings({ hoursPerDay: Number(e.target.value) })}
                min={0.5}
                step={0.5}
              />
            </div>
          </div>

          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            {t('settings.countsNote')}
          </p>

          {/* 工资规则设置（Pro） */}
          <div className="mt-4 rounded-2xl border border-zinc-200/70 bg-white/60 p-4 dark:border-zinc-800/70 dark:bg-zinc-950/30">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{t('wage.rulesTitle')}</div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t('wage.rulesHint')}</div>
              </div>
              {!isPro && (
                <button className="btn btn-primary" type="button" onClick={() => openProModal('pro_wage')}>
                  {t('pro.button')}
                </button>
              )}
            </div>

            <div className={isPro ? 'mt-3 grid grid-cols-2 gap-3' : 'mt-3 grid grid-cols-2 gap-3 opacity-50'}>
              <div className="col-span-2">
                <div className="label">{t('wage.hourlyWage')}</div>
                <input
                  className="input"
                  type="number"
                  inputMode="decimal"
                  value={wageRules.hourlyWage}
                  onChange={(e) => isPro && setWageRules({ hourlyWage: Number(e.target.value) })}
                  min={0}
                />
              </div>

              <div>
                <div className="label">{t('wage.startTime')}</div>
                <input
                  className="input"
                  type="time"
                  value={wageRules.startTime}
                  onChange={(e) => isPro && setWageRules({ startTime: e.target.value })}
                />
              </div>
              <div>
                <div className="label">{t('wage.endTime')}</div>
                <input
                  className="input"
                  type="time"
                  value={wageRules.endTime}
                  onChange={(e) => isPro && setWageRules({ endTime: e.target.value })}
                />
              </div>

              <div>
                <div className="label">{t('wage.breakMinutes')}</div>
                <input
                  className="input"
                  type="number"
                  inputMode="numeric"
                  value={wageRules.breakMinutes}
                  onChange={(e) => isPro && setWageRules({ breakMinutes: Number(e.target.value) })}
                  min={0}
                />
              </div>
              <div>
                <div className="label">{t('wage.taxRate')}</div>
                <input
                  className="input"
                  type="number"
                  inputMode="decimal"
                  value={wageRules.taxRate}
                  onChange={(e) => isPro && setWageRules({ taxRate: Number(e.target.value) })}
                  step={0.0001}
                  min={0}
                />
              </div>

              <div>
                <div className="label">{t('wage.nightRate')}</div>
                <input
                  className="input"
                  type="number"
                  inputMode="decimal"
                  value={wageRules.nightRate}
                  onChange={(e) => isPro && setWageRules({ nightRate: Number(e.target.value) })}
                  step={0.01}
                  min={1}
                />
              </div>
              <div>
                <div className="label">{t('wage.overtimeRate')}</div>
                <input
                  className="input"
                  type="number"
                  inputMode="decimal"
                  value={wageRules.overtimeRate}
                  onChange={(e) => isPro && setWageRules({ overtimeRate: Number(e.target.value) })}
                  step={0.01}
                  min={1}
                />
              </div>
            </div>
          </div>

          <CloudSyncPanel />
        </div>
      </div>
    </section>
  )
}

function Rate({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200/60 bg-white/70 px-3 py-2 dark:border-zinc-800/60 dark:bg-zinc-950/30">
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  )
}
