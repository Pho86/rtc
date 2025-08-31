import type { TranslatedText } from '../types'
import type { Language } from './TranslationService'
import { translationService } from './TranslationService'

export class MultilingualFormService {
  private readonly TRANSLATIONS_KEY = 'rtc_form_translations'

  async translateFormData(
    formData: Record<string, any>,
    sourceLanguage: Language,
    targetLanguage: Language,
    translatableFields: string[]
  ): Promise<Record<string, TranslatedText>> {
    const translations: Record<string, TranslatedText> = {}

    for (const fieldId of translatableFields) {
      const value = formData[fieldId]
      
      if (value && typeof value === 'string' && value.trim()) {
        try {
          const result = await translationService.translate(value, targetLanguage)
          
          translations[fieldId] = {
            original: value,
            translated: result.text,
            originalLanguage: sourceLanguage,
            translatedLanguage: targetLanguage,
            confidence: result.confidence || 0.7,
            isUserEdited: false
          }
        } catch (error) {
          console.error(`Translation failed for field ${fieldId}:`, error)
          // Keep original text if translation fails
          translations[fieldId] = {
            original: value,
            translated: value,
            originalLanguage: sourceLanguage,
            translatedLanguage: targetLanguage,
            confidence: 0,
            isUserEdited: false
          }
        }
      }
    }

    return translations
  }

  async retranslateField(
    fieldId: string,
    originalText: string,
    sourceLanguage: Language,
    targetLanguage: Language
  ): Promise<TranslatedText> {
    try {
      const result = await translationService.translate(originalText, targetLanguage)
      
      return {
        original: originalText,
        translated: result.text,
        originalLanguage: sourceLanguage,
        translatedLanguage: targetLanguage,
        confidence: result.confidence || 0.7,
        isUserEdited: false
      }
    } catch (error) {
      console.error(`Retranslation failed for field ${fieldId}:`, error)
      throw error
    }
  }

  editTranslation(
    translatedText: TranslatedText,
    newTranslation: string
  ): TranslatedText {
    return {
      ...translatedText,
      translated: newTranslation,
      isUserEdited: true,
      confidence: 1.0 // User edited translations have highest confidence
    }
  }

  async detectLanguage(text: string): Promise<Language> {
    const detected = await translationService.detectLanguage(text)
    return detected as Language
  }

  validateTranslation(translatedText: TranslatedText): {
    isValid: boolean
    warnings: string[]
  } {
    const warnings: string[] = []

    // Check confidence level
    if (translatedText.confidence < 0.5) {
      warnings.push('Low translation confidence - please review manually')
    }

    // Check if translation seems significantly different in length
    const lengthRatio = translatedText.translated.length / translatedText.original.length
    if (lengthRatio > 3 || lengthRatio < 0.3) {
      warnings.push('Translation length differs significantly from original')
    }

    // Check for common translation errors (placeholder)
    if (translatedText.translated === translatedText.original && 
        translatedText.originalLanguage !== translatedText.translatedLanguage) {
      warnings.push('Text appears untranslated')
    }

    return {
      isValid: warnings.length === 0,
      warnings
    }
  }

  getStoredTranslations(): Record<string, TranslatedText> {
    const stored = localStorage.getItem(this.TRANSLATIONS_KEY)
    return stored ? JSON.parse(stored) : {}
  }

  saveTranslation(key: string, translation: TranslatedText): void {
    const translations = this.getStoredTranslations()
    translations[key] = translation
    localStorage.setItem(this.TRANSLATIONS_KEY, JSON.stringify(translations))
  }

  // Generate a key for caching translations
  generateTranslationKey(text: string, sourceLanguage: Language, targetLanguage: Language): string {
    // Simple hash function for generating consistent keys
    const str = `${text}_${sourceLanguage}_${targetLanguage}`
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  // Batch translate multiple fields
  async batchTranslate(
    data: Record<string, string>,
    sourceLanguage: Language,
    targetLanguage: Language
  ): Promise<Record<string, TranslatedText>> {
    const results: Record<string, TranslatedText> = {}
    
    // Process in parallel with some delay to avoid rate limiting
    const entries = Object.entries(data)
    const batchSize = 3 // Translate 3 fields at a time
    
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async ([fieldId, text]) => {
        if (text && text.trim()) {
          const translationKey = this.generateTranslationKey(text, sourceLanguage, targetLanguage)
          const cached = this.getStoredTranslations()[translationKey]
          
          if (cached) {
            return [fieldId, cached]
          }
          
          try {
            const result = await translationService.translate(text, targetLanguage)
            const translation: TranslatedText = {
              original: text,
              translated: result.text,
              originalLanguage: sourceLanguage,
              translatedLanguage: targetLanguage,
              confidence: result.confidence || 0.7,
              isUserEdited: false
            }
            
            // Cache the translation
            this.saveTranslation(translationKey, translation)
            
            return [fieldId, translation]
          } catch (error) {
            console.error(`Translation failed for field ${fieldId}:`, error)
            return [fieldId, {
              original: text,
              translated: text,
              originalLanguage: sourceLanguage,
              translatedLanguage: targetLanguage,
              confidence: 0,
              isUserEdited: false
            }]
          }
        }
        return [fieldId, null]
      })
      
      const batchResults = await Promise.all(batchPromises)
      batchResults.forEach(([fieldId, translation]) => {
        if (translation) {
          results[fieldId as string] = translation as TranslatedText
        }
      })
      
      // Add small delay between batches
      if (i + batchSize < entries.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    return results
  }
}

export const multilingualFormService = new MultilingualFormService()
