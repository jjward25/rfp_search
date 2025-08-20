import { NextRequest } from 'next/server'

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
const connectedClients: Set<ReadableStreamDefaultController> = new Set()

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      connectedClients.add(controller)
      
      // Send any companies already received
      if (receivedCompanies.length > 0) {
        const data = `data: ${JSON.stringify({ type: 'initial', companies: receivedCompanies })}\n\n`
        controller.enqueue(new TextEncoder().encode(data))
      }
      
      // Keep connection alive
      const keepAlive = setInterval(() => {
        controller.enqueue(new TextEncoder().encode('data: {"type": "keepalive"}\n\n'))
      }, 30000) // Every 30 seconds
      
      // Clean up when client disconnects
      request.signal.addEventListener('abort', () => {
        connectedClients.delete(controller)
        clearInterval(keepAlive)
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

// Function to add a company and notify all connected clients
export function addCompany(company: CompanyData) {
  receivedCompanies.push(company)
  
  // Notify all connected clients
  const data = `data: ${JSON.stringify({ type: 'new_company', company })}\n\n`
  connectedClients.forEach(controller => {
    try {
      controller.enqueue(new TextEncoder().encode(data))
    } catch {
      // Remove disconnected clients
      connectedClients.delete(controller)
    }
  })
}

// Function to get all received companies
export function getCompanies() {
  return receivedCompanies
}
