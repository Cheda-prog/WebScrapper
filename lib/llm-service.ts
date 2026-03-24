import { KnowledgeBase } from "@/types/knowledge";
import OpenAI from "openai";

const NIM_BASE_URL = "https://integrate.api.nvidia.com/v1";
const NIM_MODEL = "meta/llama-3.1-8b-instruct"; // Switch away from reasoning model
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

let nimClient: OpenAI | null = null;

function getNIMClient(): OpenAI | null {
  if (!process.env.NVIDIA_API_KEY) {
    return null;
  }
  if (!nimClient) {
    nimClient = new OpenAI({
      baseURL: NIM_BASE_URL,
      apiKey: process.env.NVIDIA_API_KEY,
    });
  }
  return nimClient;
}

async function callWithRetry<T>(
  fn: () => Promise<T>,
  context: string
): Promise<T | null> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
      const errorMsg = lastError.message;
      
      if (attempt < MAX_RETRIES) {
        const isRetryable = 
          errorMsg.includes('500') || 
          errorMsg.includes('TRT engine') ||
          errorMsg.includes('busy') ||
          errorMsg.includes('timeout') ||
          errorMsg.includes('fetch failed');
        
        if (isRetryable) {
          console.log(`⚠️ ${context} attempt ${attempt} failed (retrying in ${RETRY_DELAY}ms)...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          continue;
        }
      }
    }
  }
  
  console.error(`❌ ${context} failed after ${MAX_RETRIES} attempts:`, lastError?.message);
  return null;
}

function cleanAIResponse(text: string | null | undefined): string | undefined {
  if (!text) return undefined;
  
  let cleaned = text.trim();
  
  // Remove <think> blocks
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "");
  
  // Split into paragraphs/sentences
  const lines = cleaned.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
  
  const reasoningPatterns = [
    /^(okay|so |i need to|i should|let me|first,|second,|third,|next,|also,|i think|here'?s|i'll |this is|this could|the goal|the key|the main)/i,
    /^(\*\*)?(okay|so|let me|i should|i need)/i,
    /^((to|for|of|with|in|on|at|by)\s+)?(starting|because)/i,
    /^entering your query|processing|analyzing|looking at|examining/i,
    /^to answer this|i will (?:create|write|focus|make)/i,
    /^then,|in the (?:first|second) paragraph|for the (?:first|second)/i,
    /^make sure|remember to|don't forget/i,
    /^(\*\*)?(?:note|tip|reminder|hint)/i,
    /^let'?s (?:say|start|begin|try)|here we|i'?ll (?:focus|start|begin)/i,
    /^the (?:pitch|response|answer|text|content) (?:should|will|must|can)/i,
    /^start (?:with|by)|begin (?:with|by)|opening with/i,
    /^use (?:a |the |this |some )?(?:professional|compelling|engaging|persuasive)/i,
    /^include|ensure|make certain|make sure/i,
  ];
  
  // Filter out reasoning lines
  const cleanLines = lines.filter(line => {
    // Skip very short lines that are likely reasoning
    if (line.length < 40) return false;
    // Skip if matches reasoning pattern
    if (reasoningPatterns.some(p => p.test(line))) return false;
    // Skip if it's clearly AI explaining its process
    if (/^i('m| am| will| can| have| need| should)/i.test(line) && line.length < 100) return false;
    // Skip instruction-like lines
    if (/^(then,|in the|i need to|make sure)/i.test(line)) return false;
    return true;
  });
  
  return cleanLines.join(' ').trim() || undefined;
}

export async function generateCompanyPitch(kb: KnowledgeBase): Promise<string> {
  const client = getNIMClient();
  if (!client) {
    return `[AI unavailable - no API key for: ${kb.companyInfo.name}]`;
  }

  const prompt = `Company: ${kb.companyInfo.name}
Industry: ${kb.companyInfo.industry || "Tax Services"}  
Description: ${kb.companyInfo.description}

Write a 2-paragraph elevator pitch. Start writing the pitch now:`;

  const result = await callWithRetry(async () => {
    const response = await client!.chat.completions.create({
      model: NIM_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a copywriter. Write the elevator pitch directly without any preamble, reasoning, or explanation. Start with the first word of the actual pitch.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 250,
    });
    return response.choices[0].message.content || "";
  }, "Generate pitch");

  if (result) {
    const cleaned = cleanAIResponse(result);
    if (cleaned && cleaned.length > 20) {
      return cleaned;
    }
    
    // Fallback: try to extract first 2 sentences as a last resort
    const sentences = result.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length >= 2) {
      return sentences.slice(0, 2).join(' ').trim();
    }
  }
  
  return `[AI pitch generation failed for: ${kb.companyInfo.name}]`;
}

export async function enrichMissingData(kb: KnowledgeBase): Promise<KnowledgeBase> {
  const client = getNIMClient();
  if (!client) return kb;

  const enrichedKB = { ...kb };

  // Infer industry if missing
  if (!kb.companyInfo.industry && kb.companyInfo.description) {
    const result = await callWithRetry(async () => {
      const response = await client!.chat.completions.create({
        model: NIM_MODEL,
        messages: [
          {
            role: "system",
            content: "Answer with ONLY the industry name. One or two words max. No explanation.",
          },
          {
            role: "user",
            content: `What industry is this company in?\n\n${kb.companyInfo.description}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 20,
      });
      return response.choices[0].message.content || "";
    }, "Infer industry");

    if (result) {
      const industry = cleanAIResponse(result);
      if (industry && industry.length > 2 && industry.length < 50) {
        enrichedKB.companyInfo.industry = industry;
      }
    }
  }

  // Infer value proposition if missing
  if (!kb.positioning?.valueProposition && kb.companyInfo.description) {
    const result = await callWithRetry(async () => {
      const response = await client!.chat.completions.create({
        model: NIM_MODEL,
        messages: [
          {
            role: "system",
            content: "Answer with ONLY the value proposition. One sentence. No preamble.",
          },
          {
            role: "user",
            content: `What unique value does this company offer?\n\n${kb.companyInfo.description}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 80,
      });
      return response.choices[0].message.content || "";
    }, "Infer value proposition");

    if (result) {
      const vp = cleanAIResponse(result);
      if (vp && vp.length > 10) {
        enrichedKB.positioning = {
          ...enrichedKB.positioning,
          valueProposition: vp,
        };
      }
    }
  }

  return enrichedKB;
}

export async function generatePersonas(kb: KnowledgeBase): Promise<string[]> {
  const client = getNIMClient();
  if (!client) return ["AI unavailable"];

  const result = await callWithRetry(async () => {
    const response = await client!.chat.completions.create({
      model: NIM_MODEL,
      messages: [
        {
          role: "system",
          content: "List 3 customer personas. Each as a short paragraph. No numbering, no preamble.",
        },
        {
          role: "user",
          content: `Target customers for: ${kb.companyInfo.name}\nIndustry: ${kb.companyInfo.industry || "General"}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });
    return response.choices[0].message.content || "";
  }, "Generate personas");

  if (result) {
    const cleaned = cleanAIResponse(result);
    if (cleaned) {
      return cleaned.split(/\n\n+/).filter(p => p.length > 20);
    }
  }
  
  return ["Persona generation failed"];
}
