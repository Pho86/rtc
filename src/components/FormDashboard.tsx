import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { authService } from '../services/AuthService'
import { formService } from '../services/FormService'
import { MultilingualFormEditor } from './MultilingualFormEditor'
import { LanguageSelectorHeader } from './LanguageSelectorHeader'
import RealTimeDashboard from './RealTimeDashboard'
import type { FormDefinition, FormSubmission } from '../types'
import type { Language } from '../services/TranslationService'

export function FormDashboard() {
  const [availableForms, setAvailableForms] = useState<FormDefinition[]>([])
  const [drafts, setDrafts] = useState<FormSubmission[]>([])
  const [selectedForm, setSelectedForm] = useState<FormDefinition | null>(null)
  const [selectedDraft, setSelectedDraft] = useState<FormSubmission | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en')

  const user = authService.getCurrentUser()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setAvailableForms(formService.getAvailableForms())
    setDrafts(formService.getUserDrafts())
  }

  const handleNewForm = (form: FormDefinition) => {
    setSelectedForm(form)
    setSelectedDraft(null)
    setShowEditor(true)
  }

  const handleEditDraft = (draft: FormSubmission) => {
    const form = formService.getFormById(draft.formId)
    if (form) {
      setSelectedForm(form)
      setSelectedDraft(draft)
      setShowEditor(true)
    }
  }

  const handleDeleteDraft = (draftId: string) => {
    if (confirm('Are you sure you want to delete this draft?')) {
      formService.deleteDraft(draftId)
      loadData()
    }
  }

  const handleFormSaved = () => {
    setShowEditor(false)
    setSelectedForm(null)
    setSelectedDraft(null)
    loadData()
  }

  const handleLogout = () => {
    authService.logout()
    window.location.reload()
  }

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language)
  }

  if (showDashboard) {
    return (
      <div>
        <LanguageSelectorHeader
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          showUserInfo={true}
          userName={user?.username}
          userDepartment={user?.department}
          onLogout={handleLogout}
        />
        <div className="p-4">
          <Button 
            variant="outline" 
            onClick={() => setShowDashboard(false)}
            className="mb-4"
          >
            ← Back to Forms
          </Button>
        </div>
        <RealTimeDashboard />
      </div>
    )
  }

  if (showEditor && selectedForm) {
    return (
      <MultilingualFormEditor
        form={selectedForm}
        draft={selectedDraft}
        onSave={handleFormSaved}
        onCancel={() => setShowEditor(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Language Selector */}
      <LanguageSelectorHeader
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        showUserInfo={true}
        userName={user?.username}
        userDepartment={user?.department}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Quick Actions */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          <div className="flex space-x-3">
            <Button
              onClick={() => setShowDashboard(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              📊 View Dashboard
            </Button>
            {authService.isAdmin() && (
              <Button
                onClick={() => setShowDashboard(true)}
                variant="outline"
              >
                📈 Analytics
              </Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Available Forms */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Available Forms</h2>
                <p className="text-sm text-gray-500">Forms available for your department</p>
              </div>
              
              <div className="p-6">
                {availableForms.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No forms available for your department
                  </p>
                ) : (
                  <div className="space-y-4">
                    {availableForms.map((form) => (
                      <div
                        key={form.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {form.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {form.description}
                            </p>
                            <div className="flex items-center mt-2 text-xs text-gray-500">
                              <span className="bg-gray-100 px-2 py-1 rounded">
                                {form.fields.length} fields
                              </span>
                              <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                v{form.version}
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleNewForm(form)}
                            className="ml-4"
                          >
                            Start Form
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Drafts */}
          <div>
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Draft Forms</h2>
                <p className="text-sm text-gray-500">Continue working on saved drafts</p>
              </div>
              
              <div className="p-6">
                {drafts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No drafts saved
                  </p>
                ) : (
                  <div className="space-y-3">
                    {drafts.map((draft) => {
                      const form = formService.getFormById(draft.formId)
                      return (
                        <div
                          key={draft.id}
                          className="border border-gray-200 rounded-lg p-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {form?.title || 'Unknown Form'}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                Last saved: {new Date(draft.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditDraft(draft)}
                              className="text-xs"
                            >
                              Continue
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteDraft(draft.id)}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
