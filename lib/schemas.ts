
export interface User {
  _id?: string;
  userId: string; // Clerk user ID
  email: string;
  subscriptionId?: string;
  status: 'free' | 'active' | 'cancelled' | 'expired';
  planId?: string;
  paypalSubscriptionId?: string;
  billingCycleAnchor?: Date;
  nextBillingDate?: Date;
  createdAt: Date;
  generations: number;
  dailyGenerations?: number;
  lastUsed?: Date;
}

export interface Plan {
  name: string;
  price: number;
  paypalPlanId: string;
  features: string[];
  maxGenerations: number;
  isPopular?: boolean;
  createdAt: Date;
}

export const PLANS = {
  PRO: {
    name: 'Pro',
    price: 9,
    paypalPlanId: process.env.PAYPAL_PRO_PLAN_ID || 'P-5ML4271244454362WXNWU5NQ', // Replace with your actual PayPal plan ID
    features: ['Unlimited merges', 'No file size limits', 'Priority support', 'API access'],
    maxGenerations: -1, // -1 for unlimited
    isPopular: true
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 29,
    paypalPlanId: process.env.PAYPAL_ENTERPRISE_PLAN_ID || 'P-1234567890123456789', // Replace with your actual PayPal plan ID
    features: ['Everything in Pro', 'Team collaboration', 'Advanced security', 'Custom integrations'],
    maxGenerations: -1,
    isPopular: false
  }
};
