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
      <div className="min-h-screen bg-gray-50">
        <div className="h-screen flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-300 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RTC Sheets</h1>
                <p className="text-sm text-gray-600">A Google Sheets-like Progressive Web App</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">PWA Ready</span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
          
          {/* Spreadsheet */}
          <div className="flex-1 bg-white">
            <Spreadsheet rows={50} cols={15} />
          </div>
        </div>
      </div>
      <PWAUpdatePrompt />
    </>
  )
}

export default App
