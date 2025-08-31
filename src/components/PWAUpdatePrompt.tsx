import { useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

export function PWAUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)

  const updateSW = registerSW({
    onNeedRefresh() {
      setNeedRefresh(true)
    },
    onOfflineReady() {
      setOfflineReady(true)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  const update = () => {
    updateSW()
    close()
  }

  return (
    <>
      {(needRefresh || offlineReady) && (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {offlineReady && (
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {needRefresh && (
                <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {offlineReady && 'App ready to work offline'}
                {needRefresh && 'New content available'}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {offlineReady && 'Your app is now ready to work offline.'}
                {needRefresh && 'Click reload to update.'}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              {needRefresh && (
                <button
                  onClick={update}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Reload
                </button>
              )}
              <button
                onClick={close}
                className="ml-2 bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
