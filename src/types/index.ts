import { User, Deal, Document, Organization, DealParticipant, Folder } from '@prisma/client'

export type UserWithRelations = User & {
  organizationMemberships?: Array<{
    organization: Organization
  }>
}

export type DealWithRelations = Deal & {
  organization: Organization
  createdBy: User
  participants: DealParticipant[]
  _count?: {
    documents: number
    participants: number
  }
}

export type DocumentWithRelations = Document & {
  folder?: Folder | null
  uploadedBy: User
  _count?: {
    activity: number
  }
}

export interface CreateDealInput {
  name: string
  targetCompany: string
  dealType: string
  estimatedCloseDate?: Date
}

export interface CreateFolderInput {
  dealId: string
  name: string
  parentFolderId?: string
}

export interface UploadDocumentInput {
  dealId: string
  folderId?: string
  filename: string
  fileSize: number
  fileType: string
  mimeType: string
  s3Key: string
  s3Bucket: string
  checksum: string
}

export interface DealAnalytics {
  totalViews: number
  totalDownloads: number
  activeUsers: number
  recentActivity: Array<{
    user: User
    action: string
    document: Document
    createdAt: Date
  }>
}
