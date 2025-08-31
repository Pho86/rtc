import React, { useState, useCallback, useRef } from 'react'
import { Button } from './ui/button'
import { photoSafetyService } from '../services/PhotoSafetyService'

interface PhotoUploadProps {
  onPhotosUploaded: (photos: PhotoWithMetadata[]) => void
  maxPhotos?: number
  allowedAudiences: Array<'internal' | 'CRA' | 'donors' | 'community'>
  description?: string
}

export interface PhotoWithMetadata {
  id: string
  file: File
  preview: string
  safetyStatus: {
    internal: boolean
    CRA: boolean
    donors: boolean
    community: boolean
  }
  approvals: {
    audience: string
    approved: boolean
    approvedBy: string
    approvedAt: string
  }[]
  metadata: {
    capturedAt: string
    location?: string
    description?: string
    consentObtained: boolean
    containsMinors: boolean
    containsPersonalInfo: boolean
  }
}

export function PhotoUpload({ 
  onPhotosUploaded, 
  maxPhotos = 5, 
  allowedAudiences,
  description = "Upload photos to support your submission"
}: PhotoUploadProps) {
  const [photos, setPhotos] = useState<PhotoWithMetadata[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (files: FileList) => {
    if (files.length === 0) return

    setUploading(true)
    const newPhotos: PhotoWithMetadata[] = []

    for (let i = 0; i < Math.min(files.length, maxPhotos - photos.length); i++) {
      const file = files[i]
      
      if (!file.type.startsWith('image/')) {
        continue
      }

      // Create preview
      const preview = URL.createObjectURL(file)
      
      // Generate unique ID
      const photoId = `photo_${Date.now()}_${i}`

      // Analyze photo safety for each audience
      const safetyStatus = {
        internal: true, // Internal is always safe
        CRA: false,
        donors: false,
        community: false
      }

      // Check safety for each allowed audience
      for (const audience of allowedAudiences) {
        if (audience !== 'internal') {
          const safetyCheck = photoSafetyService.isPhotoSafeForAudience(photoId, audience)
          safetyStatus[audience] = safetyCheck.safe
        }
      }

      // Create metadata
      const metadata = {
        capturedAt: new Date().toISOString(),
        description: '',
        consentObtained: false,
        containsMinors: false,
        containsPersonalInfo: false
      }

      const photoWithMetadata: PhotoWithMetadata = {
        id: photoId,
        file,
        preview,
        safetyStatus,
        approvals: [],
        metadata
      }

      newPhotos.push(photoWithMetadata)
    }

    const updatedPhotos = [...photos, ...newPhotos]
    setPhotos(updatedPhotos)
    onPhotosUploaded(updatedPhotos)
    setUploading(false)
  }, [photos, maxPhotos, allowedAudiences, onPhotosUploaded])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  const removePhoto = useCallback((photoId: string) => {
    const updatedPhotos = photos.filter(photo => {
      if (photo.id === photoId) {
        URL.revokeObjectURL(photo.preview)
        return false
      }
      return true
    })
    setPhotos(updatedPhotos)
    onPhotosUploaded(updatedPhotos)
  }, [photos, onPhotosUploaded])

  const updatePhotoMetadata = useCallback((photoId: string, metadata: Partial<PhotoWithMetadata['metadata']>) => {
    const updatedPhotos = photos.map(photo => 
      photo.id === photoId 
        ? { ...photo, metadata: { ...photo.metadata, ...metadata } }
        : photo
    )
    setPhotos(updatedPhotos)
    onPhotosUploaded(updatedPhotos)
  }, [photos, onPhotosUploaded])

  const approvePhotoForAudience = useCallback((photoId: string, audience: string) => {
    const updatedPhotos = photos.map(photo => {
      if (photo.id === photoId) {
        const approval = {
          audience,
          approved: true,
          approvedBy: 'current_user', // In real app, this would be the logged-in user
          approvedAt: new Date().toISOString()
        }

        return {
          ...photo,
          approvals: [...photo.approvals.filter(a => a.audience !== audience), approval]
        }
      }
      return photo
    })
    
    setPhotos(updatedPhotos)
    onPhotosUploaded(updatedPhotos)
  }, [photos, onPhotosUploaded])

  const getSafetyIcon = (safe: boolean) => {
    return safe ? '✅' : '⚠️'
  }

  const getSafetyText = (safe: boolean) => {
    return safe ? 'Safe' : 'Needs Review'
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-2">
        {description}
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="space-y-2">
          <div className="text-2xl">📸</div>
          <div className="text-sm text-gray-600">
            {uploading 
              ? 'Processing photos...' 
              : `Drop photos here or click to select (${photos.length}/${maxPhotos})`
            }
          </div>
          {photos.length < maxPhotos && (
            <Button variant="outline" size="sm" disabled={uploading}>
              {uploading ? 'Processing...' : 'Choose Files'}
            </Button>
          )}
        </div>
      </div>

      {/* Photo Previews */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Uploaded Photos</h4>
          
          {photos.map((photo) => (
            <div key={photo.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex gap-4">
                {/* Photo Preview */}
                <div className="flex-shrink-0">
                  <img 
                    src={photo.preview} 
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded border"
                  />
                </div>

                {/* Photo Details */}
                <div className="flex-grow space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">{photo.file.name}</div>
                      <div className="text-xs text-gray-500">
                        {(photo.file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePhoto(photo.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>

                  {/* Safety Status for Each Audience */}
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Audience Safety Status:</div>
                    {allowedAudiences.map(audience => (
                      <div key={audience} className="flex items-center justify-between text-xs">
                        <span className="capitalize">{audience}:</span>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            {getSafetyIcon(photo.safetyStatus[audience])}
                            {getSafetyText(photo.safetyStatus[audience])}
                          </span>
                          {!photo.safetyStatus[audience] && audience !== 'internal' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approvePhotoForAudience(photo.id, audience)}
                              className="text-xs py-1 px-2"
                            >
                              Manual Approve
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Photo Metadata Form */}
              <div className="border-t pt-3 space-y-2">
                <div className="text-sm font-medium">Photo Information:</div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Description</label>
                    <input
                      type="text"
                      value={photo.metadata.description || ''}
                      onChange={(e) => updatePhotoMetadata(photo.id, { description: e.target.value })}
                      placeholder="Brief description of the photo"
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Location (optional)</label>
                    <input
                      type="text"
                      value={photo.metadata.location || ''}
                      onChange={(e) => updatePhotoMetadata(photo.id, { location: e.target.value })}
                      placeholder="Where was this taken?"
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`consent-${photo.id}`}
                      checked={photo.metadata.consentObtained}
                      onChange={(e) => updatePhotoMetadata(photo.id, { consentObtained: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor={`consent-${photo.id}`} className="text-sm">
                      Consent obtained from all individuals in photo
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`minors-${photo.id}`}
                      checked={photo.metadata.containsMinors}
                      onChange={(e) => updatePhotoMetadata(photo.id, { containsMinors: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor={`minors-${photo.id}`} className="text-sm">
                      Photo contains minors (under 18)
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`personal-${photo.id}`}
                      checked={photo.metadata.containsPersonalInfo}
                      onChange={(e) => updatePhotoMetadata(photo.id, { containsPersonalInfo: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor={`personal-${photo.id}`} className="text-sm">
                      Photo contains personal/identifying information
                    </label>
                  </div>
                </div>
              </div>

              {/* Approval Status */}
              {photo.approvals.length > 0 && (
                <div className="border-t pt-2">
                  <div className="text-sm font-medium mb-1">Manual Approvals:</div>
                  {photo.approvals.map((approval, index) => (
                    <div key={index} className="text-xs text-green-600">
                      ✓ Approved for {approval.audience} by {approval.approvedBy} 
                      on {new Date(approval.approvedAt).toLocaleDateString()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Usage Guidelines */}
      {photos.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm font-medium text-blue-800 mb-1">Photo Usage Guidelines:</div>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Photos marked "Needs Review" require manual approval before external use</li>
            <li>• Always ensure consent is obtained from individuals in photos</li>
            <li>• Photos with minors have additional restrictions for donor/community use</li>
            <li>• Internal use photos have fewer restrictions than external communications</li>
          </ul>
        </div>
      )}
    </div>
  )
}
