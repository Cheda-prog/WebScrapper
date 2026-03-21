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
    const scrapedData = await scrapeWebsiteEnhanced(normalizedUrl);

    // Step 2: Enrich data with LLM (if OpenAI is configured)
    let enrichedData = scrapedData;
    let llmEnrichments: any = {};
    
    const hasOpenAIKey = process.env.OPENAI_API_KEY;
    
    if (hasOpenAIKey) {
      try {
        console.log('🤖 Enriching data with AI...');
        
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
        
        console.log('✅ AI enrichment complete. Enriched fields:', llmEnrichments.enrichedFields);
      } catch (llmError) {
        console.warn('⚠️  LLM enrichment failed:', llmError instanceof Error ? llmError.message : 'Unknown error');
        // Continue with scraped data if LLM fails
      }
    } else {
      console.log('ℹ️  OpenAI not configured - skipping AI enrichment');
    }

    // Step 3: Try to save to Supabase database (optional)
    let saveResult = null;
    let saveError = null;
    
    // Check if Supabase is configured
    const hasSupabaseConfig = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (hasSupabaseConfig) {
      try {
        console.log('💾 Saving to database...');
        saveResult = await saveKnowledgeBase(enrichedData, normalizedUrl);
        console.log('✅ Data saved to Supabase successfully');
      } catch (saveErr) {
        saveError = saveErr instanceof Error ? saveErr.message : 'Failed to save to database';
        console.warn('⚠️  Could not save to Supabase:', saveError);
        // Don't fail the entire request if database save fails
      }
    } else {
      console.log('ℹ️  Supabase not configured - returning enriched data only');
    }

    // Step 4: Return enriched data and metadata
    return NextResponse.json({
      success: true,
      data: enrichedData,
      enrichments: hasOpenAIKey ? llmEnrichments : null,
      saved: saveResult ? {
        companyId: saveResult.companyId,
        knowledgeBaseId: saveResult.knowledgeBaseId
      } : null,
      warnings: [
        ...(!hasSupabaseConfig ? ['Supabase not configured - data not saved to database'] : []),
        ...(saveError ? [`Database save failed: ${saveError}`] : []),
        ...(!hasOpenAIKey ? ['OpenAI not configured - AI enrichment skipped'] : [])
      ].filter(Boolean)
    });
  } catch (error) {
    console.error('API scrape error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to scrape website',
      },
      { status: 500 }
    );
  }
}
