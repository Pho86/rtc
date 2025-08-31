import type { ExportableReport } from './DashboardService'
import { photoSafetyService } from './PhotoSafetyService'

export interface ExportOptions {
  format: 'excel' | 'pdf' | 'csv' | 'json'
  audience: 'CRA' | 'donors' | 'community' | 'internal'
  includePhotos: boolean
  anonymizeData: boolean
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface ExportResult {
  success: boolean
  filename: string
  downloadUrl?: string
  warnings: string[]
  photoSafetyChecks?: Array<{
    photoId: string
    safe: boolean
    warnings: string[]
  }>
}

class ExportService {
  async exportReport(report: ExportableReport, options: ExportOptions): Promise<ExportResult> {
    const warnings: string[] = []
    const photoSafetyChecks: Array<{ photoId: string; safe: boolean; warnings: string[] }> = []

    // Validate photo safety if photos are included
    if (options.includePhotos && report.includesPhotos) {
      const photoSafety = await this.validatePhotoSafety(report, options.audience)
      photoSafetyChecks.push(...photoSafety.checks)
      warnings.push(...photoSafety.warnings)
    }

    // Process data based on audience and anonymization requirements
    const processedData = this.processDataForAudience(report.data, options)

    // Generate export based on format
    let exportResult: ExportResult
    
    switch (options.format) {
      case 'excel':
        exportResult = await this.exportToExcel(processedData, report, options)
        break
      case 'pdf':
        exportResult = await this.exportToPdf(processedData, report, options)
        break
      case 'csv':
        exportResult = await this.exportToCsv(processedData, report, options)
        break
      case 'json':
        exportResult = await this.exportToJson(processedData, report, options)
        break
      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }

    return {
      ...exportResult,
      warnings: [...warnings, ...exportResult.warnings],
      photoSafetyChecks
    }
  }

  private async validatePhotoSafety(_report: ExportableReport, audience: string) {
    const warnings: string[] = []
    const checks: Array<{ photoId: string; safe: boolean; warnings: string[] }> = []

    // In a real implementation, this would scan the report data for photo references
    // For demo purposes, we'll simulate some photo safety checks
    const mockPhotoIds = ['photo_1', 'photo_2', 'photo_3']
    
    for (const photoId of mockPhotoIds) {
      const safetyCheck = photoSafetyService.isPhotoSafeForAudience(
        photoId, 
        audience as 'internal' | 'CRA' | 'donors' | 'community'
      )
      
      checks.push({
        photoId,
        safe: safetyCheck.safe,
        warnings: safetyCheck.warnings
      })

      if (!safetyCheck.safe) {
        warnings.push(`Photo ${photoId} is not safe for ${audience} audience`)
      }
    }

    return { warnings, checks }
  }

  private processDataForAudience(data: any, options: ExportOptions): any {
    const processed = JSON.parse(JSON.stringify(data)) // Deep clone

    switch (options.audience) {
      case 'CRA':
        return this.processCRAData(processed, options)
      case 'donors':
        return this.processDonorData(processed, options)
      case 'community':
        return this.processCommunityData(processed, options)
      case 'internal':
        return processed // No processing needed for internal use
      default:
        return processed
    }
  }

  private processCRAData(data: any, options: ExportOptions): any {
    // CRA reports need aggregate data only, no personal information
    if (options.anonymizeData) {
      // Remove any personal identifiers
      this.removePersonalInfo(data)
    }

    // Ensure only approved metrics are included
    const craCompliantData = {
      reportingPeriod: data.reportingPeriod,
      totalBeneficiaries: data.totalBeneficiaries,
      programOutcomes: data.programOutcomes,
      complianceMetrics: data.complianceMetrics,
      financialSummary: data.financialSummary || 'Contact finance team for detailed breakdown',
      geographicReach: data.geographicReach || 'Multiple communities served',
      disclaimer: 'This report contains aggregate data only. Individual case information is confidential.'
    }

    return craCompliantData
  }

  private processDonorData(data: any, options: ExportOptions): any {
    // Donor reports can include impact stories but must protect privacy
    if (options.anonymizeData) {
      this.removePersonalInfo(data)
      // Anonymize success stories
      if (data.successStories) {
        data.successStories.forEach((story: any) => {
          story.personalInfoRemoved = true
          delete story.names
          delete story.specificLocations
        })
      }
    }

    return {
      ...data,
      disclaimer: 'Personal information has been removed to protect participant privacy.',
      photoPolicy: 'All photos used with appropriate consent and safety measures.'
    }
  }

  private processCommunityData(data: any, options: ExportOptions): any {
    // Community reports should be accessible and inspiring
    if (options.anonymizeData) {
      this.removePersonalInfo(data)
    }

    return {
      ...data,
      disclaimer: 'Community impact data aggregated to protect individual privacy.',
      howToGetInvolved: {
        volunteer: 'Contact us about volunteer opportunities',
        donate: 'Visit our website to support our programs',
        participate: 'Join our community workshops and events'
      }
    }
  }

  private removePersonalInfo(data: any): void {
    // Recursively remove personal information
    if (typeof data === 'object' && data !== null) {
      // Remove common personal data fields
      const personalFields = ['name', 'address', 'phone', 'email', 'personalId', 'ssn']
      personalFields.forEach(field => {
        if (data[field]) {
          delete data[field]
        }
      })

      // Recursively process nested objects and arrays
      Object.keys(data).forEach(key => {
        if (Array.isArray(data[key])) {
          data[key].forEach((item: any) => this.removePersonalInfo(item))
        } else if (typeof data[key] === 'object') {
          this.removePersonalInfo(data[key])
        }
      })
    }
  }

  private async exportToExcel(_data: any, report: ExportableReport, options: ExportOptions): Promise<ExportResult> {
    // In a real implementation, this would use libraries like SheetJS or ExcelJS
    const warnings: string[] = []
    
    if (options.includePhotos) {
      warnings.push('Photos cannot be embedded in CSV export - consider PDF format')
    }

    const filename = `${report.title}_${new Date().toISOString().split('T')[0]}.xlsx`
    
    // Simulate Excel generation
    return {
      success: true,
      filename,
      warnings,
      downloadUrl: '#' // In real app, this would be a blob URL or download endpoint
    }
  }

  private async exportToPdf(_data: any, report: ExportableReport, options: ExportOptions): Promise<ExportResult> {
    // In a real implementation, this would use libraries like jsPDF or Puppeteer
    const warnings: string[] = []
    
    if (options.includePhotos && !this.arePhotosApprovedForAudience(options.audience)) {
      warnings.push('Some photos may not be approved for this audience - please review manually')
    }

    const filename = `${report.title}_${new Date().toISOString().split('T')[0]}.pdf`
    
    // Simulate PDF generation
    return {
      success: true,
      filename,
      warnings,
      downloadUrl: '#' // In real app, this would be a blob URL
    }
  }

  private async exportToCsv(data: any, report: ExportableReport, _options: ExportOptions): Promise<ExportResult> {
    const warnings: string[] = []
    
    // Convert data to CSV format
    const csvContent = this.convertToCSV(data)
    const filename = `${report.title}_${new Date().toISOString().split('T')[0]}.csv`
    
    // Create downloadable blob
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const downloadUrl = URL.createObjectURL(blob)
    
    warnings.push('Photos and complex formatting not supported in CSV format')
    
    return {
      success: true,
      filename,
      warnings,
      downloadUrl
    }
  }

  private async exportToJson(data: any, report: ExportableReport, _options: ExportOptions): Promise<ExportResult> {
    const warnings: string[] = []
    
    const jsonContent = JSON.stringify({
      report: {
        id: report.id,
        title: report.title,
        generatedAt: report.generatedAt,
        audience: report.audience,
        sensitivityLevel: report.sensitivityLevel
      },
      data
    }, null, 2)
    
    const filename = `${report.title}_${new Date().toISOString().split('T')[0]}.json`
    
    // Create downloadable blob
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const downloadUrl = URL.createObjectURL(blob)
    
    return {
      success: true,
      filename,
      warnings,
      downloadUrl
    }
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - flatten nested objects
    const rows: string[][] = []
    
    // Flatten the data structure
    const flatData = this.flattenObject(data)
    
    // Create header row
    const headers = Object.keys(flatData)
    rows.push(headers)
    
    // Create data row
    const values = headers.map(header => String(flatData[header] || ''))
    rows.push(values)
    
    // Convert to CSV string
    return rows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n')
  }

  private flattenObject(obj: any, prefix = ''): Record<string, any> {
    const flattened: Record<string, any> = {}
    
    Object.keys(obj).forEach(key => {
      const newKey = prefix ? `${prefix}.${key}` : key
      
      if (obj[key] === null || obj[key] === undefined) {
        flattened[newKey] = ''
      } else if (Array.isArray(obj[key])) {
        flattened[newKey] = obj[key].join('; ')
      } else if (typeof obj[key] === 'object') {
        Object.assign(flattened, this.flattenObject(obj[key], newKey))
      } else {
        flattened[newKey] = obj[key]
      }
    })
    
    return flattened
  }

  private arePhotosApprovedForAudience(audience: string): boolean {
    // In a real implementation, this would check actual photo approvals
    // For demo, we'll simulate based on audience type
    return audience === 'internal' || audience === 'community'
  }

  // Get export format recommendations based on audience
  getRecommendedFormats(audience: 'CRA' | 'donors' | 'community' | 'internal'): Array<{
    format: 'excel' | 'pdf' | 'csv' | 'json'
    recommended: boolean
    reason: string
  }> {
    const recommendations = {
      CRA: [
        { format: 'excel' as const, recommended: true, reason: 'Structured data format preferred for compliance' },
        { format: 'pdf' as const, recommended: true, reason: 'Official document format' },
        { format: 'csv' as const, recommended: false, reason: 'Limited formatting options' },
        { format: 'json' as const, recommended: false, reason: 'Technical format not suitable for CRA' }
      ],
      donors: [
        { format: 'pdf' as const, recommended: true, reason: 'Professional presentation with photos' },
        { format: 'excel' as const, recommended: false, reason: 'Less visual impact for donor communications' },
        { format: 'csv' as const, recommended: false, reason: 'Too technical for donor updates' },
        { format: 'json' as const, recommended: false, reason: 'Technical format not suitable for donors' }
      ],
      community: [
        { format: 'pdf' as const, recommended: true, reason: 'Easy to read and share in community' },
        { format: 'excel' as const, recommended: false, reason: 'May not be accessible to all community members' },
        { format: 'csv' as const, recommended: false, reason: 'Too technical for general community' },
        { format: 'json' as const, recommended: false, reason: 'Technical format not suitable for community' }
      ],
      internal: [
        { format: 'excel' as const, recommended: true, reason: 'Best for data analysis and manipulation' },
        { format: 'json' as const, recommended: true, reason: 'Programmatic access and integration' },
        { format: 'pdf' as const, recommended: false, reason: 'Less useful for internal data analysis' },
        { format: 'csv' as const, recommended: true, reason: 'Simple data export for analysis tools' }
      ]
    }

    return recommendations[audience]
  }
}

export const exportService = new ExportService()
