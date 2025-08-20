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

function ensureStorageDir(): void {
  try {
    if (!existsSync(STORAGE_DIR)) {
      mkdirSync(STORAGE_DIR, { recursive: true })
    }
  } catch (error) {
    console.error('Error creating storage directory:', error)
  }
}

function readCompaniesFromFile(): CompanyData[] {
  try {
    ensureStorageDir()
    if (existsSync(STORAGE_FILE)) {
      const data = readFileSync(STORAGE_FILE, 'utf-8')
      const companies = JSON.parse(data) as CompanyData[]
      console.log('Read companies from file:', companies.length)
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
  } catch (error) {
    console.error('Error writing companies file:', error)
  }
}

export function addCompany(company: CompanyData): void {
  const companies = readCompaniesFromFile()
  
  // Check if company already exists to avoid duplicates
  const exists = companies.find(c => c.Company_Name === company.Company_Name)
  if (!exists) {
    companies.push(company)
    writeCompaniesToFile(companies)
    console.log('Company added to file storage. Total companies:', companies.length)
    console.log('Added company:', company.Company_Name)
    console.log('All companies:', companies.map(c => c.Company_Name))
  } else {
    console.log('Company already exists, skipping:', company.Company_Name)
  }
}

export function getSharedCompanies(): CompanyData[] {
  const companies = readCompaniesFromFile()
  console.log('Getting companies from file storage. Total:', companies.length)
  return companies
}

export function clearCompanies(): void {
  writeCompaniesToFile([])
  console.log('Companies cleared from file storage')
}
