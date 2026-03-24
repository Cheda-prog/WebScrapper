import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('📂 Fetching saved knowledge bases from Supabase...');
    
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
        data: []
      });
    }

    // Try to fetch from primary JSON table first
    const { data: jsonData, error: jsonError } = await supabase
      .from('knowledge_base_json')
      .select('*')
      .order('created_at', { ascending: false });

    if (!jsonError && jsonData && jsonData.length > 0) {
      console.log(`✅ Found ${jsonData.length} knowledge bases in JSON table`);
      
      // Transform the data to match KnowledgeBase interface
      const knowledgeBases = jsonData.map(item => ({
        id: item.id,
        sourceUrl: item.source_url,
        scrapedAt: item.scraped_at,
        ...item.full_data, // Spread the full JSON data
        // Ensure we have the AI pitch from both places
        positioning: {
          ...item.full_data.positioning,
          aiGeneratedPitch: item.ai_pitch || item.full_data.positioning?.aiGeneratedPitch
        }
      }));

      return NextResponse.json({
        success: true,
        data: knowledgeBases,
        count: knowledgeBases.length,
        source: 'knowledge_base_json'
      });
    }

    console.log('⚠️  No data in JSON table, trying structured tables...');
    
    // Fallback: Try structured tables approach
    const { data: structuredData, error: structuredError } = await supabase
      .from('knowledge_bases')
      .select(`
        *,
        companies (
          id,
          name,
          description,
          website,
          industry,
          business_model,
          company_size,
          founded_year
        )
      `)
      .order('created_at', { ascending: false });

    if (structuredError) {
      console.error('❌ Error fetching from structured tables:', structuredError);
      return NextResponse.json({
        success: false,
        error: `Database error: ${structuredError.message}`,
        data: []
      }, { status: 500 });
    }

    if (!structuredData || structuredData.length === 0) {
      console.log('📭 No saved knowledge bases found');
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        message: 'No saved knowledge bases found'
      });
    }

    console.log(`✅ Found ${structuredData.length} knowledge bases in structured tables`);

    // Transform structured data to KnowledgeBase format
    const knowledgeBases = structuredData.map(item => ({
      id: item.id,
      sourceUrl: item.source_url,
      scrapedAt: item.scraped_at || item.created_at,
      companyInfo: {
        name: item.companies.name,
        description: item.companies.description,
        website: item.companies.website,
        industry: item.companies.industry,
        businessModel: item.companies.business_model,
        companySize: item.companies.company_size,
        foundedYear: item.companies.founded_year
      },
      positioning: {
        companyPitch: item.company_pitch,
        aiGeneratedPitch: item.ai_generated_pitch,
        valueProposition: item.value_proposition,
        missionStatement: item.mission_statement,
        foundingStory: item.founding_story
      },
      customers: {
        targetAudience: item.target_audience,
        customerNeeds: item.customer_needs,
        personas: item.personas
      },
      branding: {
        toneOfVoice: item.tone_of_voice,
        writingStyle: item.writing_style,
        primaryColors: item.primary_colors,
        fonts: item.fonts,
        logoUrl: item.logo_url
      },
      onlinePresence: {
        email: item.email,
        phone: item.phone,
        blogUrl: item.blog_url
      },
      marketingCTAs: item.marketing_ctas,
      blogTopics: item.blog_topics,
      rawMetadata: item.raw_metadata
    }));

    return NextResponse.json({
      success: true,
      data: knowledgeBases,
      count: knowledgeBases.length,
      source: 'structured_tables'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('💥 Error fetching knowledge bases:', error);
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      data: []
    }, { status: 500 });
  }
}