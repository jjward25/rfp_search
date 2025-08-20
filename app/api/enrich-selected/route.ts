import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companies, originalQuery, mode } = body
    
    console.log('Sending selected companies for enrichment:', { 
      count: companies.length, 
      query: originalQuery, 
      mode 
    })
    
    // Send selected companies to Clay.com's enrichment webhook
    const response = await fetch('https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-86cd7154-5f2b-47cd-92ec-fd02d80029fd', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'enrichment_request',
        selectedCompanies: companies,
        originalQuery: originalQuery,
        mode: mode,
        timestamp: new Date().toISOString(),
        source: 'business-intelligence-visuals',
        enrichmentType: 'final_selection'
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Clay enrichment error:', errorText)
      throw new Error(`Clay enrichment error: ${response.status}`)
    }
    
    const responseData = await response.json()
    console.log('Clay enrichment response:', responseData)
    
    return NextResponse.json({
      success: true,
      message: 'Selected companies sent for enrichment',
      timestamp: new Date().toISOString(),
      companiesSent: companies.length
    })
    
  } catch (error) {
    console.error('Enrichment Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Enrichment failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
