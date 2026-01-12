'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { Download, FileText, Eye, Loader2 } from 'lucide-react'
import { formatDate, formatFileSize } from '@/lib/utils'

interface Document {
  id: string
  filename: string
  originalFilename: string
  fileSize: bigint
  fileType: string
  mimeType: string
  createdAt: Date
  uploadedBy: {
    name: string | null
    email: string
  }
}

interface DocumentViewerProps {
  document: Document
  dealId: string
  canDownload?: boolean
}

export function DocumentViewer({ document, dealId, canDownload = true }: DocumentViewerProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const { addToast } = useToast()

  const handleDownload = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/documents/${document.id}/download`)

      if (!response.ok) {
        const data = await response.json()
        addToast({
          title: 'Error',
          description: data.error || 'Failed to download document',
          variant: 'destructive',
        })
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = document.originalFilename
      window.document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      window.document.body.removeChild(a)

      addToast({
        title: 'Success',
        description: 'Document downloaded successfully',
      })
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

  const handleAnalyze = async () => {
    setAnalyzing(true)

    try {
      const response = await fetch(`/api/documents/${document.id}/analyze`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        addToast({
          title: 'Error',
          description: data.error || 'Failed to analyze document',
          variant: 'destructive',
        })
        return
      }

      const data = await response.json()
      setAnalysis(data)

      addToast({
        title: 'Success',
        description: 'Document analyzed successfully',
      })
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const fetchAnalysis = async () => {
    try {
      const response = await fetch(`/api/documents/${document.id}/analyze`)
      if (response.ok) {
        const data = await response.json()
        if (data.analysis) {
          setAnalysis(data.analysis)
        }
      }
    } catch (error) {
      console.error('Failed to fetch analysis:', error)
    }
  }

  return (
    <>
      <div
        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50 cursor-pointer"
        onClick={() => {
          setOpen(true)
          fetchAnalysis()
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{document.originalFilename}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatFileSize(Number(document.fileSize))}</span>
              <span>•</span>
              <span>{document.uploadedBy.name || document.uploadedBy.email}</span>
              <span>•</span>
              <span>{formatDate(document.createdAt)}</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
          fetchAnalysis()
        }}>
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{document.originalFilename}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">File Size</p>
                <p className="font-medium">{formatFileSize(Number(document.fileSize))}</p>
              </div>
              <div>
                <p className="text-muted-foreground">File Type</p>
                <p className="font-medium">{document.fileType.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Uploaded By</p>
                <p className="font-medium">{document.uploadedBy.name || document.uploadedBy.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Uploaded On</p>
                <p className="font-medium">{formatDate(document.createdAt)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {canDownload && (
                <Button onClick={handleDownload} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </>
                  )}
                </Button>
              )}
              <Button onClick={handleAnalyze} disabled={analyzing} variant="outline">
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    AI Analysis
                  </>
                )}
              </Button>
            </div>

            {analysis && (
              <Card className="p-4 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">AI Analysis</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Classification</p>
                      <Badge>{analysis.classification}</Badge>
                    </div>

                    {analysis.summary && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Summary</p>
                        <p className="text-sm">{analysis.summary}</p>
                      </div>
                    )}

                    {analysis.keyPoints && analysis.keyPoints.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Key Points</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {analysis.keyPoints.map((point: string, idx: number) => (
                            <li key={idx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.riskFlags && analysis.riskFlags.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Risk Flags</p>
                        <div className="space-y-1">
                          {analysis.riskFlags.map((flag: string, idx: number) => (
                            <Badge key={idx} variant="destructive" className="mr-2">
                              {flag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.extractedData && Object.keys(analysis.extractedData).length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Extracted Data</p>
                        <div className="rounded bg-muted p-3 text-xs font-mono">
                          <pre>{JSON.stringify(analysis.extractedData, null, 2)}</pre>
                        </div>
                      </div>
                    )}

                    {analysis.confidenceScore !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Confidence Score</p>
                        <p className="text-sm">{(analysis.confidenceScore * 100).toFixed(0)}%</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
