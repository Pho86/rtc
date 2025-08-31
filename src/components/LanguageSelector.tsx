import { useState } from 'react'
import { translationService } from '../services/TranslationService'
import type { Language, TranslationMode } from '../services/TranslationService'

interface LanguageSelectorProps {
  onLanguageChange: (lang: Language) => void
  onTranslationModeChange: (mode: TranslationMode) => void
  currentLanguage: Language
  currentMode: TranslationMode
}

export function LanguageSelector({ 
  onLanguageChange, 
  onTranslationModeChange, 
  currentLanguage, 
  currentMode 
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const translationModes = translationService.getTranslationModes()

  const handleModeSelect = (mode: TranslationMode) => {
    onTranslationModeChange(mode)
    onLanguageChange(mode.targetLang)
    setIsOpen(false)
  }

  const handleLanguageSelect = (lang: Language) => {
    onLanguageChange(lang)
    setIsOpen(false)
  }

  const getCurrentModeDisplay = () => {
    if (currentMode.autoTranslate) {
      return `${currentMode.name} (${translationService.getLanguageName(currentMode.targetLang)})`
    }
    return `Manual (${translationService.getLanguageName(currentLanguage)})`
  }

  return (
    <div className="relative mr-4">
      {/* Language Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <span className="text-sm font-medium text-gray-700">
          {getCurrentModeDisplay()}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-300 rounded-md shadow-lg z-50">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Translation Mode</h3>
            
            {/* Translation Modes */}
            <div className="space-y-2 mb-4">
              {translationModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => handleModeSelect(mode)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    currentMode.id === mode.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="font-medium">{mode.name}</div>
                  <div className="text-xs text-gray-500">{mode.description}</div>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-3"></div>

            {/* Quick Language Switcher */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Language</h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleLanguageSelect('en')}
                                  className={`px-3 py-2 rounded-md cursor-pointer text-sm font-medium transition-colors ${
                    currentLanguage === 'en'
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => handleLanguageSelect('km')}
                  className={`px-3 py-2 rounded-md cursor-pointer text-sm font-medium transition-colors ${
                    currentLanguage === 'km'
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ខ្មែរ
                </button>
                <button
                  onClick={() => handleLanguageSelect('ne')}
                                  className={`px-3 py-2 rounded-md cursor-pointer text-sm font-medium transition-colors ${
                    currentLanguage === 'ne'
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  नेपाली
                </button>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="mt-4">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </button>
              
              {showAdvanced && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><strong>Auto Khmer:</strong> Automatically translates English text to Khmer</p>
                    <p><strong>Auto Nepali:</strong> Automatically translates English text to Nepali</p>
                    <p><strong>Auto English:</strong> Automatically translates Khmer/Nepali to English</p>
                    <p><strong>Manual:</strong> No automatic translation, manual language switching</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
