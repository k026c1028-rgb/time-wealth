import type { WageRules, WageDisplayMode } from '../types'

function parseTimeToMinutes(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec((hhmm || '').trim())
  if (!m) return 0
  const hh = Math.max(0, Math.min(23, Number(m[1])))
  const mm = Math.max(0, Math.min(59, Number(m[2])))
  return hh * 60 + mm
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export type WageBreakdown = {
  actualHours: number
  normalHours: number
  nightHours: number
  overtimeHours: number
  normalPay: number
  nightPay: number
  overtimePay: number
  grossPay: number
  taxAmount: number
  netPay: number
  taxRateUsed: number
}

export function calcDailyWage(rules: WageRules): WageBreakdown {
  const hourlyWage = Number.isFinite(rules.hourlyWage) ? rules.hourlyWage : 0
  const nightRate = Number.isFinite(rules.nightRate) ? rules.nightRate : 1.25
  const overtimeRate = Number.isFinite(rules.overtimeRate) ? rules.overtimeRate : 1.25
  // If user leaves it blank, the input often becomes 0 — treat 0 as "not set".
  const taxRateUsed =
    Number.isFinite(rules.taxRate) && rules.taxRate > 0
      ? rules.taxRate
      : 0.1021

  const start = parseTimeToMinutes(rules.startTime)
  let end = parseTimeToMinutes(rules.endTime)
  if (end <= start) end += 1440

  const rawDuration = Math.max(0, end - start)
  const breakMinutes = clamp(Number.isFinite(rules.breakMinutes) ? rules.breakMinutes : 0, 0, rawDuration)

  // Place break in the middle of the shift (best-effort assumption).
  const breakStart = start + Math.floor((rawDuration - breakMinutes) / 2)
  const breakEnd = breakStart + breakMinutes

  let workedIdx = 0
  let normalMin = 0
  let nightMin = 0
  let overtimeMin = 0

  for (let m = start; m < end; m++) {
    if (breakMinutes > 0 && m >= breakStart && m < breakEnd) continue

    workedIdx++
    const isOvertime = workedIdx > 480 // after 8 hours of actual worked minutes

    const clock = ((m % 1440) + 1440) % 1440
    const isNight = clock >= 22 * 60 || clock < 5 * 60

    if (isOvertime) overtimeMin++
    else if (isNight) nightMin++
    else normalMin++
  }

  const actualMin = normalMin + nightMin + overtimeMin

  const normalHours = normalMin / 60
  const nightHours = nightMin / 60
  const overtimeHours = overtimeMin / 60
  const actualHours = actualMin / 60

  const normalPay = normalHours * hourlyWage
  const nightPay = nightHours * hourlyWage * nightRate
  const overtimePay = overtimeHours * hourlyWage * overtimeRate
  const grossPay = normalPay + nightPay + overtimePay
  const taxAmount = grossPay * taxRateUsed
  const netPay = grossPay - taxAmount

  return {
    actualHours,
    normalHours,
    nightHours,
    overtimeHours,
    normalPay,
    nightPay,
    overtimePay,
    grossPay,
    taxAmount,
    netPay,
    taxRateUsed,
  }
}

export function calcWageEarned({
  mode,
  workedSeconds,
  totalSeconds,
  grossPay,
  netPay,
}: {
  mode: WageDisplayMode
  workedSeconds: number
  totalSeconds: number
  grossPay: number
  netPay: number
}) {
  const total = Math.max(1, totalSeconds)
  const t = Math.max(0, Math.min(total, workedSeconds))
  const base = mode === 'net' ? netPay : grossPay
  return (base * t) / total
}
