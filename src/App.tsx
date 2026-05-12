import { GoalWall } from './components/GoalWall'
import { SoothingBackground } from './components/SoothingBackground'
import { Milestones } from './components/Milestones'
import { SavingsPlanner } from './components/SavingsPlanner'
import { TimerPanel } from './components/TimerPanel'
import { useTranslation } from 'react-i18next'
import { WidgetView } from './components/WidgetView'
import { ProPaywall } from './components/ProPaywall'

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
        <ProPaywall />
      </div>
    )
  }

  return (
    <div className="relative min-h-dvh bg-gradient-to-b from-zinc-50 via-zinc-50 to-fuchsia-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-fuchsia-950/10">
      <SoothingBackground />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 md:py-10">
        <TimerPanel />
        <Milestones />
        <SavingsPlanner />
        <GoalWall />

        <footer className="py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
          {t('app.footer')}
        </footer>
      </div>
      <ProPaywall />
    </div>
  )
}
