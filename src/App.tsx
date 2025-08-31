import { useState, useEffect } from 'react'
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt'
import { OfflinePage } from './components/OfflinePage'
import { LoginForm } from './components/LoginForm'
import { ComprehensiveDemo } from './components/ComprehensiveDemo'
import { authService } from './services/AuthService'

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated())

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  if (!isOnline) {
    return <OfflinePage />
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginForm onLogin={handleLogin} />
        <PWAUpdatePrompt />
      </>
    )
  }

  return (
    <>
      <ComprehensiveDemo />
      <PWAUpdatePrompt />
    </>
  )
}

export default App
