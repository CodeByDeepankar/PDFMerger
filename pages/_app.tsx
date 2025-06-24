
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs'
import { AppProps } from 'next/app'
import '../styles/globals.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider>
      <Component {...pageProps} />
    </ClerkProvider>
  )
}
