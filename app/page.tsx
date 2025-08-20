"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Search, ArrowRight, Building2, Eye, Loader2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { searchCompanies, type ClaySearchParams } from "@/lib/clay-api"

// Update the Company interface to match Clay.com's format
interface Company {
  search_query: string
  why_relevant: string
  niche_focus: string
  Company_Name: string
  source: string
  linkedinURL: string | null
}

export default function HomePage() {
  const [searchMode, setSearchMode] = useState<"rfp" | "competitor">("rfp")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set())
  const [isEnriching, setIsEnriching] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Add state for editable source URLs
  const [sourceUrls, setSourceUrls] = useState<Record<string, string>>({})

  // Function to update source URL
  const updateSourceUrl = (companyName: string, newUrl: string) => {
    setSourceUrls(prev => ({
      ...prev,
      [companyName]: newUrl
    }))
  }

  // Connect to SSE stream
  useEffect(() => {
    if (hasSearched) {
      const eventSource = new EventSource('/api/stream-companies')
      eventSourceRef.current = eventSource

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'initial') {
            setCompanies(data.companies)
          } else if (data.type === 'new_company') {
            setCompanies(prev => [...prev, data.company])
            // Auto-select new companies
            setSelectedCompanies(prev => new Set([...prev, data.company.Company_Name]))
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE error:', error)
      }

      return () => {
        eventSource.close()
        eventSourceRef.current = null
      }
    }
  }, [hasSearched])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    setHasSearched(true)
    setCompanies([])
    setSelectedCompanies(new Set())
    
    try {
      const params: ClaySearchParams = {
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

  // Update the sendSelectedToClay function to use the new webhook
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
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
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
                  className="text-lg placeholder-gray-400 focus:ring-0 px-0 py-0 bg-transparent font-medium resize-none"
                  style={{ height: 'auto', minHeight: '24px' }}
                />
                <div className="text-sm text-gray-400 mt-1">
                  <div>... in the workflow automation industry</div>
                  <div>... with over 1,000 employees and Headquartered in New Jersey</div>
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
                {isSearching ? 'Searching...' : 'Search'}
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
                  ? `${companies.length} Companies Found` 
                  : 'Waiting for companies...'
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
                    Enrich Selected ({selectedCompanies.size})
                  </Button>
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
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Searching for companies...</h3>
                <p className="text-gray-500">Companies will appear here as they're found</p>
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
                              <strong>Why Relevant:</strong> {company.why_relevant}
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
                            Source URL:
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
      </div>
    </div>
  )
}
