# RTC Multilingual Data Entry System

## Overview

The RTC Data Entry System now supports multilingual data entry with automatic translation capabilities, designed for staff who work in Nepali, Khmer, or English environments.

## Key Features

### 1. Multi-language Support
- **Input Languages**: Staff can enter data in their preferred language (Nepali, Khmer, or English)
- **Interface Language**: UI can be switched between supported languages
- **Auto-translation**: Translatable fields are automatically translated to English for HQ reporting
- **Dual Display**: Original text and translations are shown side-by-side to avoid misinterpretation

### 2. Translation Features
- **Automatic Translation**: Fields marked as translatable are auto-translated when data is entered
- **Manual Editing**: Staff can manually edit translations to improve accuracy
- **Confidence Indicators**: Translation confidence levels are displayed
- **Validation Warnings**: Low-confidence translations are flagged for manual review
- **Preservation**: Both original and translated text are permanently stored

### 3. Form Types by Department

#### Safe Homes (safe_homes_user / password123)
- Monthly reporting forms
- Translatable fields: Program Description, Challenges Faced, Additional Notes
- Validation: Cross-field validation for family/children ratios

#### Prevention Programs (prevention_user / password123)  
- Quarterly reporting forms
- Translatable fields: Workshop Topics, Participant Feedback Summary
- Validation: Total participants must equal sum of adult + child participants

#### Schools Program (schools_user / password123)
- Monthly reporting forms
- Standard numeric fields for schools visited, students reached, teachers trained

### 4. Data Entry Workflow

1. **Login**: Use department-specific credentials
2. **Language Selection**: Choose interface language (top-right dropdown)
3. **Form Selection**: Select appropriate form for your department
4. **Data Entry**: 
   - Enter data in your preferred language
   - Translatable fields show both original and English translation
   - Auto-translation happens as you type
5. **Review**: Check translation accuracy and edit if needed
6. **Save/Submit**: Save as draft or submit final form

### 5. Translation Technology

#### Fallback System
- **Primary**: Google Translate API (if configured with REACT_APP_GOOGLE_TRANSLATE_API_KEY)
- **Fallback**: Built-in dictionary for common terms
- **Cache**: Translations are cached locally to improve performance

#### Language Detection
- Automatic detection based on character sets:
  - Khmer: Unicode range `\u1780-\u17FF`
  - Nepali: Unicode range `\u0900-\u097F`  
  - English: Latin characters

### 6. Validation & Quality Control

#### Translation Validation
- Confidence scoring (0-100%)
- Length comparison warnings
- Manual edit tracking
- Untranslated text detection

#### Form Validation
- Required field validation
- Cross-field validation (e.g., totals must add up)
- Duplicate submission prevention
- Department-specific validation rules

### 7. Data Storage

#### Form Submissions
```typescript
interface FormSubmission {
  id: string
  formId: string
  userId: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  data: Record<string, any>              // Original data
  translatedData?: Record<string, TranslatedText>  // Translations
  primaryLanguage: string                // User's input language
  createdAt: Date
  updatedAt: Date
  submittedAt?: Date
  version: number
}
```

#### Translation Data
```typescript
interface TranslatedText {
  original: string          // Original text in user's language
  translated: string        // English translation
  originalLanguage: string  // Source language code
  translatedLanguage: string // Target language code  
  confidence: number        // Translation confidence (0-1)
  isUserEdited?: boolean    // Whether user manually edited
}
```

### 8. Demo Accounts

| Department | Username | Password | Forms Available |
|------------|----------|----------|----------------|
| Safe Homes | safe_homes_user | password123 | Monthly reports |
| Prevention | prevention_user | password123 | Quarterly reports |
| Schools | schools_user | password123 | Monthly reports |
| Outreach | outreach_user | password123 | Various forms |
| Admin | admin_user | password123 | All forms |

### 9. Configuration

#### Environment Variables
```bash
# Optional: For enhanced translation quality
REACT_APP_GOOGLE_TRANSLATE_API_KEY=your_api_key_here
```

#### Language Support
- Default interface language can be set in browser preferences
- User language preference is stored locally
- Form language is selected per submission

### 10. Benefits for HQ Reporting

1. **Standardization**: All data is available in English for consistent reporting
2. **Accuracy**: Original text is preserved alongside translations
3. **Context**: Staff can provide clarification in their native language
4. **Validation**: Automatic checks ensure data quality before submission
5. **Audit Trail**: Complete history of edits and translations

## Technical Implementation

### Translation Service Architecture
- `TranslationService`: Core translation functionality
- `MultilingualFormService`: Form-specific translation logic
- `ValidationService`: Enhanced validation with multilingual support
- `FormService`: Updated to handle multilingual submissions

### UI Components
- `MultilingualFormEditor`: Main form editing interface with side-by-side translation
- `LanguageSelectorHeader`: Interface language selection and user info
- `LoginForm`: Department-based authentication

### Error Handling
- Graceful fallback when translation services are unavailable
- User-friendly error messages in selected interface language
- Retry mechanisms for failed translations
- Offline capability with cached translations

This system ensures that staff can work comfortably in their native language while providing HQ with standardized English reports, maintaining data integrity and cultural context throughout the process.
