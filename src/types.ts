export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'CNY'
  | 'AUD'
  | 'CAD'
  | 'CHF'
  | 'HKD'
  | 'SGD'
  | (string & {})

export type Category =
  | 'Tech'
  | 'Watches'
  | 'Cars'
  | 'Travel'
  | 'Property'
  | 'Hobbies'
  | 'Custom'

export type Goal = {
  id: string
  /**
   * 旧字段：用户创建时的原始名称（作为回退显示）。
   */
  name: string
  /**
   * 预置目标的翻译 key（用户自定义目标为空）。
   * 这样 UI 切换语言时，预置目标名称也能跟着切换。
   */
  nameKey?: string
  /**
   * 用户目标的多语言名称（可选）。
   * 切换语言时，优先展示这里；否则回退到 name/nameKey。
   */
  nameI18n?: Partial<Record<string, string>>
  price: number
  category: Category
  createdAt: number
}

export type SalarySettings = {
  currency: CurrencyCode
  annualSalary: number
  workDaysPerYear: number
  hoursPerDay: number
}

export type TimerState = {
  isRunning: boolean
  startedAtMs: number | null
  elapsedMs: number
}

export type SavingsCadence = 'daily' | 'weekly' | 'monthly'

export type SavingsGoal = {
  id: string
  name: string
  currency: CurrencyCode
  targetAmount: number
  savedAmount: number
  targetDate: string // YYYY-MM-DD
  cadence: SavingsCadence
  createdAt: number
}

export type ProPlan = 'pro_monthly_jpy_490'

export type Entitlements = {
  isPro: boolean
  plan: ProPlan | null
  startedAtMs: number | null
}

export type UiState = {
  proModalOpen: boolean
  proModalReason?: string
}

export type WageDisplayMode = 'gross' | 'net'

export type WageRules = {
  hourlyWage: number
  startTime: string // HH:mm
  endTime: string // HH:mm (can be next day if earlier than start)
  breakMinutes: number
  nightRate: number
  overtimeRate: number
  taxRate: number // default 0.1021
  displayMode: WageDisplayMode
}
