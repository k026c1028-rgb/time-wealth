import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Entitlements, Goal, SalarySettings, SavingsGoal, TimerState, UiState, WageRules } from '../types'

type AppState = {
  settings: SalarySettings
  timer: TimerState
  goals: Goal[]
  savingsGoals: SavingsGoal[]
  selectedCategory: Goal['category'] | 'All'
  entitlements: Entitlements
  ui: UiState
  wageRules: WageRules
}

type AppActions = {
  setSettings: (patch: Partial<SalarySettings>) => void
  start: () => void
  pause: () => void
  reset: () => void
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => boolean
  removeGoal: (id: string) => void
  updateGoalNameI18n: (id: string, nameI18n: Goal['nameI18n']) => void
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => boolean
  updateSavingsGoal: (id: string, patch: Partial<SavingsGoal>) => void
  removeSavingsGoal: (id: string) => void
  setSelectedCategory: (cat: AppState['selectedCategory']) => void

  openProModal: (reason?: string) => void
  closeProModal: () => void
  subscribeProMock: () => void
  cancelProMock: () => void
  setEntitlements: (patch: Partial<Entitlements>) => void

  setWageRules: (patch: Partial<WageRules>) => void
}

const defaultState: AppState = {
  settings: {
    currency: 'USD',
    annualSalary: 300000,
    workDaysPerYear: 250,
    hoursPerDay: 8,
  },
  timer: {
    isRunning: true,
    startedAtMs: Date.now(),
    elapsedMs: 0,
  },
  goals: [
    {
      id: 'g1',
      nameKey: 'keyboard',
      name: 'Premium mechanical keyboard',
      price: 278,
      category: 'Tech',
      createdAt: Date.now(),
    },
    { id: 'g2', nameKey: 'ps5', name: 'PlayStation 5', price: 556, category: 'Tech', createdAt: Date.now() },
    { id: 'g3', nameKey: 'japanTrip', name: '7 days in Japan', price: 2083, category: 'Travel', createdAt: Date.now() },
    { id: 'g4', nameKey: 'tesla3', name: 'Tesla Model 3', price: 32639, category: 'Cars', createdAt: Date.now() },
    {
      id: 'g5',
      nameKey: 'downPayment',
      name: 'Down payment in a major city',
      price: 138889,
      category: 'Property',
      createdAt: Date.now(),
    },
  ],
  savingsGoals: [],
  selectedCategory: 'All',
  entitlements: {
    isPro: false,
    plan: null,
    startedAtMs: null,
  },
  ui: {
    proModalOpen: false,
  },
  wageRules: {
    hourlyWage: 1200,
    startTime: '18:00',
    endTime: '23:00',
    breakMinutes: 60,
    nightRate: 1.25,
    overtimeRate: 1.25,
    taxRate: 0.1021,
    displayMode: 'net',
  },
}

function uid() {
  // Good enough for local-only MVP
  return `g_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

export const useAppStore = create<AppState & AppActions>()(
  persist<AppState & AppActions>(
    (set) => ({
      ...defaultState,

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      start: () =>
        set((s) => {
          if (s.timer.isRunning) return s
          return { timer: { ...s.timer, isRunning: true, startedAtMs: Date.now() } }
        }),

      pause: () =>
        set((s) => {
          if (!s.timer.isRunning || !s.timer.startedAtMs) return s
          const now = Date.now()
          return {
            timer: {
              isRunning: false,
              startedAtMs: null,
              elapsedMs: s.timer.elapsedMs + (now - s.timer.startedAtMs),
            },
          }
        }),

      reset: () =>
        set((s) => ({
          timer: { isRunning: true, startedAtMs: Date.now(), elapsedMs: 0 },
          // Keep settings/goals; reset is about the timer session.
          settings: s.settings,
          goals: s.goals,
          selectedCategory: s.selectedCategory,
        })),

      addGoal: (goal) => {
        set((st) => ({ goals: [{ id: uid(), createdAt: Date.now(), ...goal }, ...st.goals] }))
        return true
      },

      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      updateGoalNameI18n: (id, nameI18n) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, nameI18n: { ...(g.nameI18n ?? {}), ...(nameI18n ?? {}) } } : g)),
        })),

      addSavingsGoal: (goal) => {
        set((st) => ({ savingsGoals: [{ id: uid(), createdAt: Date.now(), ...goal }, ...st.savingsGoals] }))
        return true
      },

      updateSavingsGoal: (id, patch) =>
        set((s) => ({
          savingsGoals: s.savingsGoals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),

      removeSavingsGoal: (id) => set((s) => ({ savingsGoals: s.savingsGoals.filter((g) => g.id !== id) })),

      setSelectedCategory: (cat) => set(() => ({ selectedCategory: cat })),

      openProModal: (reason) =>
        set((s) => ({
          ui: { ...s.ui, proModalOpen: true, proModalReason: reason },
        })),
      closeProModal: () => set((s) => ({ ui: { ...s.ui, proModalOpen: false } })),
      subscribeProMock: () =>
        set((s) => ({
          entitlements: { isPro: true, plan: 'pro_monthly_jpy_490', startedAtMs: Date.now() },
          ui: { ...s.ui, proModalOpen: false },
        })),
      cancelProMock: () =>
        set(() => ({
          entitlements: { isPro: false, plan: null, startedAtMs: null },
        })),

      setEntitlements: (patch) =>
        set((s) => ({
          entitlements: { ...s.entitlements, ...patch },
        })),

      setWageRules: (patch) => set((s) => ({ wageRules: { ...s.wageRules, ...patch } })),
    }),
    {
      name: 'time-wealth:v1',
      version: 6,
      partialize: (state: any) => {
        // Do not persist UI-only state
        const { ui, ...rest } = state
        return rest
      },
      migrate: (persisted: any) => {
        // 从旧版本迁移：把默认英文目标映射成可翻译的 nameKey，
        // 这样切换语言时，预置目标名称也会跟着变。
        try {
          const state = persisted as AppState
          const map: Record<string, string> = {
            'Premium mechanical keyboard': 'keyboard',
            'PlayStation 5': 'ps5',
            '7 days in Japan': 'japanTrip',
            'Tesla Model 3': 'tesla3',
            'Down payment in a major city': 'downPayment',
          }
          const goals = Array.isArray(state.goals)
            ? state.goals.map((g: any) => {
                if (g?.nameKey) return g
                const key = map[g?.name]
                return key ? { ...g, nameKey: key } : g
              })
            : state.goals
          // v6: add savingsGoals + entitlements + wageRules defaults.
          return {
            ...state,
            goals,
            savingsGoals: Array.isArray((state as any).savingsGoals) ? (state as any).savingsGoals : [],
            entitlements: (state as any).entitlements ?? { isPro: false, plan: null, startedAtMs: null },
            wageRules: (state as any).wageRules ?? defaultState.wageRules,
          }
        } catch {
          return persisted
        }
      },
    },
  ),
)
