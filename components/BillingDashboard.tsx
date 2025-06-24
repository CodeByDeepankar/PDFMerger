
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import styles from '../styles/BillingDashboard.module.css';

interface UserSubscription {
  userId: string;
  email: string;
  status: string;
  planId?: string;
  nextBillingDate?: string;
  generations: number;
  paypalSubscriptionId?: string;
}

interface Plan {
  name: string;
  price: number;
  features: string[];
  maxGenerations: number;
}

const BillingDashboard: React.FC = () => {
  const { user } = useUser();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchSubscriptionData();
  }, [user]);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/subscriptions', {
        headers: {
          'x-user-email': user?.emailAddresses[0]?.emailAddress || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.user);
        setPlans(data.plans);
      } else {
        setError('Failed to load subscription data');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'cancelled': return '#F59E0B';
      case 'expired': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className={styles.loading}>Loading billing information...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  const currentPlan = plans.find(plan => plan.name.toUpperCase() === subscription?.planId);
  const isPro = subscription?.status === 'active' && subscription?.paypalSubscriptionId;

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h2>Billing Dashboard</h2>
        <p>Manage your PDFMerge Pro subscription</p>
      </div>

      <div className={styles.currentPlan}>
        <h3>Current Plan</h3>
        <div className={styles.planInfo}>
          <div className={styles.planDetails}>
            <span className={styles.planName}>
              {currentPlan ? currentPlan.name : 'Free'}
            </span>
            <span 
              className={styles.status}
              style={{ color: getStatusColor(subscription?.status || 'free') }}
            >
              {subscription?.status || 'free'}
            </span>
          </div>
          
          {currentPlan && (
            <div className={styles.planPrice}>
              ${currentPlan.price}/month
            </div>
          )}
        </div>

        {subscription?.nextBillingDate && (
          <div className={styles.billingInfo}>
            <p>Next billing date: <strong>{formatDate(subscription.nextBillingDate)}</strong></p>
          </div>
        )}
      </div>

      <div className={styles.usage}>
        <h3>Usage Statistics</h3>
        <div className={styles.usageInfo}>
          <div className={styles.usageStat}>
            <span className={styles.usageLabel}>PDF Merges This Month</span>
            <span className={styles.usageValue}>
              {subscription?.generations || 0}
              {isPro ? ' (Unlimited)' : ' / 1'}
            </span>
          </div>
        </div>
      </div>

      {subscription?.paypalSubscriptionId && (
        <div className={styles.subscriptionId}>
          <h3>Subscription Details</h3>
          <p>Subscription ID: <code>{subscription.paypalSubscriptionId}</code></p>
          <p>Email: <code>{subscription.email}</code></p>
        </div>
      )}

      {currentPlan && (
        <div className={styles.features}>
          <h3>Plan Features</h3>
          <ul className={styles.featureList}>
            {currentPlan.features.map((feature, index) => (
              <li key={index}>✓ {feature}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BillingDashboard;
