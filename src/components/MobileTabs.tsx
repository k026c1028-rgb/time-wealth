import type { ReactNode } from 'react'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

type TabKey = 'home' | 'goals' | 'savings' | 'cloud'

type TabItem = {
  key: TabKey
  labelKey: string
  icon: string
  render: () => ReactNode
}

export function MobileTabs({ initial = 'home', tabs }: { initial?: TabKey; tabs: TabItem[] }) {
  const { t } = useTranslation()
  const initialIndex = Math.max(
    0,
    tabs.findIndex((x) => x.key === initial),
  )
  const [active, setActive] = useState(initialIndex)

  // Swipe handling (simple, like mainstream apps): horizontal swipe to change tab.
  const startRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const threshold = 60

  const pages = useMemo(() => tabs.map((x) => x.render()), [tabs])

  return (
    <div className="relative">
      {/* Pages */}
      <div
        className="overflow-hidden"
        style={{ touchAction: 'pan-y' }}
        onPointerDown={(e) => {
          // Only handle primary touch/pen/mouse
          startRef.current = { x: e.clientX, y: e.clientY, time: Date.now() }
        }}
        onPointerUp={(e) => {
          const s = startRef.current
          startRef.current = null
          if (!s) return
          const dx = e.clientX - s.x
          const dy = e.clientY - s.y
          if (Math.abs(dx) < threshold) return
          if (Math.abs(dx) < Math.abs(dy) * 1.2) return // vertical scroll dominates
          if (dx < 0 && active < tabs.length - 1) setActive((v) => v + 1)
          if (dx > 0 && active > 0) setActive((v) => v - 1)
        }}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {pages.map((node, idx) => (
            <div key={idx} className="min-w-full px-4 pb-24 pt-4">
              {node}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/70">
        <div className="mx-auto flex max-w-6xl">
          {tabs.map((tab, idx) => {
            const on = idx === active
            return (
              <button
                key={tab.key}
                type="button"
                className={on ? 'flex-1 py-2.5 text-fuchsia-600' : 'flex-1 py-2.5 text-zinc-500 dark:text-zinc-300'}
                onClick={() => setActive(idx)}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="text-lg leading-none">{tab.icon}</div>
                  <div className="text-[11px] font-medium">{t(tab.labelKey)}</div>
                </div>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
