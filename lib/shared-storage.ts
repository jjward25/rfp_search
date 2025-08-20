// Define proper types for company data
export interface CompanyData {
  Company_Name: string
  search_query: string
  why_relevant?: string
  niche_focus?: string
  source?: string
  linkedinURL?: string | null
}

// Use process.env as a hack for persistence (not recommended for production)
const STORAGE_KEY = 'COMPANIES_STORAGE'

function getStoredCompanies(): CompanyData[] {
  try {
    const stored = process.env[STORAGE_KEY]
    if (stored) {
      return JSON.parse(stored) as CompanyData[]
    }
  } catch (error) {
    console.error('Error parsing stored companies:', error)
  }
  return []
}

function storeCompanies(companies: CompanyData[]): void {
  try {
    process.env[STORAGE_KEY] = JSON.stringify(companies)
  } catch (error) {
    console.error('Error storing companies:', error)
  }
}

export function addCompany(company: CompanyData): void {
  const companies = getStoredCompanies()
  
  // Check if company already exists to avoid duplicates
  const exists = companies.find(c => c.Company_Name === company.Company_Name)
  if (!exists) {
    companies.push(company)
    storeCompanies(companies)
    console.log('Company added to storage. Total companies:', companies.length)
    console.log('Added company:', company.Company_Name)
    console.log('All stored companies:', companies.map(c => c.Company_Name))
  } else {
    console.log('Company already exists, skipping:', company.Company_Name)
  }
}

export function getSharedCompanies(): CompanyData[] {
  const companies = getStoredCompanies()
  console.log('Getting companies from storage. Total:', companies.length)
  return companies
}

export function clearCompanies(): void {
  storeCompanies([])
  console.log('Companies cleared from storage')
}
