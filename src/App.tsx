import { useState, useEffect } from 'react'
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt'
import { OfflinePage } from './components/OfflinePage'

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

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

  if (!isOnline) {
    return <OfflinePage />
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">RTC App</h1>
          <p className="text-center text-gray-600 mb-8">Progressive Web App is ready</p>
        </div>
      </div>
      <PWAUpdatePrompt />
    </>
  )
}

export default App
