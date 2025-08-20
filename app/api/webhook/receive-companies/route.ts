import { NextRequest, NextResponse } from 'next/server'
import { addCompany, type CompanyData } from '@/lib/shared-storage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('=== WEBHOOK DEBUG START ===')
    console.log('Received company from Clay via POST:', JSON.stringify(body, null, 2))
    
    // Validate the expected body format
    if (!body.Company_Name || !body.search_query) {
      console.warn('Invalid company data received:', body)
      return NextResponse.json(
        { error: 'Invalid company data format' },
        { status: 400 }
      )
    }
    
    console.log('Company validation passed, calling addCompany...')
    
    // Add the company to shared storage
    try {
      addCompany(body)
      console.log('addCompany completed successfully')
    } catch (addError) {
      console.error('Error in addCompany:', addError)
      throw addError
    }
    
    console.log('=== WEBHOOK DEBUG END ===')
    
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

// Add support for PUT method (in case Clay.com uses that)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Received company from Clay via PUT:', body)
    
    // Same logic as POST
    if (!body.Company_Name || !body.search_query) {
      console.warn('Invalid company data received:', body)
      return NextResponse.json(
        { error: 'Invalid company data format' },
        { status: 400 }
      )
    }
    
    addCompany(body)
    
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
export async function GET() {
  return NextResponse.json({
    message: 'Webhook endpoint is working',
    methods: ['POST', 'PUT', 'GET'],
    description: 'This endpoint receives company data from Clay.com'
  })
}

// Add OPTIONS method for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, PUT, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}