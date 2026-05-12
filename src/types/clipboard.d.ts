export {}

// Safari/TS may not have ClipboardItem types enabled by default.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ClipboardItem: any
}

