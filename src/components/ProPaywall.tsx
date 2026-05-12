import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAppStore } from '../store/useAppStore'
import { exportExcel } from '../lib/exportExcel'

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function ProPaywall() {
  const { t } = useTranslation()
  const open = useAppStore((s) => s.ui.proModalOpen)
  const reason = useAppStore((s) => s.ui.proModalReason)
  const isPro = useAppStore((s) => s.entitlements.isPro)
  const close = useAppStore((s) => s.closeProModal)
  const subscribe = useAppStore((s) => s.subscribeProMock)
  const cancel = useAppStore((s) => s.cancelProMock)

  const [busy, setBusy] = useState(false)

  const reasonText = useMemo(() => {
    switch (reason) {
      case 'limit_goals':
        return t('pro.reasonGoalsLimit', { n: 3 })
      case 'limit_savings':
        return t('pro.reasonSavingsLimit', { n: 3 })
      case 'pro_translate':
        return t('pro.reasonTranslate')
      case 'pro_widget':
        return t('pro.reasonWidget')
      case 'pro_wage':
        return t('pro.reasonWage')
      case 'pro_cloud':
        return t('pro.reasonCloud')
      default:
        return null
    }
  }, [reason, t])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">{t('pro.title')}</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{t('pro.price')}</div>
            {reasonText && (
              <div className="mt-2 rounded-xl border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-sm text-fuchsia-800 dark:border-fuchsia-900/50 dark:bg-fuchsia-950/30 dark:text-fuchsia-200">
                {reasonText}
              </div>
            )}
          </div>
          <button className="btn" type="button" onClick={close}>
            {t('common.close')}
          </button>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div className="font-medium">{t('pro.includes')}</div>
          <ul className="list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-200">
            <li>{t('pro.featureUnlimited')}</li>
            <li>{t('pro.featureWidget')}</li>
            <li>{t('pro.featureTranslate')}</li>
            <li>{t('pro.featureCloud')}</li>
            <li>{t('pro.featureExport')}</li>
            <li>{t('pro.featureExcel')}</li>
          </ul>
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{t('pro.mockNote')}</div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {!isPro ? (
            <button
              className="btn btn-primary"
              type="button"
              disabled={busy}
              onClick={() => {
                setBusy(true)
                try {
                  subscribe()
                } finally {
                  setBusy(false)
                }
              }}
            >
              {t('pro.subscribe')}
            </button>
          ) : (
            <>
              <button className="btn" type="button" onClick={cancel}>
                {t('pro.cancel')}
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  const state = useAppStore.getState()
                  downloadJson(`time-wealth-backup-${Date.now()}.json`, {
                    exportedAt: new Date().toISOString(),
                    app: 'time-wealth',
                    version: 1,
                    data: {
                      settings: state.settings,
                      goals: state.goals,
                      savingsGoals: state.savingsGoals,
                      timer: state.timer,
                      entitlements: state.entitlements,
                    },
                  })
                }}
              >
                {t('pro.export')}
              </button>
              <button
                className="btn"
                type="button"
                onClick={() => {
                  exportExcel()
                }}
              >
                {t('pro.exportExcel')}
              </button>
            </>
          )}

          <button className="btn" type="button" onClick={close}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
