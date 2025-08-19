"use client"

import { useState } from "react"
import Image from "next/image"
import { Search, ArrowRight, Building2, Eye, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { searchCompanies, type ClayCompany, type ClaySearchParams } from "@/lib/clay-api"

export default function HomePage() {
  const [searchMode, setSearchMode] = useState<"rfp" | "competitor">("rfp")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<ClayCompany[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    setHasSearched(true)
    
    try {
      // Call YOUR API endpoint instead of Clay directly
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          mode: searchMode
        })
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      setSearchResults(data.data.companies || [])
      
      console.log(`Search request sent successfully for ${searchMode} mode`)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
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
                  <div>... in the workflow automation industry</div>
                  <div>... with over 5000 people HQed in New Jersey</div>
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

        {/* Search Results */}
        {hasSearched && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {searchResults.length > 0 
                  ? `${searchResults.length} Companies Found` 
                  : 'No Companies Found'
                }
              </h3>
              {hasSearched && (
                <Button
                  onClick={clearSearch}
                  variant="outline"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Clear Search
                </Button>
              )}
            </div>

            {searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((company) => (
                  <div
                    key={company.id}
                    className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900 mb-2">
                          {company.name}
                        </h4>
                        {company.domain && (
                          <p className="text-blue-600 mb-2">
                            <a 
                              href={`https://${company.domain}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {company.domain}
                            </a>
                          </p>
                        )}
                        {company.description && (
                          <p className="text-gray-600 mb-3">{company.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {company.industry && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              {company.industry}
                            </span>
                          )}
                          {company.location && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                              {company.location}
                            </span>
                          )}
                          {company.employeeCount && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                              {company.employeeCount.toLocaleString()} employees
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors duration-200"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </a>
                        )}
                        {company.linkedinUrl && (
                          <a
                            href={company.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-blue-100 rounded-lg text-blue-600 hover:bg-blue-200 transition-colors duration-200"
                          >
                            <Building2 className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No results found</h3>
                <p className="text-gray-500">Try adjusting your search criteria</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
