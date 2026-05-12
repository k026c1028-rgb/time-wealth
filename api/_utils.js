import Stripe from 'stripe'

export function requireEnv(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

export function getBaseUrl(req) {
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString()
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString()
  if (!host) throw new Error('Missing host header')
  return `${proto}://${host}`
}

export function getStripe() {
  const key = requireEnv('STRIPE_SECRET_KEY')
  return new Stripe(key)
}

export async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}
