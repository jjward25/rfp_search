import { NextRequest, NextResponse } from 'next/server'

// Define proper types for company data
interface CompanyData {
  Company_Name: string
  search_query: string
  why_relevant?: string
  niche_focus?: string
  source?: string
  linkedinURL?: string | null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Received company from Clay via POST:', body)
    
    // Validate the expected body format
    if (!body.Company_Name || !body.search_query) {
      console.warn('Invalid company data received:', body)
      return NextResponse.json(
        { error: 'Invalid company data format' },
        { status: 400 }
      )
    }
    
    // Add the company by calling the stream-companies endpoint
    try {
      const streamResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stream-companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })
      
      if (streamResponse.ok) {
        console.log('Company added to stream successfully')
      } else {
        console.error('Failed to add company to stream:', streamResponse.status)
      }
    } catch (streamError) {
      console.error('Error calling stream-companies endpoint:', streamError)
    }
    
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
    
    // Add the company by calling the stream-companies endpoint
    try {
      const streamResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stream-companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })
      
      if (streamResponse.ok) {
        console.log('Company added to stream successfully')
      } else {
        console.error('Failed to add company to stream:', streamResponse.status)
      }
    } catch (streamError) {
      console.error('Error calling stream-companies endpoint:', streamError)
    }
    
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