/**
 * LLM Service - Optional AI Integration
 * 
 * This service provides AI-powered enrichment features.
 * Works without API key - enrichment is completely optional.
 */

import { KnowledgeBase } from '@/types/knowledge';
import OpenAI from 'openai';

// Lazy initialization - only create client when needed and API key exists
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  
  if (!openaiClient) {
    openaiClient = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
  }
  
  return openaiClient;
}

/**
 * Generate a company pitch using AI
 * This function takes scraped data and asks an LLM to write a pitch
 */
export async function generateCompanyPitch(kb: KnowledgeBase): Promise<string> {
  // Step 1: Build the prompt with actual data
  const prompt = buildPitchPrompt(kb);
  
  // Step 2: Send to LLM
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a professional business copywriter specializing in elevator pitches." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });
    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating pitch:', error);
    return `[AI generation failed for: ${kb.companyInfo.name}]`;
  }
}

/**
 * This function builds the prompt string
 * It takes structured data and converts it to text for the LLM
 */
function buildPitchPrompt(kb: KnowledgeBase): string {
  // This is the actual prompt text that gets sent to the AI
  return `
Generate a compelling 2-paragraph elevator pitch for this company:

Company Name: ${kb.companyInfo.name}
Industry: ${kb.companyInfo.industry || 'Not specified'}
Description: ${kb.companyInfo.description}
Value Proposition: ${kb.positioning?.valueProposition || 'Not available'}

Products/Services:
${kb.products?.map(p => `- ${p.name}: ${p.description || 'No description'}`).join('\n') || 'None listed'}

Target Audience:
${kb.customers?.targetAudience?.join(', ') || 'Not specified'}

Requirements:
1. Start with the problem the company solves
2. Highlight what makes them unique
3. Include their key products
4. End with a strong call-to-action
5. Keep it under 200 words
6. Use professional but engaging language

Generate the pitch now:
  `.trim();
}

/**
 * Enrich incomplete data using AI
 * If industry is missing, AI can infer it from description
 */
export async function enrichMissingData(kb: KnowledgeBase): Promise<KnowledgeBase> {
  const enrichedKB = { ...kb };
  
  try {
    // If industry is missing, try to infer it
    if (!kb.companyInfo.industry && kb.companyInfo.description) {
      const prompt = `
Based on this company description, what industry are they in?
Return ONLY the industry name (e.g., "SaaS", "E-commerce", "FinTech", etc.)

Description: ${kb.companyInfo.description}

Products: ${kb.products?.map(p => p.name).join(', ') || 'Unknown'}

Industry:`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 50
      });
      
      const industry = response.choices[0].message.content?.trim();
      if (industry) {
        enrichedKB.companyInfo.industry = industry;
      }
    }

    // Enrich value proposition if missing but we have description
    if (!kb.positioning?.valueProposition && kb.companyInfo.description) {
      const prompt = `
Based on this company description, create a concise value proposition (1-2 sentences).

Company: ${kb.companyInfo.name}
Description: ${kb.companyInfo.description}
Products: ${kb.products?.map(p => p.name).join(', ') || 'Unknown'}

Value Proposition:`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 150
      });
      
      const valueProposition = response.choices[0].message.content?.trim();
      if (valueProposition) {
        enrichedKB.positioning = {
          ...enrichedKB.positioning,
          valueProposition
        };
      }
    }
  } catch (error) {
    console.error('Error enriching data:', error);
    // Return original data if enrichment fails
  }
  
  return enrichedKB;
}

/**
 * Generate customer personas using AI
 */
export async function generatePersonas(kb: KnowledgeBase): Promise<string[]> {
  const prompt = `
Based on this company's data, create 3 customer personas.
For each persona, provide: Name, Role, Demographics, Pain Points, Goals

Company: ${kb.companyInfo.name}
Industry: ${kb.companyInfo.industry}
Products: ${kb.products?.map(p => p.name).join(', ')}
Target Audience: ${kb.customers?.targetAudience?.join(', ')}
Customer Needs: ${kb.customers?.customerNeeds?.join(', ')}

Format: Return each persona as a short paragraph.
  `.trim();
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a marketing strategist specializing in customer personas." },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 500
    });
    
    const content = response.choices[0].message.content || '';
    // Split by double newlines or numbered patterns
    const personas = content.split(/\n\n+|\d\.\s+/).filter(p => p.trim().length > 0);
    return personas.slice(0, 3); // Return up to 3 personas
  } catch (error) {
    console.error('Error generating personas:', error);
    return ['Persona generation failed'];
  }
}

/**
 * Example of streaming response (for real-time UI updates)
 */
export async function generatePitchStreaming(
  kb: KnowledgeBase, 
  onChunk: (text: string) => void
): Promise<void> {
  const prompt = buildPitchPrompt(kb);
  
  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a professional business copywriter specializing in elevator pitches." },
        { role: "user", content: prompt }
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 300
    });
    
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      onChunk(text); // This would update UI in real-time
    }
  } catch (error) {
    console.error('Error streaming pitch:', error);
    onChunk('[Streaming failed]');
  }
}

/**
 * Batch process multiple knowledge bases
 */
export async function batchEnrich(kbs: KnowledgeBase[]): Promise<KnowledgeBase[]> {
  // Process multiple at once
  const promises = kbs.map(kb => enrichMissingData(kb));
  return Promise.all(promises);
}
