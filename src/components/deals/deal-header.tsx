'use client'

import { Deal, Organization, User } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Settings } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface DealHeaderProps {
  deal: Deal & {
    organization: Organization
    createdBy: User
  }
  isOwner: boolean
}

export function DealHeader({ deal, isOwner }: DealHeaderProps) {
  const router = useRouter()

  return (
    <div className="mb-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/dashboard')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Deals
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{deal.name}</h1>
          <p className="mt-1 text-lg text-muted-foreground">
            {deal.targetCompany}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {deal.organization.name}
          </p>
        </div>
        {isOwner && (
          <Link href={`/dashboard/deals/${deal.id}/settings`}>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
