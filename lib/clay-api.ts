// Clay.com API integration for company search
export interface ClaySearchParams {
  query: string
  mode: 'rfp' | 'competitor'
  filters?: {
    industry?: string
    location?: string
    companySize?: string
    [key: string]: string | number | boolean | undefined
  }
}

export interface ClayCompany {
  id: string
  name: string
  domain?: string
  industry?: string
  description?: string
  employeeCount?: number
  location?: string
  linkedinUrl?: string
  website?: string
  // Add more fields as needed based on Clay's response
}

export interface ClaySearchResponse {
  companies: ClayCompany[]
  total: number
  page: number
  limit: number
}

// You'll need to get your Clay.com API key from their dashboard
const CLAY_API_KEY = process.env.NEXT_PUBLIC_CLAY_API_KEY || ''
const CLAY_API_BASE_URL = 'https://api.clay.com/v1'

export async function searchCompanies(params: ClaySearchParams): Promise<void> {
  try {
    // Extract potential filters from the search query
    const filters = extractFiltersFromQuery(params.query)
    
    // Call Clay.com API with your webhook URL
    const response = await fetch(`${CLAY_API_BASE_URL}/companies/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: params.query,
        mode: params.mode,
        filters: { ...filters, ...params.filters },
        webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/clay-results`, // Your webhook URL
        limit: 50
      })
    })

    if (!response.ok) {
      throw new Error(`Clay API error: ${response.status} ${response.statusText}`)
    }

    // Clay.com will process this asynchronously and send results to your webhook
    console.log('Search request sent to Clay.com successfully')
    
  } catch (error) {
    console.error('Error searching companies via Clay:', error)
    throw error
  }
}

// Helper function to extract potential filters from search query
function extractFiltersFromQuery(query: string) {
  const filters: Record<string, string> = {}
  
  // Extract industry mentions
  const industryMatch = query.match(/in the (\w+(?:\s+\w+)*) industry/i)
  if (industryMatch) {
    filters.industry = industryMatch[1]
  }
  
  // Extract location mentions
  const locationMatch = query.match(/HQed in ([^,]+)/i) || query.match(/in ([^,]+)/i)
  if (locationMatch) {
    filters.location = locationMatch[1]
  }
  
  // Extract company size mentions
  const sizeMatch = query.match(/(\d+(?:,\d+)*)\s*people/i) || query.match(/(\d+(?:,\d+)*)\s*employees/i)
  if (sizeMatch) {
    filters.companySize = sizeMatch[1]
  }
  
  return filters
}

// Alternative: Use Clay's company enrichment endpoint if search isn't available
export async function enrichCompanyData(domain: string): Promise<ClayCompany> {
  try {
    const response = await fetch(`${CLAY_API_BASE_URL}/companies/enrich`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain: domain
      })
    })

    if (!response.ok) {
      throw new Error(`Clay API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error enriching company data via Clay:', error)
    throw error
  }
}
