
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { updateUserSubscription, getUserSubscription } from '../../lib/mongodb';
import { PLANS } from '../../lib/schemas';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = getAuth(req);
  
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const user = await getUserSubscription(userId);
        const userEmail = req.headers['x-user-email'] as string; // You'll need to pass this from the client
        
        res.status(200).json({
          user: user || { userId, status: 'free', generations: 0 },
          plans: Object.values(PLANS)
        });
      } catch (error) {
        console.error('Error getting subscription:', error);
        res.status(500).json({ error: 'Failed to get subscription' });
      }
      break;

    case 'POST':
      try {
        const { planType, subscriptionId, email } = req.body;
        
        if (!planType || !subscriptionId || !email) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const plan = PLANS[planType as keyof typeof PLANS];
        if (!plan) {
          return res.status(400).json({ error: 'Invalid plan type' });
        }

        const subscriptionData = {
          email,
          subscriptionId,
          status: 'active',
          planId: planType,
          paypalSubscriptionId: subscriptionId,
          billingCycleAnchor: new Date(),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        };

        await updateUserSubscription(userId, subscriptionData);
        
        res.status(200).json({ success: true, message: 'Subscription activated' });
      } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ error: 'Failed to create subscription' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}
