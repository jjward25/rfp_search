import { NextRequest, NextResponse } from 'next/server'
import { addCompanies, addCompany, type CompanyData } from '@/lib/shared-storage'

// Define interfaces for incoming webhook data
interface IncomingCompany {
  company: string
  source?: string
  niche_focus?: string
  why_relevant?: string
  linkedinURL?: string
}

interface WrappedCompaniesPayload {
  CompetitiveCompanies: IncomingCompany[]
  search_query?: string
  originalQuery?: string
}

interface LegacyCompanyPayload {
  Company_Name: string
  search_query: string
  why_relevant?: string
  niche_focus?: string
  source?: string
  linkedinURL?: string | null
}

type WebhookPayload = IncomingCompany[] | WrappedCompaniesPayload | LegacyCompanyPayload

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('=== WEBHOOK DEBUG START ===')
    console.log('Received data from Clay via POST:', JSON.stringify(body, null, 2))
    
    // Handle direct array format (new)
    if (Array.isArray(body)) {
      console.log(`Processing direct array format: ${body.length} companies received`)
      
      try {
        // Map the array format to our CompanyData interface
        const companies: CompanyData[] = (body as IncomingCompany[]).map((company: IncomingCompany, index: number) => {
          const cleanCompanyName = company.company?.toString().trim()
          const cleanSource = company.source?.toString().trim()
          const cleanNicheFocus = company.niche_focus?.toString().trim()
          const cleanWhyRelevant = company.why_relevant?.toString().trim()
          
          // Validate that we have actual company data
          if (!cleanCompanyName) {
            throw new Error(`Company ${index + 1}: Missing company name`)
          }
          
          return {
            Company_Name: cleanCompanyName,
            search_query: 'competitive analysis', // Default since not provided in this format
            why_relevant: cleanWhyRelevant || undefined,
            niche_focus: cleanNicheFocus || undefined,
            source: cleanSource || undefined,
            linkedinURL: company.linkedinURL || null
          }
        })
        
        console.log('Mapped companies from direct array:', companies.map(c => c.Company_Name))
        
        // Add all companies at once using the bulk method
        await addCompanies(companies)
        console.log(`✅ Successfully added ${companies.length} companies from direct array`)
        
        console.log('=== WEBHOOK DEBUG END ===')
        
        return NextResponse.json({
          success: true,
          message: `${companies.length} companies received and processed successfully`,
          companiesProcessed: companies.length,
          timestamp: new Date().toISOString()
        })
        
      } catch (mappingError) {
        console.error('Error during direct array mapping:', mappingError)
        return NextResponse.json(
          { 
            error: 'Company data mapping failed', 
            details: mappingError instanceof Error ? mappingError.message : 'Unknown mapping error',
            sampleData: body[0]
          },
          { status: 400 }
        )
      }
    }
    
    // Handle wrapped format with CompetitiveCompanies array (existing)
    if (body.CompetitiveCompanies && Array.isArray(body.CompetitiveCompanies)) {
      console.log(`Processing bulk companies: ${body.CompetitiveCompanies.length} companies received`)
      
      try {
        // Map the new format to our CompanyData interface
        const companies: CompanyData[] = (body as WrappedCompaniesPayload).CompetitiveCompanies.map((company: IncomingCompany, index: number) => {
          const cleanCompanyName = company.company?.toString().trim()
          const cleanSource = company.source?.toString().trim()
          const cleanNicheFocus = company.niche_focus?.toString().trim()
          const cleanWhyRelevant = company.why_relevant?.toString().trim()
          
          console.log(`Mapping company ${index + 1}:`, {
            original: company.company,
            cleaned: cleanCompanyName,
            hasData: !!cleanCompanyName && cleanCompanyName !== 'company'
          })
          
          // Validate that we have actual data, not empty/placeholder
          if (!cleanCompanyName || cleanCompanyName === 'company' || cleanCompanyName === '') {
            throw new Error(`Company ${index + 1}: Missing or invalid company name. Original: "${company.company}", Cleaned: "${cleanCompanyName}"`)
          }
          
          return {
            Company_Name: cleanCompanyName,
            search_query: (body as WrappedCompaniesPayload).search_query || (body as WrappedCompaniesPayload).originalQuery || 'bulk import',
            why_relevant: cleanWhyRelevant || undefined,
            niche_focus: cleanNicheFocus || undefined,
            source: cleanSource || undefined,
            linkedinURL: company.linkedinURL || null
          }
        })
      
      console.log('Mapped companies:', companies.map(c => c.Company_Name))
      
      // Add all companies at once using the bulk method
      try {
        await addCompanies(companies)
        console.log(`✅ Successfully added ${companies.length} companies`)
      } catch (addError) {
        console.error('Error in addCompanies:', addError)
        throw addError
      }
      
      console.log('=== WEBHOOK DEBUG END ===')
      
      return NextResponse.json({
        success: true,
        message: `${companies.length} companies received and processed successfully`,
        companiesProcessed: companies.length,
        timestamp: new Date().toISOString()
      })
      
      } catch (mappingError) {
        console.error('Error during CompetitiveCompanies mapping:', mappingError)
        return NextResponse.json(
          { 
            error: 'Company data mapping failed', 
            details: mappingError instanceof Error ? mappingError.message : 'Unknown mapping error',
            sampleData: (body as WrappedCompaniesPayload).CompetitiveCompanies?.[0]
          },
          { status: 400 }
        )
      }
    }
    
    // Legacy single company format (keeping for backward compatibility)
    if (body.Company_Name && body.search_query) {
      console.log('Processing single company (legacy format):', body.Company_Name)
      
      try {
        await addCompany(body)
        console.log('addCompany completed successfully')
      } catch (addError) {
        console.error('Error in addCompany:', addError)
        throw addError
      }
      
      return NextResponse.json({
        success: true,
        message: 'Company received successfully',
        timestamp: new Date().toISOString()
      })
    }
    
    // Invalid format
    console.warn('Invalid data format received:', Object.keys(body))
    return NextResponse.json(
      { 
        error: 'Invalid data format', 
        expected: 'Either { CompetitiveCompanies: [...] } or { Company_Name, search_query, ... }',
        received: Object.keys(body)
      },
      { status: 400 }
    )

  } catch (error) {
    console.error('Webhook Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Keep existing PUT method for backward compatibility
export async function PUT(request: NextRequest) {
  // Same logic as POST - just redirect to POST handler
  return POST(request)
}

// Add GET method for testing
export async function GET() {
  return NextResponse.json({
    message: 'Webhook endpoint is working',
    methods: ['POST', 'PUT', 'GET'],
    description: 'This endpoint receives company data from Clay.com',
    formats: {
      bulk: {
        CompetitiveCompanies: [
          {
            company: 'Company Name',
            source: 'https://example.com',
            niche_focus: 'Focus area',
            why_relevant: 'Relevance explanation'
          }
        ]
      },
      single: {
        Company_Name: 'Company Name',
        search_query: 'Query',
        source: 'https://example.com'
      }
    }
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