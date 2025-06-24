
import type { NextPage } from "next";
import Head from "next/head";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import Navbar from "../components/Navbar";
import PDFMerger from "../components/PDFMerger";
import SubscriptionButton from "../components/SubscriptionButton";
import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
  const paypalOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID  as string,
    components: "buttons",
    intent: "subscription",
    vault: true
  };

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <div className={styles.container}>
      <Head>
        <title>PDFMerge Pro - Merge PDF Files Easily</title>
        <meta name="description" content="Professional PDF merger tool. Combine multiple PDF files into one with ease. Fast, secure, and reliable." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      {/* Hero Section */}
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>
            Merge PDF Files
            <span className={styles.gradient}> Effortlessly</span>
          </h1>
          <p className={styles.heroDescription}>
            Professional PDF merger that combines multiple PDF files into one document. 
            Fast, secure, and easy to use. No file size limits, no watermarks.
          </p>
          
          <div className={styles.heroButtons}>
            <SignedOut>
              <SignInButton>
                <button className={styles.primaryBtn}>Get Started Free</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <button className={styles.primaryBtn}>Start Merging</button>
            </SignedIn>
            <button className={styles.secondaryBtn}>View Demo</button>
          </div>

          {/* PDF Merger Component */}
          <PDFMerger />
        </div>

        {/* Features Section */}
        <section className={styles.features}>
          <h2 className={styles.sectionTitle}>Why Choose PDFMerge Pro?</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>⚡</div>
              <h3>Lightning Fast</h3>
              <p>Merge PDFs in seconds with our optimized processing engine</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔒</div>
              <h3>100% Secure</h3>
              <p>Your files are processed securely and deleted after 24 hours</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎯</div>
              <h3>Perfect Quality</h3>
              <p>No compression or quality loss during the merge process</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💎</div>
              <h3>No Limits</h3>
              <p>Merge unlimited files with no size restrictions</p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className={styles.howItWorks}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <div className={styles.stepsGrid}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <h3>Upload Files</h3>
              <p>Select or drag and drop your PDF files</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h3>Arrange Order</h3>
              <p>Drag to reorder your files as needed</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h3>Merge & Download</h3>
              <p>Click merge and download your combined PDF</p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className={styles.pricing}>
          <h2 className={styles.sectionTitle}>Simple Pricing</h2>
          <div className={styles.pricingCards}>
            <div className={styles.pricingCard}>
              <h3>Free</h3>
              <div className={styles.price}>$0<span>/month</span></div>
              <ul className={styles.features}>
                <li>✓ 5 merges per day</li>
                <li>✓ Up to 10MB per file</li>
                <li>✓ Basic support</li>
              </ul>
              <SignedOut>
                <SignInButton>
                  <button className={styles.pricingBtn}>Get Started</button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <button className={styles.pricingBtn}>Current Plan</button>
              </SignedIn>
            </div>
            <div className={`${styles.pricingCard} ${styles.popular}`}>
              <div className={styles.popularBadge}>Most Popular</div>
              <h3>Pro</h3>
              <div className={styles.price}>$9<span>/month</span></div>
              <ul className={styles.features}>
                <li>✓ Unlimited merges</li>
                <li>✓ No file size limits</li>
                <li>✓ Priority support</li>
                <li>✓ API access</li>
              </ul>
              <SignedOut>
                <SignInButton>
                  <button className={styles.pricingBtn}>Start Free Trial</button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <SubscriptionButton
                  planType="PRO"
                  planId="P-5ML4271244454362WXNWU5NQ"
                  price={9}
                  onSuccess={() => {
                    alert('Successfully subscribed to Pro plan!');
                    window.location.reload();
                  }}
                  onError={(error) => {
                    console.error('Subscription error:', error);
                    alert('Failed to subscribe. Please try again.');
                  }}
                />
              </SignedIn>
            </div>
            <div className={styles.pricingCard}>
              <h3>Enterprise</h3>
              <div className={styles.price}>$29<span>/month</span></div>
              <ul className={styles.features}>
                <li>✓ Everything in Pro</li>
                <li>✓ Team collaboration</li>
                <li>✓ Advanced security</li>
                <li>✓ Custom integrations</li>
              </ul>
              <SignedOut>
                <SignInButton>
                  <button className={styles.pricingBtn}>Contact Sales</button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <SubscriptionButton
                  planType="ENTERPRISE"
                  planId="P-1234567890123456789"
                  price={29}
                  onSuccess={() => {
                    alert('Successfully subscribed to Enterprise plan!');
                    window.location.reload();
                  }}
                  onError={(error) => {
                    console.error('Subscription error:', error);
                    alert('Failed to subscribe. Please try again.');
                  }}
                />
              </SignedIn>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h4>PDFMerge Pro</h4>
            <p>Professional PDF merging made simple</p>
          </div>
          <div className={styles.footerSection}>
            <h4>Product</h4>
            <ul>
              <li><a href="#">Features</a></li>
              <li><a href="#">Pricing</a></li>
              <li><a href="#">API</a></li>
            </ul>
          </div>
          <div className={styles.footerSection}>
            <h4>Support</h4>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Privacy</a></li>
            </ul>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; 2024 PDFMerge Pro. All rights reserved.</p>
        </div>
      </footer>
      </div>
    </PayPalScriptProvider>
  );
};

export default Home;
