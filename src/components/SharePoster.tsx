import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toPng } from 'html-to-image'

import { calcEarned, calcPerSecond } from '../lib/calc'
import { formatMoney } from '../lib/format'
import { useAppStore } from '../store/useAppStore'
import type { SupportedLang } from '../i18n/init'

function nowYmd() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function copyPngToClipboard(dataUrl: string) {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    throw new Error('clipboard-not-supported')
  }
  // eslint-disable-next-line no-undef
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
}

export function SharePosterButton() {
  const { t, i18n } = useTranslation()
  const settings = useAppStore((s) => s.settings)
  const timer = useAppStore((s) => s.timer)
  const goals = useAppStore((s) => s.goals)

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [img, setImg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    if (!open) return
    const id = window.setInterval(() => setNowMs(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [open])

  const earned = useMemo(() => calcEarned(settings, timer, nowMs), [settings, timer, nowMs])
  const perSecond = useMemo(() => calcPerSecond(settings), [settings])

  const posterRef = useRef<HTMLDivElement | null>(null)

  const lang = (i18n.language || 'en') as SupportedLang
  const topGoal = useMemo(() => {
    // pick nearest unfinished goal
    const list = goals
      .map((g) => {
        const remaining = Math.max(0, g.price - earned)
        const done = remaining <= 0.00001
        const name =
          (g.nameI18n && g.nameI18n[lang]) ||
          (g.nameKey ? t(`presets.${g.nameKey}`, { defaultValue: g.name }) : g.name)
        return { ...g, remaining, done, name }
      })
      .filter((g) => !g.done)
      .sort((a, b) => a.remaining - b.remaining)
    return list[0] || null
  }, [goals, earned, lang, t])

  async function generate() {
    if (!posterRef.current) return
    setBusy(true)
    setError(null)
    setCopied(false)
    try {
      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: 'transparent',
      })
      setImg(dataUrl)
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setBusy(false)
    }
  }

  async function download() {
    if (!img) return
    const a = document.createElement('a')
    a.href = img
    a.download = `time-wealth-poster-${nowYmd()}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  async function copy() {
    if (!img) return
    setBusy(true)
    setError(null)
    try {
      await copyPngToClipboard(img)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch (e: any) {
      setError(
        e?.message === 'clipboard-not-supported'
          ? t('poster.clipboardNotSupported')
          : String(e?.message || e),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button className="btn" type="button" onClick={() => { setOpen(true); setImg(null); setError(null) }}>
        {t('common.sharePoster')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold">{t('poster.title')}</div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t('poster.hint')}</div>
              </div>
              <button className="btn" type="button" onClick={() => setOpen(false)}>
                {t('common.close')}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-3 dark:border-zinc-800/70 dark:bg-zinc-900/30">
                <div
                  ref={posterRef}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-200 via-white to-sky-200 p-5 text-zinc-900 shadow-sm dark:from-fuchsia-950/60 dark:via-zinc-950 dark:to-sky-950/60 dark:text-zinc-50"
                  style={{ width: 520, maxWidth: '100%' }}
                >
                  <div className="absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-fuchsia-400/20 blur-3xl dark:bg-fuchsia-500/15" />
                  <div className="absolute top-12 -left-20 h-[380px] w-[380px] rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-500/10" />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">{t('app.name')}</div>
                      <div className="text-xs opacity-70">{nowYmd()}</div>
                    </div>

                    <div className="mt-4 text-xs opacity-80">{t('earned.title')}</div>
                    <div className="mt-1 text-3xl font-semibold tracking-tight">
                      {formatMoney(earned, settings.currency)}
                    </div>
                    <div className="mt-2 text-sm opacity-80">
                      {t('poster.perSecLine', { amount: formatMoney(perSecond, settings.currency) })}
                    </div>

                    {topGoal && (
                      <div className="mt-4 rounded-xl border border-white/60 bg-white/60 p-3 text-sm shadow-sm dark:border-zinc-800/60 dark:bg-zinc-950/30">
                        <div className="text-xs opacity-70">{t('poster.nextGoal')}</div>
                        <div className="mt-0.5 font-medium">{topGoal.name}</div>
                        <div className="mt-1 text-xs opacity-80">
                          {t('poster.remaining', { amount: formatMoney(topGoal.remaining, settings.currency) })}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 text-xs opacity-80">{t('app.microcalm')}</div>
                    <div className="mt-2 text-[11px] opacity-60">{t('poster.footer')}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn btn-primary" type="button" onClick={generate} disabled={busy}>
                    {busy ? t('common.working') : t('poster.generate')}
                  </button>
                  <button className="btn" type="button" onClick={download} disabled={!img || busy}>
                    {t('poster.download')}
                  </button>
                  <button className="btn" type="button" onClick={copy} disabled={!img || busy}>
                    {copied ? t('poster.copied') : t('poster.copy')}
                  </button>
                </div>

                {error && (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
                    {error}
                  </div>
                )}

                {img && (
                  <div className="mt-4">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{t('poster.preview')}</div>
                    <img className="mt-2 w-full rounded-xl border border-zinc-200 dark:border-zinc-800" src={img} alt="poster preview" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

