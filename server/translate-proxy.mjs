import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const PORT = Number.parseInt(process.env.TRANSLATE_PROXY_PORT || '8787', 10)

const DEEPL_API_KEY = process.env.DEEPL_API_KEY
const DEEPL_API_BASE =
  process.env.DEEPL_API_BASE ||
  (DEEPL_API_KEY && DEEPL_API_KEY.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com')

const app = express()
app.use(express.json({ limit: '1mb' }))
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

const langMap = {
  en: 'EN',
  'zh-Hans': 'ZH',
  ja: 'JA',
  es: 'ES',
  ko: 'KO',
  fr: 'FR',
  de: 'DE',
  it: 'IT',
  pt: 'PT-PT',
}

app.post('/api/translate', async (req, res) => {
  try {
    if (!DEEPL_API_KEY) {
      return res.status(400).json({
        error: 'DEEPL_API_KEY is missing. Put it in .env.local (recommended) or your shell env.',
      })
    }

    const text = String(req.body?.text ?? '').trim()
    const target = String(req.body?.targetLang ?? '').trim()
    if (!text) return res.status(400).json({ error: 'text is required' })
    if (!target) return res.status(400).json({ error: 'targetLang is required' })

    const targetLang = langMap[target] || target

    const url = `${DEEPL_API_BASE}/v2/translate`
    const params = new URLSearchParams()
    params.set('auth_key', DEEPL_API_KEY)
    params.append('text', text)
    params.set('target_lang', targetLang)

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    const json = await r.json().catch(() => null)
    if (!r.ok) {
      return res.status(500).json({
        error: 'DeepL request failed',
        status: r.status,
        details: json,
      })
    }

    const translated = json?.translations?.[0]?.text
    if (!translated) return res.status(500).json({ error: 'No translation returned', details: json })
    return res.json({ text: translated })
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) })
  }
})

app.listen(PORT, () => {
  // Intentionally minimal logs (no secrets)
  console.log(`Translate proxy listening on http://localhost:${PORT}`)
})

