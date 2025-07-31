"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Papa from "papaparse"
import {
  Search,
  Filter,
  Building2,
  Users,
  TrendingUp,
  MapPin,
  ArrowDown,
  Shield,
  Home,
  DollarSign,
  Eye,
  BarChart3,
  Briefcase,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Interface for vendor data structure (same as competitor structure)
interface Vendor {
  id: number
  companyName: string
  domain: string
  linkedinCompanyUrl: string
  totalFundingRaised: string
  employeeCount: number
  percentEmployeeGrowthOverLast6Months: number
  productFeatures: string[]
  pricingPlanSummaryResult: string[]
  customerNames: string[]
  industry: string
  description: string
  salesContactEmail: string
  enterpriseSalesRepLinkedinUrl: string
  jobTitles: string[]
  jobUrls: string[]
  jobDescriptions: string[]
  integrationsList: string[]
  companyRevenue: number
  productsAndServicesResult: string[]
  productRoadmap: string
  tier: string
}

// Papa Parse CSV parsing - much more robust
const parseCSV = (csvText: string): Promise<Vendor[]> => {
  console.log("Starting Papa Parse CSV parsing...")
  
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<Record<string, string>>) => {
        console.log("Papa Parse results:", results.data.length)
        
        const vendors: Vendor[] = []
        
        results.data.forEach((row: Record<string, string>, index: number) => {
          try {
            const employeeCount = parseInt(row["Employee Count"]) || 0
            const growth = parseFloat(row["Percent Employee Growth Over Last_6Months"]) || 0
            const revenue = parseInt(row["Company Revenue"]) || 0
            
            // Calculate tier instead of reading from CSV
            const tier = determineTier(employeeCount, growth, revenue)
            
            const vendor: Vendor = {
              id: index + 1,
              companyName: row["Company Name"] || "",
              domain: row["domain"] || "",
              linkedinCompanyUrl: row["LinkedIn Company URL"] || "",
              totalFundingRaised: row["Total Funding Raised"] || "",
              employeeCount,
              percentEmployeeGrowthOverLast6Months: growth,
              productFeatures: parseMultiValueField(row["Product Features"] || "", "features"),
              pricingPlanSummaryResult: parseMultiValueField(row["Pricing Plan Summary Result"] || "", "pricing"),
              customerNames: (row["Customer Names"] || "").split(',').filter((c: string) => c.trim()),
              industry: row["Industry"] || "",
              description: row["Description"] || "",
              salesContactEmail: row["Sales Contact Email Sales Contact"] || "",
              enterpriseSalesRepLinkedinUrl: row["Enterprise Sales Rep LinkedIn URL Linkedin Profile Url"] || "",
              jobTitles: (row["Job Titles"] || "").split('\n').filter((t: string) => t.trim()),
              jobUrls: (row["Job URLs"] || "").split('\n').filter((u: string) => u.trim()),
              jobDescriptions: (row["Job Descriptions"] || "").split('\n').filter((d: string) => d.trim()),
              integrationsList: (row["Integrations List"] || "").split(',').filter((i: string) => i.trim()),
              companyRevenue: revenue,
              productsAndServicesResult: (row["Products & Services Result"] || "").split(',').filter((p: string) => p.trim()),
              productRoadmap: row["Product Roadmap"] || "",
              tier, // Use calculated tier
            }
            vendors.push(vendor)
          } catch (error: unknown) {
            console.warn("Error parsing row in Papa Parse:", error)
          }
        })
        
        console.log("Successfully parsed vendors:", vendors.length)
        resolve(vendors)
      },
      error: (error: unknown) => {
        console.error("Papa Parse Error:", error)
        reject(error)
      },
    })
  })
}

// Reuse the same parsing functions but rename for vendor context
const parseMultiValueField = (fieldValue: string, fieldType: string): string[] => {
  if (!fieldValue || fieldValue.trim() === "") return []

  let items: string[] = []

  // Different parsing strategies based on field type
  switch (fieldType) {
    case "features":
      // Regex pattern for bullet points: "* ", "- ", or "**" at the beginning of a line
      const foundBullets: string[] = []
      
      // Find all lines that match the bullet pattern
      const lines = fieldValue.split('\n')
      for (const line of lines) {
        const trimmedLine = line.trim()
        const match = trimmedLine.match(/^(?:\*\s|\-\s|\*\*)\s*(.*)/)
        if (match && match[1].trim().length > 0) {
          foundBullets.push(match[1].trim())
        }
      }
      
      if (foundBullets.length > 0) {
        // If bullets were found, use them
        items = foundBullets
      } else {
        // If no bullets were found, return the whole string as a single entry
        items = [fieldValue.trim()]
      }
      break

    case "customers":
      // Customer names are usually comma-separated
      items = fieldValue
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 1)
      break

    case "integrations":
      // Integrations are typically comma-separated
      items = fieldValue
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 1)
      break

    case "products":
      // Products can be comma-separated or have special formatting
      items = fieldValue
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 2)
      break

    case "pricing":
      // Pricing plans use the same bullet point parsing as features
      const foundPricingBullets: string[] = []
      
      // Find all lines that match the bullet pattern
      const pricingLines = fieldValue.split('\n')
      for (const line of pricingLines) {
        const trimmedLine = line.trim()
        const match = trimmedLine.match(/^(?:\*\s|\-\s|\*\*)\s*(.*)/) 
        if (match && match[1].trim().length > 0) {
          foundPricingBullets.push(match[1].trim())
        }
      }
      
      if (foundPricingBullets.length > 0) {
        // If bullets were found, use them
        items = foundPricingBullets
      } else {
        // If no bullets were found, return the whole string as a single entry
        items = [fieldValue.trim()]
      }
      break

    default:
      items = fieldValue
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 1)
  }

  // Clean up and limit items
  return items
    .slice(0, 12) // Limit to prevent UI overflow
    .map((item) => {
      // Clean up common formatting issues
      return item
        .replace(/^["'\s-]+|["'\s-]+$/g, "")
        .replace(/\s+/g, " ")
        .trim()
    })
    .filter((item) => item.length > 0)
}

const determineTier = (employeeCount: number, growth: number, revenue: number): string => {
  // Enterprise: Large companies (>2000 employees or >$100M revenue) 
  // OR smaller companies with both size and growth
  if (employeeCount > 2000 || revenue > 100000000 || 
      ((employeeCount > 1000 || revenue > 50000000) && growth > 0)) return "enterprise"
  if (employeeCount > 1000 || revenue > 50000000 || (employeeCount > 500 && growth > 10)) return "growth"
  if (employeeCount > 200 || revenue > 10000000 || growth > 20) return "emerging"
  return "startup"
}

const businessNeedSuggestions = [
  "ai and machine learning",
  "data analytics", 
  "cloud infrastructure",
  "cybersecurity",
  "sales automation",
  "marketing technology",
  "developer tools",
  "collaboration software",
  "fintech solutions",
  "e-commerce platforms",
]

export default function VendorDiscoveryPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [accordionOpen, setAccordionOpen] = useState<string | null>(null)

  // Load CSV data on component mount
  useEffect(() => {
    const loadVendors = async () => {
      try {
        const response = await fetch("/enrichedData.csv")
        const csvText = await response.text()
        console.log("CSV loaded, length:", csvText.length)
        const parsedVendors = await parseCSV(csvText)
        console.log("Parsed vendors:", parsedVendors.length)
        setVendors(parsedVendors)
        setFilteredVendors(parsedVendors)
      } catch (error) {
        console.error("Error loading vendor data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadVendors()
  }, [])

  // Filter vendors based on search criteria
  useEffect(() => {
    const filtered = vendors.filter((vendor) => {
      // Search query filter
      const searchMatch =
        !searchQuery ||
        vendor.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.productFeatures.some((feature) => feature.toLowerCase().includes(searchQuery.toLowerCase()))

      // Employee count filter
      const employeeMatch = vendor.employeeCount >= 0 // Assuming minEmployees is 0 or removed

      // Product features filter
      const tagMatch = true // tagSearch removed

      return searchMatch && employeeMatch && tagMatch
    })

    setFilteredVendors(filtered)
  }, [vendors, searchQuery]) // minEmployees is 0 or removed

  const filteredSuggestions = businessNeedSuggestions.filter((suggestion) =>
    suggestion.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getTierConfig = (tier: string) => {
    switch (tier) {
      case "enterprise":
        return {
          badge: "bg-blue-700 text-white shadow-md",
          border: "border-l-blue-600 hover:border-l-blue-700 hover:shadow-blue-500/10",
          accent: "text-blue-600",
        }
      case "growth":
        return {
          badge: "bg-blue-600 text-white shadow-md",
          border: "border-l-blue-600 hover:border-l-blue-700 hover:shadow-blue-500/10",
          accent: "text-blue-600",
        }
      case "emerging":
        return {
          badge: "bg-indigo-600 text-white shadow-md",
          border: "border-l-indigo-600 hover:border-l-indigo-700 hover:shadow-indigo-500/10",
          accent: "text-indigo-600",
        }
      default:
        return {
          badge: "bg-gray-600 text-white shadow-md",
          border: "border-l-gray-600 hover:border-l-gray-700 hover:shadow-gray-500/10",
          accent: "text-gray-600",
        }
    }
  }

  const getGrowthIndicator = (growth: number) => {
    if (growth > 20)
      return {
        icon: TrendingUp, // Changed from ArrowUp to TrendingUp
        color: "text-green-700",
        bg: "bg-gradient-to-br from-green-50 to-green-100",
        label: "High Growth",
      }
    if (growth > 10)
      return {
        icon: TrendingUp, // Changed from ArrowUp to TrendingUp
        color: "text-blue-700",
        bg: "bg-gradient-to-br from-blue-50 to-blue-100",
        label: "Growing",
      }
    if (growth > 0)
      return {
        icon: TrendingUp, // Changed from ArrowUp to TrendingUp
        color: "text-gray-700",
        bg: "bg-gradient-to-br from-gray-50 to-gray-100",
        label: "Stable",
      }
    return {
      icon: ArrowDown,
      color: "text-red-700",
      bg: "bg-gradient-to-br from-red-50 to-red-100",
      label: "Declining",
    }
  }

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`
    } else if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    } else {
      return `$${amount.toLocaleString()}`
    }
  }

  const handleSearch = () => {
    setShowSuggestions(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-slate-600 rounded-full blur-lg opacity-20 animate-pulse"></div>
            <div className="relative animate-spin rounded-full h-32 w-32 border-8 border-transparent bg-gradient-to-r from-blue-600 to-slate-600 bg-clip-border"></div>
          </div>
          <p className="text-xl text-gray-700 font-semibold mt-6">Loading vendor data...</p>
        </div>
      </div>
    )
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/" className="flex items-center space-x-4 group">
                <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors duration-200">
                  <Home className="w-5 h-5 text-gray-600" />
                </div>
              </Link>
            <div className="flex items-center space-x-6">
              <div className="relative group">
                <div className="relative w-14 h-14 bg-gradient-to-r from-blue-600 to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Building2 className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                  <h1 className="text-3xl font-bold text-gray-900">VendorScope</h1>
                  <p className="text-gray-600 font-medium">Vendor Discovery & Intelligence Platform</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/competitors">
                <Button variant="outline" className="font-medium bg-transparent">
                  View Competitors
                </Button>
              </Link>
              <Badge className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 shadow-md hover:shadow-lg transition-all duration-300">
                <BarChart3 className="w-4 h-4 mr-2" />
                {vendors.length.toLocaleString()} Vendors Tracked
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Search Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Discover Your Vendors
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Explore qualified solution providers, analyze capabilities and market sentiment, and connect with the right vendors for your business needs
          </p>
        </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200">
              <div className="flex items-center p-4">
                <div className="ml-4 p-3 bg-gradient-to-r from-blue-600 to-slate-600 rounded-xl">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <Input
                  type="text"
                  placeholder="Search vendors by industry, technology, or solution type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 border-0 text-lg placeholder-gray-500 focus:ring-0 px-6 py-5 bg-transparent font-medium"
                />
                <Button
                  onClick={handleSearch}
                  className="bg-gradient-to-r from-blue-600 to-slate-600 hover:from-blue-700 hover:to-slate-700 text-white font-semibold px-8 py-5 rounded-xl mr-4 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                >
                  Find Vendors
                </Button>
                  </div>
                </div>

            {/* Search Suggestions */}
            {showSuggestions && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-4 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-xl shadow-xl z-10 max-h-80 overflow-y-auto">
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-8 py-4 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl transition-all duration-200 group"
                    onClick={() => {
                      setSearchQuery(suggestion)
                      setShowSuggestions(false)
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-600 rounded-lg group-hover:scale-110 transition-transform duration-200">
                        <Search className="w-4 h-4 text-white" />
                </div>
                      <span className="text-gray-900 font-medium">{suggestion}</span>
              </div>
                  </button>
                ))}
                  </div>
            )}
                  </div>
                </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-10">
          {/* Results */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-8">
                  <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {filteredVendors.length} Vendors Found
                </h3>
                <p className="text-gray-600">
                  {searchQuery && `Results for "${searchQuery}" • `}
                  Ranked by capability match and business fit
                    </p>
                  </div>
                </div>

            {filteredVendors.length === 0 ? (
              <Card className="p-12 text-center bg-white/90 backdrop-blur-xl shadow-lg">
                <CardContent>
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No vendors found</h3>
                  <p className="text-gray-500">Try adjusting your search criteria or filters</p>
            </CardContent>
          </Card>
            ) : (
              <div className="space-y-6">
                {filteredVendors.map((vendor, index) => {
                  const growthIndicator = getGrowthIndicator(vendor.percentEmployeeGrowthOverLast6Months)
                  const tierConfig = getTierConfig(vendor.tier)

                  return (
                    <Card
                      key={vendor.id}
                      className={`group hover:shadow-xl transition-all duration-500 border-l-4 ${tierConfig.border} bg-white/95 backdrop-blur-sm hover:bg-white hover:scale-[1.01] transform`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardContent className="p-8">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                              <Link href={`${vendor.domain}`} target="_blank" rel="noopener noreferrer">
                                <h4 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                                  {vendor.companyName}
                                </h4>
                              </Link>
                              <Badge className={`${tierConfig.badge} font-semibold text-xs px-3 py-1 shadow-sm`}>
                                {vendor.tier.toUpperCase()}
                              </Badge>
                              {vendor.domain && (
                                <a
                                  href={`${vendor.domain}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                                >
                                  {/* ExternalLink is not imported, assuming it's a placeholder */}
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>
                                </a>
                              )}
                  </div>

                            <div className="flex items-center space-x-6 mb-4">
                              <div className="flex items-center space-x-2">
                                <Shield className={`w-4 h-4 ${tierConfig.accent}`} />
                                <p className="text-gray-700 font-medium">{vendor.industry}</p>
                </div>
                              {vendor.totalFundingRaised && (
                                <div className="flex items-center space-x-2">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <p className="text-gray-700 font-medium">{vendor.totalFundingRaised} Funding</p>
                </div>
                              )}
                              {vendor.linkedinCompanyUrl && (
                                <a
                                  href={vendor.linkedinCompanyUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                                >
                                  {/* Linkedin is not imported, assuming it's a placeholder */}
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7H4v-7a6 6 0 0 1 6-6"/><path d="M22 9h-1M8 21h13a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2H6"/></svg>
                                </a>
                              )}
              </div>

                            <p className="text-gray-600 mb-4 leading-relaxed line-clamp-3">{vendor.description}</p>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl shadow-sm">
                                <div className="p-2 bg-blue-600 rounded-lg">
                                  <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                                  <p className="text-xs text-gray-500 font-medium">Team Size</p>
                                  <p className="font-bold text-lg text-gray-900">
                                    {vendor.employeeCount.toLocaleString()}
                    </p>
                  </div>
                </div>

                              <div
                                className={`flex items-center space-x-3 p-4 rounded-xl shadow-sm ${growthIndicator.bg}`}
                              >
                                <div
                                  className={`p-2 rounded-lg ${growthIndicator.color.replace("text-", "bg-").replace("-700", "-600")}`}
                                >
                                  <growthIndicator.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                                  <p className="text-xs text-gray-500 font-medium">{growthIndicator.label}</p>
                                  <p className={`font-bold text-lg ${growthIndicator.color}`}>
                                    {vendor.percentEmployeeGrowthOverLast6Months > 0 ? "+" : ""}
                                    {vendor.percentEmployeeGrowthOverLast6Months}%
                    </p>
                  </div>
                </div>

                              {vendor.companyRevenue > 0 && (
                                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl shadow-sm">
                                  <div className="p-2 bg-green-600 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                                    <p className="text-xs text-gray-500 font-medium">Revenue</p>
                                    <p className="font-bold text-lg text-gray-900">
                                      {formatCurrency(vendor.companyRevenue)}
                                    </p>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-xl shadow-sm">
                                <div className="p-2 bg-purple-600 rounded-lg">
                                  <Briefcase className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-medium">Open Roles</p>
                                  <p className="font-bold text-lg text-gray-900">{vendor.jobTitles.length}</p>
                  </div>
                </div>
              </div>

                            {/* Key Features */}
                            {vendor.productFeatures.length > 0 && (
                              <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 shadow-sm mb-4">
                                <h5 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                  {/* Sparkles is not imported, assuming it's a placeholder */}
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-purple-600 mr-2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.76 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                  Key Features
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {vendor.productFeatures.slice(0, 10).map((feature, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="text-xs bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors duration-200 px-3 py-1 text-left whitespace-normal max-w-none"
                                    >
                                      {feature}
                                    </Badge>
                                  ))}
                                  {vendor.productFeatures.length > 10 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-gray-500 border-gray-300 px-3 py-1"
                                    >
                                      +{vendor.productFeatures.length - 10} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Pricing Plans */}
                            {vendor.pricingPlanSummaryResult.length > 0 && (
                              <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 shadow-sm mb-4">
                                <h5 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                  <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                                  Pricing Plans
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {vendor.pricingPlanSummaryResult.slice(0, 10).map((plan, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="text-xs bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors duration-200 px-3 py-1 text-left whitespace-normal max-w-none"
                                    >
                                      {plan}
                                    </Badge>
                                  ))}
                                  {vendor.pricingPlanSummaryResult.length > 10 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-gray-500 border-gray-300 px-3 py-1"
                                    >
                                      +{vendor.pricingPlanSummaryResult.length - 10} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Products & Services */}
                            {vendor.productsAndServicesResult.length > 0 && (
                              <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 shadow-sm mb-4">
                                <h5 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                  <Building2 className="w-5 h-5 text-blue-600 mr-2" />
                                  Products & Services
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {vendor.productsAndServicesResult.slice(0, 5).map((product, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors duration-200 px-3 py-1 max-w-xs truncate"
                                    >
                                      {product}
                                    </Badge>
                                  ))}
                                  {vendor.productsAndServicesResult.length > 5 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-gray-500 border-gray-300 px-3 py-1"
                                    >
                                      +{vendor.productsAndServicesResult.length - 5} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Integrations */}
                            {vendor.integrationsList.length > 0 && (
                              <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 shadow-sm mb-4">
                                <h5 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                  {/* Globe is not imported, assuming it's a placeholder */}
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-600 mr-2"><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74A9.01 9.01 0 0 1 3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74A9.01 9.01 0 0 1 21 12z"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74A9.01 9.01 0 0 0 21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74A9.01 9.01 0 0 0 3 12"/></svg>
                                  Integrations
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {vendor.integrationsList.slice(0, 5).map((integration, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="text-xs bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors duration-200 px-3 py-1 max-w-xs truncate"
                                    >
                                      {integration}
                                    </Badge>
                                  ))}
                                  {vendor.integrationsList.length > 5 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-gray-500 border-gray-300 px-3 py-1"
                                    >
                                      +{vendor.integrationsList.length - 5} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Customer Names */}
                            {vendor.customerNames.length > 0 && (
                              <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 shadow-sm mb-4">
                              <h5 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                {/* Eye is not imported, assuming it's a placeholder */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-cyan-500 mr-2"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h18"/></svg>
                                Notable Customers
                              </h5>
                              {vendor.customerNames && vendor.customerNames.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {vendor.customerNames.slice(0, 6).map((customer, i) => (
                                    <Badge key={i} variant="secondary" className="bg-cyan-100 text-cyan-800">
                                      {customer}
                                    </Badge>
                                  ))}
                                  {vendor.customerNames.length > 6 && (
                                    <Badge variant="secondary" className="bg-cyan-100 text-cyan-800">
                                      +{vendor.customerNames.length - 6} more
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm italic">No notable customers listed</p>
                              )}
                            </div>
                            )}

                          </div>
                        </div>
                        <div className="border-t border-gray-100 pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {vendor.salesContactEmail && (
                                <a
                                  href={`mailto:${vendor.salesContactEmail}`}
                                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium group"
                                >
                                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-all duration-200 active:scale-95">
                                    {/* Mail is not imported, assuming it's a placeholder */}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
                                  </div>
                                  <span>Contact Sales</span>
                                </a>
                              )}
                            
                            </div>
                            <div className="flex space-x-3">
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-blue-600 to-slate-600 hover:from-blue-700 hover:to-slate-700 font-medium shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                              >
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Add to Shortlist
                </Button>
                            </div>
                          </div>
                        </div>
            </CardContent>
          </Card>
                  )
                })}
        </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
