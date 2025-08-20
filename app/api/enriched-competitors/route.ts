import { NextRequest, NextResponse } from 'next/server'
import { getEnrichedCompetitors } from '@/lib/shared-storage'

export async function GET(request: NextRequest) {
  try {
    console.log('=== GET ENRICHED COMPETITORS ===')
    
    const enrichedCompetitors = await getEnrichedCompetitors()
    
    console.log('Retrieved enriched competitors:', enrichedCompetitors.length)
    
    return NextResponse.json({
      success: true,
      competitors: enrichedCompetitors,
      count: enrichedCompetitors.length,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error retrieving enriched competitors:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve enriched competitors',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
