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

/**
 * Enhanced web scraper that extracts comprehensive business intelligence
 * Includes detailed company info, branding, market analysis, and more
 */
export async function scrapeWebsiteEnhanced(url: string): Promise<KnowledgeBase> {
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 2), 5000);
        console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms delay`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const response = await axios.get(normalizedUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Cache-Control": "max-age=0",
          "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
        },
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400,
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Enhanced extraction with more detail
      const companyInfo = extractEnhancedCompanyInfo($, normalizedUrl);
      const positioning = extractEnhancedPositioning($);
      const customers = extractEnhancedCustomers($);
      const branding = extractEnhancedBranding($, html);
      const onlinePresence = extractEnhancedOnlinePresence($);
      const keyPeople = extractEnhancedKeyPeople($);
      const products = extractEnhancedProducts($);
      const testimonials = extractEnhancedTestimonials($);
      const faqs = extractFAQs($);
      const marketingCTAs = extractEnhancedCTAs($);
      const trustSignals = extractEnhancedTrustSignals($);
      const rawMetadata = extractEnhancedMetadata($);

      const knowledgeBase: KnowledgeBase = {
        sourceUrl: normalizedUrl,
        scrapedAt: new Date().toISOString(),
        companyInfo,
        positioning,
        customers,
        branding,
        onlinePresence,
        keyPeople,
        products,
        testimonials,
        faqs,
        marketingCTAs,
        trustSignals,
        rawMetadata,
      };

      return knowledgeBase;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;
        
        console.error(`Scraping attempt ${attempt}/${maxRetries} failed:`, {
          status,
          message: axiosError.message,
          url: normalizedUrl,
        });

        if (status === 444 || status === 403) {
          lastError = new Error(
            `The website is blocking scraping requests (HTTP ${status}). ` +
            `This website has anti-bot protection. Consider using:\n` +
            `1. A scraping API service (set SCRAPER_API_KEY env variable)\n` +
            `2. Puppeteer/Playwright for JavaScript rendering\n` +
            `3. Residential proxies\n` +
            `Current attempt: ${attempt}/${maxRetries}`
          );
        }
      } else {
        console.error(`Scraping attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      }
      
      if (attempt === maxRetries) {
        throw lastError;
      }
    }
  }

  throw lastError || new Error("Failed to scrape website: Unknown error");
}

// ============================================================================
// ENHANCED EXTRACTION FUNCTIONS
// ============================================================================

function extractEnhancedCompanyInfo($: cheerio.CheerioAPI, url: string): CompanyInfo {
  const name =
    $('meta[property="og:site_name"]').attr("content") ||
    $("title").text().split("|")[0].split("-")[0].trim() ||
    "Unknown Company";

  const description =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    $('p[class*="description" i], p[class*="intro" i]').first().text().trim() ||
    "";

  // Extract business model
  const businessModel = extractBusinessModel($);
  
  // Extract founding year
  const foundedYear = extractFoundingYear($);
  
  // Extract company size
  const companySize = extractCompanySize($);

  return {
    name,
    description,
    website: url,
    industry: findIndustryEnhanced($),
    businessModel,
    location: findLocationsEnhanced($),
    foundedYear,
    companySize,
  };
}

function extractEnhancedPositioning($: cheerio.CheerioAPI): Positioning {
  // Extract company pitch / tagline
  const h1Texts = $("h1")
    .map((_, el) => $(el).text().trim())
    .get();
  const companyPitch =
    h1Texts[0] || 
    $('meta[property="og:description"]').attr("content") || 
    $('.hero h2, .tagline, [class*="slogan" i]').first().text().trim() ||
    "";

  // Extract founding story
  const foundingStory = extractFoundingStory($);

  // Enhanced value proposition extraction
  const valueProposition = extractValueProposition($);

  // Mission statement
  const missionStatement = findMissionStatement($);

  return {
    companyPitch,
    foundingStory,
    valueProposition,
    missionStatement,
  };
}

function extractEnhancedCustomers($: cheerio.CheerioAPI): Customer {
  return {
    targetAudience: findTargetAudienceEnhanced($),
    customerNeeds: findCustomerNeedsEnhanced($),
    personas: extractPersonas($),
  };
}

function extractEnhancedBranding($: cheerio.CheerioAPI, html: string): Branding {
  // Extract colors from CSS
  const colors: string[] = [];
  const styleTag = $("style").text();
  const inlineStyles = html.match(/style="[^"]*"/g) || [];
  const allStyles = styleTag + " " + inlineStyles.join(" ");
  
  // Extract hex colors
  const colorMatches = allStyles.match(/#[0-9A-Fa-f]{6}/g);
  if (colorMatches) {
    colors.push(...new Set(colorMatches).values());
  }
  
  // Extract RGB colors and convert to hex
  const rgbMatches = allStyles.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/g);
  if (rgbMatches) {
    rgbMatches.forEach(rgb => {
      const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const hex = `#${Number(match[1]).toString(16).padStart(2, '0')}${Number(match[2]).toString(16).padStart(2, '0')}${Number(match[3]).toString(16).padStart(2, '0')}`;
        colors.push(hex);
      }
    });
  }

  // Extract fonts
  const fonts: string[] = [];
  const fontFamilyMatches = allStyles.match(/font-family:\s*([^;}"]+)/gi);
  if (fontFamilyMatches) {
    fontFamilyMatches.forEach(font => {
      const match = font.match(/font-family:\s*([^;}"]+)/i);
      if (match) {
        const fontName = match[1].replace(/['"]/g, '').split(',')[0].trim();
        if (fontName && !fontName.includes('sans-serif') && !fontName.includes('serif')) {
          fonts.push(fontName);
        }
      }
    });
  }

  // Extract writing style
  const writingStyle = extractWritingStyle($);

  return {
    primaryColors: [...new Set(colors)].slice(0, 10),
    fonts: [...new Set(fonts)].slice(0, 5),
    logoUrl: extractLogo($),
    writingStyle,
    toneOfVoice: extractToneOfVoice($),
  };
}

function extractEnhancedOnlinePresence($: cheerio.CheerioAPI): OnlinePresence {
  const socialMedia: { platform: string; url: string }[] = [];

  // More comprehensive social media detection
  const socialPatterns = {
    'Facebook': ['facebook.com', 'fb.com'],
    'Twitter/X': ['twitter.com', 'x.com'],
    'LinkedIn': ['linkedin.com'],
    'Instagram': ['instagram.com'],
    'YouTube': ['youtube.com', 'youtu.be'],
    'TikTok': ['tiktok.com'],
    'Pinterest': ['pinterest.com'],
    'GitHub': ['github.com'],
  };

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      for (const [platform, patterns] of Object.entries(socialPatterns)) {
        if (patterns.some(pattern => href.includes(pattern))) {
          // Avoid duplicates
          if (!socialMedia.find(sm => sm.url === href)) {
            socialMedia.push({ platform, url: href });
          }
          break;
        }
      }
    }
  });

  // Extract email addresses
  const emails: string[] = [];
  $('a[href^="mailto:"]').each((_, el) => {
    const email = $(el).attr("href")?.replace("mailto:", "");
    if (email) emails.push(email);
  });
  
  // Also find emails in text
  const bodyText = $('body').text();
  const emailMatches = bodyText.match(/[\w.-]+@[\w.-]+\.\w+/g);
  if (emailMatches) {
    emails.push(...emailMatches);
  }

  // Extract phone numbers
  const phones: string[] = [];
  $('a[href^="tel:"]').each((_, el) => {
    const phone = $(el).attr("href")?.replace("tel:", "");
    if (phone) phones.push(phone);
  });

  return {
    socialMedia: socialMedia.filter(
      (v, i, a) => a.findIndex((t) => t.url === v.url) === i,
    ),
    email: emails[0],
    phone: phones[0],
  };
}

function extractEnhancedKeyPeople($: cheerio.CheerioAPI): KeyPerson[] {
  const people: KeyPerson[] = [];

  // Look for team sections
  $('[class*="team" i], [class*="about" i], [class*="leadership" i], [class*="founder" i]').each((_, section) => {
    $(section).find('[class*="member" i], [class*="person" i], .card, article').each((_, card) => {
      const name = $(card).find('h1, h2, h3, h4, h5, .name, [class*="name" i]').first().text().trim();
      const role = $(card).find('.role, .title, [class*="role" i], [class*="title" i], [class*="position" i]').first().text().trim();
      const bio = $(card).find('p, .bio, [class*="bio" i], [class*="description" i]').first().text().trim();
      const imageUrl = $(card).find('img').first().attr('src');

      if (name && name.length > 2) {
        people.push({
          name,
          role: role || "Team Member",
          bio: bio || undefined,
          imageUrl: imageUrl || undefined,
        });
      }
    });
  });

  return people.slice(0, 20);
}

function extractEnhancedProducts($: cheerio.CheerioAPI): Product[] {
  const products: Product[] = [];

  // Look for product/service sections
  $('[class*="product" i], [class*="service" i], [class*="offering" i], [class*="pricing" i], [class*="plan" i]').each(
    (_, el) => {
      const name = $(el).find("h1, h2, h3, h4").first().text().trim();
      const description = $(el).find("p, .description, [class*='description' i]").first().text().trim();
      
      // Extract features
      const features: string[] = [];
      $(el).find("ul li, ol li, [class*='feature' i]").each((_, li) => {
        const feature = $(li).text().trim();
        if (feature && feature.length > 3 && feature.length < 200) {
          features.push(feature);
        }
      });

      // Extract pricing
      const pricingText = $(el).find('[class*="price" i], .cost, .amount').first().text().trim();
      
      // Extract category
      const category = $(el).closest('[class*="category" i]').find('h2, h3').first().text().trim() ||
                      $(el).attr('data-category') || undefined;

      if (name && name.length > 3) {
        products.push({
          name,
          description: description || undefined,
          features: features.slice(0, 10),
          pricing: pricingText || undefined,
          category: category || undefined,
        });
      }
    },
  );

  return products.slice(0, 25);
}

function extractEnhancedTestimonials($: cheerio.CheerioAPI): Testimonial[] {
  const testimonials: Testimonial[] = [];

  $('[class*="testimonial" i], [class*="review" i], [class*="quote" i], [class*="feedback" i]').each(
    (_, el) => {
      const content = $(el).find("p, blockquote, .content, [class*='content' i], [class*='text' i]").first().text().trim();
      const author = $(el)
        .find('[class*="author" i], [class*="name" i], .name, cite')
        .first()
        .text()
        .trim() || "Anonymous";
      
      const role = $(el)
        .find('[class*="role" i], [class*="title" i], [class*="company" i]')
        .first()
        .text()
        .trim();

      // Try to extract rating
      const ratingStars = $(el).find('[class*="star" i], [class*="rating" i]').length;
      const ratingText = $(el).find('[class*="rating" i]').text();
      const ratingMatch = ratingText.match(/(\d+(\.\d+)?)\s*(\/|out of)\s*(\d+)/);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : (ratingStars > 0 ? ratingStars : undefined);

      if (content && content.length > 20) {
        testimonials.push({
          author,
          role: role || undefined,
          content,
          rating,
        });
      }
    },
  );

  return testimonials.slice(0, 20);
}

function extractFAQs($: cheerio.CheerioAPI): FAQ[] {
  const faqs: FAQ[] = [];

  $('[class*="faq" i], [itemtype*="FAQPage"], [class*="accordion" i]').each((_, section) => {
    $(section)
      .find('details, [class*="question" i], [class*="item" i], .accordion-item')
      .each((_, el) => {
        const question = $(el)
          .find('summary, [class*="question" i], h3, h4, .title, dt')
          .first()
          .text()
          .trim();
        const answer = $(el)
          .find('p, [class*="answer" i], dd, .content')
          .first()
          .text()
          .trim();

        if (question && answer) {
          faqs.push({ question, answer });
        }
      });
  });

  return faqs.slice(0, 30);
}

function extractEnhancedCTAs($: cheerio.CheerioAPI): string[] {
  const ctas: string[] = [];

  $('button, a[class*="button" i], a[class*="cta" i], a[class*="btn" i], [role="button"], input[type="submit"]').each((_, el) => {
    const text = $(el).text().trim() || $(el).attr('value') || $(el).attr('aria-label') || '';
    if (text && text.length > 2 && text.length < 100) {
      ctas.push(text);
    }
  });

  return [...new Set(ctas)].slice(0, 30);
}

function extractEnhancedTrustSignals($: cheerio.CheerioAPI) {
  const trustSignals: { type: string; name: string; description?: string }[] = [];

  // Awards
  $('[class*="award" i], [class*="badge" i]').each((_, el) => {
    const name = $(el).text().trim() || $(el).attr('alt') || $(el).attr('title') || '';
    if (name) {
      trustSignals.push({
        type: "award",
        name,
      });
    }
  });

  // Certifications
  $('[class*="certification" i], [class*="certified" i]').each((_, el) => {
    const name = $(el).text().trim();
    if (name) {
      trustSignals.push({
        type: "certification",
        name,
      });
    }
  });

  // Partnerships
  $('[class*="partner" i], [class*="client" i], [class*="logo" i]').each((_, el) => {
    const name = $(el).find('img').attr('alt') || $(el).text().trim();
    if (name && name.length > 2) {
      trustSignals.push({
        type: "partnership",
        name,
      });
    }
  });

  return trustSignals.slice(0, 25);
}

function extractEnhancedMetadata($: cheerio.CheerioAPI) {
  const ogTags: Record<string, string> = {};

  $('meta[property^="og:"]').each((_, el) => {
    const property = $(el).attr("property");
    const content = $(el).attr("content");
    if (property && content) {
      ogTags[property] = content;
    }
  });

  return {
    title: $("title").text(),
    metaDescription: $('meta[name="description"]').attr("content"),
    ogTags,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function findIndustryEnhanced($: cheerio.CheerioAPI): string | undefined {
  const industries = [
    "Accounting", "Tax Services", "Financial Services", "Bookkeeping",
    "Technology", "Software", "SaaS", "IT Services",
    "Finance", "Banking", "Investment",
    "Healthcare", "Medical", "Dental", "Pharmacy",
    "E-commerce", "Retail", "Online Store",
    "Marketing", "Advertising", "PR", "Digital Marketing",
    "Education", "Training", "E-learning",
    "Real Estate", "Property Management",
    "Legal", "Law", "Attorney",
    "Construction", "Architecture", "Engineering",
    "Restaurant", "Food Service", "Catering",
    "Manufacturing", "Industrial",
    "Consulting", "Professional Services",
  ];
  
  const pageText = $("body").text().toLowerCase();
  const title = $("title").text().toLowerCase();
  const description = $('meta[name="description"]').attr("content")?.toLowerCase() || '';

  for (const industry of industries) {
    const industryLower = industry.toLowerCase();
    if (title.includes(industryLower) || description.includes(industryLower)) {
      return industry;
    }
  }

  for (const industry of industries) {
    if (pageText.includes(industry.toLowerCase())) {
      return industry;
    }
  }
  
  return undefined;
}

function findLocationsEnhanced($: cheerio.CheerioAPI): string[] | undefined {
  const locations: string[] = [];
  
  // Look for address elements
  $('[class*="address" i], address, [itemtype*="PostalAddress"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text) locations.push(text);
  });

  // Look for location mentions in text
  const bodyText = $('body').text();
  const locationPatterns = [
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\s*\d{5}\b/g, // City, ST 12345
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][a-z]+)\b/g, // City, State
  ];

  locationPatterns.forEach(pattern => {
    const matches = bodyText.matchAll(pattern);
    for (const match of matches) {
      if (match[0]) locations.push(match[0]);
    }
  });

  return locations.length > 0 ? [...new Set(locations)].slice(0, 5) : undefined;
}

function extractBusinessModel($: cheerio.CheerioAPI): string | undefined {
  const pageText = $('body').text().toLowerCase();
  
  const modelKeywords = {
    'B2B': ['b2b', 'business to business', 'enterprise', 'for businesses'],
    'B2C': ['b2c', 'business to consumer', 'for individuals', 'for consumers'],
    'SaaS': ['saas', 'software as a service', 'subscription', 'cloud-based'],
    'Marketplace': ['marketplace', 'platform', 'connect buyers and sellers'],
    'Service Provider': ['services', 'consulting', 'professional services'],
    'E-commerce': ['online store', 'shop online', 'e-commerce'],
  };

  for (const [model, keywords] of Object.entries(modelKeywords)) {
    if (keywords.some(keyword => pageText.includes(keyword))) {
      return model;
    }
  }

  return undefined;
}

function extractFoundingYear($: cheerio.CheerioAPI): string | undefined {
  const pageText = $('body').text();
  
  // Look for patterns like "Founded in 2003", "Since 2003", "Est. 2003"
  const yearPatterns = [
    /(?:founded|established|since|est\.?)\s+(?:in\s+)?(\d{4})/i,
    /©\s*(\d{4})/,
  ];

  for (const pattern of yearPatterns) {
    const match = pageText.match(pattern);
    if (match && match[1]) {
      const year = parseInt(match[1]);
      if (year >= 1800 && year <= new Date().getFullYear()) {
        return match[1];
      }
    }
  }

  return undefined;
}

function extractCompanySize($: cheerio.CheerioAPI): string | undefined {
  const pageText = $('body').text().toLowerCase();
  
  const sizePatterns = [
    /(\d+)\s*[-–]\s*(\d+)\s+employees/i,
    /team of (\d+)/i,
    /(\d+)\s+team members/i,
  ];

  for (const pattern of sizePatterns) {
    const match = pageText.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return undefined;
}

function extractFoundingStory($: cheerio.CheerioAPI): string | undefined {
  // Look for sections about history, story, or founding
  const storyElements = $('[class*="story" i], [class*="history" i], [class*="about" i], [id*="story" i]');
  
  let story = '';
  storyElements.each((_, el) => {
    const text = $(el).find('p').first().text().trim();
    if (text.length > 100 && text.length < 1000) {
      story = text;
      return false; // break
    }
  });

  return story || undefined;
}

function extractValueProposition($: cheerio.CheerioAPI): string | undefined {
  const keywords = [
    "we help", "we provide", "we offer", "we enable", "we deliver",
    "our mission", "our goal", "we specialize", "committed to",
  ];
  
  const paragraphs = $("p");

  for (let i = 0; i < paragraphs.length; i++) {
    const text = $(paragraphs[i]).text();
    const textLower = text.toLowerCase();
    
    for (const keyword of keywords) {
      if (textLower.includes(keyword) && text.length > 50 && text.length < 500) {
        return text.trim();
      }
    }
  }
  
  return undefined;
}

function findMissionStatement($: cheerio.CheerioAPI): string | undefined {
  const missionElements = $('[class*="mission" i], [id*="mission" i]');
  const mission = missionElements.find('p').first().text().trim();
  return mission.length > 20 ? mission : undefined;
}

function findTargetAudienceEnhanced($: cheerio.CheerioAPI): string[] | undefined {
  const audiences: string[] = [];
  const keywords = [
    "for businesses", "for entrepreneurs", "for startups", "for enterprises",
    "for individuals", "for families", "for professionals",
    "for developers", "for marketers", "for designers",
    "for teams", "for organizations", "for agencies",
    "for small business", "for freelancers",
  ];
  
  const pageText = $("body").text().toLowerCase();

  keywords.forEach((keyword) => {
    if (pageText.includes(keyword)) {
      audiences.push(keyword.replace("for ", ""));
    }
  });

  return audiences.length > 0 ? audiences : undefined;
}

function findCustomerNeedsEnhanced($: cheerio.CheerioAPI): string[] | undefined {
  const needs: string[] = [];
  
  // Look for problem/challenge/pain sections
  const problemKeywords = $("h2, h3, p").filter((_, el) => {
    const text = $(el).text().toLowerCase();
    return (
      text.includes("problem") ||
      text.includes("challenge") ||
      text.includes("pain") ||
      text.includes("struggle") ||
      text.includes("difficulty") ||
      text.includes("need")
    );
  });

  problemKeywords.each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 10 && text.length < 300) {
      needs.push(text);
    }
  });

  return needs.length > 0 ? needs.slice(0, 10) : undefined;
}

function extractPersonas($: cheerio.CheerioAPI): string[] | undefined {
  const personas: string[] = [];
  const pageText = $('body').text();
  
  // Look for "ideal customer" or "perfect for" sections
  const personaPatterns = [
    /(?:ideal|perfect)\s+(?:for|customer):\s*([^.!?]+)/gi,
    /(?:who (?:we serve|this is for)):\s*([^.!?]+)/gi,
  ];

  personaPatterns.forEach(pattern => {
    const matches = pageText.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        personas.push(match[1].trim());
      }
    }
  });

  return personas.length > 0 ? personas.slice(0, 5) : undefined;
}

function extractWritingStyle($: cheerio.CheerioAPI): string | undefined {
  const bodyText = $('body').text();
  const paragraphs = $('p').map((_, el) => $(el).text()).get();
  
  if (paragraphs.length === 0) return undefined;

  // Analyze tone
  const professionalWords = ['professional', 'expert', 'qualified', 'certified', 'experienced'];
  const casualWords = ['we', 'you', 'your', 'our', 'hey', 'awesome'];
  const technicalWords = ['implement', 'solution', 'optimize', 'integrate', 'configure'];
  
  const textLower = bodyText.toLowerCase();
  const professionalCount = professionalWords.filter(w => textLower.includes(w)).length;
  const casualCount = casualWords.filter(w => textLower.includes(w)).length;
  const technicalCount = technicalWords.filter(w => textLower.includes(w)).length;

  const styles: string[] = [];
  if (professionalCount > 3) styles.push('Professional');
  if (casualCount > 5) styles.push('Conversational');
  if (technicalCount > 3) styles.push('Technical');
  
  // Check if uses first person
  if (textLower.includes('we ') && textLower.includes('our ')) {
    styles.push('First-person');
  }

  return styles.length > 0 ? styles.join(', ') : undefined;
}

function extractToneOfVoice($: cheerio.CheerioAPI): string | undefined {
  const bodyText = $('body').text().toLowerCase();
  
  const tones = {
    'Friendly': ['friendly', 'welcome', 'happy to', 'love to', 'excited'],
    'Professional': ['professional', 'expertise', 'quality', 'excellence'],
    'Authoritative': ['leader', 'industry-leading', 'proven', 'trusted'],
    'Helpful': ['help', 'support', 'guide', 'assist', 'service'],
    'Innovative': ['innovative', 'cutting-edge', 'modern', 'advanced'],
  };

  const detectedTones: string[] = [];
  for (const [tone, keywords] of Object.entries(tones)) {
    const count = keywords.filter(keyword => bodyText.includes(keyword)).length;
    if (count >= 2) {
      detectedTones.push(tone);
    }
  }

  return detectedTones.length > 0 ? detectedTones.join(', ') : undefined;
}

function extractLogo($: cheerio.CheerioAPI): string | undefined {
  // Look for logo in common places
  const logoSelectors = [
    'img[class*="logo" i]',
    'img[id*="logo" i]',
    'img[alt*="logo" i]',
    '.logo img',
    '#logo img',
    'header img:first',
    '.navbar-brand img',
  ];

  for (const selector of logoSelectors) {
    const src = $(selector).first().attr('src');
    if (src) {
      return src.startsWith('http') ? src : undefined;
    }
  }

  return undefined;
}
