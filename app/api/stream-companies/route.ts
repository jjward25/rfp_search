import { NextRequest, NextResponse } from 'next/server'
import { getSharedCompanies } from '@/lib/shared-storage'

export async function GET(request: NextRequest) {
  try {
    // Get companies from the shared storage
    const companies = getSharedCompanies()
    
    return NextResponse.json({
      companies: companies,
      total: companies.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting companies:', error)
    return NextResponse.json({
      companies: [],
      total: 0,
      timestamp: new Date().toISOString()
    })
  }
}

export async function POST(request: NextRequest) {
  // This endpoint is no longer needed since webhook stores directly
  return NextResponse.json({
    message: 'Companies are now stored directly by the webhook',
    redirect: 'Use GET to retrieve companies'
  })
}
