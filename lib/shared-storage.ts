import { promises as fs } from 'fs'
import { join } from 'path'
import { statSync } from 'fs'

// Define proper types for company data
export interface CompanyData {
  Company_Name: string
  search_query: string
  why_relevant?: string
  niche_focus?: string
  source?: string
  linkedinURL?: string | null
}

// Use /tmp directory which persists across function calls in Vercel
const STORAGE_DIR = '/tmp'
const STORAGE_FILE = join(STORAGE_DIR, 'companies.json')
const LOCK_FILE = join(STORAGE_DIR, 'companies.lock')

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
    if (error.code === 'ENOENT') {
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