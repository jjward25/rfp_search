import { NextRequest, NextResponse } from 'next/server'
import { addEnrichedCompetitor, type EnrichedCompetitor } from '@/lib/shared-storage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('=== CLAY MAIN ENRICHMENT WEBHOOK ===')
    console.log('Received main enrichment data from Clay:', JSON.stringify(body, null, 2))
    
    // Check if this is main enrichment data (company info)
    if (body.Company_Name) {
      console.log('🎯 Processing main enrichment data for:', body.Company_Name)
      
      // Map Clay's main enrichment data to our EnrichedCompetitor interface
      const enrichedCompetitor: EnrichedCompetitor = {
        id: Date.now(), // Generate unique ID
        companyName: body.Company_Name,
        domain: body.Source || body.domain || '',
        linkedinCompanyUrl: body.linkedinCompanyUrl || body.LinkedIn_Company_URL || '',
        totalFundingRaised: body.totalFundingRaised || body.Total_Funding_Raised || '',
        employeeCount: parseInt(body.employeeCount || body.Employee_Count || '0') || 0,
        percentEmployeeGrowthOverLast6Months: parseFloat(body.percentEmployeeGrowthOverLast6Months || body.Employee_Growth || '0') || 0,
        productFeatures: parseStringArray(body.productFeatures || body.Product_Features || ''),
        pricingPlanSummaryResult: parseStringArray(body.pricingPlanSummaryResult || body.Pricing_Plans || ''),
        customerNames: parseStringArray(body.customerNames || body.Customer_Names || ''),
        industry: body.industry || body.Industry || 'Unknown',
        description: body.description || body.Description || '',
        salesContactEmail: body.salesContactEmail || body.Sales_Contact_Email || '',
        enterpriseSalesRepLinkedinUrl: body.enterpriseSalesRepLinkedinUrl || body.Sales_Rep_LinkedIn || '',
        // Initialize job fields as empty - will be populated by jobs webhook
        jobTitles: [],
        jobUrls: [],
        jobDescriptions: [],
        integrationsList: parseStringArray(body.integrationsList || body.Integrations || ''),
        companyRevenue: parseInt(body.companyRevenue || body.Company_Revenue || '0') || 0,
        productsAndServicesResult: parseStringArray(body.productsAndServicesResult || body.Products_Services || ''),
        productRoadmap: body.productRoadmap || body.Product_Roadmap || '',
        tier: body.tier || determineTier(parseInt(body.employeeCount || body.Employee_Count || '0')),
        // Additional metadata
        originalSearchQuery: body['Search Query'] || body.originalSearchQuery || '',
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
      console.log('⚠️ Received data without Company_Name - skipping')
      return NextResponse.json({
        success: false,
        message: 'No Company_Name found in main enrichment data'
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
