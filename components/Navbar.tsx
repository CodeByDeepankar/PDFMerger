import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import styles from "../styles/Navbar.module.css";

const Navbar = () => {
  return (
    <header className={styles.header}>
      <div className={styles.nav}>
        <div className={styles.logo}>
          <Image src="/favicon.ico" alt="PDFMerge Pro" width={32} height={32} className={styles.logoIcon} />
          <h2>PDFMerge Pro</h2>
        <div className={styles.authButtons}>
          <SignedOut>
            <SignInButton>
              <button className={styles.signInBtn}>Sign In</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
