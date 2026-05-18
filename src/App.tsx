import { GoalWall } from './components/GoalWall'
import { SoothingBackground } from './components/SoothingBackground'
import { Milestones } from './components/Milestones'
import { SavingsPlanner } from './components/SavingsPlanner'
import { TimerPanel } from './components/TimerPanel'
import { useTranslation } from 'react-i18next'
import { WidgetView } from './components/WidgetView'
import { MobileTabs } from './components/MobileTabs'

export default function App() {
  const { t } = useTranslation()

  const isWidget = new URLSearchParams(window.location.search).get('widget') === '1'
  if (isWidget) {
    return (
      <div className="relative min-h-dvh bg-gradient-to-b from-zinc-50 via-zinc-50 to-fuchsia-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-fuchsia-950/10">
        <SoothingBackground />
        <div className="relative mx-auto flex w-full max-w-md flex-col gap-3 px-3 py-3">
          <WidgetView compact />
          <div className="text-center text-[11px] text-zinc-500 dark:text-zinc-400">
            {t('app.name')}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-dvh bg-gradient-to-b from-zinc-50 via-zinc-50 to-fuchsia-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-fuchsia-950/10">
      <SoothingBackground />
      {/* Mobile: bottom tabs + swipe */}
      <div className="lg:hidden">
        <MobileTabs
          tabs={[
            {
              key: 'home',
              labelKey: 'tabs.home',
              icon: '⏱',
              render: () => (
                <>
                  <TimerPanel />
                  <div className="mt-4">
                    <SavingsPlanner />
                  </div>
                  <div className="mt-4">
                    <Milestones />
                  </div>
                </>
              ),
            },
            { key: 'goals', labelKey: 'tabs.goals', icon: '🎯', render: () => <GoalWall /> },
          ]}
        />
      </div>

      {/* Desktop: dashboard layout */}
      <div className="relative mx-auto hidden w-full max-w-6xl px-4 py-6 md:py-10 lg:block">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-4">
            <TimerPanel />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Milestones />
              <SavingsPlanner />
            </div>

            <GoalWall />
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-6 h-fit" />
        </div>

        <footer className="py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
          {t('app.footer')}
          <div className="mt-2">
            <a
              className="underline underline-offset-4 hover:text-zinc-700 dark:hover:text-zinc-200"
              href="https://github.com/k026c1028-rgb/time-wealth/issues/new?labels=feedback"
              target="_blank"
              rel="noreferrer"
            >
              {t('common.feedback', { defaultValue: '反馈/建议' })}
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
