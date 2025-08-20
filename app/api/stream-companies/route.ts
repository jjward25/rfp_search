import { NextRequest } from 'next/server'

// In-memory storage for received companies (in production, use a database)
let receivedCompanies: any[] = []
let connectedClients: Set<ReadableStreamDefaultController> = new Set()

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
export function addCompany(company: any) {
  receivedCompanies.push(company)
  
  // Notify all connected clients
  const data = `data: ${JSON.stringify({ type: 'new_company', company })}\n\n`
  connectedClients.forEach(controller => {
    try {
      controller.enqueue(new TextEncoder().encode(data))
    } catch (error) {
      // Remove disconnected clients
      connectedClients.delete(controller)
    }
  })
}

// Function to get all received companies
export function getCompanies() {
  return receivedCompanies
}
