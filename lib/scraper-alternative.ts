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
} from "@/types/knowledge";

/**
 * Alternative scraper using different techniques to bypass anti-bot protection
 * This uses a scraping API service when direct scraping fails
 */
export async function scrapeWebsiteAlternative(url: string): Promise<KnowledgeBase> {
  try {
    // Ensure URL has protocol
    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

    // Try ScraperAPI if API key is available
    const scraperApiKey = process.env.SCRAPER_API_KEY;
    
    let html: string;
    
    if (scraperApiKey) {
      console.log("Using ScraperAPI to bypass anti-bot protection");
      const apiUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(normalizedUrl)}`;
      const response = await axios.get(apiUrl, { timeout: 60000 });
      html = response.data;
    } else {
      console.log("No ScraperAPI key found, attempting direct scrape with advanced headers");
      // Try direct scraping with randomized realistic headers
      const response = await axios.get(normalizedUrl, {
        headers: getRandomHeaders(),
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400,
      });
      html = response.data;
    }

    const $ = cheerio.load(html);

    // Extract all data (same extraction logic)
    const companyInfo = extractCompanyInfo($, normalizedUrl);
    const positioning = extractPositioning($);
    const customers = extractCustomers($);
    const branding = extractBranding($);
    const onlinePresence = extractOnlinePresence($);
    const keyPeople = extractKeyPeople($);
    const products = extractProducts($);
    const testimonials = extractTestimonials($);
    const faqs = extractFAQs($);
    const marketingCTAs = extractCTAs($);
    const trustSignals = extractTrustSignals($);
    const rawMetadata = extractMetadata($);

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
    console.error("Alternative scraping error:", error);
    throw new Error(
      `Failed to scrape website: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

function getRandomHeaders() {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
  ];

  const acceptLanguages = [
    "en-US,en;q=0.9",
    "en-GB,en;q=0.9",
    "en-US,en;q=0.9,es;q=0.8",
  ];

  return {
    "User-Agent": userAgents[Math.floor(Math.random() * userAgents.length)],
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": acceptLanguages[Math.floor(Math.random() * acceptLanguages.length)],
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
    "DNT": "1",
  };
}

// Include all the extraction functions from the original scraper
function extractCompanyInfo($: cheerio.CheerioAPI, url: string): CompanyInfo {
  const name =
    $('meta[property="og:site_name"]').attr("content") ||
    $("title").text().split("|")[0].trim() ||
    "Unknown Company";

  const description =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    "";

  return {
    name,
    description,
    website: url,
    industry: findIndustry($),
    location: findLocations($),
  };
}

function extractPositioning($: cheerio.CheerioAPI) {
  const h1Texts = $("h1")
    .map((_, el) => $(el).text().trim())
    .get();
  const companyPitch =
    h1Texts[0] || $('meta[property="og:description"]').attr("content") || "";

  return {
    companyPitch,
    valueProposition: findValueProposition($),
    missionStatement: findMissionStatement($),
  };
}

function extractCustomers($: cheerio.CheerioAPI) {
  return {
    targetAudience: findTargetAudience($),
    customerNeeds: findCustomerNeeds($),
  };
}

function extractBranding($: cheerio.CheerioAPI) {
  const colors: string[] = [];
  const styleTag = $("style").text();
  const colorMatches = styleTag.match(/#[0-9A-Fa-f]{6}/g);
  if (colorMatches) {
    colors.push(...new Set(colorMatches.slice(0, 5)));
  }

  return {
    primaryColors: colors,
    logoUrl: $('img[alt*="logo" i], img[class*="logo" i]').first().attr("src"),
  };
}

function extractOnlinePresence($: cheerio.CheerioAPI): OnlinePresence {
  const socialMedia: { platform: string; url: string }[] = [];

  const socialLinks = $(
    'a[href*="facebook.com"], a[href*="twitter.com"], a[href*="linkedin.com"], a[href*="instagram.com"], a[href*="youtube.com"]',
  );

  socialLinks.each((_, el) => {
    const href = $(el).attr("href");
    if (href) {
      let platform = "Unknown";
      if (href.includes("facebook")) platform = "Facebook";
      else if (href.includes("twitter") || href.includes("x.com"))
        platform = "Twitter/X";
      else if (href.includes("linkedin")) platform = "LinkedIn";
      else if (href.includes("instagram")) platform = "Instagram";
      else if (href.includes("youtube")) platform = "YouTube";

      socialMedia.push({ platform, url: href });
    }
  });

  const email = $('a[href^="mailto:"]')
    .first()
    .attr("href")
    ?.replace("mailto:", "");
  const phone = $('a[href^="tel:"]').first().attr("href")?.replace("tel:", "");

  return {
    socialMedia: socialMedia.filter(
      (v, i, a) => a.findIndex((t) => t.url === v.url) === i,
    ),
    email,
    phone,
  };
}

function extractKeyPeople($: cheerio.CheerioAPI): KeyPerson[] {
  const people: KeyPerson[] = [];

  $('[class*="team" i], [class*="about" i]')
    .find("img, h3, h4")
    .each((_, el) => {
      const text = $(el).text().trim();
      const nameMatch = text.match(/^[A-Z][a-z]+ [A-Z][a-z]+/);
      if (nameMatch) {
        people.push({
          name: nameMatch[0],
          role: $(el).next("p").text().trim() || "Team Member",
        });
      }
    });

  return people.slice(0, 10);
}

function extractProducts($: cheerio.CheerioAPI): Product[] {
  const products: Product[] = [];

  $('[class*="product" i], [class*="service" i], [class*="pricing" i]').each(
    (_, el) => {
      const name = $(el).find("h2, h3, h4").first().text().trim();
      const description = $(el).find("p").first().text().trim();

      if (name && name.length > 3) {
        products.push({
          name,
          description: description || undefined,
          features: $(el)
            .find("li")
            .map((_, li) => $(li).text().trim())
            .get()
            .slice(0, 5),
        });
      }
    },
  );

  return products.slice(0, 10);
}

function extractTestimonials($: cheerio.CheerioAPI): Testimonial[] {
  const testimonials: Testimonial[] = [];

  $('[class*="testimonial" i], [class*="review" i], [class*="quote" i]').each(
    (_, el) => {
      const content = $(el).find("p, blockquote").first().text().trim();
      const author =
        $(el)
          .find('[class*="author" i], [class*="name" i]')
          .first()
          .text()
          .trim() || "Anonymous";

      if (content && content.length > 20) {
        testimonials.push({
          author,
          content,
        });
      }
    },
  );

  return testimonials.slice(0, 10);
}

function extractFAQs($: cheerio.CheerioAPI): FAQ[] {
  const faqs: FAQ[] = [];

  $('[class*="faq" i], [itemtype*="FAQPage"]').each((_, section) => {
    $(section)
      .find('details, [class*="question" i]')
      .each((_, el) => {
        const question = $(el)
          .find('summary, [class*="question" i]')
          .first()
          .text()
          .trim();
        const answer = $(el)
          .find('p, [class*="answer" i]')
          .first()
          .text()
          .trim();

        if (question && answer) {
          faqs.push({ question, answer });
        }
      });
  });

  return faqs.slice(0, 15);
}

function extractCTAs($: cheerio.CheerioAPI): string[] {
  const ctas: string[] = [];

  $('button, a[class*="button" i], a[class*="cta" i]').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 3 && text.length < 50) {
      ctas.push(text);
    }
  });

  return [...new Set(ctas)].slice(0, 15);
}

function extractTrustSignals($: cheerio.CheerioAPI) {
  const trustSignals: { type: string; name: string }[] = [];

  $(
    '[class*="award" i], [class*="certification" i], [class*="partner" i]',
  ).each((_, el) => {
    const name = $(el).text().trim();
    if (name) {
      trustSignals.push({
        type: "award",
        name,
      });
    }
  });

  return trustSignals.slice(0, 10);
}

function extractMetadata($: cheerio.CheerioAPI) {
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

// Helper functions
function findIndustry($: cheerio.CheerioAPI): string | undefined {
  const industries = [
    "Technology",
    "Finance",
    "Healthcare",
    "E-commerce",
    "SaaS",
    "Marketing",
    "Education",
    "Real Estate",
    "Accounting",
    "Bookkeeping",
  ];
  const pageText = $("body").text().toLowerCase();

  for (const industry of industries) {
    if (pageText.includes(industry.toLowerCase())) {
      return industry;
    }
  }
  return undefined;
}

function findLocations($: cheerio.CheerioAPI): string[] | undefined {
  const locations: string[] = [];
  const addressElements = $('[class*="address" i], address');

  addressElements.each((_, el) => {
    const text = $(el).text().trim();
    if (text) locations.push(text);
  });

  return locations.length > 0 ? locations : undefined;
}

function findValueProposition($: cheerio.CheerioAPI): string | undefined {
  const keywords = [
    "we help",
    "we provide",
    "we offer",
    "our mission",
    "we enable",
  ];
  const paragraphs = $("p");

  for (let i = 0; i < paragraphs.length; i++) {
    const text = $(paragraphs[i]).text().toLowerCase();
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return $(paragraphs[i]).text().trim();
      }
    }
  }
  return undefined;
}

function findMissionStatement($: cheerio.CheerioAPI): string | undefined {
  const missionElements = $('[class*="mission" i], [id*="mission" i]');
  return missionElements.first().text().trim() || undefined;
}

function findTargetAudience($: cheerio.CheerioAPI): string[] | undefined {
  const audiences: string[] = [];
  const keywords = [
    "for businesses",
    "for entrepreneurs",
    "for developers",
    "for marketers",
    "for teams",
  ];
  const pageText = $("body").text().toLowerCase();

  keywords.forEach((keyword) => {
    if (pageText.includes(keyword)) {
      audiences.push(keyword.replace("for ", ""));
    }
  });

  return audiences.length > 0 ? audiences : undefined;
}

function findCustomerNeeds($: cheerio.CheerioAPI): string[] | undefined {
  const needs: string[] = [];
  const problemKeywords = $("h2, h3").filter((_, el) => {
    const text = $(el).text().toLowerCase();
    return (
      text.includes("problem") ||
      text.includes("challenge") ||
      text.includes("pain")
    );
  });

  problemKeywords.each((_, el) => {
    needs.push($(el).text().trim());
  });

  return needs.length > 0 ? needs : undefined;
}
