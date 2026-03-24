/**
 * Prompt Loader - Reads prompt template files and replaces variables
 *
 * This shows HOW to use those .txt prompt files in your code
 */

import fs from "fs";
import path from "path";
import { KnowledgeBase } from "@/types/knowledge";

/**
 * Load a prompt template from the prompts/ folder
 */
export function loadPromptTemplate(templateName: string): string {
  const promptPath = path.join(process.cwd(), "prompts", `${templateName}.txt`);
  return fs.readFileSync(promptPath, "utf-8");
}

/**
 * Replace variables in a prompt template with actual data
 *
 * Example: "Company: {{company_name}}" becomes "Company: Stripe"
 */
export function fillPromptTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  let filledPrompt = template;

  // Replace each {{variable}} with its value
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    filledPrompt = filledPrompt.replace(new RegExp(placeholder, "g"), value);
  }

  return filledPrompt;
}

/**
 * Build variables from KnowledgeBase data for prompt templates
   making sure that 
 */
export function buildPromptVariables(
  kb: KnowledgeBase,
): Record<string, string> {
  return {
    company_name: kb.companyInfo.name,
    industry: kb.companyInfo.industry || "Not specified",
    description: kb.companyInfo.description,
    value_proposition: kb.positioning?.valueProposition || "Not available",
    products:
      kb.products
        ?.map((p) => `- ${p.name}: ${p.description || "N/A"}`)
        .join("\n") || "None listed",
    target_audience:
      kb.customers?.targetAudience?.join(", ") || "Not specified",
    customer_needs: kb.customers?.customerNeeds?.join(", ") || "Not specified",
    testimonials:
      kb.testimonials?.map((t) => `"${t.content}" - ${t.author}`).join("\n") ||
      "None",
    brand_tone: kb.branding?.toneOfVoice || "Professional",
    writing_style: kb.branding?.writingStyle || "Clear and concise",
    products_features:
      kb.products
        ?.map((p) => `${p.name}: ${p.features?.join(", ") || "N/A"}`)
        .join("\n") || "None",
    faq_topics: kb.faqs?.map((f) => f.question).join(", ") || "None",
    existing_ctas: kb.marketingCTAs?.join(", ") || "Get Started",
  };
}

/**
 * EXAMPLE USAGE: Generate a company pitch using the template
 */
export async function generatePitchFromTemplate(
  kb: KnowledgeBase,
): Promise<string> {
  // Step 1: Load the prompt template file
  const template = loadPromptTemplate("generate-pitch");

  // Step 2: Build variables from scraped data
  const variables = buildPromptVariables(kb);

  // Step 3: Fill in the template with actual data
  const filledPrompt = fillPromptTemplate(template, variables);

  // Step 4: Send to LLM (would need API integration)
  // const response = await callOpenAI(filledPrompt);
  // return response;

  // For demo, return the filled prompt
  return filledPrompt;
}

/**
 * EXAMPLE USAGE: Create customer personas using template
 */
export async function createPersonasFromTemplate(
  kb: KnowledgeBase,
): Promise<string> {
  const template = loadPromptTemplate("create-personas");
  const variables = buildPromptVariables(kb);
  const filledPrompt = fillPromptTemplate(template, variables);

  // Would send to LLM here
  return filledPrompt;
}

/**
 * EXAMPLE USAGE: Enrich data using template
 */
export async function enrichDataFromTemplate(
  kb: KnowledgeBase,
): Promise<string> {
  const template = loadPromptTemplate("enrich-data");

  // Build special variables for enrichment
  const variables = {
    available_data: JSON.stringify(kb, null, 2),
    missing_fields: Object.keys(kb)
      .filter((key) => {
        const value = kb[key as keyof KnowledgeBase];
        return !value || (Array.isArray(value) && value.length === 0);
      })
      .join(", "),
  };

  const filledPrompt = fillPromptTemplate(template, variables);
  return filledPrompt;
}

/**
 * Helper: Actually call an LLM API (example with OpenAI)
 */
// async function callOpenAI(prompt: string): Promise<string> {
//   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
//
//   const response = await openai.chat.completions.create({
//     model: "gpt-4",
//     messages: [
//       { role: "user", content: prompt }
//     ],
//     temperature: 0.7,
//     max_tokens: 500
//   });
//
//   return response.choices[0].message.content || '';
// }
