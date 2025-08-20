import { NextRequest, NextResponse } from 'next/server'
import { clearCompanies } from '@/lib/shared-storage'

interface SearchParams {
  query: string
  mode: 'rfp' | 'competitor'
  filters?: Record<string, any>
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, mode, filters } = body

    console.log('Received search request:', { query, mode, filters })

    // Validate required fields
    if (!query || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields: query and mode' },
        { status: 400 }
      )
    }

    if (!['rfp', 'competitor'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "rfp" or "competitor"' },
        { status: 400 }
      )
    }

    // Clear previous companies before starting new search
    clearCompanies()
    console.log('Cleared previous companies for new search')

    // Send search request to Clay.com webhook
    try {
      const clayWebhookUrl = 'https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-717b978b-98aa-4d91-8be2-8cd73bcf6222'
      
      const response = await fetch(clayWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchQuery: query,
          searchMode: mode,
          searchFilters: filters || {},
          timestamp: new Date().toISOString(),
          source: 'business-intelligence-visuals',
          userId: 'anonymous',
          sessionId: Date.now().toString()
        })
      })

      if (response.ok) {
        console.log('Search request sent to Clay.com successfully')
      } else {
        console.warn('Clay.com webhook returned non-200 status:', response.status)
      }

    } catch (clayError) {
      console.error('Clay API Error:', clayError)
      // Don't fail the request - Clay.com might still process it
    }

    // Always return success so frontend starts polling
    return NextResponse.json({
      success: true,
      message: 'Search request initiated - companies will appear as they are found',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Company Search API',
    endpoints: {
      POST: '/api/search - Search for companies',
      GET: '/api/search - API information'
    },
    usage: {
      method: 'POST',
      body: {
        query: 'string - Search query (e.g., "Clay.com in workflow automation")',
        mode: 'string - "rfp" or "competitor"',
        filters: 'object - Optional additional filters'
      }
    }
  })
}
