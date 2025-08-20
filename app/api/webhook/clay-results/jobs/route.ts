import { NextRequest, NextResponse } from 'next/server'
import { updateEnrichedCompetitorJobs } from '@/lib/shared-storage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('=== CLAY JOBS DATA WEBHOOK ===')
    console.log('Received jobs data from Clay:', JSON.stringify(body, null, 2))
    
    // Check if this is jobs data
    if (body['Company Name']) {
      console.log('🎯 Processing jobs data for:', body['Company Name'])
      
      // Clay sends individual job records, so we need to handle this differently
      // Extract individual job data from Clay's structure
      const jobTitle = body['Title'] || body['Normalized Title'] || ''
      const jobUrl = body['URL'] || ''
      const jobDescription = body['Description'] || ''
      
      console.log('Received individual job:', {
        company: body['Company Name'],
        title: jobTitle,
        hasUrl: !!jobUrl,
        hasDescription: !!jobDescription
      })
      
      const jobData = {
        companyName: body['Company Name'],
        jobTitles: jobTitle ? [jobTitle] : [],
        jobUrls: jobUrl ? [jobUrl] : [],
        jobDescriptions: jobDescription ? [jobDescription] : [],
        updatedAt: new Date().toISOString()
      }
      
      console.log('Parsed job data:', {
        company: jobData.companyName,
        jobCount: jobData.jobTitles.length
      })
      
      try {
        await updateEnrichedCompetitorJobs(jobData)
        console.log('✅ Successfully added job data for:', body['Company Name'])
        
        return NextResponse.json({
          success: true,
          message: 'Job data received and added successfully',
          companyName: body['Company Name'],
          jobTitle: jobTitle
        })
      } catch (storageError) {
        console.error('❌ Error updating jobs data:', storageError)
        return NextResponse.json(
          { error: 'Failed to update jobs data' },
          { status: 500 }
        )
      }
    } else {
      console.log('⚠️ Received jobs data without Company Name - skipping')
      return NextResponse.json({
        success: false,
        message: 'No Company Name found in jobs data'
      })
    }

  } catch (error) {
    console.error('❌ Jobs Data Webhook Error:', error)
    return NextResponse.json(
      { error: 'Jobs data webhook processing failed' },
      { status: 500 }
    )
  }
}

// Helper function to parse job arrays (handles various delimiters and formats)
function parseJobArray(value: string | string[] | undefined): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(item => item && item.trim())
  if (typeof value === 'string') {
    // Try different delimiters for job data
    const delimiters = ['\n', '|', ';', ',']
    for (const delimiter of delimiters) {
      if (value.includes(delimiter)) {
        return value.split(delimiter)
          .map(item => item.trim())
          .filter(item => item.length > 0)
      }
    }
    // If no delimiter found, return as single item
    return value.trim() ? [value.trim()] : []
  }
  return []
}

// Helper function to pad arrays to the same length
function padArray(arr: string[], targetLength: number): string[] {
  const result = [...arr]
  while (result.length < targetLength) {
    result.push('')
  }
  return result
}
