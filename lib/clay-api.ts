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
}

export interface ClaySearchResponse {
  success: boolean
  message: string
  timestamp: string
}

// Clay.com webhook URL for sending data
const CLAY_WEBHOOK_URL = 'https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-717b978b-98aa-4d91-8be2-8cd73bcf6222'

export async function searchCompanies(params: ClaySearchParams): Promise<ClaySearchResponse> {
  try {
    // Extract potential filters from the search query
    const filters = extractFiltersFromQuery(params.query)
    
    console.log('Sending search data to Clay.com webhook:', { query: params.query, mode: params.mode, filters })
    
    // Send data to Clay.com's webhook
    const response = await fetch(CLAY_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchQuery: params.query,
        searchMode: params.mode,
        searchFilters: { ...filters, ...params.filters },
        timestamp: new Date().toISOString(),
        source: 'business-intelligence-visuals',
        userId: 'anonymous', // You can add user identification if needed
        sessionId: Date.now().toString()
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Clay webhook error response:', errorText)
      throw new Error(`Clay webhook error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Clay webhook response:', data)
    
    return {
      success: true,
      message: 'Search data sent to Clay.com successfully',
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('Error sending data to Clay webhook:', error)
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
