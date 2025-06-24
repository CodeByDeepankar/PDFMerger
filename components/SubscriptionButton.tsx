
import React, { useState } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { useUser } from '@clerk/nextjs';
import styles from '../styles/SubscriptionButton.module.css';

interface SubscriptionButtonProps {
  planType: 'PRO' | 'ENTERPRISE';
  planId: string;
  price: number;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

const SubscriptionButton: React.FC<SubscriptionButtonProps> = ({
  planType,
  planId,
  price,
  onSuccess,
  onError
}) => {
  const [{ isPending }] = usePayPalScriptReducer();
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);

  if (isPending) {
    return <div className={styles.loading}>Loading PayPal...</div>;
  }

  const createSubscription = (data: any, actions: any) => {
    return actions.subscription.create({
      plan_id: planId,
      application_context: {
        brand_name: 'PDFMerge Pro',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
        },
        return_url: `${window.location.origin}/dashboard`,
        cancel_url: `${window.location.origin}/pricing`
      }
    });
  };

  const onApprove = async (data: any, actions: any) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.emailAddresses[0]?.emailAddress || ''
        },
        body: JSON.stringify({
          planType,
          subscriptionId: data.subscriptionID,
          email: user?.emailAddresses[0]?.emailAddress
        })
      });

      if (response.ok) {
        onSuccess?.();
      } else {
        throw new Error('Failed to activate subscription');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.container}>
      {isProcessing && (
        <div className={styles.processing}>
          Processing your subscription...
        </div>
      )}
      <PayPalButtons
        style={{
          shape: 'rect',
          color: 'blue',
          layout: 'vertical',
          label: 'subscribe'
        }}
        createSubscription={createSubscription}
        onApprove={onApprove}
        onError={(err) => {
          console.error('PayPal error:', err);
          onError?.(err);
        }}
        disabled={isProcessing}
      />
    </div>
  );
};

export default SubscriptionButton;
