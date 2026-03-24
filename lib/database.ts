/**
 * Database Service - Save scraped data to Supabase
 * 
 * This file handles all database operations for storing knowledge bases.
 */

import { supabase } from './supabase';
import { KnowledgeBase } from '@/types/knowledge';

/**
 * Save a complete knowledge base to Supabase
 * 
 * This function:
 * 1. Creates/updates the company record
 * 2. Creates a knowledge_base entry
 * 3. Saves complete JSON backup
 */
export async function saveKnowledgeBase(kb: KnowledgeBase, sourceUrl: string) {
  try {
    console.log('📝 Starting database save for:', kb.companyInfo.name);
    
    // Step 1: Try to save just the JSON backup first (simpler approach)
    console.log('💾 Saving JSON backup...');
    const { data: jsonResult, error: jsonError } = await supabase
      .from('knowledge_base_json')
      .insert({
        source_url: sourceUrl,
        scraped_at: kb.scrapedAt,
        company_name: kb.companyInfo.name,
        company_description: kb.companyInfo.description,
        full_data: kb, // Store complete knowledge base as JSON
        ai_pitch: kb.positioning?.aiGeneratedPitch || null
      })
      .select()
      .single();

    if (jsonError) {
      console.error('❌ JSON backup failed:', jsonError);
      
      // Provide helpful error messages based on error codes
      if (jsonError.code === 'PGRST205' || jsonError.message?.includes('Could not find the table')) {
        throw new Error('Database table "knowledge_base_json" does not exist. Please run supabase-setup.sql in your Supabase SQL editor first.');
      }
      
      // Fallback: Try the original approach
      console.log('🔄 Trying structured table approach...');
      return await saveToStructuredTables(kb, sourceUrl);
    }

    console.log('✅ JSON backup saved successfully:', jsonResult.id);
    return {
      companyId: null,
      knowledgeBaseId: jsonResult.id,
      jsonBackupId: jsonResult.id
    };

  } catch (error) {
    console.error('💥 Database save failed:', error);
    
    // Enhanced error reporting
    if (error instanceof Error) {
      if (error.message.includes('table') && error.message.includes('does not exist')) {
        throw new Error('Required database tables do not exist. Please run supabase-setup.sql in your Supabase SQL editor.');
      }
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        throw new Error('Database schema is outdated. Please run supabase-setup.sql to add missing columns.');
      }
    }
    
    throw error;
  }
}

// Fallback function for structured approach
async function saveToStructuredTables(kb: KnowledgeBase, sourceUrl: string) {
  console.log('🔄 Trying structured table approach...');
  
  try {
    // Step 1: Create or get existing company
    const { data: existingCompany, error: selectError } = await supabase
      .from('companies')
      .select('id')
      .eq('website', sourceUrl)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      if (selectError.code === 'PGRST205' || selectError.message?.includes('Could not find the table')) {
        throw new Error('Database table "companies" does not exist. Please run supabase-setup.sql in your Supabase SQL editor first.');
      }
      throw selectError;
    }

    let companyId: string;

    if (existingCompany) {
      // Update existing company
      const { data: updatedCompany, error: updateError } = await supabase
        .from('companies')
        .update({
          name: kb.companyInfo.name,
          description: kb.companyInfo.description,
          industry: kb.companyInfo.industry,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCompany.id)
        .select()
        .single();

      if (updateError) throw updateError;
      companyId = updatedCompany.id;
    } else {
      // Create new company
      const { data: newCompany, error: insertError } = await supabase
        .from('companies')
        .insert({
          name: kb.companyInfo.name,
          description: kb.companyInfo.description,
          website: sourceUrl,
          industry: kb.companyInfo.industry
        })
        .select()
        .single();

      if (insertError) throw insertError;
      companyId = newCompany.id;
    }

    // Step 2: Save to knowledge_bases
    const kbData: any = {
      company_id: companyId,
      source_url: sourceUrl,
      company_pitch: kb.positioning?.companyPitch,
      value_proposition: kb.positioning?.valueProposition,
      target_audience: kb.customers?.targetAudience || [],
      primary_colors: kb.branding?.primaryColors || [],
      email: kb.onlinePresence?.email,
      phone: kb.onlinePresence?.phone,
      marketing_ctas: kb.marketingCTAs || [],
      ai_generated_pitch: kb.positioning?.aiGeneratedPitch // Always include this now
    };

    const { data: knowledgeBaseData, error: kbError } = await supabase
      .from('knowledge_bases')
      .insert(kbData)
      .select()
      .single();

    if (kbError) {
      if (kbError.code === 'PGRST205' || kbError.message?.includes('Could not find the table')) {
        throw new Error('Database table "knowledge_bases" does not exist. Please run supabase-setup.sql in your Supabase SQL editor first.');
      }
      if (kbError.message?.includes('ai_generated_pitch') && kbError.message?.includes('column')) {
        throw new Error('Database column "ai_generated_pitch" is missing from knowledge_bases table. Please run supabase-setup.sql to add it.');
      }
      throw kbError;
    }

    console.log('✅ Structured tables save completed successfully');
    return {
      companyId,
      knowledgeBaseId: knowledgeBaseData.id,
      jsonBackupId: null
    };
    
  } catch (error) {
    console.error('💥 Structured tables save failed:', error);
    throw error;
  }
}

/**
 * Get all saved knowledge bases
 */
export async function getAllKnowledgeBases() {
  const { data, error } = await supabase
    .from('knowledge_bases')
    .select(`
      *,
      companies (
        id,
        name,
        website,
        description,
        industry
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get JSON backup by ID
 */
export async function getKnowledgeBaseJSON(companyId: string) {
  const { data, error } = await supabase
    .from('knowledge_base_json')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}