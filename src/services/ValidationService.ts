import type { FormDefinition, FormField, ValidationRule, FormValidationResult } from '../types'

export class ValidationService {
  static validateField(field: FormField, value: any, formData: Record<string, any> = {}): string[] {
    const errors: string[] = []

    if (!field.validation) return errors

    for (const rule of field.validation) {
      switch (rule.type) {
        case 'required':
          if (this.isEmpty(value)) {
            errors.push(rule.message)
          }
          break

        case 'min':
          if (field.type === 'number' && typeof value === 'number' && value < (rule.value as number)) {
            errors.push(rule.message)
          }
          if (field.type === 'text' && typeof value === 'string' && value.length < (rule.value as number)) {
            errors.push(rule.message)
          }
          break

        case 'max':
          if (field.type === 'number' && typeof value === 'number' && value > (rule.value as number)) {
            errors.push(rule.message)
          }
          if (field.type === 'text' && typeof value === 'string' && value.length > (rule.value as number)) {
            errors.push(rule.message)
          }
          break

        case 'email':
          if (value && !this.isValidEmail(value)) {
            errors.push(rule.message)
          }
          break

        case 'pattern':
          if (value && rule.value && !new RegExp(rule.value as string).test(value)) {
            errors.push(rule.message)
          }
          break

        case 'custom':
          if (rule.customValidator && !rule.customValidator(value, formData)) {
            errors.push(rule.message)
          }
          break
      }
    }

    return errors
  }

  static validateForm(form: FormDefinition, formData: Record<string, any>): FormValidationResult {
    const errors: Record<string, string[]> = {}
    const warnings: Record<string, string[]> = {}

    // Validate individual fields
    form.fields.forEach(field => {
      const value = formData[field.id]
      const fieldErrors = this.validateField(field, value, formData)
      
      if (fieldErrors.length > 0) {
        errors[field.id] = fieldErrors
      }
    })

    // Validate form-level rules
    if (form.validationRules) {
      const formErrors: string[] = []
      
      form.validationRules.forEach(rule => {
        if (!rule.validator(formData)) {
          formErrors.push(rule.message)
        }
      })

      if (formErrors.length > 0) {
        errors.form = formErrors
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    }
  }

  static isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true
    if (typeof value === 'string') return value.trim() === ''
    if (typeof value === 'number') return isNaN(value)
    if (Array.isArray(value)) return value.length === 0
    return false
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static isValidDate(dateString: string): boolean {
    const date = new Date(dateString)
    return !isNaN(date.getTime())
  }

  static isWithinRange(value: number, min?: number, max?: number): boolean {
    if (min !== undefined && value < min) return false
    if (max !== undefined && value > max) return false
    return true
  }

  // Utility function to create common validation rules
  static createValidationRules = {
    required: (message = 'This field is required'): ValidationRule => ({
      type: 'required',
      message
    }),

    minLength: (length: number, message?: string): ValidationRule => ({
      type: 'min',
      value: length,
      message: message || `Must be at least ${length} characters`
    }),

    maxLength: (length: number, message?: string): ValidationRule => ({
      type: 'max',
      value: length,
      message: message || `Must be no more than ${length} characters`
    }),

    minValue: (value: number, message?: string): ValidationRule => ({
      type: 'min',
      value,
      message: message || `Must be at least ${value}`
    }),

    maxValue: (value: number, message?: string): ValidationRule => ({
      type: 'max',
      value,
      message: message || `Must be no more than ${value}`
    }),

    email: (message = 'Please enter a valid email address'): ValidationRule => ({
      type: 'email',
      message
    }),

    pattern: (regex: string, message: string): ValidationRule => ({
      type: 'pattern',
      value: regex,
      message
    }),

    custom: (validator: (value: any, formData: Record<string, any>) => boolean, message: string): ValidationRule => ({
      type: 'custom',
      customValidator: validator,
      message
    })
  }
}

export const validationService = new ValidationService()
