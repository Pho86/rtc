import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { dashboardService } from '../services/DashboardService'
import type { DashboardMetrics, ProgramMetrics, ExportableReport, ReportTemplate } from '../services/DashboardService'

export function RealTimeDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [programMetrics, setProgramMetrics] = useState<ProgramMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    loadDashboardData()
    
    // Auto-refresh every 5 minutes if enabled
    const interval = autoRefresh ? setInterval(() => {
      loadDashboardData()
    }, 5 * 60 * 1000) : null

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const [dashboardData, programData] = await Promise.all([
        dashboardService.getDashboardMetrics(),
        dashboardService.getProgramMetrics()
      ])
      
      setMetrics(dashboardData)
      setProgramMetrics(programData)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDuration = (ms: number): string => {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000))
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h`
  }

  if (isLoading && !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-300 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Real-Time Dashboard</h1>
            <p className="text-sm text-gray-600">
              Last updated: {lastRefresh.toLocaleString()}
              {autoRefresh && <span className="ml-2 text-green-600">• Auto-refresh enabled</span>}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-3 py-2"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'text-green-600' : 'text-gray-600'}
            >
              {autoRefresh ? '⟲ Auto-refresh' : '⏸ Manual'}
            </Button>
            
            <Button onClick={loadDashboardData} disabled={isLoading}>
              {isLoading ? 'Refreshing...' : 'Refresh Now'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(metrics?.totalSubmissions || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round((metrics?.completionRate || 0) * 100)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(metrics?.averageResponseTime || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Lives Impacted</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(
                    (programMetrics?.safeHomes.totalFamiliesServed || 0) +
                    (programMetrics?.prevention.totalParticipants || 0) +
                    (programMetrics?.schools.totalStudentsReached || 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Program Metrics */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Program Impact</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Safe Homes */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Safe Homes Program</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <p className="text-2xl font-bold text-blue-600">
                      {programMetrics?.safeHomes.totalFamiliesServed || 0}
                    </p>
                    <p className="text-xs text-gray-600">Families Served</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatNumber(programMetrics?.safeHomes.totalBedNights || 0)}
                    </p>
                    <p className="text-xs text-gray-600">Bed Nights</p>
                  </div>
                </div>
              </div>

              {/* Prevention */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Prevention Program</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded">
                    <p className="text-2xl font-bold text-green-600">
                      {programMetrics?.prevention.totalWorkshops || 0}
                    </p>
                    <p className="text-xs text-gray-600">Workshops</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <p className="text-2xl font-bold text-green-600">
                      {programMetrics?.prevention.totalParticipants || 0}
                    </p>
                    <p className="text-xs text-gray-600">Participants</p>
                  </div>
                </div>
              </div>

              {/* Schools */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Schools Program</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <p className="text-2xl font-bold text-purple-600">
                      {programMetrics?.schools.totalSchoolsVisited || 0}
                    </p>
                    <p className="text-xs text-gray-600">Schools Visited</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <p className="text-2xl font-bold text-purple-600">
                      {formatNumber(programMetrics?.schools.totalStudentsReached || 0)}
                    </p>
                    <p className="text-xs text-gray-600">Students Reached</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Department Performance */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Department Performance</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(metrics?.submissionsByDepartment || {}).map(([department, count]) => {
                  const percentage = metrics?.totalSubmissions 
                    ? Math.round((count / metrics.totalSubmissions) * 100)
                    : 0
                  
                  return (
                    <div key={department}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {department.replace('-', ' ')}
                        </span>
                        <span className="text-sm text-gray-600">{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Exportable Reports Section */}
        <ExportableReportsSection />
      </div>
    </div>
  )
}

function ExportableReportsSection() {
  const [reports, setReports] = useState<ExportableReport[]>([])
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({})
  const [templates] = useState<ReportTemplate[]>(dashboardService.getReportTemplates())

  const generateReport = async (templateId: string) => {
    setIsGenerating(prev => ({ ...prev, [templateId]: true }))
    
    try {
      const report = await dashboardService.generateReport(templateId)
      setReports(prev => [report, ...prev.slice(0, 9)]) // Keep last 10 reports
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setIsGenerating(prev => ({ ...prev, [templateId]: false }))
    }
  }

  const downloadReport = (report: ExportableReport) => {
    const dataStr = JSON.stringify(report.data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mt-8 bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Exportable Reports</h2>
          <p className="text-sm text-gray-500">Generate reports for different audiences</p>
        </div>
      </div>
      
      <div className="p-6">
        {/* Report Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {templates.map((template) => (
            <div key={template.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">{template.name}</h3>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  template.audience === 'CRA' ? 'bg-red-100 text-red-800' :
                  template.audience === 'donors' ? 'bg-blue-100 text-blue-800' :
                  template.audience === 'community' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {template.audience}
                </span>
              </div>
              
              <p className="text-xs text-gray-600 mb-3">{template.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {template.format.toUpperCase()}
                </span>
                <Button
                  size="sm"
                  onClick={() => generateReport(template.id)}
                  disabled={isGenerating[template.id]}
                >
                  {isGenerating[template.id] ? 'Generating...' : 'Generate'}
                </Button>
              </div>
              
              {template.sensitivityRules.excludePhotos && (
                <div className="mt-2 flex items-center text-xs text-green-600">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Photo-safe
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Recent Reports */}
        {reports.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Reports</h3>
            <div className="space-y-2">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{report.title}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        report.sensitivityLevel === 'public' ? 'bg-green-100 text-green-800' :
                        report.sensitivityLevel === 'restricted' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {report.sensitivityLevel}
                      </span>
                      {report.includesPhotos && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          📷 Photos
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Generated: {report.generatedAt.toLocaleString()}
                    </p>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadReport(report)}
                  >
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RealTimeDashboard
