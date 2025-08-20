import { writeFileSync, readFileSync, existsSync } from 'fs'
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

// Use /tmp directory which is writable in Vercel
const STORAGE_FILE = join('/tmp', 'companies.json')

function readCompaniesFromFile(): CompanyData[] {
  try {
    if (existsSync(STORAGE_FILE)) {
      const data = readFileSync(STORAGE_FILE, 'utf-8')
      return JSON.parse(data) as CompanyData[]
    }
  } catch (error) {
    console.error('Error reading companies file:', error)
  }
  return []
}

function writeCompaniesToFile(companies: CompanyData[]): void {
  try {
    writeFileSync(STORAGE_FILE, JSON.stringify(companies, null, 2))
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
    console.log('Company added to storage. Total companies:', companies.length)
    console.log('Added company:', company.Company_Name)
  } else {
    console.log('Company already exists, skipping:', company.Company_Name)
  }
}

export function getSharedCompanies(): CompanyData[] {
  return readCompaniesFromFile()
}

export function clearCompanies(): void {
  writeCompaniesToFile([])
  console.log('Companies cleared from storage')
}
