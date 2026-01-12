import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">DealOS</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-5xl font-bold tracking-tight sm:text-6xl">
              Modern M&A Transaction Platform
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              Secure Virtual Data Room with AI-powered due diligence capabilities.
              Streamline your M&A transactions with intelligent document management,
              real-time collaboration, and automated insights.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/auth/signup">
                <Button size="lg">Start Free Trial</Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section id="features" className="border-t bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <h3 className="text-center text-3xl font-bold">Key Features</h3>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="rounded-lg border bg-background p-6">
                <h4 className="text-xl font-semibold">Secure Data Rooms</h4>
                <p className="mt-2 text-muted-foreground">
                  Enterprise-grade security with granular access controls,
                  encryption, and comprehensive audit logs.
                </p>
              </div>
              <div className="rounded-lg border bg-background p-6">
                <h4 className="text-xl font-semibold">AI-Powered Due Diligence</h4>
                <p className="mt-2 text-muted-foreground">
                  Automatic document classification, data extraction, and risk
                  identification to accelerate your deal process.
                </p>
              </div>
              <div className="rounded-lg border bg-background p-6">
                <h4 className="text-xl font-semibold">Real-Time Analytics</h4>
                <p className="mt-2 text-muted-foreground">
                  Track deal activity, buyer engagement, and document views with
                  comprehensive analytics dashboards.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2024 DealOS. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
