"use client"

import Link from "next/link"
import {
  Building2,
  Users,
  Search,
  TrendingUp,
  Target,
  Globe,
  ArrowRight,
  Briefcase,
  Eye,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
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
              <div className="relative group">
                <div className="relative w-14 h-14 bg-gradient-to-r from-blue-600 to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Briefcase className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Business Intelligence Visuals</h1>
                <p className="text-gray-600 font-medium">Vendor & Competitor Discovery Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <Badge className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 shadow-md hover:shadow-lg transition-all duration-300">
                <Globe className="w-4 h-4 mr-2" />
                Enterprise Ready
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold text-gray-900 mb-8 leading-tight mt-4">
            Discover & Analyze
            <span className="text-blue-600 block">Your Business Landscape</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-12">
            Comprehensive vendor discovery and competitor intelligence in one powerful platform. Complement your existing intelligence with detailed, structured, and refreshable market insights.
          </p>
        </div>

        {/* Platform Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">

          {/* Competitor Analysis Card */}
          <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/95 backdrop-blur-sm hover:bg-white hover:scale-[1.02] transform overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100 p-8">
              <div className="flex items-center space-x-4 mb-4">
                <div className="relative group">
                  <div className="relative w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">Competitor Intelligence</CardTitle>
                  <p className="text-gray-600 font-medium">Analyze market competition</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative p-8 pt-4">
              <div className="space-y-6 mb-24">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-purple-100 rounded-lg mt-1">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Market Intelligence</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Track competitor funding, employee growth, product roadmaps, and strategic initiatives in
                      real-time.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-pink-100 rounded-lg mt-1">
                    <Users className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Hiring & Job Analysis</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Monitor competitor job postings, hiring trends, and team expansion to understand strategic
                      direction.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-indigo-100 rounded-lg mt-1">
                    <Globe className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Product & Service Mapping</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Comprehensive analysis of competitor offerings, integrations, and go-to-market strategies.
                    </p>
                  </div>
                </div>
              </div>

              <Link href="/competitors">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 group">
                  <span className="flex items-center justify-center">
                    Analyze Competitors
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                  </span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          
          {/* Vendor Discovery Card */}
          <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/95 backdrop-blur-sm hover:bg-white hover:scale-[1.02] transform overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-slate-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative bg-gradient-to-r from-blue-50 to-slate-50 border-b border-gray-100 p-8">
              <div className="flex items-center space-x-4 mb-4">
                <div className="relative group">
                  <div className="relative w-12 h-12 bg-gradient-to-r from-blue-600 to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">Vendor Discovery</CardTitle>
                  <p className="text-gray-600 font-medium">Find qualified solution providers</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative p-8 pt-4">
              <div className="space-y-6 mb-12">

              <div className="flex items-start space-x-4">
                  <div className="p-2 bg-green-100 rounded-lg mt-1">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Detailed Company Profiles</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Access comprehensive vendor information including product features, pricing plans, team size, and
                      growth indicators.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg mt-1">
                    <Search className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">TBD: Advanced Search & Filtering</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Search by industry, technology stack, company size, and growth metrics. Find vendors that match
                      your specific requirements.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-purple-100 rounded-lg mt-1">
                    <Target className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">TBD: Smart Match Scoring</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Set your desired filters and our algorithm will use your preferences to rank vendors.
                    </p>
                  </div>
                </div>
              </div>

              <Link href="/vendors">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-slate-600 hover:from-blue-700 hover:to-slate-700 text-white font-semibold py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 group">
                  <span className="flex items-center justify-center">
                    Explore Vendors
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                  </span>
                </Button>
              </Link>
            </CardContent>
          </Card>

        </div>

       
      </div>
    </div>
  )
}
