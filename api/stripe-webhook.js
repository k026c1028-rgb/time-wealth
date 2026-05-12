import { createClient } from '@supabase/supabase-js'
import { getStripe, readRawBody, requireEnv } from './_utils.js'

function getAdminSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  if (!url) throw new Error('Missing env: VITE_SUPABASE_URL (or SUPABASE_URL)')
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, { auth: { persistSession: false } })
}

async function upsertEntitlement({ userId, isPro, plan, customerId, subscriptionId, currentPeriodEnd }) {
  const supabase = getAdminSupabase()
  const { error } = await supabase.from('tw_entitlements').upsert(
    {
      user_id: userId,
      is_pro: isPro,
      plan,
      stripe_customer_id: customerId ?? null,
      stripe_subscription_id: subscriptionId ?? null,
      current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
    },
    { onConflict: 'user_id' },
  )
  if (error) throw new Error(error.message)
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).send('Method not allowed')

    const stripe = getStripe()
    const webhookSecret = requireEnv('STRIPE_WEBHOOK_SECRET')

    const rawBody = await readRawBody(req)
    const sig = req.headers['stripe-signature']
    if (!sig) return res.status(400).send('Missing stripe-signature')

    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)

    // 1) 支付完成（含 trial），立刻开通 Pro
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object
      const userId = s?.metadata?.user_id || s?.client_reference_id
      const plan = s?.metadata?.plan || null
      const customerId = s?.customer || null
      const subscriptionId = s?.subscription || null
      if (userId) {
        await upsertEntitlement({
          userId,
          isPro: true,
          plan,
          customerId: typeof customerId === 'string' ? customerId : null,
          subscriptionId: typeof subscriptionId === 'string' ? subscriptionId : null,
          currentPeriodEnd: null,
        })
      }
    }

    // 2) 订阅被取消/删除：关闭 Pro
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object
      const userId = sub?.metadata?.user_id
      const plan = sub?.metadata?.plan || null
      if (userId) {
        await upsertEntitlement({
          userId,
          isPro: false,
          plan,
          customerId: typeof sub?.customer === 'string' ? sub.customer : null,
          subscriptionId: typeof sub?.id === 'string' ? sub.id : null,
          currentPeriodEnd: sub?.current_period_end ?? null,
        })
      }
    }

    // 3) 账单支付成功：更新到期时间（trial 结束后/续费）
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object
      const subscriptionId = invoice?.subscription
      if (typeof subscriptionId === 'string') {
        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = sub?.metadata?.user_id
        const plan = sub?.metadata?.plan || null
        if (userId) {
          await upsertEntitlement({
            userId,
            isPro: true,
            plan,
            customerId: typeof sub?.customer === 'string' ? sub.customer : null,
            subscriptionId: sub.id,
            currentPeriodEnd: sub.current_period_end,
          })
        }
      }
    }

    return res.status(200).json({ received: true })
  } catch (e) {
    // Stripe 要求 webhook 返回 2xx 才算成功，否则会重试
    return res.status(400).send(e?.message || String(e))
  }
}

