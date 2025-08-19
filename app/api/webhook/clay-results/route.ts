import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // This is where Clay.com will send the search results
    console.log('Received results from Clay:', body)
    
    // Process the results from Clay.com
    // You can store them in state, database, or pass them to your frontend
    
    return NextResponse.json({
      success: true,
      message: 'Results received successfully'
    })

  } catch (error) {
    console.error('Webhook Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
