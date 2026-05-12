export function SoothingBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-fuchsia-400/20 blur-3xl dark:bg-fuchsia-500/15 animate-drift" />
      <div className="absolute top-24 -left-24 h-[460px] w-[460px] rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-500/10 animate-floatSlow" />
      <div className="absolute bottom-[-180px] right-[-140px] h-[520px] w-[520px] rounded-full bg-emerald-400/12 blur-3xl dark:bg-emerald-500/10 animate-drift" />

      {/* subtle grain */}
      <div className="absolute inset-0 opacity-[0.08] mix-blend-overlay dark:opacity-[0.06]">
        <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,.6)_1px,transparent_0)] [background-size:14px_14px]" />
      </div>
    </div>
  )
}

