import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { formService } from '../services/FormService'
import { multilingualFormService } from '../services/MultilingualFormService'
import { translationService } from '../services/TranslationService'
import { PhotoUpload, type PhotoWithMetadata } from './PhotoUpload'
import type { FormDefinition, FormSubmission, FormField, TranslatedText } from '../types'
import type { Language } from '../services/TranslationService'

interface MultilingualFormEditorProps {
  form: FormDefinition
  draft?: FormSubmission | null
  onSave: () => void
  onCancel: () => void
}

export function MultilingualFormEditor({ form, draft, onSave, onCancel }: MultilingualFormEditorProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [translatedData, setTranslatedData] = useState<Record<string, TranslatedText>>({})
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [primaryLanguage, setPrimaryLanguage] = useState<Language>('en')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isTranslating, setIsTranslating] = useState<Record<string, boolean>>({})
  const [showTranslations, setShowTranslations] = useState(false)
  const [photos, setPhotos] = useState<PhotoWithMetadata[]>([])

  useEffect(() => {
    if (draft) {
      setFormData(draft.data)
      setTranslatedData(draft.translatedData || {})
      setPrimaryLanguage(draft.primaryLanguage as Language)
      // Note: Photos from drafts can't be restored as they contain File objects
      // that can't be serialized. User will need to re-upload photos.
      setPhotos([])
    }
  }, [draft])

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
    
    // Clear field errors when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: []
      }))
    }

    // Auto-translate if field is translatable and value changed
    const field = form.fields.find(f => f.id === fieldId)
    if (field?.translatable && typeof value === 'string' && value.trim() && primaryLanguage !== 'en') {
      handleAutoTranslate(fieldId, value)
    }
  }

  const handleAutoTranslate = async (fieldId: string, text: string) => {
    if (!text.trim()) return

    setIsTranslating(prev => ({ ...prev, [fieldId]: true }))
    
    try {
      const translation = await multilingualFormService.retranslateField(
        fieldId,
        text,
        primaryLanguage,
        'en'
      )
      
      setTranslatedData(prev => ({
        ...prev,
        [fieldId]: translation
      }))
    } catch (error) {
      console.error(`Auto-translation failed for field ${fieldId}:`, error)
    } finally {
      setIsTranslating(prev => ({ ...prev, [fieldId]: false }))
    }
  }

  const handleManualTranslationEdit = (fieldId: string, newTranslation: string) => {
    const existing = translatedData[fieldId]
    if (existing) {
      const updated = multilingualFormService.editTranslation(existing, newTranslation)
      setTranslatedData(prev => ({
        ...prev,
        [fieldId]: updated
      }))
    }
  }

  const handleRetranslate = async (fieldId: string) => {
    const originalText = formData[fieldId]
    if (!originalText) return

    setIsTranslating(prev => ({ ...prev, [fieldId]: true }))
    
    try {
      const translation = await multilingualFormService.retranslateField(
        fieldId,
        originalText,
        primaryLanguage,
        'en'
      )
      
      setTranslatedData(prev => ({
        ...prev,
        [fieldId]: translation
      }))
    } catch (error) {
      console.error(`Retranslation failed for field ${fieldId}:`, error)
    } finally {
      setIsTranslating(prev => ({ ...prev, [fieldId]: false }))
    }
  }

  const handleSaveDraft = async () => {
    setIsSavingDraft(true)
    try {
      const draftData = { 
        ...formData,
        photos: photos.map(photo => ({
          id: photo.id,
          filename: photo.file.name,
          safetyStatus: photo.safetyStatus,
          metadata: photo.metadata,
          approvals: photo.approvals
        }))
      }
      formService.saveDraft(form.id, draftData, primaryLanguage)
      onSave()
    } catch (error) {
      console.error('Failed to save draft:', error)
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      const submissionData = {
        ...formData,
        photos: photos.map(photo => ({
          id: photo.id,
          filename: photo.file.name,
          safetyStatus: photo.safetyStatus,
          metadata: photo.metadata,
          approvals: photo.approvals
        }))
      }
      
      const result = formService.submitForm(form.id, submissionData, primaryLanguage, draft?.id)
      
      if (result.success) {
        onSave()
      } else {
        setErrors(result.errors || {})
      }
    } catch (error) {
      console.error('Failed to submit form:', error)
      setErrors({ form: ['An unexpected error occurred'] })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const value = formData[field.id] || ''
    const translation = translatedData[field.id]
    const fieldErrors = errors[field.id] || []
    const hasError = fieldErrors.length > 0
    const isTranslatingField = isTranslating[field.id]

    const baseInputClasses = `mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
      hasError ? 'border-red-300' : 'border-gray-300'
    }`

    const renderInputField = () => {
      switch (field.type) {
        case 'text':
        case 'email':
          return (
            <input
              type={field.type}
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={baseInputClasses}
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          )
        
        case 'number':
          return (
            <input
              type="number"
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value ? parseInt(e.target.value) : '')}
              className={baseInputClasses}
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          )
        
        case 'date':
          return (
            <input
              type="date"
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={baseInputClasses}
            />
          )
        
        case 'select':
          return (
            <select
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={baseInputClasses}
            >
              <option value="">Select {field.label.toLowerCase()}</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )
        
        case 'textarea':
          return (
            <textarea
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              rows={4}
              className={baseInputClasses}
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          )
        
        default:
          return null
      }
    }

    return (
      <div key={field.id} className="space-y-2">
        <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
          {field.translatable && (
            <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
              Translatable
            </span>
          )}
        </label>
        
        {field.translatable && field.displayBothLanguages ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Original language input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">
                  Original ({translationService.getLanguageName(primaryLanguage)})
                </span>
                {isTranslatingField && (
                  <span className="text-xs text-blue-500">Translating...</span>
                )}
              </div>
              {renderInputField()}
            </div>
            
            {/* Translation */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">
                  English Translation
                  {translation && (
                    <span className="ml-2 text-xs text-gray-400">
                      ({Math.round(translation.confidence * 100)}% confidence)
                    </span>
                  )}
                </span>
                {translation && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleRetranslate(field.id)}
                    disabled={isTranslatingField}
                    className="text-xs"
                  >
                    Retranslate
                  </Button>
                )}
              </div>
              
              {field.type === 'textarea' ? (
                <textarea
                  value={translation?.translated || ''}
                  onChange={(e) => handleManualTranslationEdit(field.id, e.target.value)}
                  rows={4}
                  className={`${baseInputClasses} bg-gray-50`}
                  placeholder="Auto-translation will appear here..."
                  disabled={isTranslatingField}
                />
              ) : (
                <input
                  type="text"
                  value={translation?.translated || ''}
                  onChange={(e) => handleManualTranslationEdit(field.id, e.target.value)}
                  className={`${baseInputClasses} bg-gray-50`}
                  placeholder="Auto-translation will appear here..."
                  disabled={isTranslatingField}
                />
              )}
              
              {translation && translation.isUserEdited && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Manually edited
                </p>
              )}
              
              {translation && translation.confidence < 0.5 && (
                <p className="text-xs text-yellow-600 mt-1">
                  ⚠ Low confidence translation - please review
                </p>
              )}
            </div>
          </div>
        ) : (
          renderInputField()
        )}
        
        {/* Field errors */}
        {fieldErrors.length > 0 && (
          <div className="text-sm text-red-600">
            {fieldErrors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-300 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
            <p className="text-sm text-gray-600">{form.description}</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">
                Primary Language:
              </label>
              <select
                value={primaryLanguage}
                onChange={(e) => setPrimaryLanguage(e.target.value as Language)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="en">English</option>
                <option value="km">Khmer</option>
                <option value="ne">Nepali</option>
              </select>
            </div>
            
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting || isSavingDraft}
            >
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSaveDraft}
              disabled={isSubmitting || isSavingDraft}
            >
              {isSavingDraft ? 'Saving...' : 'Save Draft'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Form Details</h2>
                  {draft && (
                    <p className="text-sm text-blue-600 mt-1">
                      Editing draft (last saved: {new Date(draft.updatedAt).toLocaleString()})
                    </p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTranslations(!showTranslations)}
                  >
                    {showTranslations ? 'Hide' : 'Show'} Translations
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Form-level errors */}
              {errors.form && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-red-800">
                    <ul className="list-disc list-inside space-y-1">
                      {errors.form.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Form fields */}
              {form.fields.map(renderField)}

              {/* Photo Upload Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-t pt-6">Supporting Photos</h3>
                <PhotoUpload
                  onPhotosUploaded={setPhotos}
                  maxPhotos={5}
                  allowedAudiences={['internal', 'CRA', 'donors', 'community']}
                  description="Upload photos that support your submission. All photos will be reviewed for safety and consent before external use."
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isSubmitting || isSavingDraft}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSaveDraft}
                disabled={isSubmitting || isSavingDraft}
              >
                {isSavingDraft ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting || isSavingDraft}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Form'}
              </Button>
            </div>
          </form>
        </div>

        {/* Translation info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Multi-language Support:</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Enter data in your preferred language (Nepali, Khmer, or English)</li>
            <li>• Translatable fields are automatically translated to English for HQ reporting</li>
            <li>• Both original and translated text are preserved to avoid misinterpretation</li>
            <li>• You can manually edit translations to improve accuracy</li>
            <li>• Low confidence translations are flagged for manual review</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
