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
    
    // Send selected companies back to Clay for final enrichment
    // You can customize this based on what Clay.com expects
    const response = await fetch('https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-717b978b-98aa-4d91-8be2-8cd73bcf6222', {
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
        source: 'business-intelligence-visuals'
      })
    })
    
    if (!response.ok) {
      throw new Error(`Clay enrichment error: ${response.status}`)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Selected companies sent for enrichment',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Enrichment Error:', error)
    return NextResponse.json(
      { error: 'Enrichment failed' },
      { status: 500 }
    )
  }
}
