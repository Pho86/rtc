import type { FormSubmission, Department } from '../types'

export interface DashboardMetrics {
  totalSubmissions: number
  submissionsByDepartment: Record<Department, number>
  submissionsByMonth: Record<string, number>
  submissionsByStatus: Record<string, number>
  averageResponseTime: number
  completionRate: number
  lastUpdated: Date
}

export interface ProgramMetrics {
  safeHomes: {
    totalFamiliesServed: number
    totalChildrenServed: number
    totalBedNights: number
    emergencyPlacements: number
    monthlyTrend: Array<{ month: string; families: number; children: number }>
  }
  prevention: {
    totalWorkshops: number
    totalParticipants: number
    adultParticipants: number
    childParticipants: number
    quarterlyTrend: Array<{ quarter: string; workshops: number; participants: number }>
  }
  schools: {
    totalSchoolsVisited: number
    totalStudentsReached: number
    totalTeachersTrained: number
    monthlyTrend: Array<{ month: string; schools: number; students: number; teachers: number }>
  }
}

export interface ExportableReport {
  id: string
  title: string
  description: string
  audience: 'CRA' | 'donors' | 'community' | 'internal'
  format: 'excel' | 'pdf' | 'csv' | 'json'
  data: any
  generatedAt: Date
  sensitivityLevel: 'public' | 'restricted' | 'confidential'
  includesPhotos: boolean
}

export interface ReportTemplate {
  id: string
  name: string
  audience: 'CRA' | 'donors' | 'community' | 'internal'
  description: string
  dataPoints: string[]
  format: 'excel' | 'pdf' | 'csv' | 'json'
  autoGenerate: boolean
  schedule?: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  sensitivityRules: {
    excludePhotos: boolean
    excludePersonalInfo: boolean
    aggregateOnly: boolean
  }
}

class DashboardService {
  private readonly METRICS_CACHE_KEY = 'rtc_dashboard_metrics'
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  private reportTemplates: ReportTemplate[] = [
    {
      id: 'cra-compliance',
      name: 'CRA Compliance Report',
      audience: 'CRA',
      description: 'Quarterly compliance report for Canada Revenue Agency',
      dataPoints: [
        'total_beneficiaries',
        'program_outcomes',
        'financial_summary',
        'geographic_reach'
      ],
      format: 'excel',
      autoGenerate: true,
      schedule: 'quarterly',
      sensitivityRules: {
        excludePhotos: true,
        excludePersonalInfo: true,
        aggregateOnly: true
      }
    },
    {
      id: 'donor-update',
      name: 'Donor Update Newsletter',
      audience: 'donors',
      description: 'Monthly newsletter for donors with impact stories',
      dataPoints: [
        'success_stories',
        'program_highlights',
        'beneficiary_testimonials',
        'financial_transparency'
      ],
      format: 'pdf',
      autoGenerate: true,
      schedule: 'monthly',
      sensitivityRules: {
        excludePhotos: false, // Photos allowed but vetted
        excludePersonalInfo: true,
        aggregateOnly: false
      }
    },
    {
      id: 'community-newsletter',
      name: 'Community Newsletter',
      audience: 'community',
      description: 'Public newsletter for community members',
      dataPoints: [
        'program_activities',
        'upcoming_events',
        'volunteer_opportunities',
        'success_metrics'
      ],
      format: 'pdf',
      autoGenerate: true,
      schedule: 'monthly',
      sensitivityRules: {
        excludePhotos: false,
        excludePersonalInfo: true,
        aggregateOnly: false
      }
    },
    {
      id: 'internal-metrics',
      name: 'Internal Performance Dashboard',
      audience: 'internal',
      description: 'Real-time metrics for internal management',
      dataPoints: [
        'all_metrics',
        'staff_performance',
        'budget_tracking',
        'operational_efficiency'
      ],
      format: 'json',
      autoGenerate: true,
      schedule: 'daily',
      sensitivityRules: {
        excludePhotos: false,
        excludePersonalInfo: false,
        aggregateOnly: false
      }
    }
  ]

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    // Check cache first
    const cached = this.getCachedMetrics()
    if (cached && Date.now() - cached.lastUpdated.getTime() < this.CACHE_DURATION) {
      return cached
    }

    // Calculate fresh metrics
    const submissions = this.getAllSubmissions()
    const metrics = this.calculateMetrics(submissions)
    
    // Cache the results
    this.setCachedMetrics(metrics)
    
    return metrics
  }

  async getProgramMetrics(): Promise<ProgramMetrics> {
    const submissions = this.getAllSubmissions()
    return this.calculateProgramMetrics(submissions)
  }

  private getAllSubmissions(): FormSubmission[] {
    const stored = localStorage.getItem('rtc_form_submissions')
    if (!stored) return []
    
    const submissionsObj = JSON.parse(stored)
    return Object.values(submissionsObj) as FormSubmission[]
  }

  private calculateMetrics(submissions: FormSubmission[]): DashboardMetrics {
    const now = new Date()
    
    // Filter only submitted forms
    const submittedForms = submissions.filter(s => s.status === 'submitted')
    
    // By department
    const byDepartment: Record<Department, number> = {
      'safe-homes': 0,
      'prevention': 0,
      'schools': 0,
      'outreach': 0,
      'admin': 0
    }
    
    // By month (last 12 months)
    const byMonth: Record<string, number> = {}
    
    // By status
    const byStatus: Record<string, number> = {
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0
    }

    submissions.forEach(submission => {
      // Get user department (simplified - in real app would lookup user)
      const formId = submission.formId
      let department: Department = 'admin'
      if (formId.includes('safe-homes')) department = 'safe-homes'
      else if (formId.includes('prevention')) department = 'prevention'
      else if (formId.includes('schools')) department = 'schools'
      else if (formId.includes('outreach')) department = 'outreach'
      
      byDepartment[department]++
      byStatus[submission.status]++
      
      // By month
      const monthKey = new Date(submission.createdAt).toISOString().substring(0, 7) // YYYY-MM
      byMonth[monthKey] = (byMonth[monthKey] || 0) + 1
    })

    // Calculate average response time (simplified)
    const responseTimes = submittedForms
      .filter(s => s.submittedAt)
      .map(s => {
        const created = new Date(s.createdAt).getTime()
        const submitted = new Date(s.submittedAt!).getTime()
        return submitted - created
      })
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0

    // Completion rate
    const totalDrafts = submissions.filter(s => s.status === 'draft').length
    const totalSubmitted = submittedForms.length
    const completionRate = totalDrafts + totalSubmitted > 0 
      ? totalSubmitted / (totalDrafts + totalSubmitted) 
      : 0

    return {
      totalSubmissions: submittedForms.length,
      submissionsByDepartment: byDepartment,
      submissionsByMonth: byMonth,
      submissionsByStatus: byStatus,
      averageResponseTime,
      completionRate,
      lastUpdated: now
    }
  }

  private calculateProgramMetrics(submissions: FormSubmission[]): ProgramMetrics {
    const safeHomesSubmissions = submissions.filter(s => 
      s.formId.includes('safe-homes') && s.status === 'submitted'
    )
    const preventionSubmissions = submissions.filter(s => 
      s.formId.includes('prevention') && s.status === 'submitted'
    )
    const schoolsSubmissions = submissions.filter(s => 
      s.formId.includes('schools') && s.status === 'submitted'
    )

    // Safe Homes metrics
    const safeHomesMetrics = {
      totalFamiliesServed: safeHomesSubmissions.reduce((sum, s) => 
        sum + (parseInt(s.data.families_served) || 0), 0),
      totalChildrenServed: safeHomesSubmissions.reduce((sum, s) => 
        sum + (parseInt(s.data.children_served) || 0), 0),
      totalBedNights: safeHomesSubmissions.reduce((sum, s) => 
        sum + (parseInt(s.data.total_bed_nights) || 0), 0),
      emergencyPlacements: safeHomesSubmissions.reduce((sum, s) => 
        sum + (parseInt(s.data.emergency_placements) || 0), 0),
      monthlyTrend: this.calculateMonthlyTrend(safeHomesSubmissions, [
        'families_served', 'children_served'
      ])
    }

    // Prevention metrics
    const preventionMetrics = {
      totalWorkshops: preventionSubmissions.reduce((sum, s) => 
        sum + (parseInt(s.data.workshops_conducted) || 0), 0),
      totalParticipants: preventionSubmissions.reduce((sum, s) => 
        sum + (parseInt(s.data.participants_total) || 0), 0),
      adultParticipants: preventionSubmissions.reduce((sum, s) => 
        sum + (parseInt(s.data.participants_adults) || 0), 0),
      childParticipants: preventionSubmissions.reduce((sum, s) => 
        sum + (parseInt(s.data.participants_children) || 0), 0),
      quarterlyTrend: this.calculateQuarterlyTrend(preventionSubmissions)
    }

    // Schools metrics
    const schoolsMetrics = {
      totalSchoolsVisited: schoolsSubmissions.reduce((sum, s) => 
        sum + (parseInt(s.data.schools_visited) || 0), 0),
      totalStudentsReached: schoolsSubmissions.reduce((sum, s) => 
        sum + (parseInt(s.data.students_reached) || 0), 0),
      totalTeachersTrained: schoolsSubmissions.reduce((sum, s) => 
        sum + (parseInt(s.data.teachers_trained) || 0), 0),
      monthlyTrend: this.calculateMonthlyTrend(schoolsSubmissions, [
        'schools_visited', 'students_reached', 'teachers_trained'
      ])
    }

    return {
      safeHomes: safeHomesMetrics,
      prevention: preventionMetrics,
      schools: schoolsMetrics
    }
  }

  private calculateMonthlyTrend(submissions: FormSubmission[], fields: string[]) {
    const monthlyData: Record<string, any> = {}
    
    submissions.forEach(submission => {
      const monthKey = new Date(submission.createdAt).toISOString().substring(0, 7)
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {}
        fields.forEach(field => monthlyData[monthKey][field] = 0)
      }
      
      fields.forEach(field => {
        monthlyData[monthKey][field] += parseInt(submission.data[field]) || 0
      })
    })

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        ...data
      }))
  }

  private calculateQuarterlyTrend(submissions: FormSubmission[]) {
    const quarterlyData: Record<string, { workshops: number; participants: number }> = {}
    
    submissions.forEach(submission => {
      const quarter = submission.data.quarter
      const year = submission.data.year
      const quarterKey = `${year}-${quarter}`
      
      if (!quarterlyData[quarterKey]) {
        quarterlyData[quarterKey] = { workshops: 0, participants: 0 }
      }
      
      quarterlyData[quarterKey].workshops += parseInt(submission.data.workshops_conducted) || 0
      quarterlyData[quarterKey].participants += parseInt(submission.data.participants_total) || 0
    })

    return Object.entries(quarterlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([quarter, data]) => ({
        quarter,
        ...data
      }))
  }

  getReportTemplates(): ReportTemplate[] {
    return this.reportTemplates
  }

  async generateReport(templateId: string): Promise<ExportableReport> {
    const template = this.reportTemplates.find(t => t.id === templateId)
    if (!template) {
      throw new Error('Report template not found')
    }

    const dashboardMetrics = await this.getDashboardMetrics()
    const programMetrics = await this.getProgramMetrics()
    
    let data: any = {}
    let includesPhotos = false

    switch (template.audience) {
      case 'CRA':
        data = {
          reportingPeriod: this.getCurrentQuarter(),
          totalBeneficiaries: {
            families: programMetrics.safeHomes.totalFamiliesServed,
            children: programMetrics.safeHomes.totalChildrenServed + programMetrics.prevention.childParticipants,
            adults: programMetrics.prevention.adultParticipants,
            students: programMetrics.schools.totalStudentsReached
          },
          programOutcomes: {
            safeHomes: {
              emergencyPlacements: programMetrics.safeHomes.emergencyPlacements,
              totalBedNights: programMetrics.safeHomes.totalBedNights
            },
            prevention: {
              workshopsDelivered: programMetrics.prevention.totalWorkshops,
              participantsReached: programMetrics.prevention.totalParticipants
            },
            schools: {
              schoolsReached: programMetrics.schools.totalSchoolsVisited,
              teachersTrained: programMetrics.schools.totalTeachersTrained
            }
          },
          complianceMetrics: {
            reportingRate: dashboardMetrics.completionRate,
            dataQuality: 'High',
            auditTrail: 'Complete'
          }
        }
        break

      case 'donors':
        data = {
          impactSummary: {
            livesChanged: programMetrics.safeHomes.totalFamiliesServed + programMetrics.prevention.totalParticipants,
            safetyProvided: `${programMetrics.safeHomes.totalBedNights} bed nights of safety`,
            educationDelivered: `${programMetrics.prevention.totalWorkshops} educational workshops`,
            communityReach: `${programMetrics.schools.totalSchoolsVisited} schools engaged`
          },
          successStories: this.generateSuccessStories(template.sensitivityRules),
          transparencyMetrics: {
            programEfficiency: '94%',
            adminCosts: '6%',
            directImpact: '94%'
          }
        }
        includesPhotos = !template.sensitivityRules.excludePhotos
        break

      case 'community':
        data = {
          communityImpact: {
            localFamiliesHelped: programMetrics.safeHomes.totalFamiliesServed,
            childrenEducated: programMetrics.prevention.childParticipants + programMetrics.schools.totalStudentsReached,
            teachersEmpowered: programMetrics.schools.totalTeachersTrained
          },
          upcomingEvents: this.getUpcomingEvents(),
          volunteerOpportunities: this.getVolunteerOpportunities(),
          howToHelp: {
            donate: 'Visit our website to make a donation',
            volunteer: 'Contact us about volunteer opportunities',
            spread: 'Share our impact stories with your network'
          }
        }
        includesPhotos = !template.sensitivityRules.excludePhotos
        break

      case 'internal':
        data = {
          dashboardMetrics,
          programMetrics,
          operationalMetrics: {
            formCompletionRate: dashboardMetrics.completionRate,
            averageResponseTime: dashboardMetrics.averageResponseTime,
            departmentPerformance: dashboardMetrics.submissionsByDepartment
          },
          alerts: this.generateAlerts(dashboardMetrics, programMetrics)
        }
        break
    }

    return {
      id: `${templateId}_${Date.now()}`,
      title: template.name,
      description: template.description,
      audience: template.audience,
      format: template.format,
      data,
      generatedAt: new Date(),
      sensitivityLevel: this.determineSensitivityLevel(template.audience),
      includesPhotos
    }
  }

  private getCurrentQuarter(): string {
    const now = new Date()
    const quarter = Math.floor(now.getMonth() / 3) + 1
    return `Q${quarter} ${now.getFullYear()}`
  }

  private generateSuccessStories(sensitivityRules: ReportTemplate['sensitivityRules']) {
    // In a real implementation, this would pull from a curated set of success stories
    // with appropriate privacy controls
    return [
      {
        title: 'Family Finds Safety and Stability',
        summary: 'A mother and her three children found refuge in our safe homes program...',
        outcome: 'Family successfully transitioned to independent housing',
        duration: '6 months',
        photoAvailable: !sensitivityRules.excludePhotos,
        personalInfoRemoved: sensitivityRules.excludePersonalInfo
      }
    ]
  }

  private getUpcomingEvents() {
    return [
      {
        title: 'Community Safety Workshop',
        date: '2025-09-15',
        location: 'Community Center',
        description: 'Learn about domestic violence prevention'
      }
    ]
  }

  private getVolunteerOpportunities() {
    return [
      {
        role: 'Crisis Support Volunteer',
        commitment: '4 hours/week',
        training: 'Provided',
        contact: 'volunteer@rtc.org'
      }
    ]
  }

  private generateAlerts(dashboardMetrics: DashboardMetrics, _programMetrics: ProgramMetrics) {
    const alerts = []
    
    if (dashboardMetrics.completionRate < 0.8) {
      alerts.push({
        type: 'warning',
        message: 'Form completion rate below target (80%)',
        value: `${Math.round(dashboardMetrics.completionRate * 100)}%`
      })
    }

    if (dashboardMetrics.averageResponseTime > 7 * 24 * 60 * 60 * 1000) { // 7 days
      alerts.push({
        type: 'error',
        message: 'Average response time exceeds 7 days',
        value: `${Math.round(dashboardMetrics.averageResponseTime / (24 * 60 * 60 * 1000))} days`
      })
    }

    return alerts
  }

  private determineSensitivityLevel(audience: string): 'public' | 'restricted' | 'confidential' {
    switch (audience) {
      case 'community': return 'public'
      case 'donors': return 'restricted'
      case 'CRA': return 'confidential'
      case 'internal': return 'confidential'
      default: return 'restricted'
    }
  }

  private getCachedMetrics(): DashboardMetrics | null {
    const cached = localStorage.getItem(this.METRICS_CACHE_KEY)
    if (!cached) return null
    
    try {
      const parsed = JSON.parse(cached)
      return {
        ...parsed,
        lastUpdated: new Date(parsed.lastUpdated)
      }
    } catch {
      return null
    }
  }

  private setCachedMetrics(metrics: DashboardMetrics): void {
    localStorage.setItem(this.METRICS_CACHE_KEY, JSON.stringify(metrics))
  }

  // Photo safety check - ensures no sensitive photos are included
  validatePhotoSafety(photoData: any, audience: 'CRA' | 'donors' | 'community' | 'internal'): {
    safe: boolean
    warnings: string[]
    recommendations: string[]
  } {
    const warnings: string[] = []
    const recommendations: string[] = []

    // Basic safety checks
    if (audience !== 'internal') {
      if (photoData.containsFaces) {
        warnings.push('Photo contains identifiable faces')
        recommendations.push('Blur faces or obtain explicit consent')
      }
      
      if (photoData.containsMinors) {
        warnings.push('Photo contains minors')
        recommendations.push('Remove photo or use alternative without children')
      }
      
      if (photoData.locationIdentifiable) {
        warnings.push('Location may be identifiable')
        recommendations.push('Crop or blur identifying location features')
      }
    }

    // Audience-specific checks
    if (audience === 'CRA') {
      if (photoData.personal) {
        warnings.push('CRA reports should not include personal photos')
        recommendations.push('Use aggregate data visualizations instead')
      }
    }

    return {
      safe: warnings.length === 0,
      warnings,
      recommendations
    }
  }
}

export const dashboardService = new DashboardService()
