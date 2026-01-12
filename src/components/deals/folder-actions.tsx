'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/toast'
import { MoreVertical, Trash2, Edit } from 'lucide-react'

interface FolderActionsProps {
  folderId: string
  folderName: string
  onUpdate?: () => void
}

export function FolderActions({ folderId, folderName, onUpdate }: FolderActionsProps) {
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the folder "${folderName}"? This action cannot be undone.`)) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        addToast({
          title: 'Error',
          description: data.error || 'Failed to delete folder',
          variant: 'destructive',
        })
        return
      }

      addToast({
        title: 'Success',
        description: 'Folder deleted successfully',
      })

      onUpdate?.()
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={loading}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Folder Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Folder
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
