'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/toast'
import { MoreVertical, Trash2, UserCog } from 'lucide-react'

interface Participant {
  id: string
  role: string
  ndaSigned: boolean
  invitedAt: Date
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

interface ParticipantsListProps {
  dealId: string
  participants: Participant[]
  isOwner: boolean
  currentUserId: string
  onUpdate?: () => void
}

export function ParticipantsList({ dealId, participants, isOwner, currentUserId, onUpdate }: ParticipantsListProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const { addToast } = useToast()

  const handleRemove = async (participantId: string) => {
    if (!confirm('Are you sure you want to remove this participant?')) {
      return
    }

    setLoading(participantId)

    try {
      const response = await fetch(`/api/deals/${dealId}/participants/${participantId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        addToast({
          title: 'Error',
          description: data.error || 'Failed to remove participant',
          variant: 'destructive',
        })
        return
      }

      addToast({
        title: 'Success',
        description: 'Participant removed successfully',
      })

      onUpdate?.()
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      {participants.map((participant) => (
        <div
          key={participant.id}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-semibold text-primary">
                {participant.user.name?.[0]?.toUpperCase() || participant.user.email[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">
                {participant.user.name || participant.user.email}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {participant.user.email}
                </p>
                {!participant.ndaSigned && (
                  <Badge variant="outline" className="text-xs">
                    NDA Pending
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {participant.role.replace('_', ' ')}
            </Badge>

            {isOwner && participant.user.id !== currentUserId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={loading === participant.id}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleRemove(participant.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
