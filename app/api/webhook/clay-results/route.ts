import { NextRequest, NextResponse } from 'next/server'
import { addEnrichedCompetitor, type EnrichedCompetitor } from '@/lib/shared-storage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('=== CLAY RESULTS WEBHOOK ===')
    console.log('Received data from Clay:', JSON.stringify(body, null, 2))
    
    // Check if this is final enrichment data
    if (body.Company_Name && (body.Source || body['Search Query'])) {
      console.log('🎯 Detected final enrichment data for:', body.Company_Name)
      
      // Map Clay's final enrichment data to our EnrichedCompetitor interface
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
        jobTitles: parseStringArray(body.jobTitles || body.Job_Titles || ''),
        jobUrls: parseStringArray(body.jobUrls || body.Job_URLs || ''),
        jobDescriptions: parseStringArray(body.jobDescriptions || body.Job_Descriptions || ''),
        integrationsList: parseStringArray(body.integrationsList || body.Integrations || ''),
        companyRevenue: parseInt(body.companyRevenue || body.Company_Revenue || '0') || 0,
        productsAndServicesResult: parseStringArray(body.productsAndServicesResult || body.Products_Services || ''),
        productRoadmap: body.productRoadmap || body.Product_Roadmap || '',
        tier: body.tier || determineTier(parseInt(body.employeeCount || body.Employee_Count || '0')),
        // Additional metadata
        originalSearchQuery: body['Search Query'] || body.originalSearchQuery || '',
        enrichmentTimestamp: new Date().toISOString(),
        enrichmentSource: 'clay_final_enrichment'
      }
      
      try {
        await addEnrichedCompetitor(enrichedCompetitor)
        console.log('✅ Successfully stored enriched competitor:', enrichedCompetitor.companyName)
        
        return NextResponse.json({
          success: true,
          message: 'Final enrichment data received and stored successfully',
          companyName: enrichedCompetitor.companyName
        })
      } catch (storageError) {
        console.error('❌ Error storing enriched competitor:', storageError)
        return NextResponse.json(
          { error: 'Failed to store enriched competitor data' },
          { status: 500 }
        )
      }
    } else {
      // This might be search results or other data - just log for now
      console.log('📊 Received other Clay data (not final enrichment)')
      return NextResponse.json({
        success: true,
        message: 'Data received successfully'
      })
    }

  } catch (error) {
    console.error('❌ Clay Results Webhook Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
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
