"use client"

import Link from "next/link"
import {
  Building2,
  Sparkles,
  Globe,
  ExternalLink,
  Linkedin,
  ArrowUp,
  ArrowDown,
  Shield,
  DollarSign,
  Eye,
  Briefcase,
  Users,
  TrendingUp,
  Rocket,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

// Interface for competitor data structure
export interface Competitor {
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



interface CompetitorCardProps {
  competitor: Competitor
  index?: number
  showTrackButton?: boolean
  onTrackCompetitor?: (competitor: Competitor) => void
  mode?: "rfp" | "competitor" // Add mode prop
}

export default function CompetitorCard({ 
  competitor, 
  index = 0, 
  showTrackButton = true,
  onTrackCompetitor,
  mode = "competitor"
}: CompetitorCardProps) {
  const [accordionOpen, setAccordionOpen] = useState<string | null>(null)

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

  const growthIndicator = getGrowthIndicator(competitor.percentEmployeeGrowthOverLast6Months)
  const tierConfig = getTierConfig(competitor.tier)

  return (
    <Card
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
              {showTrackButton && (
                <Button
                  size="sm"
                  onClick={() => onTrackCompetitor?.(competitor)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-medium shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {mode === "rfp" ? "Add to Shortlist" : "Track Competitor"}
                </Button>
              )}
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

            {/* Pricing Plans */}
            {Array.isArray(competitor.pricingPlanSummaryResult) && competitor.pricingPlanSummaryResult.length > 0 && (
              <div className="mb-6 pl-4">
                <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                  Pricing Plans
                </h5>
                <div className="flex flex-wrap gap-2 max-w-full overflow-hidden">
                  {competitor.pricingPlanSummaryResult.slice(0, 10).map((plan, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-xs bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors duration-200 px-3 py-1 text-left whitespace-normal max-w-none"
                    >
                      {plan}
                    </Badge>
                  ))}
                  {competitor.pricingPlanSummaryResult.length > 10 && (
                    <Badge
                      variant="outline"
                      className="text-xs text-gray-500 border-gray-300 px-3 py-1"
                    >
                      +{competitor.pricingPlanSummaryResult.length - 10} more
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

            {/* Active Job Postings - Accordion */}
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
}
