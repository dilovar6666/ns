import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './style.css'
import { syncQueue } from './offline'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'

const client = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } })
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')
window.addEventListener('online', () => syncQueue().catch(() => {}))
syncQueue().catch(() => {})
window.setInterval(() => syncQueue().catch(() => {}), 15000)
