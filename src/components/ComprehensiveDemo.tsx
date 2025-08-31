import { useState } from 'react'
import { Button } from './ui/button'
import { MultilingualFormEditor } from './MultilingualFormEditor'
import { RealTimeDashboard } from './RealTimeDashboard'
import { exportService } from '../services/ExportService'
import { dashboardService } from '../services/DashboardService'
import type { FormDefinition, Department } from '../types'

// Demo form definition with photo support
const demoForm: FormDefinition = {
  id: 'demo-incident-report',
  title: 'Community Incident Report',
  description: 'Report community incidents with multilingual support and photo documentation',
  department: 'outreach',
  version: 1,
  fields: [
    {
      id: 'incident_date',
      label: 'Date of Incident',
      type: 'date',
      required: true,
      translatable: false
    },
    {
      id: 'incident_location',
      label: 'Location of Incident',
      type: 'text',
      required: true,
      translatable: true,
      displayBothLanguages: true
    },
    {
      id: 'incident_description',
      label: 'Detailed Description',
      type: 'textarea',
      required: true,
      translatable: true,
      displayBothLanguages: true
    },
    {
      id: 'people_involved',
      label: 'Number of People Involved',
      type: 'number',
      required: true,
      translatable: false
    },
    {
      id: 'severity_level',
      label: 'Severity Level',
      type: 'select',
      required: true,
      translatable: false,
      options: ['Low', 'Medium', 'High', 'Critical']
    },
    {
      id: 'immediate_actions',
      label: 'Immediate Actions Taken',
      type: 'textarea',
      required: false,
      translatable: true,
      displayBothLanguages: true
    },
    {
      id: 'follow_up_needed',
      label: 'Follow-up Actions Required',
      type: 'textarea',
      required: false,
      translatable: true,
      displayBothLanguages: true
    },
    {
      id: 'reporter_contact',
      label: 'Reporter Contact Information',
      type: 'email',
      required: true,
      translatable: false
    }
  ]
}

export function ComprehensiveDemo() {
  const [currentView, setCurrentView] = useState<'form' | 'dashboard' | 'export'>('form')
  const [showFormEditor, setShowFormEditor] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department>('outreach')

  const handleFormSave = () => {
    setShowFormEditor(false)
    alert('Form saved successfully! In a real application, this would redirect to the form list.')
  }

  const handleFormCancel = () => {
    setShowFormEditor(false)
  }

  const handleExportDemo = async () => {
    try {
      const report = await dashboardService.generateReport('donors')

      const exportResult = await exportService.exportReport(report, {
        format: 'pdf',
        audience: 'donors',
        includePhotos: true,
        anonymizeData: true
      })

      if (exportResult.success) {
        alert(`Export successful!\nFilename: ${exportResult.filename}\nWarnings: ${exportResult.warnings.length}\nPhoto safety checks: ${exportResult.photoSafetyChecks?.length || 0}`)
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    }
  }

  const renderNavigationTabs = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        {[
          { id: 'form', name: 'Multilingual Forms', icon: '📝' },
          { id: 'dashboard', name: 'Real-time Dashboard', icon: '📊' },
          { id: 'export', name: 'Export & Reports', icon: '📤' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentView(tab.id as any)}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentView === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </nav>
    </div>
  )

  const renderFormView = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">🌍 Multilingual Form System</h3>
        <p className="text-blue-700 text-sm mb-3">
          Create forms with automatic translation, photo upload with safety validation, 
          and department-based filtering. All submissions include consent tracking and 
          audience-appropriate content filtering.
        </p>
        <div className="flex gap-3">
          <Button 
            onClick={() => setShowFormEditor(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            🆕 Create New Incident Report
          </Button>
          <Button 
            variant="outline"
            onClick={() => alert('In a real app, this would show the forms list with filters')}
          >
            📋 View All Forms
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium mb-3">✨ Key Features</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• <strong>Auto-translation:</strong> Forms automatically translate to 15+ languages</li>
            <li>• <strong>Photo safety:</strong> Automatic validation ensures appropriate content for each audience</li>
            <li>• <strong>Draft saving:</strong> Progress saved automatically, resume anytime</li>
            <li>• <strong>Validation:</strong> Real-time form validation with helpful error messages</li>
            <li>• <strong>Consent tracking:</strong> Built-in consent management for photos and data</li>
          </ul>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium mb-3">🔒 Safety & Compliance</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• <strong>CRA compliance:</strong> Reports formatted for regulatory requirements</li>
            <li>• <strong>Photo protection:</strong> Sensitive photos (children) never sent to donors</li>
            <li>• <strong>Data anonymization:</strong> Personal info automatically removed from public reports</li>
            <li>• <strong>Audience filtering:</strong> Content automatically filtered based on recipient</li>
            <li>• <strong>Manual overrides:</strong> Staff can manually approve content when needed</li>
          </ul>
        </div>
      </div>

      {showFormEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <MultilingualFormEditor
              form={demoForm}
              draft={null}
              onSave={handleFormSave}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}
    </div>
  )

  const renderDashboardView = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-900 mb-2">📊 Real-time Analytics Dashboard</h3>
        <p className="text-green-700 text-sm mb-3">
          Monitor submission trends, track completion rates, and generate reports for different 
          audiences. All metrics update in real-time as new forms are submitted.
        </p>
      </div>

      <RealTimeDashboard />
    </div>
  )

  const renderExportView = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-medium text-purple-900 mb-2">📤 Smart Export System</h3>
        <p className="text-purple-700 text-sm mb-3">
          Generate audience-specific reports with automatic content filtering, photo safety validation, 
          and compliance formatting. Export to multiple formats with built-in safety checks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium mb-3">🎯 Audience-Specific Reports</h4>
          <div className="space-y-3">
            <div className="border-l-4 border-blue-500 pl-3">
              <strong className="text-blue-700">CRA Reports:</strong>
              <p className="text-sm text-gray-600">Aggregate data only, no personal information, compliance-focused metrics</p>
            </div>
            <div className="border-l-4 border-green-500 pl-3">
              <strong className="text-green-700">Donor Updates:</strong>
              <p className="text-sm text-gray-600">Impact stories with anonymized data, safe photos only, engaging format</p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-3">
              <strong className="text-yellow-700">Community Reports:</strong>
              <p className="text-sm text-gray-600">Accessible language, local impact focus, community-appropriate content</p>
            </div>
            <div className="border-l-4 border-gray-500 pl-3">
              <strong className="text-gray-700">Internal Reports:</strong>
              <p className="text-sm text-gray-600">Full data access, all photos, detailed analytics for staff use</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium mb-3">⚙️ Export Options</h4>
          <div className="space-y-3">
            <Button 
              onClick={handleExportDemo}
              className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
            >
              📊 Generate Sample Donor Report (PDF)
            </Button>
            <Button 
              onClick={() => alert('This would generate a CRA compliance report in Excel format')}
              variant="outline"
              className="w-full justify-start"
            >
              📈 CRA Compliance Report (Excel)
            </Button>
            <Button 
              onClick={() => alert('This would generate a community newsletter in PDF format')}
              variant="outline"
              className="w-full justify-start"
            >
              📰 Community Newsletter (PDF)
            </Button>
            <Button 
              onClick={() => alert('This would export raw data for analysis')}
              variant="outline"
              className="w-full justify-start"
            >
              💾 Raw Data Export (JSON/CSV)
            </Button>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded border">
            <h5 className="font-medium text-sm mb-2">🔍 Photo Safety Features</h5>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Automatic detection of sensitive content</li>
              <li>• Consent verification before external use</li>
              <li>• Manual approval workflow for edge cases</li>
              <li>• Audit trail for all photo decisions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🏠 Community Support System
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Comprehensive data entry with multilingual support, photo safety, and smart reporting
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Department:</div>
              <select 
                value={selectedDepartment} 
                onChange={(e) => setSelectedDepartment(e.target.value as Department)}
                className="mt-1 text-sm border-gray-300 rounded"
              >
                <option value="safe-homes">Safe Homes</option>
                <option value="prevention">Prevention</option>
                <option value="schools">Schools</option>
                <option value="outreach">Outreach</option>
                <option value="admin">Administration</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderNavigationTabs()}
        
        {currentView === 'form' && renderFormView()}
        {currentView === 'dashboard' && renderDashboardView()}
        {currentView === 'export' && renderExportView()}
      </div>
    </div>
  )
}
