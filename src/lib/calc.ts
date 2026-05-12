import type { SalarySettings, TimerState } from '../types'

export function calcHourlyRate(settings: SalarySettings) {
  const { annualSalary, workDaysPerYear, hoursPerDay } = settings
  if (!annualSalary || !workDaysPerYear || !hoursPerDay) return 0
  return annualSalary / workDaysPerYear / hoursPerDay
}

export function calcPerSecond(settings: SalarySettings) {
  return calcHourlyRate(settings) / 3600
}

export function calcElapsedMs(timer: TimerState, nowMs: number) {
  if (!timer.isRunning || !timer.startedAtMs) return timer.elapsedMs
  return timer.elapsedMs + (nowMs - timer.startedAtMs)
}

export function calcEarned(settings: SalarySettings, timer: TimerState, nowMs: number) {
  const perSecond = calcPerSecond(settings)
  const elapsedMs = calcElapsedMs(timer, nowMs)
  return perSecond * (elapsedMs / 1000)
}

