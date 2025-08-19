import { NextRequest, NextResponse } from 'next/server'
import { searchCompanies, type ClaySearchParams } from '@/lib/clay-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, mode, filters } = body

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

    // Call Clay API
    const results = await searchCompanies(searchParams)

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
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
