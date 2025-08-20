"use client"

import { useState, useEffect } from "react"
import { Search, ArrowRight, Building2, Loader2, Check, X, Sparkles, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import CompetitorCard, { type Competitor } from "@/components/CompetitorCard"

// Company interface for initial search results
interface Company {
  search_query: string
  why_relevant: string
  niche_focus: string
  Company_Name: string
  source: string
  linkedinURL: string | null
}

interface RFPViewProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export default function RFPView({ searchQuery, setSearchQuery }: RFPViewProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set())
  const [isEnriching, setIsEnriching] = useState(false)
  const [hasReceivedBulkData, setHasReceivedBulkData] = useState(false)

  // Add state for editable source URLs
  const [sourceUrls, setSourceUrls] = useState<Record<string, string>>({})

  // Add state for enriched competitors
  const [enrichedCompetitors, setEnrichedCompetitors] = useState<Competitor[]>([])
  const [isLoadingEnriched, setIsLoadingEnriched] = useState(false)
  const [showEnrichedResults, setShowEnrichedResults] = useState(false)

  // Function to update source URL
  const updateSourceUrl = (companyName: string, newUrl: string) => {
    setSourceUrls(prev => ({
      ...prev,
      [companyName]: newUrl
    }))
  }

  // Function to load enriched competitors
  const loadEnrichedCompetitors = async () => {
    try {
      setIsLoadingEnriched(true)
      const response = await fetch('/api/enriched-competitors')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.competitors) {
          // Map EnrichedCompetitor to Competitor interface
          const mappedCompetitors: Competitor[] = data.competitors.map((comp: any, index: number) => ({
            id: comp.id || index + 1,
            companyName: comp.companyName,
            domain: comp.domain,
            linkedinCompanyUrl: comp.linkedinCompanyUrl,
            totalFundingRaised: comp.totalFundingRaised,
            employeeCount: comp.employeeCount,
            percentEmployeeGrowthOverLast6Months: comp.percentEmployeeGrowthOverLast6Months,
            productFeatures: comp.productFeatures || [],
            pricingPlanSummaryResult: comp.pricingPlanSummaryResult || [],
            customerNames: comp.customerNames || [],
            industry: comp.industry,
            description: comp.description,
            salesContactEmail: comp.salesContactEmail,
            enterpriseSalesRepLinkedinUrl: comp.enterpriseSalesRepLinkedinUrl,
            jobTitles: comp.jobTitles || [],
            jobUrls: comp.jobUrls || [],
            jobDescriptions: comp.jobDescriptions || [],
            integrationsList: comp.integrationsList || [],
            companyRevenue: comp.companyRevenue,
            productsAndServicesResult: comp.productsAndServicesResult || [],
            productRoadmap: comp.productRoadmap,
            tier: comp.tier
          }))
          
          setEnrichedCompetitors(mappedCompetitors)
          console.log('Loaded enriched competitors:', mappedCompetitors.length)
          
          if (mappedCompetitors.length > 0) {
            setShowEnrichedResults(true)
          }
        }
      }
    } catch (error) {
      console.error('Error loading enriched competitors:', error)
    } finally {
      setIsLoadingEnriched(false)
    }
  }

  // Function to handle vendor tracking (for RFP context, this would be "shortlisting")
  const handleTrackCompetitor = (competitor: Competitor) => {
    console.log('Adding to vendor shortlist:', competitor.companyName)
    alert(`${competitor.companyName} added to your vendor shortlist!`)
  }

  // Poll for companies after search
  useEffect(() => {
    if (hasSearched && !hasReceivedBulkData) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch('/api/stream-companies')
          if (response.ok) {
            const data = await response.json()
            if (data.companies && data.companies.length > 0) {
              
              // Check if this looks like bulk data
              const isBulkData = data.companies.length >= 5
              
              if (isBulkData) {
                console.log(`🎯 Received bulk data: ${data.companies.length} companies - stopping polling`)
                setHasReceivedBulkData(true)
                clearInterval(pollInterval)
              }
              
              // Only update companies if we haven't set them yet, or if this is more companies
              setCompanies(prevCompanies => {
                if (prevCompanies.length === 0 || data.companies.length > prevCompanies.length) {
                  console.log(`Updating companies: ${prevCompanies.length} → ${data.companies.length}`)
                  return data.companies
                }
                return prevCompanies
              })
              
              // Auto-select new companies
              setSelectedCompanies(prev => {
                const newSet = new Set(prev)
                data.companies.forEach((company: Company) => {
                  newSet.add(company.Company_Name)
                })
                return newSet
              })
              
              console.log('Received companies:', data.companies)
            }
          }
        } catch (error) {
          console.error('Error polling for companies:', error)
        }
      }, 2000)

      const timeout = setTimeout(() => {
        console.log('⏰ Polling timeout reached - stopping')
        clearInterval(pollInterval)
        setHasReceivedBulkData(true)
      }, 120000)

      return () => {
        clearInterval(pollInterval)
        clearTimeout(timeout)
      }
    }
  }, [hasSearched, hasReceivedBulkData])

  // Load enriched competitors on component mount and poll for updates
  useEffect(() => {
    loadEnrichedCompetitors()
    
    const enrichedPollInterval = setInterval(() => {
      loadEnrichedCompetitors()
    }, 10000)
    
    return () => {
      clearInterval(enrichedPollInterval)
    }
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    setHasSearched(true)
    setCompanies([])
    setSelectedCompanies(new Set())
    setHasReceivedBulkData(false)
    setSourceUrls({})
    
    try {
      const params = {
        query: searchQuery,
        mode: 'rfp' as const
      }
      
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      console.log('Search request sent to Clay.com successfully')
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const toggleCompanySelection = (companyId: string) => {
    setSelectedCompanies(prev => {
      const newSet = new Set(prev)
      if (newSet.has(companyId)) {
        newSet.delete(companyId)
      } else {
        newSet.add(companyId)
      }
      return newSet
    })
  }

  const selectAllCompanies = () => {
    setSelectedCompanies(new Set(companies.map(c => c.Company_Name)))
  }

  const deselectAllCompanies = () => {
    setSelectedCompanies(new Set())
  }

  const sendSelectedToClay = async () => {
    if (selectedCompanies.size === 0) return
    
    setIsEnriching(true)
    
    try {
      const selectedCompanyData = companies
        .filter(c => selectedCompanies.has(c.Company_Name))
        .map(company => ({
          ...company,
          source: sourceUrls[company.Company_Name] || company.source
        }))
      
      console.log('Sending selected companies for enrichment:', selectedCompanyData)
      
      const response = await fetch('/api/enrich-selected', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companies: selectedCompanyData,
          originalQuery: searchQuery,
          mode: 'rfp'
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Enrichment result:', result)
        
        if (result.success) {
          console.log(`✅ Successfully sent ${result.companiesSent} companies to Clay for enrichment`)
          alert(`Successfully sent ${result.companiesSent} vendors to Clay for enrichment! They will appear in the enriched results below once processed.`)
          
          setTimeout(() => {
            loadEnrichedCompetitors()
          }, 5000)
        } else {
          console.warn('⚠️ Enrichment completed with some errors:', result.errors)
          alert(`Enrichment completed with ${result.companiesSent} successes and ${result.errors?.length || 0} errors. Check console for details.`)
        }
      } else {
        const errorData = await response.json()
        throw new Error(`Enrichment failed: ${response.status} - ${errorData.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error sending companies for enrichment:', error)
      alert(`Error during enrichment: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsEnriching(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
    setCompanies([])
    setSelectedCompanies(new Set())
    setHasSearched(false)
  }

  return (
    <div className="space-y-8">
      {/* Search Input */}
      <div className="relative max-w-3xl mx-auto">
        <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center p-6">
            <div className="mr-4 p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <Input
                type="text"
                placeholder="... like Clay.com"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="border-0 text-lg placeholder-gray-400 focus:ring-0 px-0 py-0 bg-transparent font-medium resize-none"
                style={{ height: 'auto', minHeight: '24px' }}
              />
              <div className="text-sm text-gray-400 mt-1">
                <div>... workflow automation tools</div>
                <div>{`... with over 1,000 employees and Headquartered in New Jersey`}</div>
              </div>
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl ml-4 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5 mr-2" />
              )}
              {isSearching ? 'Searching...' : 'Find Vendors'}
            </Button>
          </div>
        </div>
      </div>

      {/* Companies Results */}
      {hasSearched && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {companies.length > 0 
                ? `${companies.length} Potential Vendors Found` 
                : 'Searching for vendors...'
              }
            </h3>
            {companies.length > 0 && (
              <div className="flex items-center space-x-4">
                <Button
                  onClick={selectAllCompanies}
                  variant="outline"
                  size="sm"
                >
                  Select All
                </Button>
                <Button
                  onClick={deselectAllCompanies}
                  variant="outline"
                  size="sm"
                >
                  Deselect All
                </Button>
                <Button
                  onClick={sendSelectedToClay}
                  disabled={selectedCompanies.size === 0 || isEnriching}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isEnriching ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Get Vendor Details ({selectedCompanies.size})
                </Button>
                {enrichedCompetitors.length > 0 && !showEnrichedResults && (
                  <Button
                    onClick={() => setShowEnrichedResults(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    View Vendor Analysis ({enrichedCompetitors.length})
                  </Button>
                )}
                <Button
                  onClick={clearSearch}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            )}
          </div>

          {companies.length === 0 ? (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">{`Searching for vendors... (takes about 1-2 minutes)`}</h3>
              <p className="text-gray-500">{`Potential vendors will appear here as they're found`}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {companies.map((company, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-xl p-6 shadow-lg border-2 transition-all duration-200 ${
                    selectedCompanies.has(company.Company_Name)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedCompanies.has(company.Company_Name)}
                      onChange={() => toggleCompanySelection(company.Company_Name)}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1"
                    />
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">
                        {company.Company_Name}
                      </h4>
                      
                      {/* Why Relevant Section */}
                      {company.why_relevant && (
                        <div className="mb-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                          <p className="text-sm text-blue-800">
                            <strong>Why This Vendor Fits:</strong> {company.why_relevant}
                          </p>
                        </div>
                      )}
                      
                      {/* Niche Focus */}
                      {company.niche_focus && (
                        <div className="mb-3">
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                            {company.niche_focus}
                          </span>
                        </div>
                      )}
                      
                      {/* Editable Source URL */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vendor Website:
                        </label>
                        <div className="flex space-x-2">
                          <Input
                            type="url"
                            placeholder="Enter or verify vendor website"
                            value={sourceUrls[company.Company_Name] || company.source || ''}
                            onChange={(e) => updateSourceUrl(company.Company_Name, e.target.value)}
                            className="flex-1 text-sm"
                          />
                          {sourceUrls[company.Company_Name] && sourceUrls[company.Company_Name] !== company.source && (
                            <Button
                              onClick={() => updateSourceUrl(company.Company_Name, company.source || '')}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              Reset
                            </Button>
                          )}
                        </div>
                        {company.source && company.source !== (sourceUrls[company.Company_Name] || '') && (
                          <p className="text-xs text-gray-500 mt-1">
                            Original: {company.source}
                          </p>
                        )}
                      </div>
                      
                      {/* Search Query Match */}
                      <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                        <strong>Matched Query:</strong> {company.search_query}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Enriched Vendor Analysis Section */}
      {showEnrichedResults && (
        <div className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <Building2 className="w-8 h-8 mr-3 text-blue-600" />
                Detailed Vendor Analysis
              </h3>
              <p className="text-xl text-gray-600">
                {enrichedCompetitors.length} vendors with comprehensive business intelligence
              </p>
            </div>
            <Button
              onClick={() => setShowEnrichedResults(false)}
              variant="outline"
              size="sm"
            >
              <X className="w-4 h-4 mr-2" />
              Hide Analysis
            </Button>
          </div>

          {isLoadingEnriched ? (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading vendor analysis...</h3>
              <p className="text-gray-500">Fetching detailed vendor intelligence</p>
            </div>
          ) : enrichedCompetitors.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
              <Building2 className="w-16 h-16 text-blue-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No vendor analysis yet</h3>
              <p className="text-gray-500">
                Select vendors above and click "Get Vendor Details" to see comprehensive analysis here
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {enrichedCompetitors.map((competitor, index) => (
                <CompetitorCard
                  key={competitor.id}
                  competitor={competitor}
                  index={index}
                  showTrackButton={true}
                  onTrackCompetitor={handleTrackCompetitor}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
