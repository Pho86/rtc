export interface PhotoMetadata {
  id: string
  filename: string
  uploadedAt: Date
  uploadedBy: string
  department: string
  formSubmissionId?: string
  tags: string[]
  containsFaces: boolean
  containsMinors: boolean
  locationIdentifiable: boolean
  approved: boolean
  approvedBy?: string
  approvedAt?: Date
  restrictions: PhotoRestriction[]
}

export interface PhotoRestriction {
  type: 'no_public_use' | 'no_donor_reports' | 'internal_only' | 'consent_required'
  reason: string
  addedBy: string
  addedAt: Date
}

export interface PhotoSafetyCheck {
  safe: boolean
  warnings: string[]
  recommendations: string[]
  allowedAudiences: ('internal' | 'CRA' | 'donors' | 'community')[]
  requiresApproval: boolean
}

class PhotoSafetyService {
  private readonly PHOTO_METADATA_KEY = 'rtc_photo_metadata'
  private readonly SAFETY_RULES = {
    CRA: {
      allowFaces: false,
      allowMinors: false,
      allowPersonalInfo: false,
      requiresApproval: true
    },
    donors: {
      allowFaces: true, // with consent
      allowMinors: false,
      allowPersonalInfo: false,
      requiresApproval: true
    },
    community: {
      allowFaces: true, // with consent
      allowMinors: false,
      allowPersonalInfo: false,
      requiresApproval: true
    },
    internal: {
      allowFaces: true,
      allowMinors: true,
      allowPersonalInfo: true,
      requiresApproval: false
    }
  }

  // Analyze photo for safety concerns
  analyzePhoto(file: File, _metadata: Partial<PhotoMetadata> = {}): Promise<PhotoSafetyCheck> {
    return new Promise((resolve) => {
      // In a real implementation, this would use AI/ML services like:
      // - Azure Cognitive Services Face API
      // - AWS Rekognition
      // - Google Cloud Vision API
      
      // For demo purposes, we'll simulate analysis based on filename and metadata
      const warnings: string[] = []
      const recommendations: string[] = []
      const allowedAudiences: ('internal' | 'CRA' | 'donors' | 'community')[] = ['internal']

      // Simulate detection based on filename patterns
      const filename = file.name.toLowerCase()
      const containsFaces = filename.includes('face') || filename.includes('person') || filename.includes('child')
      const containsMinors = filename.includes('child') || filename.includes('kid') || filename.includes('student')
      const locationIdentifiable = filename.includes('school') || filename.includes('address') || filename.includes('location')

      // Check for safety issues
      if (containsFaces) {
        warnings.push('Photo appears to contain identifiable faces')
        recommendations.push('Blur faces or obtain explicit consent before sharing')
      }

      if (containsMinors) {
        warnings.push('Photo appears to contain minors')
        recommendations.push('Remove from public reports - internal use only')
      }

      if (locationIdentifiable) {
        warnings.push('Location may be identifiable in photo')
        recommendations.push('Crop or blur identifying location features')
      }

      // Determine allowed audiences based on safety analysis
      if (!containsMinors && !containsFaces) {
        allowedAudiences.push('CRA', 'donors', 'community')
      } else if (!containsMinors) {
        allowedAudiences.push('donors', 'community')
      }

      const safe = warnings.length === 0
      const requiresApproval = !safe || containsFaces || containsMinors

      setTimeout(() => {
        resolve({
          safe,
          warnings,
          recommendations,
          allowedAudiences,
          requiresApproval
        })
      }, 1000) // Simulate analysis time
    })
  }

  // Save photo metadata with safety information
  savePhotoMetadata(metadata: PhotoMetadata): void {
    const stored = this.getStoredMetadata()
    stored[metadata.id] = metadata
    localStorage.setItem(this.PHOTO_METADATA_KEY, JSON.stringify(stored))
  }

  // Get photo metadata
  getPhotoMetadata(photoId: string): PhotoMetadata | null {
    const stored = this.getStoredMetadata()
    return stored[photoId] || null
  }

  // Check if photo is safe for specific audience
  isPhotoSafeForAudience(photoId: string, audience: 'internal' | 'CRA' | 'donors' | 'community'): PhotoSafetyCheck {
    const metadata = this.getPhotoMetadata(photoId)
    if (!metadata) {
      return {
        safe: false,
        warnings: ['Photo metadata not found'],
        recommendations: ['Do not use photo until properly analyzed'],
        allowedAudiences: [],
        requiresApproval: true
      }
    }

    const rules = this.SAFETY_RULES[audience]
    const warnings: string[] = []
    const recommendations: string[] = []

    // Check face restrictions
    if (metadata.containsFaces && !rules.allowFaces) {
      warnings.push(`Photo contains faces - not allowed for ${audience} reports`)
      recommendations.push('Use a different photo or blur faces')
    }

    // Check minor restrictions
    if (metadata.containsMinors && !rules.allowMinors) {
      warnings.push(`Photo contains minors - not allowed for ${audience} reports`)
      recommendations.push('Use a different photo without children')
    }

    // Check location restrictions
    if (metadata.locationIdentifiable && audience !== 'internal') {
      warnings.push('Photo contains identifiable location information')
      recommendations.push('Crop or blur location-identifying features')
    }

    // Check approval status
    if (rules.requiresApproval && !metadata.approved) {
      warnings.push('Photo requires approval before use')
      recommendations.push('Submit photo for approval by authorized staff')
    }

    // Check specific restrictions
    const relevantRestrictions = metadata.restrictions.filter(restriction => {
      switch (restriction.type) {
        case 'no_public_use':
          return audience === 'community'
        case 'no_donor_reports':
          return audience === 'donors'
        case 'internal_only':
          return audience !== 'internal'
        case 'consent_required':
          return true
        default:
          return false
      }
    })

    relevantRestrictions.forEach(restriction => {
      warnings.push(`Restriction: ${restriction.reason}`)
      recommendations.push('Check with uploader or remove photo')
    })

    const safe = warnings.length === 0
    const allowedAudiences = Object.entries(this.SAFETY_RULES)
      .filter(([_, rules]) => this.checkAudienceCompatibility(metadata, rules))
      .map(([audience]) => audience as any)

    return {
      safe,
      warnings,
      recommendations,
      allowedAudiences,
      requiresApproval: rules.requiresApproval && !metadata.approved
    }
  }

  // Approve photo for use
  approvePhoto(photoId: string, approvedBy: string): boolean {
    const metadata = this.getPhotoMetadata(photoId)
    if (!metadata) return false

    metadata.approved = true
    metadata.approvedBy = approvedBy
    metadata.approvedAt = new Date()

    this.savePhotoMetadata(metadata)
    return true
  }

  // Add restriction to photo
  addPhotoRestriction(photoId: string, restriction: Omit<PhotoRestriction, 'addedAt'>): boolean {
    const metadata = this.getPhotoMetadata(photoId)
    if (!metadata) return false

    metadata.restrictions.push({
      ...restriction,
      addedAt: new Date()
    })

    this.savePhotoMetadata(metadata)
    return true
  }

  // Get all photos that are safe for a specific audience
  getPhotosForAudience(audience: 'internal' | 'CRA' | 'donors' | 'community'): PhotoMetadata[] {
    const stored = this.getStoredMetadata()
    return Object.values(stored).filter(photo => {
      const safetyCheck = this.isPhotoSafeForAudience(photo.id, audience)
      return safetyCheck.safe
    })
  }

  // Generate photo safety report
  generatePhotoSafetyReport(): {
    totalPhotos: number
    approvedPhotos: number
    restrictedPhotos: number
    pendingApproval: number
    safetyByAudience: Record<string, number>
    riskySituations: Array<{ photoId: string; risks: string[] }>
  } {
    const stored = this.getStoredMetadata()
    const photos = Object.values(stored)

    const totalPhotos = photos.length
    const approvedPhotos = photos.filter(p => p.approved).length
    const restrictedPhotos = photos.filter(p => p.restrictions.length > 0).length
    const pendingApproval = photos.filter(p => !p.approved && (p.containsFaces || p.containsMinors)).length

    const safetyByAudience: Record<string, number> = {}
    Object.keys(this.SAFETY_RULES).forEach(audience => {
      safetyByAudience[audience] = this.getPhotosForAudience(audience as any).length
    })

    const riskySituations = photos
      .filter(photo => photo.containsMinors || photo.containsFaces)
      .map(photo => ({
        photoId: photo.id,
        risks: [
          ...(photo.containsMinors ? ['Contains minors'] : []),
          ...(photo.containsFaces ? ['Contains identifiable faces'] : []),
          ...(photo.locationIdentifiable ? ['Location identifiable'] : []),
          ...(!photo.approved ? ['Not approved'] : [])
        ]
      }))

    return {
      totalPhotos,
      approvedPhotos,
      restrictedPhotos,
      pendingApproval,
      safetyByAudience,
      riskySituations
    }
  }

  private getStoredMetadata(): Record<string, PhotoMetadata> {
    const stored = localStorage.getItem(this.PHOTO_METADATA_KEY)
    return stored ? JSON.parse(stored) : {}
  }

  private checkAudienceCompatibility(metadata: PhotoMetadata, rules: typeof this.SAFETY_RULES.internal): boolean {
    if (metadata.containsFaces && !rules.allowFaces) return false
    if (metadata.containsMinors && !rules.allowMinors) return false
    if (rules.requiresApproval && !metadata.approved) return false
    
    // Check restrictions
    const hasBlockingRestriction = metadata.restrictions.some(restriction => {
      switch (restriction.type) {
        case 'internal_only':
          return rules !== this.SAFETY_RULES.internal
        case 'no_public_use':
          return rules === this.SAFETY_RULES.community
        case 'no_donor_reports':
          return rules === this.SAFETY_RULES.donors
        default:
          return false
      }
    })

    return !hasBlockingRestriction
  }

  // Utility function to help staff understand photo safety
  getPhotoSafetyGuidelines(): {
    dosAndDonts: { do: string[]; dont: string[] }
    approvalProcess: string[]
    audienceGuidelines: Record<string, string[]>
  } {
    return {
      dosAndDonts: {
        do: [
          'Get written consent before photographing identifiable people',
          'Blur faces when sharing with external audiences',
          'Use photos that tell your program\'s story without compromising privacy',
          'Submit photos for approval before including in public materials',
          'Focus on activities, settings, and anonymous groups when possible'
        ],
        dont: [
          'Never include photos of children\'s faces in donor or public materials',
          'Don\'t include identifying location information (addresses, signs)',
          'Avoid photos that could be used to identify program participants',
          'Don\'t share photos marked as "internal only"',
          'Never override photo restrictions without proper authorization'
        ]
      },
      approvalProcess: [
        '1. Upload photo with appropriate metadata and tags',
        '2. System automatically analyzes for faces, minors, and locations',
        '3. Review safety warnings and recommendations',
        '4. Submit for approval if required (contains faces/minors)',
        '5. Authorized staff reviews and approves/rejects with comments',
        '6. Approved photos can be used according to their safety rating'
      ],
      audienceGuidelines: {
        'CRA Reports': [
          'Use aggregate data visualizations instead of photos',
          'If photos needed, use only approved facility/program images',
          'No identifiable people or personal information',
          'Focus on infrastructure and service delivery'
        ],
        'Donor Updates': [
          'Approved photos with faces OK (with consent)',
          'No children\'s faces - use silhouettes or back views',
          'Tell impact stories through approved imagery',
          'Emphasize program outcomes and community benefit'
        ],
        'Community Materials': [
          'Public-approved photos only',
          'Follow same rules as donor materials',
          'Consider cultural sensitivities',
          'Ensure all participants consented to public use'
        ],
        'Internal Use': [
          'All approved photos available',
          'Can include sensitive materials for program improvement',
          'Still follow basic consent and ethical guidelines',
          'Maintain confidentiality of participant information'
        ]
      }
    }
  }
}

export const photoSafetyService = new PhotoSafetyService()
