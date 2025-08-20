import { NextRequest, NextResponse } from 'next/server'
import { updateEnrichedCompetitorJobs } from '@/lib/shared-storage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('=== CLAY JOBS DATA WEBHOOK ===')
    console.log('Received jobs data from Clay:', JSON.stringify(body, null, 2))
    
    // Check if this is jobs data
    if (body.Company_Name) {
      console.log('🎯 Processing jobs data for:', body.Company_Name)
      
      // Parse job data from Clay
      const jobTitles = parseJobArray(body.Job_Titles || body.jobTitles || body.Job_Title || '')
      const jobUrls = parseJobArray(body.Job_URLs || body.jobUrls || body.Job_URL || '')
      const jobDescriptions = parseJobArray(body.Job_Descriptions || body.jobDescriptions || body.Job_Description || '')
      
      // Ensure all arrays are the same length
      const maxLength = Math.max(jobTitles.length, jobUrls.length, jobDescriptions.length)
      const normalizedJobTitles = padArray(jobTitles, maxLength)
      const normalizedJobUrls = padArray(jobUrls, maxLength)
      const normalizedJobDescriptions = padArray(jobDescriptions, maxLength)
      
      const jobData = {
        companyName: body.Company_Name,
        jobTitles: normalizedJobTitles,
        jobUrls: normalizedJobUrls,
        jobDescriptions: normalizedJobDescriptions,
        updatedAt: new Date().toISOString()
      }
      
      console.log('Parsed job data:', {
        company: jobData.companyName,
        jobCount: jobData.jobTitles.length
      })
      
      try {
        await updateEnrichedCompetitorJobs(jobData)
        console.log('✅ Successfully updated jobs data for:', body.Company_Name)
        
        return NextResponse.json({
          success: true,
          message: 'Jobs data received and updated successfully',
          companyName: body.Company_Name,
          jobCount: jobData.jobTitles.length
        })
      } catch (storageError) {
        console.error('❌ Error updating jobs data:', storageError)
        return NextResponse.json(
          { error: 'Failed to update jobs data' },
          { status: 500 }
        )
      }
    } else {
      console.log('⚠️ Received jobs data without Company_Name - skipping')
      return NextResponse.json({
        success: false,
        message: 'No Company_Name found in jobs data'
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
