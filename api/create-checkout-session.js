import { getStripe, getBaseUrl, requireEnv } from './_utils.js'

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const stripe = getStripe()
    const baseUrl = getBaseUrl(req)

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const plan = body?.plan
    const userId = body?.userId
    const email = body?.email

    if (!userId || !email) return res.status(400).json({ error: 'Missing userId/email' })
    if (plan !== 'monthly' && plan !== 'yearly') return res.status(400).json({ error: 'Invalid plan' })

    const priceId = plan === 'monthly' ? requireEnv('STRIPE_PRICE_MONTHLY') : requireEnv('STRIPE_PRICE_YEARLY')

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      client_reference_id: userId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 7,
        metadata: { user_id: userId, plan },
      },
      metadata: { user_id: userId, plan },
      success_url: `${baseUrl}/?checkout=success`,
      cancel_url: `${baseUrl}/?checkout=cancel`,
    })

    return res.status(200).json({ url: session.url })
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) })
  }
}

