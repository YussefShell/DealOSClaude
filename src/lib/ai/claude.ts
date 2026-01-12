import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export interface DocumentAnalysisResult {
  classification: string
  summary: string
  keyPoints: string[]
  extractedData: Record<string, unknown>
  riskFlags: string[]
  confidenceScore: number
}

export async function analyzeDocument(
  content: string,
  filename: string
): Promise<DocumentAnalysisResult> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are an expert M&A analyst reviewing documents for due diligence. Analyze the following document and provide:

1. Document classification (e.g., Financial Statement, Contract, Corporate Document, Legal Document, etc.)
2. Executive summary (2-3 sentences)
3. Key points (5-7 bullet points of the most important information)
4. Extracted data (structured data like dates, amounts, parties, terms, etc.)
5. Risk flags (any concerns or red flags for due diligence)
6. Confidence score (0-1, how confident you are in this analysis)

Document filename: ${filename}

Document content:
${content.slice(0, 50000)}

Respond in JSON format with the following structure:
{
  "classification": "Document Type",
  "summary": "Executive summary here",
  "keyPoints": ["point 1", "point 2", ...],
  "extractedData": {
    "field1": "value1",
    "field2": "value2",
    ...
  },
  "riskFlags": ["risk 1", "risk 2", ...],
  "confidenceScore": 0.95
}`,
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      throw new Error('Failed to parse AI response')
    }

    const result = JSON.parse(jsonMatch[0])
    return result
  } catch (error) {
    console.error('Document analysis error:', error)
    return {
      classification: 'Unknown',
      summary: 'Analysis failed',
      keyPoints: [],
      extractedData: {},
      riskFlags: ['Analysis failed - manual review required'],
      confidenceScore: 0,
    }
  }
}

export async function extractContractTerms(content: string) {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Extract key contract terms from this document. Focus on:
- Parties involved
- Contract duration/term
- Key obligations
- Payment terms
- Termination clauses
- Change of control provisions
- Renewal terms
- Notice periods

Document content:
${content.slice(0, 30000)}

Respond in JSON format.`,
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    return {}
  } catch (error) {
    console.error('Contract extraction error:', error)
    return {}
  }
}

export async function extractFinancialData(content: string) {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Extract financial data from this document. Focus on:
- Revenue figures
- EBITDA
- Net income
- Total assets
- Total liabilities
- Debt
- Working capital
- Cash flow
- Key financial ratios

Document content:
${content.slice(0, 30000)}

Respond in JSON format with numerical values where possible.`,
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    return {}
  } catch (error) {
    console.error('Financial extraction error:', error)
    return {}
  }
}
