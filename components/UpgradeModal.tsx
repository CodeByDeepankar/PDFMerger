
import React from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import styles from '../styles/UpgradeModal.module.css';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  generations: number;
  maxFreeGenerations: number;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  generations,
  maxFreeGenerations
}) => {
  if (!isOpen) return null;

  const paypalOptions = {
    "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "ATl3RReOfIjpOQYrgpNr2EoXM_ZknnlrMjgoLHeP5Ed53w4Q1cF4vjubQyJPNaDszbR7MtIyrMuqOZa1",
    components: "buttons",
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
            <h3>Free Tier Limit Reached</h3>
            <p>You have used {generations} out of {maxFreeGenerations} free merges.</p>
          </div>

          <div className={styles.pricing}>
            <h4>Upgrade to Pro - $9/month</h4>
            <ul>
              <li>✓ Unlimited PDF merges</li>
              <li>✓ No file size limits</li>
              <li>✓ Priority support</li>
              <li>✓ API access</li>
            </ul>
          </div>

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
