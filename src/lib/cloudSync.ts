import { supabase, supabaseEnabled } from './supabaseClient'
import { useAppStore } from '../store/useAppStore'

const TABLE = 'tw_user_data'

export type CloudPayloadV1 = {
  version: 1
  exportedAt: string
  data: {
    settings: ReturnType<typeof useAppStore.getState>['settings']
    goals: ReturnType<typeof useAppStore.getState>['goals']
    savingsGoals: ReturnType<typeof useAppStore.getState>['savingsGoals']
    wageRules: ReturnType<typeof useAppStore.getState>['wageRules']
  }
}

export function getDeviceId() {
  const key = 'tw:deviceId'
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const id = `dev_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
  localStorage.setItem(key, id)
  return id
}

export function makePayload(): CloudPayloadV1 {
  const s = useAppStore.getState()
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      settings: s.settings,
      goals: s.goals,
      savingsGoals: s.savingsGoals,
      wageRules: s.wageRules,
    },
  }
}

export async function pushToCloud() {
  if (!supabaseEnabled || !supabase) throw new Error('supabase-not-configured')
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
  if (sessionErr) throw sessionErr
  const user = sessionData.session?.user
  if (!user) throw new Error('not-signed-in')

  const payload = makePayload()
  const deviceId = getDeviceId()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from(TABLE)
    .upsert({ user_id: user.id, data: payload, device_id: deviceId, updated_at: now }, { onConflict: 'user_id' })
  if (error) throw error
  return { updatedAt: now }
}

export async function pullFromCloud(): Promise<CloudPayloadV1 | null> {
  if (!supabaseEnabled || !supabase) throw new Error('supabase-not-configured')
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
  if (sessionErr) throw sessionErr
  const user = sessionData.session?.user
  if (!user) throw new Error('not-signed-in')

  const { data, error } = await supabase.from(TABLE).select('data').eq('user_id', user.id).maybeSingle()
  if (error) throw error
  return (data?.data as CloudPayloadV1) ?? null
}

export function applyPayload(payload: CloudPayloadV1) {
  if (!payload?.data) return
  useAppStore.setState((s) => ({
    ...s,
    settings: payload.data.settings ?? s.settings,
    goals: payload.data.goals ?? s.goals,
    savingsGoals: payload.data.savingsGoals ?? s.savingsGoals,
    wageRules: payload.data.wageRules ?? s.wageRules,
  }))
}

