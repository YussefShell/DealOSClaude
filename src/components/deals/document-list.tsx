'use client'

import { Folder, Document, User } from '@prisma/client'
import { FileText, Download, Eye, Folder as FolderIcon } from 'lucide-react'
import { formatBytes, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface DocumentListProps {
  folders: (Folder & {
    documents: (Document & {
      uploadedBy: User
    })[]
  })[]
  dealId: string
  isOwner: boolean
}

export function DocumentList({ folders, dealId, isOwner }: DocumentListProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(folders.map((f) => f.id))
  )

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  const handleDownload = async (documentId: string, filename: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  if (folders.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No folders created yet
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {folders.map((folder) => (
        <div key={folder.id} className="rounded-lg border">
          <button
            onClick={() => toggleFolder(folder.id)}
            className="flex w-full items-center gap-3 p-4 text-left hover:bg-accent"
          >
            <FolderIcon className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <h3 className="font-medium">{folder.name}</h3>
              <p className="text-sm text-muted-foreground">
                {folder.documents.length} document
                {folder.documents.length !== 1 ? 's' : ''}
              </p>
            </div>
          </button>

          {expandedFolders.has(folder.id) && (
            <div className="border-t">
              {folder.documents.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No documents in this folder
                </div>
              ) : (
                <div className="divide-y">
                  {folder.documents.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center gap-4 p-4 hover:bg-accent"
                    >
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {document.originalFilename}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{formatBytes(Number(document.fileSize))}</span>
                          <span>•</span>
                          <span>{document.uploadedBy.name}</span>
                          <span>•</span>
                          <span>{formatDateTime(document.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(`/documents/${document.id}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(document.id, document.originalFilename)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
