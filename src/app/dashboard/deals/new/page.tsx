'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const dealTypes = [
  { value: 'ACQUISITION', label: 'Acquisition' },
  { value: 'MERGER', label: 'Merger' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'JOINT_VENTURE', label: 'Joint Venture' },
  { value: 'ASSET_SALE', label: 'Asset Sale' },
  { value: 'OTHER', label: 'Other' },
]

export default function NewDealPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    targetCompany: '',
    dealType: 'ACQUISITION',
    estimatedCloseDate: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          estimatedCloseDate: formData.estimatedCloseDate || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create deal')
        return
      }

      router.push(`/dashboard/deals/${data.id}`)
      router.refresh()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Deal Room</CardTitle>
          <CardDescription>
            Set up a secure virtual data room for your M&A transaction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Deal Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Project Phoenix"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetCompany">Target Company *</Label>
              <Input
                id="targetCompany"
                name="targetCompany"
                placeholder="e.g., Acme Corp"
                value={formData.targetCompany}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dealType">Deal Type *</Label>
              <select
                id="dealType"
                name="dealType"
                value={formData.dealType}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                {dealTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedCloseDate">Estimated Close Date</Label>
              <Input
                id="estimatedCloseDate"
                name="estimatedCloseDate"
                type="date"
                value={formData.estimatedCloseDate}
                onChange={handleChange}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Creating...' : 'Create Deal Room'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
