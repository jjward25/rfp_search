import { NextRequest, NextResponse } from 'next/server'
import { addEnrichedCompetitor, type EnrichedCompetitor } from '@/lib/shared-storage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('=== CLAY MAIN ENRICHMENT WEBHOOK ===')
    console.log('Received main enrichment data from Clay:', JSON.stringify(body, null, 2))
    
    // Check if this is main enrichment data (company info)
    if (body['Company Name']) {
      console.log('🎯 Processing main enrichment data for:', body['Company Name'])
      
      // Map Clay's exact data structure to our EnrichedCompetitor interface
      const enrichedCompetitor: EnrichedCompetitor = {
        id: Date.now(), // Generate unique ID
        companyName: body['Company Name'],
        domain: body['company_Domain'] || '',
        linkedinCompanyUrl: body['LinkedIn URL'] || '',
        totalFundingRaised: body['Funding Estimate'] ? body['Funding Estimate'].toString() : '',
        employeeCount: parseInt(body['Employee Count'] || '0') || 0,
        percentEmployeeGrowthOverLast6Months: parseFloat(body['Percent Employee Count'] || '0') || 0,
        productFeatures: parseStringArray(body['Product Features'] || ''),
        pricingPlanSummaryResult: parseStringArray(body['Pricing Plan Summary'] || ''),
        customerNames: [], // Not provided in this structure - might come from jobs data or separate endpoint
        industry: body['Industry'] || 'Unknown',
        description: body['Company Description'] || '',
        salesContactEmail: body['Sales Contact Email'] || '',
        enterpriseSalesRepLinkedinUrl: body['Enterprise Sales Rep'] || '',
        // Initialize job fields as empty - will be populated by jobs webhook
        jobTitles: [],
        jobUrls: [],
        jobDescriptions: [],
        integrationsList: [], // Not provided in this structure
        companyRevenue: parseFloat(body['Company Revenue'] || '0') || 0,
        productsAndServicesResult: parseStringArray(body['Products & Services'] || ''),
        productRoadmap: body['Upcoming Product Roadmap'] || '',
        tier: determineTier(parseInt(body['Employee Count'] || '0')),
        // Additional metadata
        originalSearchQuery: '', // Will be set from the initial search context
        enrichmentTimestamp: new Date().toISOString(),
        enrichmentSource: 'clay_main_enrichment'
      }
      
      try {
        await addEnrichedCompetitor(enrichedCompetitor)
        console.log('✅ Successfully stored main enrichment data:', enrichedCompetitor.companyName)
        
        return NextResponse.json({
          success: true,
          message: 'Main enrichment data received and stored successfully',
          companyName: enrichedCompetitor.companyName
        })
      } catch (storageError) {
        console.error('❌ Error storing main enrichment data:', storageError)
        return NextResponse.json(
          { error: 'Failed to store main enrichment data' },
          { status: 500 }
        )
      }
    } else {
      console.log('⚠️ Received data without Company Name - skipping')
      return NextResponse.json({
        success: false,
        message: 'No Company Name found in main enrichment data'
      })
    }

  } catch (error) {
    console.error('❌ Main Enrichment Webhook Error:', error)
    return NextResponse.json(
      { error: 'Main enrichment webhook processing failed' },
      { status: 500 }
    )
  }
}

// Helper function to parse string arrays from various formats
function parseStringArray(value: string | string[] | undefined): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(item => item && item.trim())
  if (typeof value === 'string') {
    // Try different delimiters
    const delimiters = [',', '\n', ';', '|']
    for (const delimiter of delimiters) {
      if (value.includes(delimiter)) {
        return value.split(delimiter)
          .map(item => item.trim())
          .filter(item => item.length > 0)
      }
    }
    // If no delimiter found, return as single item
    return value.trim() ? [value.trim()] : []
  }
  return []
}

// Helper function to determine tier based on employee count
function determineTier(employeeCount: number): string {
  if (employeeCount >= 1000) return 'enterprise'
  if (employeeCount >= 100) return 'growth'
  if (employeeCount >= 10) return 'emerging'
  return 'startup'
}
