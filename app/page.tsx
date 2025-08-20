"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Search, ArrowRight, Building2, Eye, Loader2, Check, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import CompetitorCard, { type Competitor } from "@/components/CompetitorCard"
import RFPView from "@/components/RFPView"


// Update the Company interface to match Clay.com's format
interface Company {
  search_query: string
  why_relevant: string
  niche_focus: string
  Company_Name: string
  source: string
  linkedinURL: string | null
}

interface SearchParams {
  query: string
  mode: 'rfp' | 'competitor'
}

export default function HomePage() {
  const [searchMode, setSearchMode] = useState<"rfp" | "competitor">("rfp")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set())
  const [isEnriching, setIsEnriching] = useState(false)
  const [hasReceivedBulkData, setHasReceivedBulkData] = useState(false) // New flag

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
          const mappedCompetitors: Competitor[] = data.competitors.map((comp: unknown, index: number) => {
            const competitor = comp as Record<string, unknown>
            return {
              id: (competitor.id as number) || index + 1,
              companyName: competitor.companyName as string,
              domain: competitor.domain as string,
              linkedinCompanyUrl: competitor.linkedinCompanyUrl as string,
              totalFundingRaised: competitor.totalFundingRaised as string,
              employeeCount: competitor.employeeCount as number,
              percentEmployeeGrowthOverLast6Months: competitor.percentEmployeeGrowthOverLast6Months as number,
              productFeatures: (competitor.productFeatures as string[]) || [],
              pricingPlanSummaryResult: (competitor.pricingPlanSummaryResult as string[]) || [],
              customerNames: (competitor.customerNames as string[]) || [],
              industry: competitor.industry as string,
              description: competitor.description as string,
              salesContactEmail: competitor.salesContactEmail as string,
              enterpriseSalesRepLinkedinUrl: competitor.enterpriseSalesRepLinkedinUrl as string,
              jobTitles: (competitor.jobTitles as string[]) || [],
              jobUrls: (competitor.jobUrls as string[]) || [],
              jobDescriptions: (competitor.jobDescriptions as string[]) || [],
              integrationsList: (competitor.integrationsList as string[]) || [],
              companyRevenue: competitor.companyRevenue as number,
              productsAndServicesResult: (competitor.productsAndServicesResult as string[]) || [],
              productRoadmap: competitor.productRoadmap as string,
              tier: competitor.tier as string
            }
          })
          
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

  // Function to handle competitor tracking
  const handleTrackCompetitor = (competitor: Competitor) => {
    if (searchMode === "rfp") {
      console.log('Adding to vendor shortlist:', competitor.companyName)
      alert(`${competitor.companyName} added to your vendor shortlist!`)
    } else {
      console.log('Tracking competitor:', competitor.companyName)
      alert(`Now tracking ${competitor.companyName}!`)
    }
  }

  // Poll for companies after search
  useEffect(() => {
    if (hasSearched && !hasReceivedBulkData) { // Stop polling once we get bulk data
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch('/api/stream-companies')
          if (response.ok) {
            const data = await response.json()
            if (data.companies && data.companies.length > 0) {
              
              // Check if this looks like bulk data (significant number of companies)
              const isBulkData = data.companies.length >= 5 // Threshold for bulk data
              
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
                return prevCompanies // Keep existing to preserve UI state
              })
              
              // Auto-select new companies (only add, don't replace)
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
      }, 2000) // Check every 2 seconds

      // Stop polling after 2 minutes for bulk data (reduced from 10 minutes)
      const timeout = setTimeout(() => {
        console.log('⏰ Polling timeout reached - stopping')
        clearInterval(pollInterval)
        setHasReceivedBulkData(true)
      }, 120000) // 2 minutes

      return () => {
        clearInterval(pollInterval)
        clearTimeout(timeout)
      }
    }
  }, [hasSearched, hasReceivedBulkData])

  // Load enriched competitors on component mount and poll for updates
  useEffect(() => {
    // Load initially
    loadEnrichedCompetitors()
    
    // Poll for new enriched competitors every 10 seconds
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
    setHasReceivedBulkData(false) // Reset bulk data flag
    setSourceUrls({}) // Reset source URLs
    
    try {
      const params: SearchParams = {
        query: searchQuery,
        mode: searchMode
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
          // Use updated source URL if available, otherwise use original
          source: sourceUrls[company.Company_Name] || company.source
        }))
      
      console.log('Sending selected companies for enrichment:', selectedCompanyData)
      
      // Send selected companies to Clay.com's enrichment webhook
      const response = await fetch('/api/enrich-selected', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companies: selectedCompanyData,
          originalQuery: searchQuery,
          mode: searchMode
        })
      })
      
      if (response.ok) {
        console.log('Selected companies sent to Clay for enrichment')
        // You could show a success message or redirect to results
      } else {
        throw new Error(`Enrichment failed: ${response.status}`)
      }
    } catch (error) {
      console.error('Error sending companies for enrichment:', error)
      // You could show an error message to the user
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      {/* Subtle background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-400/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative group">
                <div className="relative w-14 h-14 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                  <Image 
                    src="/logo.png" 
                    alt="Business Intelligence Visuals Logo" 
                    width={56} 
                    height={56}
                    className="object-contain"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Business Intelligence Visuals</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-28">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Search for Companies
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Find the perfect vendors and analyze your competition with intelligent search
          </p>
        </div>

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
                {isSearching ? 'Searching...' : (searchMode === "rfp" ? 'Find Vendors' : 'Find Competitors')}
              </Button>
            </div>
          </div>
        </div>

        {/* Search Mode Toggle */}
        <div className="flex justify-center mt-8">
          <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-200">
            <div className="flex space-x-1">
              <button
                onClick={() => setSearchMode("rfp")}
                className={`px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center space-x-2 ${
                  searchMode === "rfp"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>RFP</span>
              </button>
              <button
                onClick={() => setSearchMode("competitor")}
                className={`px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center space-x-2 ${
                  searchMode === "competitor"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Competitor Research</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mode Description */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200">
            {searchMode === "rfp" ? (
              <>
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>RFP Mode: Find vendors and solution providers</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-purple-600" />
                <span>Competitor Research Mode: Analyze market competition</span>
              </>
            )}
          </div>
        </div>

        {/* Companies Results */}
        {hasSearched && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {companies.length > 0 
                  ? `${companies.length} ${searchMode === "rfp" ? "Potential Vendors" : "Competitors"} Found` 
                  : `Searching for ${searchMode === "rfp" ? "vendors" : "competitors"}...`
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
                    {searchMode === "rfp" ? "Get Vendor Details" : "Analyze Competitors"} ({selectedCompanies.size})
                  </Button>
                  {enrichedCompetitors.length > 0 && !showEnrichedResults && (
                    <Button
                      onClick={() => setShowEnrichedResults(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      View {searchMode === "rfp" ? "Vendor Analysis" : "Competitor Analysis"} ({enrichedCompetitors.length})
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
                              <h3 className="text-xl font-semibold text-gray-700 mb-2">{`Searching for ${searchMode === "rfp" ? "vendors" : "competitors"}... (takes about 1-2 minutes)`}</h3>
              <p className="text-gray-500">{`${searchMode === "rfp" ? "Potential vendors" : "Competitors"} will appear here as they're found`}</p>
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
                              <strong>{searchMode === "rfp" ? "Why This Vendor Fits" : "Why Relevant"}:</strong> {company.why_relevant}
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
                            {searchMode === "rfp" ? "Vendor Website" : "Source URL"}:
                          </label>
                          <div className="flex space-x-2">
                            <Input
                              type="url"
                              placeholder="Enter or verify source URL"
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

        {/* Enriched Results Section */}
        {showEnrichedResults && (
          <div className="mt-20">
            <div className="flex items-center justify-between mb-8">
              <div>
                              <h3 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                {searchMode === "rfp" ? (
                  <Building2 className="w-8 h-8 mr-3 text-blue-600" />
                ) : (
                  <Sparkles className="w-8 h-8 mr-3 text-purple-600" />
                )}
                {searchMode === "rfp" ? "Detailed Vendor Analysis" : "Enriched Competitor Analysis"}
              </h3>
              <p className="text-xl text-gray-600">
                {enrichedCompetitors.length} {searchMode === "rfp" ? "vendors" : "companies"} with {searchMode === "rfp" ? "comprehensive business intelligence" : "detailed competitive intelligence"}
              </p>
              </div>
              <Button
                onClick={() => setShowEnrichedResults(false)}
                variant="outline"
                size="sm"
              >
                <X className="w-4 h-4 mr-2" />
                Hide Results
              </Button>
            </div>

            {isLoadingEnriched ? (
              <div className="text-center py-12">
                <Loader2 className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-spin" />
                              <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading {searchMode === "rfp" ? "vendor" : "competitor"} analysis...</h3>
              <p className="text-gray-500">Fetching detailed {searchMode === "rfp" ? "vendor intelligence" : "competitive intelligence"}</p>
              </div>
            ) : enrichedCompetitors.length === 0 ? (
              <div className="text-center py-12 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                <Sparkles className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No {searchMode === "rfp" ? "vendor analysis" : "enriched data"} yet</h3>
                <p className="text-gray-500">
                  Select {searchMode === "rfp" ? "vendors" : "companies"} above and click &ldquo;{searchMode === "rfp" ? "Get Vendor Details" : "Analyze Competitors"}&rdquo; to see detailed analysis here
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {searchMode === "rfp" ? (
                  // RFP Mode: Show as vendor cards with RFP context
                  enrichedCompetitors.map((competitor, index) => (
                    <CompetitorCard
                      key={competitor.id}
                      competitor={competitor}
                      index={index}
                      showTrackButton={true}
                      onTrackCompetitor={handleTrackCompetitor}
                      mode="rfp"
                    />
                  ))
                ) : (
                  // Competitor Mode: Show as competitor cards
                  enrichedCompetitors.map((competitor, index) => (
                    <CompetitorCard
                      key={competitor.id}
                      competitor={competitor}
                      index={index}
                      showTrackButton={true}
                      onTrackCompetitor={handleTrackCompetitor}
                      mode="competitor"
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
