import { NextRequest, NextResponse } from 'next/server'

// Define proper types
interface CompanyData {
  Company_Name: string
  search_query: string
  why_relevant?: string
  niche_focus?: string
  source?: string
  linkedinURL?: string | null
}

// In-memory storage for received companies (in production, use a database)
const receivedCompanies: CompanyData[] = []

export async function GET(request: NextRequest) {
  // Return the current list of companies instead of a stream
  return NextResponse.json({
    companies: receivedCompanies,
    total: receivedCompanies.length,
    timestamp: new Date().toISOString()
  })
}

// Function to add a company (called by the webhook)
export function addCompany(company: CompanyData) {
  receivedCompanies.push(company)
  console.log('Company added to storage. Total companies:', receivedCompanies.length)
}

// Function to get all received companies
export function getCompanies() {
  return receivedCompanies
}

// Function to clear companies (for testing)
export function clearCompanies() {
  receivedCompanies.length = 0
}
