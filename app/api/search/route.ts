import { NextRequest, NextResponse } from 'next/server'
import { searchCompanies, type ClaySearchParams } from '@/lib/clay-api'

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

    // Prepare search parameters
    const searchParams: ClaySearchParams = {
      query,
      mode,
      filters: filters || {}
    }

    console.log('Calling Clay API with params:', searchParams)

    try {
      // Call Clay API from your server (no CORS issues here)
      const results = await searchCompanies(searchParams)
      console.log('Clay API response:', results)

      return NextResponse.json({
        success: true,
        data: results,
        message: 'Search request sent to Clay.com successfully',
        timestamp: new Date().toISOString()
      })

    } catch (clayError) {
      console.error('Clay API Error:', clayError)
      
      // Return a more graceful error response
      return NextResponse.json({
        success: false,
        error: 'Clay API temporarily unavailable',
        message: 'Search request could not be processed at this time',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

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
