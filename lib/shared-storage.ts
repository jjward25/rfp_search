import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
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

// Use /tmp directory which persists across function calls in Vercel
const STORAGE_DIR = '/tmp'
const STORAGE_FILE = join(STORAGE_DIR, 'companies.json')
const LOCK_FILE = join(STORAGE_DIR, 'companies.lock')

function ensureStorageDir(): void {
  try {
    if (!existsSync(STORAGE_DIR)) {
      mkdirSync(STORAGE_DIR, { recursive: true })
    }
  } catch (error) {
    console.error('Error creating storage directory:', error)
  }
}

function acquireLock(): boolean {
  try {
    if (existsSync(LOCK_FILE)) {
      // Check if lock is stale (older than 5 seconds)
      const lockStats = statSync(LOCK_FILE)
      const lockAge = Date.now() - lockStats.mtime.getTime()
      if (lockAge > 5000) {
        require('fs').unlinkSync(LOCK_FILE)
      } else {
        return false // Lock is active
      }
    }
    writeFileSync(LOCK_FILE, Date.now().toString())
    return true
  } catch (error) {
    console.error('Error acquiring lock:', error)
    return false
  }
}

function releaseLock(): void {
  try {
    if (existsSync(LOCK_FILE)) {
      require('fs').unlinkSync(LOCK_FILE)
    }
  } catch (error) {
    console.error('Error releasing lock:', error)
  }
}

function readCompaniesFromFile(): CompanyData[] {
  try {
    ensureStorageDir()
    if (existsSync(STORAGE_FILE)) {
      const data = readFileSync(STORAGE_FILE, 'utf-8')
      const companies = JSON.parse(data) as CompanyData[]
      console.log('Read companies from file:', companies.length)
      console.log('Company names:', companies.map(c => c.Company_Name))
      return companies
    }
  } catch (error) {
    console.error('Error reading companies file:', error)
  }
  return []
}

function writeCompaniesToFile(companies: CompanyData[]): void {
  try {
    ensureStorageDir()
    writeFileSync(STORAGE_FILE, JSON.stringify(companies, null, 2), 'utf-8')
    console.log('Wrote companies to file:', companies.length)
    console.log('Written company names:', companies.map(c => c.Company_Name))
  } catch (error) {
    console.error('Error writing companies file:', error)
  }
}

export function addCompany(company: CompanyData): void {
  console.log('=== ATTEMPTING TO ADD COMPANY ===')
  console.log('Company to add:', company.Company_Name)
  
  // Try to acquire lock with retries
  let lockAcquired = false
  let attempts = 0
  while (!lockAcquired && attempts < 10) {
    lockAcquired = acquireLock()
    if (!lockAcquired) {
      console.log('Lock not acquired, waiting...', attempts)
      // Wait 100ms before retry
      require('child_process').execSync('sleep 0.1')
      attempts++
    }
  }
  
  if (!lockAcquired) {
    console.error('Could not acquire lock after 10 attempts')
    return
  }
  
  try {
    const companies = readCompaniesFromFile()
    console.log('Current companies before add:', companies.map(c => c.Company_Name))
    
    // Check if company already exists to avoid duplicates
    const exists = companies.find(c => c.Company_Name === company.Company_Name)
    if (!exists) {
      companies.push(company)
      writeCompaniesToFile(companies)
      console.log('✅ Company added successfully. Total companies:', companies.length)
      console.log('✅ Added company:', company.Company_Name)
    } else {
      console.log('❌ Company already exists, skipping:', company.Company_Name)
    }
  } finally {
    releaseLock()
  }
}

export function getSharedCompanies(): CompanyData[] {
  const companies = readCompaniesFromFile()
  console.log('Getting companies from file storage. Total:', companies.length)
  return companies
}

export function clearCompanies(): void {
  if (acquireLock()) {
    try {
      writeCompaniesToFile([])
      console.log('Companies cleared from file storage')
    } finally {
      releaseLock()
    }
  }
}
