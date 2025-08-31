import type { FormDefinition, FormSubmission, Department, FormValidationResult } from '../types'
import type { Language } from './TranslationService'
import { authService } from './AuthService'

class FormService {
  private readonly SUBMISSIONS_KEY = 'rtc_form_submissions'
  private readonly DRAFTS_KEY = 'rtc_form_drafts'

  // Mock form definitions for different departments
  private formDefinitions: FormDefinition[] = [
    {
      id: 'safe-homes-monthly',
      title: 'Safe Homes Monthly Report',
      description: 'Monthly report for safe homes program activities',
      department: 'safe-homes',
      version: 1,
      fields: [
        {
          id: 'reporting_period',
          label: 'Reporting Period',
          type: 'date',
          required: true,
          validation: [{ type: 'required', message: 'Reporting period is required' }]
        },
        {
          id: 'families_served',
          label: 'Number of Families Served',
          type: 'number',
          required: true,
          validation: [
            { type: 'required', message: 'Number of families is required' },
            { type: 'min', value: 0, message: 'Cannot be negative' }
          ]
        },
        {
          id: 'children_served',
          label: 'Number of Children Served',
          type: 'number',
          required: true,
          validation: [
            { type: 'required', message: 'Number of children is required' },
            { type: 'min', value: 0, message: 'Cannot be negative' }
          ]
        },
        {
          id: 'emergency_placements',
          label: 'Emergency Placements',
          type: 'number',
          required: true,
          validation: [
            { type: 'required', message: 'Emergency placements is required' },
            { type: 'min', value: 0, message: 'Cannot be negative' }
          ]
        },
        {
          id: 'total_bed_nights',
          label: 'Total Bed Nights',
          type: 'number',
          required: true,
          validation: [
            { type: 'required', message: 'Total bed nights is required' },
            { type: 'min', value: 0, message: 'Cannot be negative' }
          ]
        },
        {
          id: 'program_description',
          label: 'Program Description',
          type: 'textarea',
          required: false,
          translatable: true,
          displayBothLanguages: true
        },
        {
          id: 'challenges_faced',
          label: 'Challenges Faced',
          type: 'textarea',
          required: false,
          translatable: true,
          displayBothLanguages: true
        },
        {
          id: 'notes',
          label: 'Additional Notes',
          type: 'textarea',
          required: false,
          translatable: true,
          displayBothLanguages: true
        }
      ],
      validationRules: [
        {
          type: 'custom',
          fieldIds: ['children_served', 'families_served'],
          message: 'Children served should not exceed families served × 6 (reasonable estimate)',
          validator: (data) => {
            const children = parseInt(data.children_served) || 0
            const families = parseInt(data.families_served) || 0
            return children <= families * 6
          }
        }
      ]
    },
    {
      id: 'prevention-quarterly',
      title: 'Prevention Programs Quarterly Report',
      description: 'Quarterly report for prevention program activities',
      department: 'prevention',
      version: 1,
      fields: [
        {
          id: 'quarter',
          label: 'Quarter',
          type: 'select',
          required: true,
          options: ['Q1', 'Q2', 'Q3', 'Q4'],
          validation: [{ type: 'required', message: 'Quarter is required' }]
        },
        {
          id: 'year',
          label: 'Year',
          type: 'number',
          required: true,
          validation: [
            { type: 'required', message: 'Year is required' },
            { type: 'min', value: 2020, message: 'Year must be 2020 or later' }
          ]
        },
        {
          id: 'workshops_conducted',
          label: 'Workshops Conducted',
          type: 'number',
          required: true,
          validation: [
            { type: 'required', message: 'Number of workshops is required' },
            { type: 'min', value: 0, message: 'Cannot be negative' }
          ]
        },
        {
          id: 'participants_total',
          label: 'Total Participants',
          type: 'number',
          required: true,
          validation: [
            { type: 'required', message: 'Total participants is required' },
            { type: 'min', value: 0, message: 'Cannot be negative' }
          ]
        },
        {
          id: 'participants_adults',
          label: 'Adult Participants',
          type: 'number',
          required: true,
          validation: [
            { type: 'required', message: 'Adult participants is required' },
            { type: 'min', value: 0, message: 'Cannot be negative' }
          ]
        },
        {
          id: 'participants_children',
          label: 'Child Participants',
          type: 'number',
          required: true,
          validation: [
            { type: 'required', message: 'Child participants is required' },
            { type: 'min', value: 0, message: 'Cannot be negative' }
          ]
        },
        {
          id: 'workshop_topics',
          label: 'Workshop Topics Covered',
          type: 'textarea',
          required: false,
          translatable: true,
          displayBothLanguages: true
        },
        {
          id: 'feedback_summary',
          label: 'Participant Feedback Summary',
          type: 'textarea',
          required: false,
          translatable: true,
          displayBothLanguages: true
        }
      ],
      validationRules: [
        {
          type: 'total-sum',
          fieldIds: ['participants_adults', 'participants_children'],
          message: 'Adult and child participants must equal total participants',
          validator: (data) => {
            const total = parseInt(data.participants_total) || 0
            const adults = parseInt(data.participants_adults) || 0
            const children = parseInt(data.participants_children) || 0
            return adults + children === total
          }
        }
      ]
    },
    {
      id: 'schools-monthly',
      title: 'Schools Program Monthly Report',
      description: 'Monthly report for school-based program activities',
      department: 'schools',
      version: 1,
      fields: [
        {
          id: 'month',
          label: 'Month',
          type: 'select',
          required: true,
          options: ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'],
          validation: [{ type: 'required', message: 'Month is required' }]
        },
        {
          id: 'year',
          label: 'Year',
          type: 'number',
          required: true,
          validation: [
            { type: 'required', message: 'Year is required' },
            { type: 'min', value: 2020, message: 'Year must be 2020 or later' }
          ]
        },
        {
          id: 'schools_visited',
          label: 'Schools Visited',
          type: 'number',
          required: true,
          validation: [
            { type: 'required', message: 'Number of schools is required' },
            { type: 'min', value: 0, message: 'Cannot be negative' }
          ]
        },
        {
          id: 'students_reached',
          label: 'Students Reached',
          type: 'number',
          required: true,
          validation: [
            { type: 'required', message: 'Students reached is required' },
            { type: 'min', value: 0, message: 'Cannot be negative' }
          ]
        },
        {
          id: 'teachers_trained',
          label: 'Teachers Trained',
          type: 'number',
          required: true,
          validation: [
            { type: 'required', message: 'Teachers trained is required' },
            { type: 'min', value: 0, message: 'Cannot be negative' }
          ]
        }
      ]
    }
  ]

  getAvailableForms(department?: Department): FormDefinition[] {
    const userDepartment = department || authService.getUserDepartment()
    if (!userDepartment) return []
    
    if (authService.isAdmin()) {
      return this.formDefinitions
    }
    
    return this.formDefinitions.filter(form => form.department === userDepartment)
  }

  getFormById(formId: string): FormDefinition | null {
    return this.formDefinitions.find(form => form.id === formId) || null
  }

  saveDraft(formId: string, data: Record<string, any>, primaryLanguage: Language = 'en'): string {
    const user = authService.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const drafts = this.getDrafts()
    const draftId = `${formId}_${user.id}_${Date.now()}`
    
    const draft: FormSubmission = {
      id: draftId,
      formId,
      userId: user.id,
      status: 'draft',
      data,
      primaryLanguage,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    }

    drafts[draftId] = draft
    localStorage.setItem(this.DRAFTS_KEY, JSON.stringify(drafts))
    return draftId
  }

  getDrafts(): Record<string, FormSubmission> {
    const stored = localStorage.getItem(this.DRAFTS_KEY)
    return stored ? JSON.parse(stored) : {}
  }

  getUserDrafts(): FormSubmission[] {
    const user = authService.getCurrentUser()
    if (!user) return []

    const drafts = this.getDrafts()
    return Object.values(drafts).filter(draft => draft.userId === user.id)
  }

  deleteDraft(draftId: string): void {
    const drafts = this.getDrafts()
    delete drafts[draftId]
    localStorage.setItem(this.DRAFTS_KEY, JSON.stringify(drafts))
  }

  submitForm(formId: string, data: Record<string, any>, primaryLanguage: Language = 'en', draftId?: string): { success: boolean; errors?: Record<string, string[]> } {
    const user = authService.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const form = this.getFormById(formId)
    if (!form) throw new Error('Form not found')

    // Validate form data
    const validation = this.validateForm(form, data)
    if (!validation.isValid) {
      return { success: false, errors: validation.errors }
    }

    // Check for duplicate submissions
    if (this.hasDuplicateSubmission(formId, data)) {
      return { 
        success: false, 
        errors: { form: ['A similar submission already exists for this period'] }
      }
    }

    // Create submission
    const submissions = this.getSubmissions()
    const submissionId = `${formId}_${user.id}_${Date.now()}`
    
    const submission: FormSubmission = {
      id: submissionId,
      formId,
      userId: user.id,
      status: 'submitted',
      data,
      primaryLanguage,
      createdAt: new Date(),
      updatedAt: new Date(),
      submittedAt: new Date(),
      version: form.version
    }

    submissions[submissionId] = submission
    localStorage.setItem(this.SUBMISSIONS_KEY, JSON.stringify(submissions))

    // Remove draft if it exists
    if (draftId) {
      this.deleteDraft(draftId)
    }

    return { success: true }
  }

  validateForm(form: FormDefinition, data: Record<string, any>): FormValidationResult {
    const errors: Record<string, string[]> = {}
    const warnings: Record<string, string[]> = {}

    // Validate individual fields
    form.fields.forEach(field => {
      const value = data[field.id]
      const fieldErrors: string[] = []

      if (field.validation) {
        field.validation.forEach(rule => {
          switch (rule.type) {
            case 'required':
              if (!value || (typeof value === 'string' && value.trim() === '')) {
                fieldErrors.push(rule.message)
              }
              break
            case 'min':
              if (typeof value === 'number' && value < (rule.value as number)) {
                fieldErrors.push(rule.message)
              }
              break
            case 'max':
              if (typeof value === 'number' && value > (rule.value as number)) {
                fieldErrors.push(rule.message)
              }
              break
            case 'email':
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
              if (value && !emailRegex.test(value)) {
                fieldErrors.push(rule.message)
              }
              break
            case 'custom':
              if (rule.customValidator && !rule.customValidator(value, data)) {
                fieldErrors.push(rule.message)
              }
              break
          }
        })
      }

      if (fieldErrors.length > 0) {
        errors[field.id] = fieldErrors
      }
    })

    // Validate form-level rules
    if (form.validationRules) {
      form.validationRules.forEach(rule => {
        if (!rule.validator(data)) {
          if (!errors.form) errors.form = []
          errors.form.push(rule.message)
        }
      })
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    }
  }

  private getSubmissions(): Record<string, FormSubmission> {
    const stored = localStorage.getItem(this.SUBMISSIONS_KEY)
    return stored ? JSON.parse(stored) : {}
  }

  private hasDuplicateSubmission(formId: string, data: Record<string, any>): boolean {
    const user = authService.getCurrentUser()
    if (!user) return false

    const submissions = this.getSubmissions()
    const userSubmissions = Object.values(submissions).filter(
      sub => sub.userId === user.id && sub.formId === formId && sub.status === 'submitted'
    )

    // Check for duplicate based on key fields (e.g., reporting period)
    return userSubmissions.some(submission => {
      // For demonstration, check if reporting period matches
      if (data.reporting_period && submission.data.reporting_period) {
        return data.reporting_period === submission.data.reporting_period
      }
      if (data.month && data.year && submission.data.month && submission.data.year) {
        return data.month === submission.data.month && data.year === submission.data.year
      }
      if (data.quarter && data.year && submission.data.quarter && submission.data.year) {
        return data.quarter === submission.data.quarter && data.year === submission.data.year
      }
      return false
    })
  }
}

export const formService = new FormService()
