// Define proper types for company data
interface CompanyData {
  Company_Name: string
  search_query: string
  why_relevant?: string
  niche_focus?: string
  source?: string
  linkedinURL?: string | null
}

// Shared storage (in production, use a database)
const sharedCompanies: CompanyData[] = []

export function addCompany(company: CompanyData) {
  sharedCompanies.push(company)
  console.log('Company added to shared storage. Total companies:', sharedCompanies.length)
}

export function getSharedCompanies(): CompanyData[] {
  return sharedCompanies
}

export function clearCompanies() {
  sharedCompanies.length = 0
}

export type { CompanyData }
