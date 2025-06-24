
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify PayPal webhook signature
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    const paypalSignature = req.headers['paypal-transmission-sig'] as string;
    
    if (!webhookId || !paypalSignature) {
      return res.status(400).json({ error: 'Missing webhook verification data' });
    }

    // Note: In production, you should verify the webhook signature properly
    // For now, we'll proceed with processing the webhook

    const { event_type, resource } = req.body;
    const { db } = await connectToDatabase();

    switch (event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.RENEWED':
        await db.collection('users').updateOne(
          { paypalSubscriptionId: resource.id },
          {
            $set: {
              status: 'active',
              nextBillingDate: new Date(resource.billing_info?.next_billing_time || Date.now() + 30 * 24 * 60 * 60 * 1000),
              updatedAt: new Date()
            }
          }
        );
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await db.collection('users').updateOne(
          { paypalSubscriptionId: resource.id },
          {
            $set: {
              status: 'cancelled',
              updatedAt: new Date()
            }
          }
        );
        break;

      case 'PAYMENT.SALE.COMPLETED':
        // Handle successful payment
        await db.collection('users').updateOne(
          { paypalSubscriptionId: resource.billing_agreement_id },
          {
            $set: {
              status: 'active',
              updatedAt: new Date()
            }
          }
        );
        break;

      case 'PAYMENT.SALE.DENIED':
      case 'PAYMENT.SALE.REFUNDED':
        // Handle failed or refunded payment
        await db.collection('users').updateOne(
          { paypalSubscriptionId: resource.billing_agreement_id },
          {
            $set: {
              status: 'expired',
              updatedAt: new Date()
            }
          }
        );
        break;

      default:
        console.log('Unhandled webhook event:', event_type);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
