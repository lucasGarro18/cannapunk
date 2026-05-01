import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import App from './App'
import CustomCursor  from './components/ui/CustomCursor'
import LoadingScreen from './components/ui/LoadingScreen'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          1000 * 60 * 5,
      retry:              false,         // no retry — mock fallback handles it
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <LoadingScreen />
        <CustomCursor />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1c1c1f',
              color:      '#fafafa',
              border:     '1px solid #3f3f46',
              fontSize:   '0.875rem',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#0c0c0e' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#080b08' },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
)
