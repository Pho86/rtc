import { useState, useEffect } from 'react'
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt'
import { OfflinePage } from './components/OfflinePage'
import { Spreadsheet } from './components/Spreadsheet'

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
        <div className="h-screen flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-300 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Ally Beacon</h1>
                <p className="text-sm text-gray-600">An AI Sheets Progressive Web App</p>
              </div>
              
              <div className="flex items-center space-x-2 mr-4">
                <span className="text-sm text-gray-500 ">PWA Ready</span>
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
