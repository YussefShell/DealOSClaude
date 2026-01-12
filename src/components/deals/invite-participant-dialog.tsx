'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { UserPlus } from 'lucide-react'

interface InviteParticipantDialogProps {
  dealId: string
  onSuccess?: () => void
}

export function InviteParticipantDialog({ dealId, onSuccess }: InviteParticipantDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('BUYER')
  const { addToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/deals/${dealId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })

      const data = await response.json()

      if (!response.ok) {
        addToast({
          title: 'Error',
          description: data.error || 'Failed to invite participant',
          variant: 'destructive',
        })
        return
      }

      addToast({
        title: 'Success',
        description: `Invited ${email} to the deal`,
      })

      setEmail('')
      setRole('BUYER')
      setOpen(false)
      onSuccess?.()
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Participant
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite Participant</DialogTitle>
            <DialogDescription>
              Add a new participant to this deal room. They will receive access based on their assigned role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="participant@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="BUYER">Buyer</option>
                <option value="SELLER_TEAM">Seller Team</option>
                <option value="ADVISOR">Advisor</option>
                <option value="VIEW_ONLY">View Only</option>
                <option value="DEAL_OWNER">Deal Owner</option>
              </Select>
              <p className="text-xs text-muted-foreground">
                {role === 'BUYER' && 'Can view documents, ask questions, and download files'}
                {role === 'SELLER_TEAM' && 'Can upload documents, answer questions, and manage content'}
                {role === 'ADVISOR' && 'Can view documents and provide advice'}
                {role === 'VIEW_ONLY' && 'Can only view documents, no downloads'}
                {role === 'DEAL_OWNER' && 'Full access to manage deal and participants'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Inviting...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
