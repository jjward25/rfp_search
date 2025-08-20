import { NextRequest, NextResponse } from 'next/server'

// Define proper types
interface CompanyData {
  Company_Name: string
  search_query: string
  why_relevant?: string
  niche_focus?: string
  source?: string
  linkedinURL?: string | null
}

// In-memory storage for received companies (in production, use a database)
const receivedCompanies: CompanyData[] = []

export async function GET(request: NextRequest) {
  // Return the current list of companies
  return NextResponse.json({
    companies: receivedCompanies,
    total: receivedCompanies.length,
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  // Allow adding companies via POST request
  try {
    const body = await request.json()
    
    if (!body.Company_Name || !body.search_query) {
      return NextResponse.json(
        { error: 'Invalid company data' },
        { status: 400 }
      )
    }
    
    receivedCompanies.push(body)
    console.log('Company added via POST. Total companies:', receivedCompanies.length)
    
    return NextResponse.json({
      success: true,
      message: 'Company added successfully',
      total: receivedCompanies.length
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add company' },
      { status: 500 }
    )
  }
}
