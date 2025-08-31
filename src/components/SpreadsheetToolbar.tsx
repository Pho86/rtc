import { useState } from 'react'
import { translationService } from '../services/TranslationService'
import type { Language } from '../services/TranslationService'

interface SpreadsheetToolbarProps {
  onSave: () => void
  onLoad: () => void
  onClear: () => void
  onExport: () => void
  currentLanguage?: Language
}

export function SpreadsheetToolbar({ onSave, onLoad, onClear, onExport, currentLanguage = 'en' }: SpreadsheetToolbarProps) {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div className="bg-gray-100 border-b border-gray-300 p-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* File Operations */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onSave}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>{translationService.translateUI('save', currentLanguage)}</span>
            </button>
            <button
              onClick={onLoad}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span>{translationService.translateUI('load', currentLanguage)}</span>
            </button>
            <button
              onClick={onExport}
              className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{translationService.translateUI('export', currentLanguage)}</span>
            </button>
          </div>

          {/* Data Operations */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onClear}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>{translationService.translateUI('clear', currentLanguage)}</span>
            </button>
          </div>
        </div>

        {/* Help */}
        <div className="flex items-center space-x-2 mr-4">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
                          <span>{translationService.translateUI('help', currentLanguage)}</span>
          </button>
        </div>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="mt-4 p-4 bg-white border border-gray-300 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Formula Examples:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <p><strong>Basic Math:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>=A1+B1 (Addition)</li>
                <li>=A1-B1 (Subtraction)</li>
                <li>=A1*B1 (Multiplication)</li>
                <li>=A1/B1 (Division)</li>
              </ul>
            </div>
            <div>
              <p><strong>Functions:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>=SUM(A1:A10) (Sum range)</li>
                <li>=AVERAGE(A1:A10) (Average)</li>
                <li>=MAX(A1:A10) (Maximum)</li>
                <li>=MIN(A1:A10) (Minimum)</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Navigation:</strong> Use arrow keys to move between cells, Enter to edit, Escape to cancel.</p>
          </div>
        </div>
      )}
    </div>
  )
}
