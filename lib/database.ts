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
 * 3. Saves all related data (products, FAQs, testimonials, team, CTAs)
 */
export async function saveKnowledgeBase(kb: KnowledgeBase, sourceUrl: string) {
  try {
    // Step 1: Create or get existing company
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('website', sourceUrl)
      .single();

    let companyId: string;

    if (existingCompany) {
      // Update existing company
      const { data: updatedCompany, error: updateError } = await supabase
        .from('companies')
        .update({
          name: kb.companyInfo.name,
          description: kb.companyInfo.description,
          industry: kb.companyInfo.industry,
          business_model: kb.companyInfo.businessModel,
          founded_year: kb.companyInfo.foundedYear,
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
          industry: kb.companyInfo.industry,
          business_model: kb.companyInfo.businessModel,
          founded_year: kb.companyInfo.foundedYear
        })
        .select()
        .single();

      if (insertError) throw insertError;
      companyId = newCompany.id;
    }

    // Step 2: Create knowledge base entry
    const { data: knowledgeBaseData, error: kbError } = await supabase
      .from('knowledge_bases')
      .insert({
        company_id: companyId,
        source_url: sourceUrl,
        company_pitch: kb.positioning?.companyPitch,
        founding_story: kb.positioning?.foundingStory,
        value_proposition: kb.positioning?.valueProposition,
        target_audience: kb.customers?.targetAudience || [],
        customer_needs: kb.customers?.customerNeeds || [],
        tone_of_voice: kb.branding?.toneOfVoice,
        writing_style: kb.branding?.writingStyle,
        primary_colors: kb.branding?.primaryColors || [],
        fonts: kb.branding?.fonts || [],
        logo_url: kb.branding?.logoUrl,
        email: kb.onlinePresence?.email,
        phone: kb.onlinePresence?.phone,
        blog_url: kb.onlinePresence?.blogUrl,
        marketing_ctas: kb.marketingCTAs || [],
        raw_metadata: kb as any // Store full scraped data as JSON
      })
      .select()
      .single();

    if (kbError) throw kbError;

    // Step 3: Save products
    if (kb.products && kb.products.length > 0) {
      const productsToInsert = kb.products.map(product => ({
        company_id: companyId,
        name: product.name,
        description: product.description,
        category: product.category,
        pricing: product.pricing,
        features: product.features || []
      }));

      const { error: productsError } = await supabase
        .from('products')
        .insert(productsToInsert);

      if (productsError) console.error('Error saving products:', productsError);
    }

    // Step 4: Save testimonials
    if (kb.testimonials && kb.testimonials.length > 0) {
      const testimonialsToInsert = kb.testimonials.map(testimonial => ({
        company_id: companyId,
        author: testimonial.author,
        role: testimonial.role,
        content: testimonial.content,
        rating: testimonial.rating
      }));

      const { error: testimonialsError } = await supabase
        .from('testimonials')
        .insert(testimonialsToInsert);

      if (testimonialsError) console.error('Error saving testimonials:', testimonialsError);
    }

    // Step 5: Save FAQs
    if (kb.faqs && kb.faqs.length > 0) {
      const faqsToInsert = kb.faqs.map((faq, index) => ({
        company_id: companyId,
        question: faq.question,
        answer: faq.answer,
        display_order: index + 1
      }));

      const { error: faqsError } = await supabase
        .from('faqs')
        .insert(faqsToInsert);

      if (faqsError) console.error('Error saving FAQs:', faqsError);
    }

    // Step 6: Save team members
    if (kb.keyPeople && kb.keyPeople.length > 0) {
      const teamToInsert = kb.keyPeople.map(member => ({
        company_id: companyId,
        name: member.name,
        role: member.role,
        bio: member.bio,
        image_url: member.imageUrl
      }));

      const { error: teamError } = await supabase
        .from('key_people')
        .insert(teamToInsert);

      if (teamError) console.error('Error saving team members:', teamError);
    }

    // Step 7: Save social media links
    if (kb.onlinePresence?.socialMedia && kb.onlinePresence.socialMedia.length > 0) {
      const socialMediaToInsert = kb.onlinePresence.socialMedia.map(social => ({
        company_id: companyId,
        platform: social.platform,
        url: social.url
      }));

      const { error: socialError } = await supabase
        .from('social_media')
        .insert(socialMediaToInsert);

      if (socialError) console.error('Error saving social media:', socialError);
    }

    return {
      success: true,
      companyId,
      knowledgeBaseId: knowledgeBaseData.id
    };

  } catch (error) {
    console.error('Database save error:', error);
    throw error;
  }
}

/**
 * Retrieve all knowledge bases from database
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
        industry
      )
    `)
    .eq('is_latest', true)
    .order('scraped_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get a single knowledge base with all related data
 */
export async function getKnowledgeBase(companyId: string) {
  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      knowledge_bases (*),
      products (*),
      testimonials (*),
      faqs (*),
      key_people (*),
      social_media (*),
      locations (*)
    `)
    .eq('id', companyId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a company and all related data (CASCADE will handle relations)
 */
export async function deleteKnowledgeBase(companyId: string) {
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', companyId);

  if (error) throw error;
  return { success: true };
}
