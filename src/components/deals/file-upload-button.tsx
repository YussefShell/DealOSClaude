'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FileUploadButtonProps {
  dealId: string
  folderId?: string
}

export function FileUploadButton({ dealId, folderId }: FileUploadButtonProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('dealId', dealId)
        if (folderId) {
          formData.append('folderId', folderId)
        }

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }
      }

      router.refresh()
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload files. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        <Upload className="mr-2 h-4 w-4" />
        {uploading ? 'Uploading...' : 'Upload Files'}
      </Button>
    </>
  )
}
