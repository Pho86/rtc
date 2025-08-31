export interface User {
  id: string
  username: string
  department: Department
  role: 'admin' | 'user'
}

export type Department = 'safe-homes' | 'prevention' | 'schools' | 'outreach' | 'admin'

export interface FormField {
  id: string
  label: string
  type: 'text' | 'number' | 'email' | 'select' | 'textarea' | 'date'
  required: boolean
  options?: string[] // for select fields
  validation?: ValidationRule[]
  translatable?: boolean // whether this field should be translated
  displayBothLanguages?: boolean // whether to show original + translation side by side
}

export interface ValidationRule {
  type: 'min' | 'max' | 'required' | 'email' | 'pattern' | 'custom'
  value?: number | string
  message: string
  customValidator?: (value: any, formData: Record<string, any>) => boolean
}

export interface FormDefinition {
  id: string
  title: string
  description: string
  department: Department
  version: number
  fields: FormField[]
  validationRules?: FormValidationRule[]
}

export interface FormValidationRule {
  type: 'total-sum' | 'conditional' | 'cross-field' | 'custom'
  fieldIds: string[]
  expectedValue?: number
  condition?: string
  message: string
  validator: (formData: Record<string, any>) => boolean
}

export interface TranslatedText {
  original: string
  translated: string
  originalLanguage: string
  translatedLanguage: string
  confidence: number
  isUserEdited?: boolean
}

export interface FormSubmission {
  id: string
  formId: string
  userId: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  data: Record<string, any>
  translatedData?: Record<string, TranslatedText>
  primaryLanguage: string
  photos?: Array<{
    id: string
    filename: string
    safetyStatus: {
      internal: boolean
      CRA: boolean
      donors: boolean
      community: boolean
    }
    metadata: {
      capturedAt: string
      location?: string
      description?: string
      consentObtained: boolean
      containsMinors: boolean
      containsPersonalInfo: boolean
    }
    approvals: Array<{
      audience: string
      approved: boolean
      approvedBy: string
      approvedAt: string
    }>
  }>
  createdAt: Date
  updatedAt: Date
  submittedAt?: Date
  version: number
}

export interface FormValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
}
