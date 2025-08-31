import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { formService } from '../services/FormService'
import type { FormDefinition, FormSubmission, FormField } from '../types'
import type { Language } from '@/services/TranslationService'

interface FormEditorProps {
  form: FormDefinition
  draft?: FormSubmission | null
  onSave: () => void
  onCancel: () => void
}

export function FormEditor({ form, draft, onSave, onCancel }: FormEditorProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)

  useEffect(() => {
    if (draft) {
      setFormData(draft.data)
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
  }

  const handleSaveDraft = async () => {
    setIsSavingDraft(true)
    try {
      formService.saveDraft(form.id, formData)
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
      const result = formService.submitForm(form.id, formData, draft?.id as Language)
      
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
    const fieldErrors = errors[field.id] || []
    const hasError = fieldErrors.length > 0

    const baseInputClasses = `mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
      hasError ? 'border-red-300' : 'border-gray-300'
    }`

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-300 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
            <p className="text-sm text-gray-600">{form.description}</p>
          </div>
          
          <div className="flex items-center space-x-3">
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

      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Form Details</h2>
              {draft && (
                <p className="text-sm text-blue-600 mt-1">
                  Editing draft (last saved: {new Date(draft.updatedAt).toLocaleString()})
                </p>
              )}
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
              {form.fields.map((field) => (
                <div key={field.id}>
                  <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {renderField(field)}
                  
                  {/* Field errors */}
                  {errors[field.id] && (
                    <div className="mt-1 text-sm text-red-600">
                      {errors[field.id].map((error, index) => (
                        <div key={index}>{error}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
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

        {/* Validation preview */}
        {form.validationRules && form.validationRules.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Validation Rules:</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              {form.validationRules.map((rule, index) => (
                <li key={index}>• {rule.message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
