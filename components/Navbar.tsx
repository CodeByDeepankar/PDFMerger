
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import styles from "../styles/Navbar.module.css";

const Navbar = () => {
  return (
    <header className={styles.header}>
      <div className={styles.nav}>
        <div className={styles.logo}>
          <h2>PDFMerge Pro</h2>
        </div>
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
