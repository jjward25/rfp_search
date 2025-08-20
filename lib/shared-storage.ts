// Define proper types for company data
interface CompanyData {
  Company_Name: string
  search_query: string
  why_relevant?: string
  niche_focus?: string
  source?: string
  linkedinURL?: string | null
}

// Use a global variable that persists across function calls
declare global {
  var __companies: CompanyData[] | undefined
}

// Initialize shared storage with global persistence
const sharedCompanies: CompanyData[] = globalThis.__companies || []
globalThis.__companies = sharedCompanies

export function addCompany(company: CompanyData) {
  // Check if company already exists to avoid duplicates
  const exists = sharedCompanies.find(c => c.Company_Name === company.Company_Name)
  if (!exists) {
    sharedCompanies.push(company)
    globalThis.__companies = sharedCompanies
    console.log('Company added to shared storage. Total companies:', sharedCompanies.length)
  } else {
    console.log('Company already exists, skipping:', company.Company_Name)
  }
}

export function getSharedCompanies(): CompanyData[] {
  return globalThis.__companies || []
}

export function clearCompanies() {
  sharedCompanies.length = 0
  globalThis.__companies = []
  console.log('Companies cleared from storage')
}

export type { CompanyData }
