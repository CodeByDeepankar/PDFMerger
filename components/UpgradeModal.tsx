
import React from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import styles from '../styles/UpgradeModal.module.css';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  generations: number;
  dailyGenerations: number;
  maxFreeDailyMerges: number;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  generations,
  dailyGenerations,
  maxFreeDailyMerges
}) => {
  if (!isOpen) return null;

  const paypalOptions = {
    intent: "subscription",
    vault: true
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Upgrade Required</h2>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.limit}>
            <h3>Daily Limit Reached</h3>
            <p>You have used {dailyGenerations} out of {maxFreeDailyMerges} free merges today.</p>
            <p className={styles.resetInfo}>Your daily limit resets at midnight.</p>
            <p className={styles.totalInfo}>Total merges: {generations}</p>
          </div>
          <div className={styles.pricing}>
            <h4>Upgrade to Pro - $9/month</h4>
            <ul>
              <li>✓ Unlimited PDF merges</li>
              <li>✓ No file size limits</li>
              <li>✓ Priority support</li>
              <li>✓ API access</li>
            </ul>

          <div className={styles.actions}>
            <PayPalScriptProvider options={paypalOptions}>
              <PayPalButtons
                style={{
                  layout: "vertical",
                  color: "blue",
                  shape: "rect",
                  label: "subscribe"
                }}
                createSubscription={(data, actions) => {
                  return actions.subscription.create({
                    plan_id: "P-5ML4271244454362WXNWU5NQ"
                  });
                }}
                onApprove={async (data, actions) => {
                  alert('Successfully subscribed to Pro plan!');
                  onClose();
                  window.location.reload();
                }}
                onError={(err) => {
                  console.error('PayPal error:', err);
                  alert('Failed to subscribe. Please try again.');
                }}
              />
            </PayPalScriptProvider>
            
            <button onClick={onClose} className={styles.cancelBtn}>
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
