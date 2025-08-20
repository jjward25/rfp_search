// Define proper types for company data
export interface CompanyData {
  Company_Name: string
  search_query: string
  why_relevant?: string
  niche_focus?: string
  source?: string
  linkedinURL?: string | null
}

// Use a combination of in-memory cache and simple persistence
let companiesCache: CompanyData[] = []
let lastUpdateTime = 0

// Simple persistence using a global object that survives longer in Vercel
declare global {
  var __globalCompaniesStore: {
    companies: CompanyData[]
    timestamp: number
  } | undefined
}

function initializeStorage(): void {
  if (!globalThis.__globalCompaniesStore) {
    globalThis.__globalCompaniesStore = {
      companies: [],
      timestamp: Date.now()
    }
  }
  
  // Load from global store if it's newer than our cache
  if (globalThis.__globalCompaniesStore.timestamp > lastUpdateTime) {
    companiesCache = [...globalThis.__globalCompaniesStore.companies]
    lastUpdateTime = globalThis.__globalCompaniesStore.timestamp
  }
}

function persistToStorage(): void {
  if (!globalThis.__globalCompaniesStore) {
    globalThis.__globalCompaniesStore = {
      companies: [],
      timestamp: Date.now()
    }
  }
  
  globalThis.__globalCompaniesStore.companies = [...companiesCache]
  globalThis.__globalCompaniesStore.timestamp = Date.now()
  lastUpdateTime = globalThis.__globalCompaniesStore.timestamp
}

export function addCompany(company: CompanyData): void {
  initializeStorage()
  
  // Check if company already exists to avoid duplicates
  const exists = companiesCache.find(c => c.Company_Name === company.Company_Name)
  if (!exists) {
    companiesCache.push(company)
    persistToStorage()
    console.log('Company added to persistent storage. Total companies:', companiesCache.length)
    console.log('Added company:', company.Company_Name)
  } else {
    console.log('Company already exists, skipping:', company.Company_Name)
  }
}

export function getSharedCompanies(): CompanyData[] {
  initializeStorage()
  console.log('Getting companies from persistent storage. Total:', companiesCache.length)
  return [...companiesCache]
}

export function clearCompanies(): void {
  companiesCache = []
  persistToStorage()
  console.log('Companies cleared from persistent storage')
}
