"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Papa from "papaparse"
import {
  Search,
  Building2,
  Sparkles,
  Globe,
  ExternalLink,
  Linkedin,
  ArrowUp,
  ArrowDown,
  Shield,
  Home,
  DollarSign,
  Eye,
  BarChart3,
  Briefcase,
  Users,
  TrendingUp,
  Rocket,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Interface for competitor data structure
interface Competitor {
  id: number
  companyName: string
  domain: string
  linkedinCompanyUrl: string
  totalFundingRaised: string
  employeeCount: number
  percentEmployeeGrowthOverLast6Months: number
  productFeatures: string[]
  pricingPlanSummaryResult: string
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

// Define proper interfaces
interface JobData {
  title: string;
  url: string;
  description: string;
}

interface JobsDataRecord {
  [companyName: string]: JobData[];
}

interface CsvRowData {
  [key: string]: string;
}

// Papa Parse CSV parsing with job data merge
const parseCSV = (csvText: string): Promise<Competitor[]> => {
  console.log("Starting Papa Parse CSV parsing...")
  
  return new Promise(async (resolve, reject) => {
    try {
      // First, load the jobs data
      const jobsResponse = await fetch("/jobsList.csv")
      const jobsText = await jobsResponse.text()
      
      // Parse jobs data
      const jobsData: JobsDataRecord = {}
      Papa.parse(jobsText, {
        header: true,
        skipEmptyLines: true,
        complete: (jobsResults: Papa.ParseResult<CsvRowData>) => {
          console.log("Jobs data loaded:", jobsResults.data.length)
          
          // Group jobs by company name
          jobsResults.data.forEach((job: CsvRowData) => {
            const companyName = job["Company Name"]
            if (!jobsData[companyName]) {
              jobsData[companyName] = []
            }
            jobsData[companyName].push({
              title: job["Job Title"] || "",
              url: job["Job URL"] || "",
              description: job["Job Description"] || ""
            })
          })
          
          // Now parse the main competitors data
          Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results: Papa.ParseResult<CsvRowData>) => {
              console.log("Papa Parse results:", results.data.length)
              
              const competitors: Competitor[] = []
              
              results.data.forEach((row: CsvRowData, index: number) => {
                try {
                  const companyName = row["Company Name"] || ""
                  
                  // Get jobs for this company
                  const companyJobs = jobsData[companyName] || []
                  
                  const competitor: Competitor = {
                    id: index + 1,
                    companyName: companyName,
                    domain: row["domain"] || "",
                    linkedinCompanyUrl: row["LinkedIn Company URL"] || "",
                    totalFundingRaised: row["Total Funding Raised"] || "",
                    employeeCount: parseInt(row["Employee Count"]) || 0,
                    percentEmployeeGrowthOverLast6Months: parseFloat(row["Percent Employee Growth Over Last_6Months"]) || 0,
                    productFeatures: (row["Product Features"] || "").split('\n').filter((f: string) => f.trim()),
                    pricingPlanSummaryResult: row["Pricing Plan Summary Result"] || "",
                    customerNames: (row["Customer Names"] || "").split(',').filter((c: string) => c.trim()),
                    industry: row["Industry"] || "",
                    description: row["Description"] || "",
                    salesContactEmail: row["Sales Contact Email Sales Contact"] || "",
                    enterpriseSalesRepLinkedinUrl: row["Enterprise Sales Rep LinkedIn URL Linkedin Profile Url"] || "",
                    // Use jobs from jobsList.csv
                    jobTitles: companyJobs.map((job: JobData) => job.title),
                    jobUrls: companyJobs.map((job: JobData) => job.url),
                    jobDescriptions: companyJobs.map((job: JobData) => job.description),
                    integrationsList: (row["Integrations List"] || "").split(',').filter((i: string) => i.trim()),
                    companyRevenue: parseInt(row["Company Revenue"]) || 0,
                    productsAndServicesResult: (row["Products & Services Result"] || "").split(',').filter((p: string) => p.trim()),
                    productRoadmap: row["Product Roadmap"] || "",
                    tier: row["Tier"] || "startup",
                  }
                  competitors.push(competitor)
                } catch (error: unknown) {
                  console.warn("Error parsing row in Papa Parse:", error)
                }
              })
              
              console.log("Successfully parsed competitors:", competitors.length)
              resolve(competitors)
            },
            error: (error: unknown) => {
              console.error("Papa Parse Error:", error)
              reject(error)
            },
          })
        },
        error: (error: unknown) => {
          console.error("Jobs Parse Error:", error)
          reject(error)
        }
      })
    } catch (error) {
      console.error("Error loading jobs data:", error)
      reject(error)
    }
  })
}

const parseMultiValueField = (fieldValue: string, fieldType: string): string[] => {
  if (!fieldValue || fieldValue.trim() === "") return []

  let items: string[] = []

  // Different parsing strategies based on field type
  switch (fieldType) {
    case "features":
      // Regex pattern for bullet points: "* ", "- ", or "**" at the beginning of a line
      const bulletPattern = /^(?:\*\s|\-\s|\*\*)\s*(.*)/gm
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

export default function CompetitorDiscoveryPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [filteredCompetitors, setFilteredCompetitors] = useState<Competitor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [accordionOpen, setAccordionOpen] = useState<string | null>(null)

  // Load CSV data on component mount
  useEffect(() => {
    const loadCompetitors = async () => {
      try {
        const response = await fetch("/enrichedData.csv")
        const csvText = await response.text()
        console.log("CSV loaded, length:", csvText.length)
        const parsedCompetitors = await parseCSV(csvText)
        console.log("Parsed competitors:", parsedCompetitors.length)
        setCompetitors(parsedCompetitors)
        setFilteredCompetitors(parsedCompetitors)
      } catch (error) {
        console.error("Error loading competitor data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadCompetitors()
  }, [])

  // Filter competitors based on search criteria
  useEffect(() => {
    const filtered = competitors.filter((competitor) => {
      // Search query filter
      const searchMatch =
        !searchQuery ||
        competitor.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        competitor.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        competitor.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        competitor.productFeatures.some((feature) => feature.toLowerCase().includes(searchQuery.toLowerCase()))

      // Employee count filter
      const employeeMatch = competitor.employeeCount >= 0

      // Product features filter
      const tagMatch = true

      return searchMatch && employeeMatch && tagMatch
    })
    
    setFilteredCompetitors(filtered)
  }, [competitors, searchQuery])

  const filteredSuggestions = businessNeedSuggestions.filter((suggestion) =>
    suggestion.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getTierConfig = (tier: string) => {
    switch (tier) {
      case "enterprise":
        return {
          badge: "bg-purple-700 text-white shadow-md",
          border: "border-l-purple-600 hover:border-l-purple-700 hover:shadow-purple-500/10",
          accent: "text-purple-600",
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
        icon: ArrowUp,
        color: "text-green-700",
        bg: "bg-gradient-to-br from-green-50 to-green-100",
        label: "High Growth",
      }
    if (growth > 10)
      return {
        icon: ArrowUp,
        color: "text-blue-700",
        bg: "bg-gradient-to-br from-blue-50 to-blue-100",
        label: "Growing",
      }
    if (growth > 0)
      return {
        icon: ArrowUp,
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
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-lg opacity-20 animate-pulse"></div>
            <div className="relative animate-spin rounded-full h-32 w-32 border-8 border-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-border"></div>
          </div>
          <p className="text-xl text-gray-700 font-semibold mt-6">Loading competitor data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      {/* Subtle background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-400/5 rounded-full blur-3xl" />
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
                  <div className="relative w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Eye className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">CompetitorScope</h1>
                  <p className="text-gray-600 font-medium">Market Intelligence & Competitor Analysis</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/vendors">
                <Button variant="outline" className="font-medium bg-transparent">
                  View Vendors
                </Button>
              </Link>
              <Badge className="text-sm font-semibold bg-purple-600 text-white px-4 py-2 shadow-md hover:shadow-lg transition-all duration-300">
                <BarChart3 className="w-4 h-4 mr-2" />
                {competitors.length.toLocaleString()} Competitors Tracked
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
              Analyze Your Competition
          </h2> 
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Track competitor funding, hiring trends, product roadmaps, and strategic initiatives in real-time
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200">
              <div className="flex items-center p-4">
                <div className="ml-4 p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <Input
                  type="text"
                  placeholder="Search competitors by industry, technology, or market segment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 border-0 text-lg placeholder-gray-500 focus:ring-0 px-6 py-5 bg-transparent font-medium"
                />
                <Button
                  onClick={handleSearch}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-5 rounded-xl mr-4 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                >
                  Analyze Market
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
                      <div className="p-2 bg-purple-600 rounded-lg group-hover:scale-110 transition-transform duration-200">
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
                  {filteredCompetitors.length} Competitors Analyzed
                </h3>
                <p className="text-gray-600">
                  {searchQuery && `Results for "${searchQuery}" • `}
                  Ranked by market intelligence and strategic importance
                </p>
              </div>
            </div>

            {filteredCompetitors.length === 0 ? (
              <Card className="p-12 text-center bg-white/90 backdrop-blur-xl shadow-lg">
                <CardContent>
                  <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No competitors found</h3>
                  <p className="text-gray-500">Try adjusting your search criteria or filters</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredCompetitors.map((competitor, index) => {
                  const growthIndicator = getGrowthIndicator(competitor.percentEmployeeGrowthOverLast6Months)
                  const tierConfig = getTierConfig(competitor.tier)

                  return (
                    <Card
                      key={competitor.id}
                      className={`group hover:shadow-xl transition-all duration-500 border-l-4 ${tierConfig.border} bg-white/95 backdrop-blur-sm hover:bg-white hover:scale-[1.01] transform`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardContent className="p-8">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                <Link href={`${competitor.domain}`} target="_blank" rel="noopener noreferrer">
                                  <h4 className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
                                    {competitor.companyName}
                                  </h4>
                                </Link>
                                <Badge className={`${tierConfig.badge} font-semibold text-xs px-3 py-1 shadow-sm`}>
                                  {competitor.tier.toUpperCase()}
                                </Badge>
                                {competitor.domain && (
                                  <a
                                    href={`${competitor.domain}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-purple-600 rounded-lg text-white hover:bg-purple-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-medium shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                              >
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Track Competitor
                              </Button>
                            </div>

                            <div className="flex items-center space-x-6 mb-4">
                              <div className="flex items-center space-x-2">
                                <Shield className={`w-4 h-4 ${tierConfig.accent}`} />
                                <p className="text-gray-700 font-medium">{competitor.industry}</p>
                              </div>
                              {competitor.totalFundingRaised && (
                                <div className="flex items-center space-x-2">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <p className="text-gray-700 font-medium">{competitor.totalFundingRaised} Funding</p>
                                </div>
                              )}
                              {competitor.linkedinCompanyUrl && (
                                <a
                                  href={competitor.linkedinCompanyUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                                >
                                  <Linkedin className="w-4 h-4" />
                                </a>
                              )}
                            </div>

                            <p className="text-gray-600 mb-4 leading-relaxed line-clamp-3">{competitor.description}</p>

                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl shadow-sm">
                                <div className="p-2 bg-blue-600 rounded-lg">
                                  <Users className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-medium">Team Size</p>
                                  <p className="font-bold text-lg text-gray-900">
                                    {competitor.employeeCount.toLocaleString()}
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
                                    {competitor.percentEmployeeGrowthOverLast6Months > 0 ? "+" : ""}
                                    {competitor.percentEmployeeGrowthOverLast6Months}%
                                  </p>
                                </div>
                              </div>

                              {competitor.companyRevenue > 0 && (
                                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl shadow-sm">
                                  <div className="p-2 bg-green-600 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 font-medium">Revenue</p>
                                    <p className="font-bold text-lg text-gray-900">
                                      {formatCurrency(competitor.companyRevenue)}
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
                                  <p className="font-bold text-lg text-gray-900">{competitor.jobTitles.length}</p>
                                </div>
                              </div>

                            </div>

                            {/* Product Features */}
                            {competitor.productFeatures.length > 0 && (
                              <div className="mb-6 mt-8 pl-4">
                                <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                  <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                                  Key Features
                                </h5>
                                <div className="flex flex-wrap gap-2 max-w-full overflow-hidden">
                                  {competitor.productFeatures.slice(0, 10).map((feature, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="text-xs bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors duration-200 px-3 py-1 text-left whitespace-normal max-w-none"
                                    >
                                      {feature}
                                    </Badge>
                                  ))}
                                  {competitor.productFeatures.length > 10 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-gray-500 border-gray-300 px-3 py-1"
                                    >
                                      +{competitor.productFeatures.length - 10} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Products & Services */}
                            {competitor.productsAndServicesResult.length > 0 && (
                              <div className="mb-6 pl-4">
                                <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                  <Building2 className="w-4 h-4 mr-2 text-blue-600" />
                                  Products & Services
                                </h5>
                                <div className="flex flex-wrap gap-2 max-w-full overflow-hidden">
                                  {competitor.productsAndServicesResult.slice(0, 5).map((product, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors duration-200 px-3 py-1 max-w-xs truncate"
                                    >
                                      {product}
                                    </Badge>
                                  ))}
                                  {competitor.productsAndServicesResult.length > 5 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-gray-500 border-gray-300 px-3 py-1"
                                    >
                                      +{competitor.productsAndServicesResult.length - 5} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )} 

                            {/* Integrations */}
                            {competitor.integrationsList.length > 0 && (
                              <div className="mb-6 pl-4">
                                <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                  <Globe className="w-4 h-4 mr-2 text-green-600" />
                                  Integrations
                                </h5>
                                <div className="flex flex-wrap gap-2 max-w-full overflow-hidden">
                                  {competitor.integrationsList.slice(0, 5).map((integration, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="text-xs bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors duration-200 px-3 py-1 max-w-xs truncate"
                                    >
                                      {integration}
                                    </Badge>
                                  ))}
                                  {competitor.integrationsList.length > 5 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-gray-500 border-gray-300 px-3 py-1"
                                    >
                                      +{competitor.integrationsList.length - 5} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Customer Names */}
                            {competitor.customerNames.length > 0 && (
                              <div className="mb-10 pl-4">
                                <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                  <Eye className="w-4 h-4 mr-2 text-cyan-600" />
                                  Notable Customers
                                </h5>
                                {competitor.customerNames && competitor.customerNames.length > 0 ? (
                                  <div className="flex flex-wrap gap-2 max-w-full overflow-hidden">
                                    {competitor.customerNames.slice(0, 6).map((customer, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 transition-colors duration-200 px-3 py-1 max-w-xs truncate">
                                        {customer}
                                      </Badge>
                                    ))}
                                    {competitor.customerNames.length > 6 && (
                                      <Badge variant="outline" className="text-xs text-gray-500 border-gray-300 px-3 py-1">
                                        +{competitor.customerNames.length - 6} more
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-gray-500 text-sm italic">No notable customers listed</p>
                                )}
                              </div>
                            )}

                            {/* Active Job Postings - Accordion Header */}
                            {competitor.jobTitles.length > 0 && (
                              <div className="bg-gray-50 rounded-xl border border-gray-200 mb-4">
                                <button
                                  onClick={() =>
                                    setAccordionOpen(
                                      accordionOpen === `jobs-main-${competitor.id}` 
                                        ? null 
                                        : `jobs-main-${competitor.id}`
                                    )
                                  }
                                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100 transition-colors duration-200 rounded-xl"
                                >
                                  <h5 className="text-sm font-semibold text-gray-700 flex items-center">
                                    <Briefcase className="w-4 h-4 mr-2 text-indigo-600" />
                                    Active Job Postings ({competitor.jobTitles.length})
                                  </h5>
                                  {accordionOpen === `jobs-main-${competitor.id}` ? (
                                    <ArrowUp className="w-4 h-4 text-gray-500" />
                                  ) : (
                                    <ArrowDown className="w-4 h-4 text-gray-500" />
                                  )}
                                </button>
                                
                                {accordionOpen === `jobs-main-${competitor.id}` && (
                                  <div className="px-4 pb-4 space-y-3 animate-in fade-in duration-300">
                                    {(() => {
                                      // Create properly aligned job objects
                                      const alignedJobs = competitor.jobTitles.map((title, index) => ({
                                        title: title,
                                        url: competitor.jobUrls[index] || null,
                                        description: competitor.jobDescriptions[index] || null
                                      }));

                                      // Show first 5 jobs by default
                                      const defaultShowCount = 5;
                                      const jobsToShow = alignedJobs.slice(0, defaultShowCount);
                                      const remainingJobs = alignedJobs.slice(defaultShowCount);

                                      return (
                                        <>
                                          {jobsToShow.map((job, index) => (
                                            <div
                                              key={index}
                                              className="border-l-4 border-indigo-400 pl-4 py-3 bg-white rounded-r-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                                            >
                                              <div className="flex items-start justify-between mb-2">
                                                <h6 className="font-semibold text-gray-800 text-sm leading-tight">
                                                  {job.url ? (
                                                    <a
                                                      href={job.url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-indigo-600 hover:text-indigo-800 transition-colors duration-200 hover:underline"
                                                    >
                                                      {job.title}
                                                    </a>
                                                  ) : (
                                                    <span>{job.title}</span>
                                                  )}
                                                </h6>
                                                {job.url && (
                                                  <a
                                                    href={job.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 bg-indigo-100 rounded-md text-indigo-600 hover:bg-indigo-200 transition-colors duration-200 flex-shrink-0 ml-2"
                                                    title="View job posting"
                                                  >
                                                    <ExternalLink className="w-3 h-3" />
                                                  </a>
                                                )}
                                              </div>
                                              {job.description && (
                                                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 mt-1">
                                                  {job.description}
                                                </p>
                                              )}
                                            </div>
                                          ))}

                                          {/* Sub-accordion for remaining jobs */}
                                          {remainingJobs.length > 0 && (
                                            <div className="border-t border-gray-200 pt-3">
                                              <button
                                                onClick={() =>
                                                  setAccordionOpen(
                                                    accordionOpen === `jobs-sub-${competitor.id}` 
                                                      ? `jobs-main-${competitor.id}`
                                                      : `jobs-sub-${competitor.id}`
                                                  )
                                                }
                                                className="w-full flex items-center justify-center space-x-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200 py-2 px-4 rounded-lg hover:bg-indigo-50"
                                              >
                                                {accordionOpen === `jobs-sub-${competitor.id}` ? (
                                                  <>
                                                    <ArrowUp className="w-4 h-4" />
                                                    <span>Show less jobs</span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <ArrowDown className="w-4 h-4" />
                                                    <span>Show {remainingJobs.length} more job postings</span>
                                                  </>
                                                )}
                                              </button>
                                              
                                              {accordionOpen === `jobs-sub-${competitor.id}` && (
                                                <div className="mt-3 space-y-3 animate-in fade-in duration-300">
                                                  {remainingJobs.map((job, index) => (
                                                    <div
                                                      key={index + defaultShowCount}
                                                      className="border-l-4 border-indigo-400 pl-4 py-3 bg-white rounded-r-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                                                    >
                                                      <div className="flex items-start justify-between mb-2">
                                                        <h6 className="font-semibold text-gray-800 text-sm leading-tight">
                                                          {job.url ? (
                                                            <a
                                                              href={job.url}
                                                              target="_blank"
                                                              rel="noopener noreferrer"
                                                              className="text-indigo-600 hover:text-indigo-800 transition-colors duration-200 hover:underline"
                                                            >
                                                              {job.title}
                                                            </a>
                                                          ) : (
                                                            <span>{job.title}</span>
                                                          )}
                                                        </h6>
                                                        {job.url && (
                                                          <a
                                                            href={job.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1.5 bg-indigo-100 rounded-md text-indigo-600 hover:bg-indigo-200 transition-colors duration-200 flex-shrink-0 ml-2"
                                                            title="View job posting"
                                                          >
                                                            <ExternalLink className="w-3 h-3" />
                                                          </a>
                                                        )}
                                                      </div>
                                                      {job.description && (
                                                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 mt-1">
                                                          {job.description}
                                                        </p>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Product Roadmap */}
                            {competitor.productRoadmap && (
                              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                  <Rocket className="w-4 h-4 mr-2 text-purple-600" />
                                  Product Roadmap
                                </h5>
                                <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
                                  {competitor.productRoadmap}
                                </p>
                              </div>
                            )}
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
