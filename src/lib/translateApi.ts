import type { SupportedLang } from '../i18n/init'

export async function translateText({
  text,
  targetLang,
}: {
  text: string
  targetLang: SupportedLang
}): Promise<string> {
  const r = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, targetLang }),
  })
  const json = await r.json().catch(() => null)
  if (!r.ok) {
    const msg = json?.error || `Translate failed (${r.status})`
    throw new Error(msg)
  }
  return String(json?.text ?? '')
}

