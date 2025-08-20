import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for received companies (in production, use a database)
let receivedCompanies: any[] = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Received company from Clay:', body)
    
    // Validate the expected body format
    if (!body.Company_Name || !body.search_query) {
      console.warn('Invalid company data received:', body)
      return NextResponse.json(
        { error: 'Invalid company data format' },
        { status: 400 }
      )
    }
    
    // Add the company to our storage
    receivedCompanies.push(body)
    console.log('Company added to storage. Total companies:', receivedCompanies.length)
    
    return NextResponse.json({
      success: true,
      message: 'Company received successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Webhook Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Add GET method for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Webhook endpoint is working',
    method: 'POST',
    description: 'This endpoint receives company data from Clay.com',
    companiesReceived: receivedCompanies.length
  })
}