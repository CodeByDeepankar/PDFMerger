
import type { NextPage } from "next";
import Head from "next/head";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import Navbar from "../components/Navbar";
import BillingDashboard from "../components/BillingDashboard";
import styles from "../styles/Home.module.css";

const Dashboard: NextPage = () => {
  return (
    <>
      <Head>
        <title>Dashboard - PDFMerge Pro</title>
        <meta name="description" content="Manage your PDFMerge Pro subscription and billing" />
      </Head>

      <Navbar />

      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>

      <SignedIn>
        <div className={styles.container}>
          <main className={styles.main}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
              <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#1F2937' }}>
                Your Dashboard
              </h1>
              <BillingDashboard />
            </div>
          </main>
        </div>
      </SignedIn>
    </>
  );
};

export default Dashboard;
