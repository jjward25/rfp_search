"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Filter,
  Users,
  Building2,
  Sparkles,
  Target,
  FileText,
  Send,
  Briefcase,
  Globe,
  ExternalLink,
  Mail,
  Linkedin,
  ArrowUp,
  ArrowDown,
  Star,
  Zap,
  Award,
  Rocket,
  Crown,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"

// Interface for vendor data structure
interface Vendor {
  id: number
  companyName: string
  domain: string
  linkedinCompanyUrl: string
  employeeCount: number
  percentEmployeeGrowthOverLast6Months: number
  productFeatures: string[]
  pricingPlanSummaryResult: string
  industry: string
  description: string
  salesContactEmail: string
  enterpriseSalesRepLinkedinUrl: string
  matchScore: number
  tier: string
}

// Robust CSV parsing function that handles multi-line values and escaped quotes
const parseCSV = (csvText: string): Vendor[] => {
  const vendors: Vendor[] = []
  let currentRow: string[] = []
  let currentField = ''
  let inQuotes = false
  let rowIndex = 0
  
  // Process character by character to handle multi-line fields
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i]
    const nextChar = csvText[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote within field
        currentField += '"'
        i++ // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      currentRow.push(currentField.trim())
      currentField = ''
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // End of row (only if not within quotes)
      if (char === '\r' && nextChar === '\n') {
        i++ // Skip \r\n
      }
      
      // Add the last field
      currentRow.push(currentField.trim())
      
      // Process the row if it has enough columns
      if (currentRow.length >= 11 && rowIndex > 0) { // Skip header row
        const vendor = parseVendorRow(currentRow, rowIndex)
        if (vendor) {
          vendors.push(vendor)
        }
      }
      
      // Reset for next row
      currentRow = []
      currentField = ''
      rowIndex++
    } else {
      // Regular character
      currentField += char
    }
  }
  
  // Handle the last row if file doesn't end with newline
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim())
    if (currentRow.length >= 11 && rowIndex > 0) {
      const vendor = parseVendorRow(currentRow, rowIndex)
      if (vendor) {
        vendors.push(vendor)
      }
    }
  }
  
  return vendors.sort((a, b) => b.matchScore - a.matchScore)
}

const parseVendorRow = (row: string[], index: number): Vendor | null => {
  try {
    // Map CSV columns to our data structure
    const companyName = cleanField(row[1])
    const domain = cleanField(row[2])
    const linkedinUrl = cleanField(row[3])
    const employeeCountStr = cleanField(row[4])
    const growthStr = cleanField(row[5])
    const featuresStr = cleanField(row[6])
    const pricing = cleanField(row[7])
    const industry = cleanField(row[8])
    const description = cleanField(row[9])
    const salesEmail = cleanField(row[10])
    const salesRepLinkedin = row[11] ? cleanField(row[11]) : ''
    
    // Skip rows with missing essential data
    if (!companyName || companyName === 'Company Name' || !industry) {
      return null
    }
    
    // Parse numeric values safely
    const employeeCount = parseNumericValue(employeeCountStr)
    const growth = parseFloat(growthStr) || 0
    
    // Parse product features from the description-like text
    const features = extractFeatures(featuresStr, description)
    
    // Calculate match score
    const matchScore = calculateMatchScore(description, features, employeeCount, growth)
    
    // Determine tier
    const tier = determineTier(employeeCount, growth)
    
    return {
      id: index,
      companyName,
      domain,
      linkedinCompanyUrl: linkedinUrl,
      employeeCount,
      percentEmployeeGrowthOverLast6Months: growth,
      productFeatures: features,
      pricingPlanSummaryResult: pricing,
      industry,
      description,
      salesContactEmail: salesEmail,
      enterpriseSalesRepLinkedinUrl: salesRepLinkedin,
      matchScore,
      tier
    }
  } catch (error) {
    console.warn('Error parsing vendor row:', error)
    return null
  }
}

const cleanField = (field: string): string => {
  if (!field) return ''
  return field
    .replace(/^["'\s]+|["'\s]+$/g, '') // Remove leading/trailing quotes and spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

const parseNumericValue = (value: string): number => {
  if (!value) return 0
  // Remove commas and other non-numeric characters except decimal point
  const cleaned = value.replace(/[^\d.-]/g, '')
  const parsed = parseInt(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

const calculateMatchScore = (description: string, features: string[], employeeCount: number, growth: number): number => {
  let score = 50 // Base score
  
  // Description quality
  if (description.length > 200) score += 15
  else if (description.length > 100) score += 10
  else if (description.length > 50) score += 5
  
  // Feature richness
  if (features.length > 6) score += 15
  else if (features.length > 3) score += 10
  else if (features.length > 0) score += 5
  
  // Company size
  if (employeeCount > 1000) score += 10
  else if (employeeCount > 500) score += 8
  else if (employeeCount > 100) score += 5
  else if (employeeCount > 50) score += 3
  
  // Growth
  if (growth > 30) score += 15
  else if (growth > 20) score += 12
  else if (growth > 10) score += 8
  else if (growth > 5) score += 5
  else if (growth > 0) score += 2
  
  return Math.min(score, 100)
}

const determineTier = (employeeCount: number, growth: number): string => {
  if (employeeCount > 2000 && growth > 0) return 'enterprise'
  if (employeeCount > 1000 || (employeeCount > 500 && growth > 10)) return 'growth'
  if (employeeCount > 200 || growth > 20) return 'emerging'
  return 'startup'
}

const extractFeatures = (featuresStr: string, description: string): string[] => {
  const features: string[] = []
  const text = `${featuresStr} ${description}`.toLowerCase()

  // Enhanced technology keywords based on your sample data
  const techKeywords = [
    // Cloud & Infrastructure
    "cloud computing",
    "aws",
    "azure",
    "serverless",
    "edge network",
    "cdn",
    "infrastructure",
    "compute",
    "storage",
    "databases",
    "networking",
    "global edge",
    "multi-region",

    // AI & Analytics
    "ai",
    "machine learning",
    "analytics",
    "predictive analytics",
    "data preparation",
    "automated insights",
    "generative ai",
    "automl",
    "data blending",
    "statistical modeling",

    // Development & Deployment
    "git integration",
    "ci/cd",
    "deployment",
    "preview deployments",
    "rollbacks",
    "developer tools",
    "drag-and-drop",
    "workflow automation",
    "api integration",

    // Security & Compliance
    "security",
    "firewall",
    "ddos protection",
    "encryption",
    "authentication",
    "governance",
    "audit log",
    "scim",
    "access controls",
    "waf protection",

    // Business Applications
    "expense management",
    "receipt scanning",
    "reimbursement",
    "bill pay",
    "travel booking",
    "reporting",
    "dashboard",
    "collaboration",
    "mobile app",
    "real-time",

    // Integration & Connectivity
    "integration",
    "api",
    "webhook",
    "data sources",
    "bi tools",
    "accounting software",
    "marketplace",
    "third-party",
    "connectors",
  ]

  // Extract compound features (multi-word)
  const compoundFeatures = [
    "machine learning",
    "data preparation",
    "expense management",
    "receipt scanning",
    "cloud computing",
    "predictive analytics",
    "automated insights",
    "drag-and-drop",
    "real-time analytics",
    "global edge network",
    "ci/cd deployment",
    "api integration",
  ]

  // First check for compound features
  compoundFeatures.forEach((feature) => {
    if (text.includes(feature.toLowerCase())) {
      features.push(
        feature
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
      )
    }
  })

  // Then check for single keywords (avoid duplicates)
  techKeywords.forEach((keyword) => {
    if (
      text.includes(keyword) &&
      !features.some((f) => f.toLowerCase().includes(keyword) || keyword.includes(f.toLowerCase()))
    ) {
      features.push(keyword.charAt(0).toUpperCase() + keyword.slice(1))
    }
  })

  // Extract structured features from bullet points or feature lists
  const structuredFeatures = featuresStr.match(/[A-Z][^.!?]*?:/g)
  if (structuredFeatures) {
    structuredFeatures.forEach((feature) => {
      const cleaned = feature.replace(":", "").trim()
      if (cleaned.length > 3 && cleaned.length < 40 && !features.includes(cleaned)) {
        features.push(cleaned)
      }
    })
  }

  // Extract key capabilities from description
  const capabilityPatterns = [
    /offers?\s+([^,]{10,40})/gi,
    /includes?\s+([^,]{10,40})/gi,
    /provides?\s+([^,]{10,40})/gi,
    /features?\s+([^,]{10,40})/gi,
  ]

  capabilityPatterns.forEach((pattern) => {
    const matches = description.match(pattern)
    if (matches) {
      matches.slice(0, 3).forEach((match) => {
        const capability = match.replace(/^(offers?|includes?|provides?|features?)\s+/i, "").trim()
        if (
          capability.length > 10 &&
          capability.length < 50 &&
          !features.some((f) => f.toLowerCase().includes(capability.toLowerCase()))
        ) {
          features.push(capability.charAt(0).toUpperCase() + capability.slice(1))
        }
      })
    }
  })

  return [...new Set(features)].slice(0, 8) // Remove duplicates and limit
}

const businessNeedSuggestions = [
  "cloud computing",
  "software development", 
  "cybersecurity",
  "analytics",
  "human resources",
  "email management",
  "sales automation",
  "workflow automation",
  "data management",
  "e-learning",
  "scheduling",
  "expense management"
]

const AnimatedMatchScore = ({ score, tier }: { score: number; tier: string }) => {
  const [displayScore, setDisplayScore] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayScore((prev) => {
          if (prev >= score) {
            clearInterval(interval)
            setIsAnimating(false)
            return score
          }
          return prev + 2
        })
      }, 30)
      return () => clearInterval(interval)
    }, Math.random() * 300)

    return () => clearTimeout(timer)
  }, [score])

  const getTierConfig = (tier: string) => {
    switch (tier) {
      case "enterprise":
        return {
          icon: Crown,
          color: "text-slate-700",
          bgGradient: "from-slate-600 to-slate-700",
          glowColor: "shadow-slate-500/20",
          badge: "ENTERPRISE",
        }
      case "growth":
        return {
          icon: Rocket,
          color: "text-blue-700",
          bgGradient: "from-blue-600 to-blue-700",
          glowColor: "shadow-blue-500/20",
          badge: "GROWTH",
        }
      case "emerging":
        return {
          icon: Sparkles,
          color: "text-indigo-700",
          bgGradient: "from-indigo-600 to-indigo-700",
          glowColor: "shadow-indigo-500/20",
          badge: "EMERGING",
        }
      default:
        return {
          icon: Zap,
          color: "text-gray-700",
          bgGradient: "from-gray-600 to-gray-700",
          glowColor: "shadow-gray-500/20",
          badge: "STARTUP",
        }
    }
  }

  const config = getTierConfig(tier)
  const IconComponent = config.icon

  return (
    <div className="relative">
      {/* Animated background glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${config.bgGradient} rounded-xl blur-lg opacity-15 ${isAnimating ? "animate-pulse" : ""}`}
      />

      <div
        className={`relative bg-gradient-to-br ${config.bgGradient} rounded-xl p-6 text-white shadow-lg ${config.glowColor}`}
      >
        <div className="text-center">
          <div className="mb-3 flex justify-center">
            <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
              <IconComponent className="w-6 h-6" />
            </div>
          </div>
          <div className={`text-3xl font-bold mb-2 ${isAnimating ? "animate-pulse" : ""}`}>{displayScore}%</div>
          <div className="text-xs font-semibold uppercase tracking-wider opacity-90">{config.badge}</div>
          {score >= 90 && (
            <div className="mt-2 flex justify-center">
              <Star className="w-4 h-4 text-yellow-300 fill-current animate-bounce" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VendorDiscoveryPlatform() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [matchScoreFilter, setMatchScoreFilter] = useState(0)
  const [minEmployees, setMinEmployees] = useState(0)
  const [tagSearch, setTagSearch] = useState("")

  // Load CSV data on component mount
  useEffect(() => {
    const loadVendors = async () => {
      try {
        const response = await fetch('/enrichedData.csv')
        const csvText = await response.text()
        console.log('CSV loaded, length:', csvText.length)
        const parsedVendors = parseCSV(csvText)
        console.log('Parsed vendors:', parsedVendors.length)
        setVendors(parsedVendors)
        setFilteredVendors(parsedVendors)
      } catch (error) {
        console.error('Error loading vendor data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadVendors()
  }, [])

  // Filter vendors based on search criteria
  useEffect(() => {
    let filtered = vendors.filter(vendor => {
      // Search query filter (searches in industry and description)
      const searchMatch = !searchQuery || 
        vendor.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.productFeatures.some(feature => 
          feature.toLowerCase().includes(searchQuery.toLowerCase())
        )

      // Match score filter
      const scoreMatch = vendor.matchScore >= matchScoreFilter

      // Employee count filter  
      const employeeMatch = vendor.employeeCount >= minEmployees

      // Product features filter
      const tagMatch = !tagSearch || 
        vendor.productFeatures.some(feature =>
          feature.toLowerCase().includes(tagSearch.toLowerCase())
        ) ||
        vendor.description.toLowerCase().includes(tagSearch.toLowerCase())

      return searchMatch && scoreMatch && employeeMatch && tagMatch
    })

    setFilteredVendors(filtered)
  }, [vendors, searchQuery, matchScoreFilter, minEmployees, tagSearch])

  const filteredSuggestions = businessNeedSuggestions.filter((suggestion) =>
    suggestion.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getTierConfig = (tier: string) => {
    switch (tier) {
      case "enterprise":
        return {
          badge: "bg-slate-700 text-white shadow-md",
          border: "border-l-slate-600 hover:border-l-slate-700 hover:shadow-slate-500/10",
          accent: "text-slate-600",
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
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Header */}
      <header className="relative bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-slate-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300 animate-pulse" />
                <div className="relative w-14 h-14 bg-gradient-to-r from-blue-600 to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Briefcase className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  VendorScope
                </h1>
                <p className="text-gray-600 font-medium">Enterprise Vendor Discovery Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <Badge className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 shadow-md hover:shadow-lg transition-all duration-300">
                <Globe className="w-4 h-4 mr-2" />
                {vendors.length.toLocaleString()} Verified Vendors
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
              Find the Right Vendors
              <span className="text-blue-600 block">
                for Your Business
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Search by industry, description, or technology needs to discover qualified solution providers
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-slate-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition duration-500 animate-pulse" />
              <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200">
                <div className="flex items-center p-4">
                  <div className="ml-4 p-3 bg-gradient-to-r from-blue-600 to-slate-600 rounded-xl">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search by industry, description, or technology needs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1 border-0 text-lg placeholder-gray-500 focus:ring-0 px-6 py-5 bg-transparent font-medium"
                  />
                  <Button
                    onClick={handleSearch}
                    className="bg-gradient-to-r from-blue-600 to-slate-600 hover:from-blue-700 hover:to-slate-700 text-white font-semibold px-8 py-5 rounded-xl mr-4 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Search Vendors
                  </Button>
                </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 shadow-lg border-0 bg-white/90 backdrop-blur-xl">
              <CardHeader className="bg-gray-50 rounded-t-xl border-b border-gray-100">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Filter className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold">Filter Vendors</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 p-6">
                {/* Match Score Filter */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-4 block flex items-center">
                    <Target className="w-4 h-4 mr-2 text-blue-600" />
                    Match Score: {matchScoreFilter}%
                  </label>
                  <Slider
                    value={[matchScoreFilter]}
                    onValueChange={(value) => setMatchScoreFilter(value[0])}
                    max={100}
                    min={0}
                    step={5}
                    className="mb-3"
                  />
                  <div className="flex justify-between text-xs text-gray-500 font-medium">
                    <span>0%</span>
                    <span>Perfect Match 100%</span>
                  </div>
                </div>

                <Separator />

                {/* Employee Count Filter */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-4 block flex items-center">
                    <Users className="w-4 h-4 mr-2 text-blue-600" />
                    Team Size: {minEmployees}+
                  </label>
                  <Slider
                    value={[minEmployees]}
                    onValueChange={(value) => setMinEmployees(value[0])}
                    max={5000}
                    min={0}
                    step={100}
                    className="mb-3"
                  />
                  <div className="flex justify-between text-xs text-gray-500 font-medium">
                    <span>Startup</span>
                    <span>Enterprise 5000+</span>
                  </div>
                </div>

                <Separator />

                {/* Product Features Search */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center">
                    <Sparkles className="w-4 h-4 mr-2 text-blue-600" />
                    Technology & Features
                  </label>
                  <Input
                    type="text"
                    placeholder="API, Analytics, Security..."
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    className="border-gray-300 focus:border-blue-500 rounded-lg"
                  />
                  {tagSearch && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-700 font-medium">Filtering by: "{tagSearch}"</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{filteredVendors.length} Qualified Vendors Found</h3>
                <p className="text-gray-600">
                  {searchQuery && `Results for "${searchQuery}" • `}
                  Ranked by capability match and reliability
                </p>
              </div>
            </div>

            {filteredVendors.length === 0 ? (
              <Card className="p-12 text-center bg-white/90 backdrop-blur-xl shadow-lg">
                <CardContent>
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
                              <h4 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                                {vendor.companyName}
                              </h4>
                              <Badge
                                className={`${tierConfig.badge} font-semibold text-xs px-3 py-1 shadow-sm`}
                              >
                                {vendor.tier.toUpperCase()}
                              </Badge>
                              {vendor.domain && (
                                <a
                                  href={`https://${vendor.domain}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 hover:scale-110 transition-all duration-200 shadow-sm"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>

                            <div className="flex items-center space-x-4 mb-4">
                              <div className="flex items-center space-x-2">
                                <Shield className={`w-4 h-4 ${tierConfig.accent}`} />
                                <p className="text-gray-700 font-medium">{vendor.industry}</p>
                              </div>
                              {vendor.linkedinCompanyUrl && (
                                <a
                                  href={vendor.linkedinCompanyUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 hover:scale-110 transition-all duration-200 shadow-sm"
                                >
                                  <Linkedin className="w-4 h-4" />
                                </a>
                              )}
                            </div>

                            <p className="text-gray-600 mb-4 leading-relaxed line-clamp-3">
                              {vendor.description}
                            </p>

                            {vendor.productFeatures.length > 0 && (
                              <div className="mb-4">
                                <div className="flex flex-wrap gap-2">
                                  {vendor.productFeatures.slice(0, 6).map((feature, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors duration-200 px-3 py-1"
                                    >
                                      {feature}
                                    </Badge>
                                  ))}
                                  {vendor.productFeatures.length > 6 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-gray-500 border-gray-300 px-3 py-1"
                                    >
                                      +{vendor.productFeatures.length - 6} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {vendor.pricingPlanSummaryResult && (
                              <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                  <Award className="w-4 h-4 mr-2 text-blue-600" />
                                  Pricing Plans
                                </h5>
                                <div className="text-sm text-gray-700 space-y-3">
                                  {(() => {
                                    const pricingText = vendor.pricingPlanSummaryResult

                                    // Common plan keywords to look for
                                    const planKeywords = [
                                      'free plan', 'free tier', 'free',
                                      'hobby plan', 'hobby',
                                      'starter plan', 'starter', 'basic plan', 'basic',
                                      'professional plan', 'professional', 'pro plan', 'pro',
                                      'business plan', 'business',
                                      'enterprise plan', 'enterprise',
                                      'team plan', 'team',
                                      'premium plan', 'premium',
                                      'plus plan', 'plus',
                                      'standard plan', 'standard'
                                    ]

                                    // First try to find plans using common keywords
                                    let plans: string[] = []
                                    
                                    // Look for plan patterns with keywords
                                    const planPatterns = [
                                      // Pattern: "Plan Name Plan: description"
                                      /(?:^|\n|-)?\s*([A-Z][^:\n]*(?:Plan|Tier|Edition)[^:\n]*?):\s*([^.\n]+(?:\.[^A-Z\n]*)*)/gi,
                                      // Pattern: "Plan Name: description"
                                      /(?:^|\n|-)?\s*((?:Free|Hobby|Starter|Basic|Pro|Professional|Business|Enterprise|Team|Premium|Plus|Standard)[^:\n]*?):\s*([^.\n]+(?:\.[^A-Z\n]*)*)/gi,
                                      // Pattern: "- Plan Name, description"
                                      /(?:^|\n)-\s*([A-Z][^,\n]*(?:Plan|Tier|Edition)[^,\n]*?),\s*([^.\n]+(?:\.[^A-Z\n]*)*)/gi,
                                      // Pattern: "**Plan Name** description"
                                      /\*\*([^*]+(?:Plan|Tier|Edition|Free|Pro|Enterprise|Basic|Premium)[^*]*?)\*\*[,\s]*([^*\n]+(?:\.[^*\n]*)*)/gi
                                    ]

                                    // Try each pattern
                                    for (const pattern of planPatterns) {
                                      const matches = [...pricingText.matchAll(pattern)]
                                      if (matches.length > 0) {
                                        plans = matches.map(match => {
                                          const planName = match[1]?.trim() || ''
                                          const planDetails = match[2]?.trim() || ''
                                          return planName && planDetails ? `${planName}: ${planDetails}` : match[0]
                                        }).filter(plan => plan.length > 10)
                                        
                                        if (plans.length > 0) break
                                      }
                                    }

                                    // Fallback: Split by common separators if no structured plans found
                                    if (plans.length === 0) {
                                      const separators = [
                                        /- (?=[A-Z])/g,
                                        /\n(?=[A-Z][^:\n]*:)/g,
                                        /(?=\*\*[A-Z])/g
                                      ]

                                      for (const separator of separators) {
                                        const splitPlans = pricingText.split(separator).filter(plan => {
                                          const cleaned = plan.trim().replace(/^[-*\s]+/, '')
                                          return cleaned.length > 15 && 
                                                 (cleaned.toLowerCase().includes('plan') || 
                                                  cleaned.toLowerCase().includes('tier') ||
                                                  cleaned.toLowerCase().includes('free') ||
                                                  cleaned.toLowerCase().includes('pro') ||
                                                  cleaned.toLowerCase().includes('enterprise') ||
                                                  cleaned.toLowerCase().includes('basic') ||
                                                  cleaned.toLowerCase().includes('premium') ||
                                                  /\$\d+/.test(cleaned))
                                        })
                                        
                                        if (splitPlans.length > 1) {
                                          plans = splitPlans
                                          break
                                        }
                                      }
                                    }

                                    // Final fallback: if still no plans, try to find pricing mentions
                                    if (plans.length === 0) {
                                      const priceMatches = pricingText.match(/[^.!?]*\$\d+[^.!?]*/g)
                                      if (priceMatches && priceMatches.length > 0) {
                                        plans = priceMatches.slice(0, 3)
                                      } else {
                                        // Just show the first part of the text if nothing else works
                                        plans = [pricingText.slice(0, 200) + (pricingText.length > 200 ? '...' : '')]
                                      }
                                    }

                                    // Limit to 5 plans maximum
                                    const limitedPlans = plans.slice(0, 5)

                                    return limitedPlans.map((plan, index) => {
                                      // Clean up the plan text
                                      let cleanPlan = plan
                                        .replace(/^[-*\s]+/, '')
                                        .replace(/\*\*/g, '')
                                        .trim()

                                      // Try to separate plan name from details
                                      const colonIndex = cleanPlan.indexOf(':')
                                      let planName = ''
                                      let planDetails = cleanPlan

                                      if (colonIndex > 0 && colonIndex < 50) {
                                        planName = cleanPlan.substring(0, colonIndex).trim()
                                        planDetails = cleanPlan.substring(colonIndex + 1).trim()
                                      } else {
                                        // Try to extract plan name from beginning
                                        const planNameMatch = cleanPlan.match(/^([A-Z][^,.$]*(?:Plan|Tier|Edition|Free|Pro|Enterprise|Basic|Premium|Plus|Standard)[^,.$]*)/i)
                                        if (planNameMatch && planNameMatch[1].length < 30) {
                                          planName = planNameMatch[1].trim()
                                          planDetails = cleanPlan.replace(planNameMatch[1], '').replace(/^[,:.\s-]+/, '').trim()
                                        }
                                      }

                                      // Clean up details - remove excessive spacing and fix character splits
                                      planDetails = planDetails
                                        .replace(/\s+/g, ' ')
                                        .replace(/([A-Z])\s+([A-Z])\s+([A-Z])/g, '$1$2$3') // Fix "G P T" -> "GPT"
                                        .replace(/([A-Z])\s+([a-z])/g, '$1$2') // Fix "A pi" -> "Api"
                                        .replace(/(\d)\s+([A-Z])/g, '$1$2') // Fix "4 M" -> "4M"
                                        .trim()

                                      // Truncate if too long
                                      if (planDetails.length > 120) {
                                        planDetails = planDetails.slice(0, 120) + '...'
                                      }

                                      // Skip if the plan seems malformed (too much character splitting)
                                      if (planDetails.includes(' G P T') || planDetails.includes(' A P I') || planDetails.match(/[A-Z]\s[A-Z]\s[A-Z]/)) {
                                        return null
                                      }

                                      return (
                                        <div
                                          key={index}
                                          className="border-l-3 border-blue-400 pl-4 py-2 bg-white rounded-r-lg shadow-sm"
                                        >
                                          {planName && (
                                            <div className="font-semibold text-gray-800 text-sm mb-1">{planName}</div>
                                          )}
                                          <div className="text-xs text-gray-600 leading-relaxed">
                                            {planDetails}
                                          </div>
                                        </div>
                                      )
                                    }).filter(Boolean) // Remove null entries
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="ml-6">
                            <AnimatedMatchScore score={vendor.matchScore} tier={vendor.tier} />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl shadow-sm">
                            <div className="p-2 bg-blue-600 rounded-lg">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Team Size</p>
                              <p className="font-bold text-lg text-gray-900">{vendor.employeeCount.toLocaleString()}</p>
                            </div>
                          </div>

                          <div
                            className={`flex items-center space-x-3 p-4 rounded-xl shadow-sm ${growthIndicator.bg}`}
                          >
                            <div className={`p-2 rounded-lg ${growthIndicator.color.replace("text-", "bg-").replace("-700", "-600")}`}>
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

                          <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl shadow-sm">
                            <div className="p-2 bg-green-600 rounded-lg">
                              <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Features</p>
                              <p className="font-bold text-lg text-gray-900">{vendor.productFeatures.length}</p>
                            </div>
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
                                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-200">
                                    <Mail className="w-4 h-4" />
                                  </div>
                                  <span>Sales Contact</span>
                                </a>
                              )}
                              {vendor.enterpriseSalesRepLinkedinUrl && (
                                <a
                                  href={vendor.enterpriseSalesRepLinkedinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium group"
                                >
                                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-200">
                                    <Linkedin className="w-4 h-4" />
                                  </div>
                                  <span>Sales Rep</span>
                                </a>
                              )}
                            </div>
                            <div className="flex space-x-3">
                              <Button
                                variant="outline"
                                size="sm"
                                className="font-medium bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                View Profile
                              </Button>
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-blue-600 to-slate-600 hover:from-blue-700 hover:to-slate-700 font-medium shadow-md hover:shadow-lg transition-all duration-300"
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Request RFP
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
