// Translation Service for Khmer, Nepali, and English
// Handles seamless translation between these languages

export type Language = 'en' | 'km' | 'ne'

export interface TranslationResult {
  text: string
  detectedLanguage?: string
  confidence?: number
}

export interface TranslationMode {
  id: string
  name: string
  description: string
  sourceLang: Language
  targetLang: Language
  autoTranslate: boolean
}

export class TranslationService {
  private currentLanguage: Language = 'en'
  private translationModes: TranslationMode[] = [
    {
      id: 'auto-khmer',
      name: 'Auto Khmer',
      description: 'Automatically translate to Khmer',
      sourceLang: 'en',
      targetLang: 'km',
      autoTranslate: true
    },
    {
      id: 'auto-nepali',
      name: 'Auto Nepali',
      description: 'Automatically translate to Nepali',
      sourceLang: 'en',
      targetLang: 'ne',
      autoTranslate: true
    },
    {
      id: 'auto-english',
      name: 'Auto English',
      description: 'Automatically translate to English',
      sourceLang: 'km',
      targetLang: 'en',
      autoTranslate: true
    },
    {
      id: 'manual',
      name: 'Manual',
      description: 'No automatic translation',
      sourceLang: 'en',
      targetLang: 'en',
      autoTranslate: false
    }
  ]

  private languageNames: Record<Language, string> = {
    en: 'English',
    km: 'ខ្មែរ', // Khmer
    ne: 'नेपाली' // Nepali
  }

  private languageCodes: Record<Language, string> = {
    en: 'en',
    km: 'km',
    ne: 'ne'
  }

  // Get all available translation modes
  getTranslationModes(): TranslationMode[] {
    return this.translationModes
  }

  // Get current language
  getCurrentLanguage(): Language {
    return this.currentLanguage
  }

  // Set current language
  setCurrentLanguage(lang: Language): void {
    this.currentLanguage = lang
    localStorage.setItem('rtc-spreadsheet-language', lang)
  }

  // Get language name
  getLanguageName(lang: Language): string {
    return this.languageNames[lang]
  }

  // Detect language of text
  async detectLanguage(text: string): Promise<string> {
    if (!text.trim()) return 'en'

    try {
      // Simple language detection based on character sets
      const khmerChars = /[\u1780-\u17FF]/
      const nepaliChars = /[\u0900-\u097F]/
      const englishChars = /[a-zA-Z]/

      if (khmerChars.test(text)) return 'km'
      if (nepaliChars.test(text)) return 'ne'
      if (englishChars.test(text)) return 'en'

      return 'en' // Default to English
    } catch (error) {
      console.error('Language detection failed:', error)
      return 'en'
    }
  }

  // Translate text using Google Translate API (if available)
  async translateWithGoogleAPI(text: string, targetLang: Language): Promise<TranslationResult> {
    const GOOGLE_TRANSLATE_API_KEY = process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY

    if (!GOOGLE_TRANSLATE_API_KEY) {
      throw new Error('Google Translate API key not configured')
    }

    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            target: this.languageCodes[targetLang],
            format: 'text'
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`)
      }

      const data = await response.json()
      return {
        text: data.data.translations[0].translatedText,
        detectedLanguage: data.data.translations[0].detectedSourceLanguage,
        confidence: 0.9
      }
    } catch (error) {
      console.error('Google Translate API failed:', error)
      throw error
    }
  }

  // Fallback translation using basic character mapping
  async translateWithFallback(text: string, targetLang: Language): Promise<TranslationResult> {
    const detectedLang = await this.detectLanguage(text)
    
    if (detectedLang === targetLang) {
      return { text, detectedLanguage: detectedLang, confidence: 1.0 }
    }

    // Basic fallback translations for common terms
    const translations = this.getBasicTranslations()
    const key = `${detectedLang}-${targetLang}`
    
    if (translations[key] && translations[key][text.toLowerCase()]) {
      return {
        text: translations[key][text.toLowerCase()],
        detectedLanguage: detectedLang,
        confidence: 0.7
      }
    }

    // If no translation found, return original text
    return {
      text,
      detectedLanguage: detectedLang,
      confidence: 0.0
    }
  }

  // Get basic translations for common terms
  private getBasicTranslations(): Record<string, Record<string, string>> {
    return {
      'en-km': {
        'hello': 'សួស្តី',
        'goodbye': 'លាសិនហើយ',
        'thank you': 'សូមអរគុណ',
        'yes': 'បាទ',
        'no': 'ទេ',
        'name': 'ឈ្មោះ',
        'date': 'កាលបរិច្ឆេទ',
        'total': 'សរុប',
        'sum': 'ផលបូក',
        'average': 'មធ្យម',
        'maximum': 'អតិបរមា',
        'minimum': 'អប្បបរមា',
        'save': 'រក្សាទុក',
        'load': 'ផ្ទុក',
        'export': 'នាំចេញ',
        'clear': 'សម្អាត',
        'help': 'ជំនួយ'
      },
      'en-ne': {
        'hello': 'नमस्ते',
        'goodbye': 'अलविदा',
        'thank you': 'धन्यवाद',
        'yes': 'हो',
        'no': 'होइन',
        'name': 'नाम',
        'date': 'मिति',
        'total': 'कुल',
        'sum': 'योग',
        'average': 'औसत',
        'maximum': 'अधिकतम',
        'minimum': 'न्यूनतम',
        'save': 'सुरक्षित गर्नुहोस्',
        'load': 'लोड गर्नुहोस्',
        'export': 'निर्यात गर्नुहोस्',
        'clear': 'सफा गर्नुहोस्',
        'help': 'सहायता'
      },
      'km-en': {
        'សួស្តី': 'hello',
        'លាសិនហើយ': 'goodbye',
        'សូមអរគុណ': 'thank you',
        'បាទ': 'yes',
        'ទេ': 'no',
        'ឈ្មោះ': 'name',
        'កាលបរិច្ឆេទ': 'date',
        'សរុប': 'total',
        'ផលបូក': 'sum',
        'មធ្យម': 'average',
        'អតិបរមា': 'maximum',
        'អប្បបរមា': 'minimum',
        'រក្សាទុក': 'save',
        'ផ្ទុក': 'load',
        'នាំចេញ': 'export',
        'សម្អាត': 'clear',
        'ជំនួយ': 'help'
      },
      'ne-en': {
        'नमस्ते': 'hello',
        'अलविदा': 'goodbye',
        'धन्यवाद': 'thank you',
        'हो': 'yes',
        'होइन': 'no',
        'नाम': 'name',
        'मिति': 'date',
        'कुल': 'total',
        'योग': 'sum',
        'औसत': 'average',
        'अधिकतम': 'maximum',
        'न्यूनतम': 'minimum',
        'सुरक्षित गर्नुहोस्': 'save',
        'लोड गर्नुहोस्': 'load',
        'निर्यात गर्नुहोस्': 'export',
        'सफा गर्नुहोस्': 'clear',
        'सहायता': 'help'
      }
    }
  }

  // Main translation method
  async translate(text: string, targetLang: Language): Promise<TranslationResult> {
    if (!text.trim()) {
      return { text: '', detectedLanguage: targetLang, confidence: 1.0 }
    }

    try {
      // Try Google Translate API first
      return await this.translateWithGoogleAPI(text, targetLang)
    } catch (error) {
      console.log('Falling back to basic translation')
      // Fallback to basic translation
      return await this.translateWithFallback(text, targetLang)
    }
  }

  // Translate UI text
  translateUI(key: string, lang: Language): string {
    const translations: Record<string, Record<Language, string>> = {
      'save': {
        en: 'Save',
        km: 'រក្សាទុក',
        ne: 'सुरक्षित गर्नुहोस्'
      },
      'load': {
        en: 'Load',
        km: 'ផ្ទុក',
        ne: 'लोड गर्नुहोस्'
      },
      'export': {
        en: 'Export',
        km: 'នាំចេញ',
        ne: 'निर्यात गर्नुहोस्'
      },
      'clear': {
        en: 'Clear',
        km: 'សម្អាត',
        ne: 'सफा गर्नुहोस्'
      },
      'help': {
        en: 'Help',
        km: 'ជំនួយ',
        ne: 'सहायता'
      },
      'cell': {
        en: 'Cell',
        km: 'ក្រឡា',
        ne: 'सेल'
      },
      'value': {
        en: 'Value',
        km: 'តម្លៃ',
        ne: 'मान'
      },
      'apply': {
        en: 'Apply',
        km: 'អនុវត្ត',
        ne: 'लागू गर्नुहोस्'
      },
      'formula': {
        en: 'Formula',
        km: 'រូបមន្ត',
        ne: 'सूत्र'
      },
      'enter_formula': {
        en: 'Enter value or formula (e.g., =A1+B1)',
        km: 'បញ្ចូលតម្លៃ ឬរូបមន្ត (ឧ. =A1+B1)',
        ne: 'मान वा सूत्र प्रविष्ट गर्नुहोस् (जस्तै =A1+B1)'
      }
    }

    return translations[key]?.[lang] || translations[key]?.['en'] || key
  }
}

// Global instance
export const translationService = new TranslationService()
