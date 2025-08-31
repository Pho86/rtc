import { useState } from 'react'
import { Button } from './ui/button'
import type { Language } from '../services/TranslationService'

interface LanguageSelectorHeaderProps {
  currentLanguage: Language
  onLanguageChange: (language: Language) => void
  showUserInfo?: boolean
  userName?: string
  userDepartment?: string
  onLogout?: () => void
}

export function LanguageSelectorHeader({
  currentLanguage,
  onLanguageChange,
  showUserInfo = false,
  userName,
  userDepartment,
  onLogout
}: LanguageSelectorHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const languages: { code: Language; name: string; nativeName: string }[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ' },
    { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' }
  ]

  const getCurrentLanguageDisplay = () => {
    const lang = languages.find(l => l.code === currentLanguage)
    return lang ? `${lang.nativeName} (${lang.name})` : 'English'
  }

  return (
    <div className="bg-white border-b border-gray-300 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RTC Data Entry</h1>
          {showUserInfo && (
            <p className="text-sm text-gray-600">
              Welcome back, {userName} ({userDepartment?.replace('-', ' ').toUpperCase()})
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Language Selector */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Interface Language
            </label>
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 text-sm"
              >
                <span>{getCurrentLanguageDisplay()}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    {languages.map((language) => (
                      <button
                        key={language.code}
                        onClick={() => {
                          onLanguageChange(language.code)
                          setIsDropdownOpen(false)
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                          currentLanguage === language.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{language.nativeName}</span>
                          <span className="text-xs text-gray-500">{language.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="border-t border-gray-200 p-3">
                    <p className="text-xs text-gray-500">
                      This changes the interface language. Data entry language is selected per form.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Actions */}
          {showUserInfo && onLogout && (
            <Button 
              variant="outline" 
              onClick={onLogout}
              className="text-sm"
            >
              Logout
            </Button>
          )}
        </div>
      </div>
      
      {/* Translation Notice */}
      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800">Multi-language Support</h3>
            <p className="text-xs text-blue-700 mt-1">
              Enter data in your preferred language (Nepali, Khmer, or English). 
              Translatable fields are automatically translated to English for HQ reporting, 
              while preserving your original text to avoid misinterpretation.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
