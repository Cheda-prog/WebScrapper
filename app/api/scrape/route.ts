import { NextRequest, NextResponse } from 'next/server';
import { scrapeWebsiteEnhanced } from '@/lib/scraper-enhanced';
import { saveKnowledgeBase } from '@/lib/database';
import { enrichMissingData, generateCompanyPitch } from '@/lib/llm-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    let normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Step 1: Scrape the website with enhanced extraction
    console.log('🔍 Scraping website:', normalizedUrl);
    let scrapedData;
    try {
      scrapedData = await scrapeWebsiteEnhanced(normalizedUrl);
    } catch (scrapeError) {
      const scrapeErrorMsg = scrapeError instanceof Error ? scrapeError.message : 'Failed to scrape website';
      console.error('❌ Scraping failed:', scrapeErrorMsg);
      return NextResponse.json(
        { success: false, error: scrapeErrorMsg },
        { status: 500 }
      );
    }

    // Step 2: Enrich data with LLM (if NVIDIA NIM is configured)
    let enrichedData = scrapedData;
    let llmEnrichments: any = {};
    
    const hasNVIDIAKey = process.env.NVIDIA_API_KEY;
    
    if (hasNVIDIAKey) {
      try {
        console.log('🤖 Enriching data with AI (NVIDIA NIM)...');
        
        // Enrich missing fields (industry, value proposition, etc.)
        enrichedData = await enrichMissingData(scrapedData);
        
        // Generate AI-powered company pitch
        const aiPitch = await generateCompanyPitch(enrichedData);
        
        // Store enrichments for response
        llmEnrichments = {
          aiGeneratedPitch: aiPitch,
          enrichedFields: []
        };
        
        // Track what was enriched
        if (!scrapedData.companyInfo.industry && enrichedData.companyInfo.industry) {
          llmEnrichments.enrichedFields.push('industry');
        }
        if (!scrapedData.positioning?.valueProposition && enrichedData.positioning?.valueProposition) {
          llmEnrichments.enrichedFields.push('valueProposition');
        }
        
        // Merge AI enrichments into the enriched data
        enrichedData.aiEnrichments = {
          ...llmEnrichments,
          enrichedAt: new Date().toISOString()
        };
        
        // Also update positioning with AI-generated pitch if available
        if (llmEnrichments.aiGeneratedPitch) {
          enrichedData.positioning = {
            ...enrichedData.positioning,
            aiGeneratedPitch: llmEnrichments.aiGeneratedPitch
          };
        }
        
        console.log('✅ AI enrichment complete. Enriched fields:', llmEnrichments.enrichedFields);
      } catch (llmError) {
        const errorMsg = llmError instanceof Error ? llmError.message : 'Unknown error';
        console.warn('⚠️  LLM enrichment failed (scraping continues):', errorMsg);
        // Continue with scraped data if LLM fails - no throw here
      }
    } else {
      console.log('ℹ️  NVIDIA API key not configured - skipping AI enrichment');
    }

    // Step 3: Try to save to Supabase database (optional)
    let saveResult = null;
    let saveError = null;
    
    // Check if Supabase is configured
    const hasSupabaseConfig = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                              process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (hasSupabaseConfig) {
      try {
        console.log('💾 Saving to database...');
        saveResult = await saveKnowledgeBase(enrichedData, normalizedUrl);
        console.log('✅ Data saved to Supabase successfully');
      } catch (saveErr) {
        saveError = saveErr instanceof Error ? saveErr.message : 'Failed to save to database';
        console.warn('⚠️  Could not save to Supabase:', saveError);
        
        // If table doesn't exist, provide helpful guidance
        if (saveError.includes('supabase-setup.sql') || 
            saveError.includes('table') || 
            saveError.includes('column')) {
          console.log('💡 Database schema issue detected - guiding user to setup script');
        }
        
        // Don't fail the entire request if database save fails
      }
    } else {
      console.log('ℹ️  Supabase not configured - returning enriched data only');
      saveError = 'Supabase not configured (missing SUPABASE_SERVICE_ROLE_KEY)';
    }

    // Step 4: Return enriched data and metadata
    return NextResponse.json({
      success: true,
      data: enrichedData,
      enrichments: hasNVIDIAKey ? llmEnrichments : null,
      saved: saveResult ? { companyId: saveResult.companyId, knowledgeBaseId: saveResult.knowledgeBaseId } : null,
      warnings: [
        ...(!hasSupabaseConfig ? ['Supabase not configured - data not saved to database'] : []),
        ...(saveError ? [`Database save failed: ${saveError}`] : []),
        ...(!hasNVIDIAKey ? ['NVIDIA API key not configured - AI enrichment skipped'] : [])
      ].filter(Boolean)
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape website';
    console.error('API scrape error:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
