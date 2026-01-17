import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'
import { ToastWrapper } from '../components/ToastWrapper'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'

function AppContent({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  )
}

export default function App(props: AppProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AppContent {...props} />
          <ToastWrapper />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
