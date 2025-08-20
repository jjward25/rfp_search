import { promises as fs } from 'fs'
import { join } from 'path'

// Define proper types for company data
export interface CompanyData {
  Company_Name: string
  search_query: string
  why_relevant?: string
  niche_focus?: string
  source?: string
  linkedinURL?: string | null
}

// Interface for enriched competitor data (from final enrichment)
export interface EnrichedCompetitor {
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
  // Additional metadata from final enrichment
  originalSearchQuery?: string
  enrichmentTimestamp?: string
  enrichmentSource?: string
}

// Use /tmp directory which persists across function calls in Vercel
const STORAGE_DIR = '/tmp'
const STORAGE_FILE = join(STORAGE_DIR, 'companies.json')
const ENRICHED_STORAGE_FILE = join(STORAGE_DIR, 'enriched-competitors.json')
const LOCK_FILE = join(STORAGE_DIR, 'companies.lock')
const ENRICHED_LOCK_FILE = join(STORAGE_DIR, 'enriched.lock')

async function ensureStorageDir(): Promise<void> {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true })
  } catch (error) {
    console.error('Error creating storage directory:', error)
  }
}

// Check if lock file exists and is not stale
async function isLockStale(): Promise<boolean> {
  try {
    const stats = await fs.stat(LOCK_FILE)
    const lockAge = Date.now() - stats.mtime.getTime()
    return lockAge > 5000 // Consider stale if older than 5 seconds
  } catch {
    return true // File doesn't exist, so no lock
  }
}

// Better locking with retry and stale lock cleanup
async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const maxRetries = 20
  const retryDelay = 100
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Clean up stale locks
      if (await isLockStale()) {
        try {
          await fs.unlink(LOCK_FILE)
        } catch {} // Ignore errors if file doesn't exist
      }

      // Try to acquire lock (exclusive create)
      await fs.writeFile(LOCK_FILE, Date.now().toString(), { flag: 'wx' })
      
      try {
        return await fn()
      } finally {
        // Always release lock
        try {
          await fs.unlink(LOCK_FILE)
        } catch (error) {
          console.error('Error releasing lock:', error)
        }
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code !== 'EEXIST') {
        throw error // Some other error, not lock contention
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }
  
  throw new Error('Could not acquire lock after maximum retries')
}

// Read companies from file with error handling
async function readCompaniesFromFile(): Promise<CompanyData[]> {
  try {
    await ensureStorageDir()
    const data = await fs.readFile(STORAGE_FILE, 'utf-8')
    const companies = JSON.parse(data) as CompanyData[]
    console.log('Read companies from file:', companies.length)
    console.log('Company names:', companies.map(c => c.Company_Name))
    return companies
  } catch (error) {
    // Type-safe error checking
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      // File doesn't exist yet, return empty array
      console.log('Companies file does not exist yet, starting with empty array')
      return []
    }
    console.error('Error reading companies file:', error)
    return []
  }
}

// Atomic write using temporary file
async function atomicWriteCompanies(companies: CompanyData[]): Promise<void> {
  const tempFile = `${STORAGE_FILE}.tmp.${Date.now()}.${Math.random()}`
  
  try {
    await ensureStorageDir()
    
    // Write to temporary file first
    await fs.writeFile(tempFile, JSON.stringify(companies, null, 2), 'utf-8')
    
    // Atomically move temp file to final location
    await fs.rename(tempFile, STORAGE_FILE)
    
    console.log('✅ Atomic write completed:', companies.length)
    console.log('Written company names:', companies.map(c => c.Company_Name))
  } catch (error) {
    console.error('Error in atomic write:', error)
    
    // Cleanup temp file on error
    try {
      await fs.unlink(tempFile)
    } catch {} // Ignore cleanup errors
    
    throw error
  }
}

// Add single company with proper locking
export async function addCompany(company: CompanyData): Promise<void> {
  console.log('=== ATTEMPTING TO ADD COMPANY ===')
  console.log('Company to add:', company.Company_Name)
  
  try {
    await withLock(async () => {
      const companies = await readCompaniesFromFile()
      console.log('Current companies before add:', companies.map(c => c.Company_Name))
      
      // Check if company already exists to avoid duplicates
      const exists = companies.find(c => c.Company_Name === company.Company_Name)
      
      if (!exists) {
        companies.push(company)
        await atomicWriteCompanies(companies)
        console.log('✅ Company added successfully. Total companies:', companies.length)
        console.log('✅ Added company:', company.Company_Name)
      } else {
        console.log('❌ Company already exists, skipping:', company.Company_Name)
      }
    })
  } catch (error) {
    console.error('❌ Error adding company:', error)
    throw error
  }
}

// Add multiple companies in one transaction (more efficient)
export async function addCompanies(newCompanies: CompanyData[]): Promise<void> {
  console.log('=== ATTEMPTING TO ADD MULTIPLE COMPANIES ===')
  console.log('Companies to add:', newCompanies.map(c => c.Company_Name))
  
  try {
    await withLock(async () => {
      const existingCompanies = await readCompaniesFromFile()
      console.log('Current companies before add:', existingCompanies.map(c => c.Company_Name))
      
      // Filter out duplicates
      const companiesToAdd = newCompanies.filter(newCompany => 
        !existingCompanies.find(existing => existing.Company_Name === newCompany.Company_Name)
      )
      
      if (companiesToAdd.length > 0) {
        const allCompanies = [...existingCompanies, ...companiesToAdd]
        await atomicWriteCompanies(allCompanies)
        console.log('✅ Companies added successfully. Total companies:', allCompanies.length)
        console.log('✅ Added companies:', companiesToAdd.map(c => c.Company_Name))
      } else {
        console.log('❌ All companies already exist, nothing to add')
      }
    })
  } catch (error) {
    console.error('❌ Error adding companies:', error)
    throw error
  }
}

// Get all companies
export async function getSharedCompanies(): Promise<CompanyData[]> {
  try {
    const companies = await readCompaniesFromFile()
    console.log('Getting companies from file storage. Total:', companies.length)
    return companies
  } catch (error) {
    console.error('Error getting companies:', error)
    return []
  }
}

// Clear all companies
export async function clearCompanies(): Promise<void> {
  console.log('=== CLEARING ALL COMPANIES ===')
  
  try {
    await withLock(async () => {
      await atomicWriteCompanies([])
      console.log('✅ Companies cleared from file storage')
    })
  } catch (error) {
    console.error('❌ Error clearing companies:', error)
    throw error
  }
}

// ===== ENRICHED COMPETITOR STORAGE FUNCTIONS =====

// Read enriched competitors from file
async function readEnrichedCompetitorsFromFile(): Promise<EnrichedCompetitor[]> {
  try {
    await ensureStorageDir()
    const data = await fs.readFile(ENRICHED_STORAGE_FILE, 'utf-8')
    const competitors = JSON.parse(data) as EnrichedCompetitor[]
    console.log('Read enriched competitors from file:', competitors.length)
    return competitors
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      console.log('Enriched competitors file does not exist yet, starting with empty array')
      return []
    }
    console.error('Error reading enriched competitors file:', error)
    return []
  }
}

// Atomic write for enriched competitors
async function atomicWriteEnrichedCompetitors(competitors: EnrichedCompetitor[]): Promise<void> {
  const tempFile = `${ENRICHED_STORAGE_FILE}.tmp.${Date.now()}.${Math.random()}`
  
  try {
    await ensureStorageDir()
    await fs.writeFile(tempFile, JSON.stringify(competitors, null, 2), 'utf-8')
    await fs.rename(tempFile, ENRICHED_STORAGE_FILE)
    console.log('✅ Enriched competitors atomic write completed:', competitors.length)
  } catch (error) {
    console.error('Error in enriched competitors atomic write:', error)
    try {
      await fs.unlink(tempFile)
    } catch {}
    throw error
  }
}

// Add enriched competitor
export async function addEnrichedCompetitor(competitor: EnrichedCompetitor): Promise<void> {
  console.log('=== ADDING ENRICHED COMPETITOR ===')
  console.log('Competitor to add:', competitor.companyName)
  
  try {
    // Use a separate lock for enriched competitors to avoid conflicts
    await withEnrichedLock(async () => {
      const competitors = await readEnrichedCompetitorsFromFile()
      
      // Check if competitor already exists
      const exists = competitors.find(c => c.companyName === competitor.companyName)
      
      if (!exists) {
        competitors.push(competitor)
        await atomicWriteEnrichedCompetitors(competitors)
        console.log('✅ Enriched competitor added successfully. Total:', competitors.length)
      } else {
        console.log('❌ Enriched competitor already exists, updating:', competitor.companyName)
        // Update existing competitor
        const index = competitors.findIndex(c => c.companyName === competitor.companyName)
        competitors[index] = competitor
        await atomicWriteEnrichedCompetitors(competitors)
        console.log('✅ Enriched competitor updated successfully')
      }
    })
  } catch (error) {
    console.error('❌ Error adding enriched competitor:', error)
    throw error
  }
}

// Get all enriched competitors
export async function getEnrichedCompetitors(): Promise<EnrichedCompetitor[]> {
  try {
    const competitors = await readEnrichedCompetitorsFromFile()
    console.log('Getting enriched competitors from file storage. Total:', competitors.length)
    return competitors
  } catch (error) {
    console.error('Error getting enriched competitors:', error)
    return []
  }
}

// Clear all enriched competitors
export async function clearEnrichedCompetitors(): Promise<void> {
  console.log('=== CLEARING ALL ENRICHED COMPETITORS ===')
  
  try {
    await withEnrichedLock(async () => {
      await atomicWriteEnrichedCompetitors([])
      console.log('✅ Enriched competitors cleared from file storage')
    })
  } catch (error) {
    console.error('❌ Error clearing enriched competitors:', error)
    throw error
  }
}

// Lock management for enriched competitors (separate from regular companies)
async function withEnrichedLock<T>(fn: () => Promise<T>): Promise<T> {
  const maxRetries = 20
  const retryDelay = 100
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Clean up stale locks
      if (await isEnrichedLockStale()) {
        try {
          await fs.unlink(ENRICHED_LOCK_FILE)
        } catch {}
      }

      // Try to acquire lock
      await fs.writeFile(ENRICHED_LOCK_FILE, Date.now().toString(), { flag: 'wx' })
      
      try {
        return await fn()
      } finally {
        try {
          await fs.unlink(ENRICHED_LOCK_FILE)
        } catch (error) {
          console.error('Error releasing enriched lock:', error)
        }
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code !== 'EEXIST') {
        throw error
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }
  
  throw new Error('Could not acquire enriched lock after maximum retries')
}

async function isEnrichedLockStale(): Promise<boolean> {
  try {
    const stats = await fs.stat(ENRICHED_LOCK_FILE)
    const lockAge = Date.now() - stats.mtime.getTime()
    return lockAge > 5000
  } catch {
    return true
  }
}

// Update existing enriched competitor with jobs data
export async function updateEnrichedCompetitorJobs(jobData: {
  companyName: string
  jobTitles: string[]
  jobUrls: string[]
  jobDescriptions: string[]
  updatedAt: string
}): Promise<void> {
  console.log('=== UPDATING ENRICHED COMPETITOR JOBS ===')
  console.log('Updating jobs for company:', jobData.companyName)
  
  try {
    await withEnrichedLock(async () => {
      const competitors = await readEnrichedCompetitorsFromFile()
      
      // Find the competitor to update
      const competitorIndex = competitors.findIndex(c => c.companyName === jobData.companyName)
      
      if (competitorIndex !== -1) {
        // Update the existing competitor with job data
        competitors[competitorIndex] = {
          ...competitors[competitorIndex],
          jobTitles: jobData.jobTitles,
          jobUrls: jobData.jobUrls,
          jobDescriptions: jobData.jobDescriptions,
          enrichmentTimestamp: jobData.updatedAt // Update timestamp
        }
        
        await atomicWriteEnrichedCompetitors(competitors)
        console.log('✅ Successfully updated jobs data for:', jobData.companyName)
        console.log('Job count:', jobData.jobTitles.length)
      } else {
        console.log('⚠️ Competitor not found for jobs update:', jobData.companyName)
        console.log('Available competitors:', competitors.map(c => c.companyName))
        
        // Don't throw error - jobs data might arrive before main data
        // This is normal in a two-webhook setup
      }
    })
  } catch (error) {
    console.error('❌ Error updating competitor jobs:', error)
    throw error
  }
}