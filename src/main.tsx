import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import App from './App'
import './i18n'
import './globals.css'

// Handle dynamic import errors (stale cache after deploy)
// When a chunk fails to load, reload the page to get fresh assets
function isChunkLoadError(message: string | undefined): boolean {
  if (!message) return false
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Loading chunk') ||
    message.includes('Loading CSS chunk')
  )
}

function handleChunkError(): void {
  const lastReload = sessionStorage.getItem('lastChunkErrorReload')
  const now = Date.now()
  // Prevent infinite reload loop - only reload once every 10 seconds
  if (!lastReload || now - parseInt(lastReload) > 10000) {
    sessionStorage.setItem('lastChunkErrorReload', now.toString())
    window.location.reload()
  }
}

window.addEventListener('error', (event: ErrorEvent) => {
  if (isChunkLoadError(event.message)) {
    handleChunkError()
  }
})

window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  const reason = event.reason as Error | undefined
  if (isChunkLoadError(reason?.message)) {
    handleChunkError()
  }
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
        }}
      />
    </QueryClientProvider>
  </StrictMode>
)
