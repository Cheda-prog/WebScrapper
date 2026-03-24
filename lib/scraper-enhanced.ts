import axios, { AxiosError } from "axios";
import * as cheerio from "cheerio";
import type {
  KnowledgeBase,
  CompanyInfo,
  OnlinePresence,
  KeyPerson,
  Product,
  Testimonial,
  FAQ,
  Branding,
  Positioning,
  Customer,
} from "@/types/knowledge";

export async function scrapeWebsiteEnhanced(url: string): Promise<KnowledgeBase> {
  const maxRetries = 3;
  let lastError: Error | null = null;
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 2), 5000)));
      }

      const response = await axios.get(normalizedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400,
      });

      const $ = cheerio.load(response.data);

      return {
        sourceUrl: normalizedUrl,
        scrapedAt: new Date().toISOString(),
        companyInfo: extractCompanyInfo($, normalizedUrl),
        positioning: extractPositioning($),
        customers: extractCustomers($),
        branding: extractBranding($),
        onlinePresence: extractOnlinePresence($),
        keyPeople: extractKeyPeople($),
        products: extractProducts($),
        testimonials: extractTestimonials($),
        faqs: extractFAQs($),
        competitors: extractCompetitors($),
        marketingCTAs: extractCTAs($),
        trustSignals: extractTrustSignals($),
        blogTopics: extractBlogTopics($),
        rawMetadata: extractMetadata($),
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        console.error(`Scraping failed (attempt ${attempt}/${maxRetries}):`, { status, message: error.message });
        
        if (status === 403 || status === 444) {
          throw new Error(`Website blocking requests (HTTP ${status}). Try: Puppeteer, proxies, or scraping API.`);
        }
      } else if (lastError.message.includes('ENOTFOUND') || lastError.message.includes('ECONNREFUSED')) {
        throw new Error(`Cannot reach "${normalizedUrl}". Check if site is valid and online.`);
      }
      
      if (attempt === maxRetries) throw lastError;
    }
  }
  throw lastError || new Error("Scraping failed");
}

function extractCompanyInfo($: cheerio.CheerioAPI, url: string): CompanyInfo {
  return {
    name: $('meta[property="og:site_name"]').attr("content") || 
          $("title").text().split(/[|\-]/)[0].trim() || 
          "Unknown Company",
    description: $('meta[name="description"]').attr("content") || 
                 $('meta[property="og:description"]').attr("content") || "",
    website: url,
    industry: findIndustry($),
    businessModel: findBusinessModel($),
    location: findLocations($),
    foundedYear: findFoundingYear($),
    companySize: findCompanySize($),
  };
}

function extractPositioning($: cheerio.CheerioAPI): Positioning {
  const h1Text = $("h1").first().text().trim();
  return {
    companyPitch: h1Text || $('meta[property="og:description"]').attr("content") || "",
    valueProposition: findValueProposition($),
    missionStatement: findMissionStatement($),
    foundingStory: findFoundingStory($),
  };
}

function extractCustomers($: cheerio.CheerioAPI): Customer {
  return {
    targetAudience: findTargetAudience($),
    customerNeeds: findCustomerNeeds($),
    personas: findPersonas($),
  };
}

function extractBranding($: cheerio.CheerioAPI): Branding {
  const html = $.html();
  const colors: string[] = [];
  
  // Extract hex colors
  const hexMatches = html.match(/#[0-9A-Fa-f]{6}/g);
  if (hexMatches) colors.push(...new Set(hexMatches));
  
  // Extract fonts
  const fontMatches = html.match(/font-family:\s*([^;}"]+)/gi) || [];
  const fonts = fontMatches
    .map(f => f.match(/font-family:\s*([^;}"]+)/i)?.[1]?.replace(/['"]/g, '').split(',')[0] || '')
    .filter(f => f && !f.includes('sans-serif') && !f.includes('serif'))
    .slice(0, 5) as string[];

  return {
    primaryColors: colors.slice(0, 10),
    fonts: [...new Set(fonts)],
    logoUrl: findLogo($),
    toneOfVoice: findTone($),
    writingStyle: findWritingStyle($),
  };
}

function extractOnlinePresence($: cheerio.CheerioAPI): OnlinePresence {
  const socialMedia: { platform: string; url: string }[] = [];
  const socialPatterns: Record<string, string[]> = {
    'Facebook': ['facebook.com', 'fb.com'],
    'Twitter/X': ['twitter.com', 'x.com'],
    'LinkedIn': ['linkedin.com'],
    'Instagram': ['instagram.com'],
    'YouTube': ['youtube.com', 'youtu.be'],
  };

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    for (const [platform, patterns] of Object.entries(socialPatterns)) {
      if (patterns.some(p => href.includes(p)) && !socialMedia.find(s => s.url === href)) {
        socialMedia.push({ platform, url: href });
      }
    }
  });

  const emails: string[] = [];
  $('a[href^="mailto:"]').each((_, el) => {
    const email = $(el).attr("href")?.replace("mailto:", "");
    if (email) emails.push(email);
  });

  const phones: string[] = [];
  $('a[href^="tel:"]').each((_, el) => {
    const phone = $(el).attr("href")?.replace("tel:", "");
    if (phone) phones.push(phone);
  });

  return {
    socialMedia,
    email: emails[0],
    phone: phones[0],
  };
}

function extractKeyPeople($: cheerio.CheerioAPI): KeyPerson[] {
  const people: KeyPerson[] = [];
  const selectors = '[class*="team" i], [class*="about" i], [class*="leadership" i], [class*="founder" i]';

  $(selectors).each((_, section) => {
    $(section).find('[class*="member" i], .card, article').each((_, card) => {
      const name = $(card).find('h1, h2, h3, h4, .name').first().text().trim();
      const role = $(card).find('.role, .title, [class*="role" i]').first().text().trim();
      const bio = $(card).find('p').first().text().trim();
      
      if (name && name.length > 2) {
        people.push({
          name,
          role: role || "Team Member",
          bio: bio || undefined,
          imageUrl: $(card).find('img').first().attr('src'),
        });
      }
    });
  });
  return people.slice(0, 20);
}

function extractProducts($: cheerio.CheerioAPI): Product[] {
  const products: Product[] = [];
  const selectors = '[class*="product" i], [class*="service" i], [class*="offering" i]';

  $(selectors).each((_, el) => {
    const name = $(el).find("h1, h2, h3, h4").first().text().trim();
    const description = $(el).find("p").first().text().trim();
    const features: string[] = [];
    
    $(el).find("ul li").each((_, li) => {
      const feature = $(li).text().trim();
      if (feature.length > 3 && feature.length < 200) features.push(feature);
    });

    if (name && name.length > 3) {
      products.push({
        name,
        description: description || undefined,
        features: features.slice(0, 10),
        pricing: $(el).find('[class*="price" i]').first().text().trim() || undefined,
      });
    }
  });
  return products.slice(0, 25);
}

function extractTestimonials($: cheerio.CheerioAPI): Testimonial[] {
  const testimonials: Testimonial[] = [];
  const selectors = '[class*="testimonial" i], [class*="review" i], [class*="quote" i]';

  $(selectors).each((_, el) => {
    const content = $(el).find("p, blockquote").first().text().trim();
    const author = $(el).find('[class*="author" i], [class*="name" i]').first().text().trim() || "Anonymous";
    
    if (content && content.length > 20) {
      testimonials.push({ author, content, role: $(el).find('[class*="role" i]').first().text().trim() || undefined });
    }
  });
  return testimonials.slice(0, 20);
}

function extractFAQs($: cheerio.CheerioAPI): FAQ[] {
  const faqs: FAQ[] = [];
  const selectors = '[class*="faq" i], details, [class*="accordion" i]';

  $(selectors).each((_, el) => {
    const question = $(el).find('summary, h3, h4, [class*="question" i]').first().text().trim();
    const answer = $(el).find('p').first().text().trim();
    if (question && answer) faqs.push({ question, answer });
  });
  return faqs.slice(0, 30);
}

function extractCompetitors($: cheerio.CheerioAPI): { name: string; website?: string; differentiator?: string }[] {
  const competitors: { name: string; website?: string; differentiator?: string }[] = [];
  const text = $("body").text().toLowerCase();
  
  // Look for competitor mentions in common patterns
  const competitorPatterns = [
    /vs\.?\s+([A-Z][a-zA-Z\s&]+?)(?:[,.]|\s+and|\s+or)/g,
    /compare[sd]?\s+to\s+([A-Z][a-zA-Z\s&]+?)(?:[,.]|\s+and|\s+or)/g,
    /alternative\s+to\s+([A-Z][a-zA-Z\s&]+?)(?:[,.]|\s+and|\s+or)/g,
    /unlike\s+([A-Z][a-zA-Z\s&]+?)(?:[,.]|\s+and|\s+or)/g,
    /instead\s+of\s+([A-Z][a-zA-Z\s&]+?)(?:[,.]|\s+and|\s+or)/g
  ];

  // Search for competitor sections
  $('[class*="competitor" i], [class*="comparison" i], [class*="alternative" i]').each((_, el) => {
    const sectionText = $(el).text();
    
    // Extract company names from headings and links
    $(el).find('h3, h4, a[href*="://"]').each((_, item) => {
      const name = $(item).text().trim();
      const url = $(item).is('a') ? $(item).attr('href') : undefined;
      
      if (name && name.length > 2 && name.length < 50 && /^[A-Z]/.test(name)) {
        // Avoid generic terms
        const genericTerms = ['compare', 'vs', 'alternative', 'solution', 'software', 'tool', 'service'];
        if (!genericTerms.some(term => name.toLowerCase().includes(term))) {
          competitors.push({
            name: name.replace(/['"]/g, ''),
            website: url?.startsWith('http') ? url : undefined,
            differentiator: findDifferentiator($, name)
          });
        }
      }
    });
  });

  // Extract from text patterns
  const fullText = $("body").text();
  for (const pattern of competitorPatterns) {
    let match;
    while ((match = pattern.exec(fullText)) !== null && competitors.length < 15) {
      const name = match[1].trim().replace(/['"]/g, '');
      if (name.length > 2 && name.length < 50 && !competitors.find(c => c.name === name)) {
        competitors.push({
          name,
          differentiator: findDifferentiator($, name)
        });
      }
    }
  }

  return [...new Map(competitors.map(c => [c.name, c])).values()].slice(0, 10);
}

function extractBlogTopics($: cheerio.CheerioAPI): string[] {
  const topics = new Set<string>();
  
  // Look for blog sections or recent posts
  const blogSelectors = [
    '[class*="blog" i]',
    '[class*="article" i]', 
    '[class*="post" i]',
    '[class*="news" i]',
    '[class*="insights" i]',
    '[class*="resources" i]'
  ];

  for (const selector of blogSelectors) {
    $(selector).each((_, section) => {
      // Extract topics from headings
      $(section).find('h1, h2, h3, h4, .title, [class*="title" i]').each((_, heading) => {
        const topic = $(heading).text().trim();
        if (topic && topic.length > 5 && topic.length < 100) {
          // Clean up common prefixes/suffixes
          const cleanTopic = topic
            .replace(/^(blog|post|article):\s*/i, '')
            .replace(/\s*-\s*(read more|learn more|view post)$/i, '')
            .replace(/^\d+\.\s*/, '')  // Remove numbering
            .trim();
          
          if (cleanTopic.length > 5) {
            topics.add(cleanTopic);
          }
        }
      });

      // Extract topics from article links
      $(section).find('a').each((_, link) => {
        const text = $(link).text().trim();
        const href = $(link).attr('href');
        
        if (text && text.length > 10 && text.length < 100 && 
            href && (href.includes('/blog') || href.includes('/article') || href.includes('/post'))) {
          topics.add(text.replace(/^(read|view|see):\s*/i, '').trim());
        }
      });
    });
  }

  // Extract from meta tags that might indicate blog topics
  $('meta[name="keywords"]').each((_, meta) => {
    const keywords = $(meta).attr('content');
    if (keywords) {
      keywords.split(',').forEach(keyword => {
        const topic = keyword.trim();
        if (topic.length > 3 && topic.length < 50) {
          topics.add(topic);
        }
      });
    }
  });

  // Look for topic tags or categories
  $('[class*="tag" i], [class*="category" i], [class*="topic" i]').each((_, el) => {
    const topic = $(el).text().trim();
    if (topic && topic.length > 3 && topic.length < 50) {
      topics.add(topic);
    }
  });

  return Array.from(topics).slice(0, 20);
}

function extractCTAs($: cheerio.CheerioAPI): string[] {
  const ctas: string[] = [];
  $('button, a[class*="button" i], a[class*="cta" i], a[class*="btn" i]').each((_, el) => {
    const text = $(el).text().trim() || $(el).attr('value') || '';
    if (text.length > 2 && text.length < 100) ctas.push(text);
  });
  return [...new Set(ctas)].slice(0, 30);
}

function extractTrustSignals($: cheerio.CheerioAPI) {
  const signals: { type: string; name: string }[] = [];
  
  $('[class*="award" i]').each((_, el) => { signals.push({ type: "award", name: $(el).text().trim() }); });
  $('[class*="certified" i]').each((_, el) => { signals.push({ type: "certification", name: $(el).text().trim() }); });
  $('[class*="partner" i]').each((_, el) => {
    const name = $(el).find('img').attr('alt') || $(el).text().trim();
    if (name) signals.push({ type: "partnership", name });
  });
  
  return signals.slice(0, 25);
}

function extractMetadata($: cheerio.CheerioAPI) {
  const ogTags: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const prop = $(el).attr("property");
    const content = $(el).attr("content");
    if (prop && content) ogTags[prop] = content;
  });
  return {
    title: $("title").text(),
    metaDescription: $('meta[name="description"]').attr("content"),
    ogTags,
  };
}

// ============== HELPER FUNCTIONS ==============

function findIndustry($: cheerio.CheerioAPI): string | undefined {
  const industries = ["Accounting", "Tax Services", "Technology", "SaaS", "Finance", "Healthcare", 
    "E-commerce", "Marketing", "Education", "Real Estate", "Legal", "Construction", "Restaurant"];
  
  const text = ($("title").text() + " " + ($('meta[name="description"]').attr("content") || "")).toLowerCase();
  return industries.find(ind => text.includes(ind.toLowerCase()));
}

function findBusinessModel($: cheerio.CheerioAPI): string | undefined {
  const text = $("body").text().toLowerCase();
  if (text.includes('subscription') || text.includes('saas')) return 'SaaS';
  if (text.includes('b2b') || text.includes('enterprise')) return 'B2B';
  if (text.includes('e-commerce') || text.includes('online store')) return 'E-commerce';
  return undefined;
}

function findLocations($: cheerio.CheerioAPI): string[] | undefined {
  const locations: string[] = [];
  $('[class*="address" i], address').each((_, el) => {
    const text = $(el).text().trim();
    if (text) locations.push(text);
  });
  return locations.length > 0 ? [...new Set(locations)].slice(0, 5) : undefined;
}

function findFoundingYear($: cheerio.CheerioAPI): string | undefined {
  const text = $("body").text();
  const match = text.match(/(?:founded|established|since|©)\s*(\d{4})/i);
  if (match) {
    const year = parseInt(match[1]);
    if (year >= 1800 && year <= new Date().getFullYear()) return match[1];
  }
  return undefined;
}

function findCompanySize($: cheerio.CheerioAPI): string | undefined {
  const text = $("body").text();
  const match = text.match(/(\d+)\s*[-–]\s*(\d+)\s+employees/i) || 
                text.match(/team of (\d+)/i);
  return match ? match[0] : undefined;
}

function findValueProposition($: cheerio.CheerioAPI): string | undefined {
  const keywords = ["we help", "we provide", "we offer", "we specialize", "our mission"];
  for (const kw of keywords) {
    const p = $("p").filter((_, el) => $(el).text().toLowerCase().includes(kw)).first();
    const text = p.text().trim();
    if (text.length > 50 && text.length < 500) return text;
  }
  return undefined;
}

function findMissionStatement($: cheerio.CheerioAPI): string | undefined {
  const mission = $('[class*="mission" i]').find('p').first().text().trim();
  return mission.length > 20 ? mission : undefined;
}

function findFoundingStory($: cheerio.CheerioAPI): string | undefined {
  const story = $('[class*="story" i], [class*="history" i]').find('p').first().text().trim();
  return story.length > 100 ? story : undefined;
}

function findTargetAudience($: cheerio.CheerioAPI): string[] | undefined {
  const keywords = ["for businesses", "for entrepreneurs", "for individuals", "for developers", "for teams"];
  const text = $("body").text().toLowerCase();
  const found = keywords.filter(kw => text.includes(kw)).map(kw => kw.replace("for ", ""));
  return found.length > 0 ? found : undefined;
}

function findCustomerNeeds($: cheerio.CheerioAPI): string[] | undefined {
  const needs: string[] = [];
  $("h2, h3, p").filter((_, el) => {
    const text = $(el).text().toLowerCase();
    return text.includes("problem") || text.includes("challenge") || text.includes("need");
  }).each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 10 && text.length < 300) needs.push(text);
  });
  return needs.slice(0, 10);
}

function findPersonas($: cheerio.CheerioAPI): string[] | undefined {
  const text = $("body").text();
  const matches = [...text.matchAll(/(?:ideal|perfect)\s+(?:for|customer):\s*([^.!?]+)/gi)];
  return matches.length > 0 ? matches.map(m => m[1].trim()).slice(0, 5) : undefined;
}

function findTone($: cheerio.CheerioAPI): string | undefined {
  const text = $("body").text().toLowerCase();
  const tones: Record<string, string[]> = {
    'Friendly': ['friendly', 'welcome', 'happy'],
    'Professional': ['professional', 'expertise', 'quality'],
    'Helpful': ['help', 'support', 'service'],
  };
  const found = Object.entries(tones).filter(([_, kws]) => kws.filter(k => text.includes(k)).length >= 2).map(([tone]) => tone);
  return found.join(', ') || undefined;
}

function findWritingStyle($: cheerio.CheerioAPI): string | undefined {
  const text = $("body").text().toLowerCase();
  const styles: string[] = [];
  if (text.includes('we ') && text.includes('our ')) styles.push('First-person');
  if (['implement', 'solution', 'optimize'].filter(w => text.includes(w)).length > 2) styles.push('Technical');
  return styles.join(', ') || undefined;
}

function findLogo($: cheerio.CheerioAPI): string | undefined {
  const selectors = ['img[class*="logo" i]', 'img[alt*="logo" i]', '.logo img', 'header img:first'];
  for (const sel of selectors) {
    const src = $(sel).first().attr('src');
    if (src) return src.startsWith('http') ? src : undefined;
  }
  return undefined;
}

function findDifferentiator($: cheerio.CheerioAPI, competitorName: string): string | undefined {
  const text = $("body").text().toLowerCase();
  const competitor = competitorName.toLowerCase();
  
  // Look for text near the competitor mention that indicates differentiation
  const differentiatorPatterns = [
    `unlike ${competitor}`,
    `compared to ${competitor}`,
    `vs ${competitor}`,
    `better than ${competitor}`,
    `${competitor} doesn't`
  ];
  
  for (const pattern of differentiatorPatterns) {
    const index = text.indexOf(pattern);
    if (index !== -1) {
      // Extract surrounding context (100 chars after pattern)
      const context = text.substring(index, index + 150);
      const sentences = context.split(/[.!?]/);
      if (sentences[0] && sentences[0].length > 20) {
        return sentences[0].trim();
      }
    }
  }
  
  return undefined;
}
