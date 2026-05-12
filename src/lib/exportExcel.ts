import * as XLSX from 'xlsx'
import { useAppStore } from '../store/useAppStore'

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function ymd() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

export function exportExcel() {
  const s = useAppStore.getState()

  const wb = XLSX.utils.book_new()

  const summary = [
    { key: 'currency', value: s.settings.currency },
    { key: 'annualSalary', value: s.settings.annualSalary },
    { key: 'workDaysPerYear', value: s.settings.workDaysPerYear },
    { key: 'hoursPerDay', value: s.settings.hoursPerDay },
    { key: 'wage.hourlyWage', value: s.wageRules.hourlyWage },
    { key: 'wage.startTime', value: s.wageRules.startTime },
    { key: 'wage.endTime', value: s.wageRules.endTime },
    { key: 'wage.breakMinutes', value: s.wageRules.breakMinutes },
    { key: 'wage.nightRate', value: s.wageRules.nightRate },
    { key: 'wage.overtimeRate', value: s.wageRules.overtimeRate },
    { key: 'wage.taxRate', value: s.wageRules.taxRate },
    { key: 'exportedAt', value: new Date().toISOString() },
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'Summary')

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      s.goals.map((g) => ({
        id: g.id,
        name: g.name,
        nameKey: (g as any).nameKey ?? '',
        category: g.category,
        price: g.price,
        createdAt: g.createdAt ? new Date(g.createdAt).toISOString() : '',
      })),
    ),
    'Goals',
  )

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      s.savingsGoals.map((g) => ({
        id: g.id,
        name: g.name,
        currency: g.currency,
        targetAmount: g.targetAmount,
        savedAmount: g.savedAmount,
        targetDate: g.targetDate,
        cadence: g.cadence,
        createdAt: g.createdAt ? new Date(g.createdAt).toISOString() : '',
      })),
    ),
    'Savings',
  )

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet([{ ...s.wageRules }]),
    'WageRules',
  )

  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  downloadBlob(`time-wealth-export-${ymd()}.xlsx`, blob)
}

