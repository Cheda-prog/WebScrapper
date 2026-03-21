import { NextRequest, NextResponse } from 'next/server';
import { scrapeWebsiteEnhanced } from '@/lib/scraper-enhanced';

/**
 * Generate a formatted report from scraped data
 * Access via: GET /api/report?url=https://account-it.net/
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url') || 'https://account-it.net/';

    console.log('🔍 Generating report for:', url);

    let normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    try {
      new URL(normalizedUrl);
    } catch {
      return new NextResponse('Invalid URL format', { status: 400 });
    }

    const scrapedData = await scrapeWebsiteEnhanced(normalizedUrl);

    // Generate formatted text report
    const report = generateTextReport(scrapedData);

    return new NextResponse(report, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('❌ Report generation error:', error);
    return new NextResponse(
      `Error generating report: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
}

function generateTextReport(data: any): string {
  const lines: string[] = [];
  
  lines.push('═'.repeat(80));
  lines.push('COMPANY INTELLIGENCE REPORT');
  lines.push('═'.repeat(80));
  lines.push('');
  
  // Overview Section
  lines.push('OVERVIEW');
  lines.push('─'.repeat(80));
  lines.push(`${data.companyInfo.description || 'No description available'}`);
  lines.push('');
  
  // Company Details
  lines.push('COMPANY DETAILS');
  lines.push('─'.repeat(80));
  lines.push(`Website: ${data.companyInfo.website}`);
  if (data.companyInfo.industry) {
    lines.push(`Industry: ${data.companyInfo.industry}`);
  }
  if (data.companyInfo.businessModel) {
    lines.push(`Business Model: ${data.companyInfo.businessModel}`);
  }
  if (data.companyInfo.foundedYear) {
    lines.push(`Year Founded: ${data.companyInfo.foundedYear}`);
  }
  if (data.companyInfo.location && data.companyInfo.location.length > 0) {
    lines.push(`Service Locations: ${data.companyInfo.location.join(', ')}`);
  }
  lines.push('');
  
  // Pitch
  if (data.positioning?.companyPitch || data.positioning?.valueProposition) {
    lines.push('PITCH');
    lines.push('─'.repeat(80));
    if (data.positioning.companyPitch) {
      lines.push(data.positioning.companyPitch);
      lines.push('');
    }
    if (data.positioning.valueProposition) {
      lines.push(data.positioning.valueProposition);
    }
    lines.push('');
  }
  
  // Market & Customers
  if (data.customers && (data.customers.targetAudience || data.customers.customerNeeds)) {
    lines.push('MARKET & CUSTOMERS');
    lines.push('─'.repeat(80));
    
    if (data.customers.targetAudience && data.customers.targetAudience.length > 0) {
      lines.push(`Target Audience: ${data.customers.targetAudience.join(', ')}`);
      lines.push('');
    }
    
    if (data.customers.customerNeeds && data.customers.customerNeeds.length > 0) {
      lines.push('Customer Needs:');
      data.customers.customerNeeds.forEach((need: string, i: number) => {
        lines.push(`${i + 1}. ${need}`);
      });
      lines.push('');
    }
  }
  
  // Founding Story
  if (data.positioning?.foundingStory) {
    lines.push('FOUNDING STORY');
    lines.push('─'.repeat(80));
    lines.push(data.positioning.foundingStory);
    lines.push('');
  }
  
  // Branding & Style
  if (data.branding) {
    lines.push('BRANDING & STYLE');
    lines.push('─'.repeat(80));
    
    if (data.branding.writingStyle) {
      lines.push(`Writing Style: ${data.branding.writingStyle}`);
    }
    if (data.branding.toneOfVoice) {
      lines.push(`Tone of Voice: ${data.branding.toneOfVoice}`);
    }
    if (data.branding.fonts && data.branding.fonts.length > 0) {
      lines.push(`Fonts: ${data.branding.fonts.join(', ')}`);
    }
    if (data.branding.primaryColors && data.branding.primaryColors.length > 0) {
      lines.push(`Colors: ${data.branding.primaryColors.join(' ')}`);
    }
    if (data.branding.logoUrl) {
      lines.push(`Logo: ${data.branding.logoUrl}`);
    }
    lines.push('');
  }
  
  // Online Presence
  if (data.onlinePresence) {
    lines.push('ONLINE PRESENCE');
    lines.push('─'.repeat(80));
    
    if (data.onlinePresence.email) {
      lines.push(`Email: ${data.onlinePresence.email}`);
    }
    if (data.onlinePresence.phone) {
      lines.push(`Phone: ${data.onlinePresence.phone}`);
    }
    
    if (data.onlinePresence.socialMedia && data.onlinePresence.socialMedia.length > 0) {
      lines.push('');
      lines.push('Social Media:');
      data.onlinePresence.socialMedia.forEach((sm: any) => {
        lines.push(`  ${sm.platform}: ${sm.url}`);
      });
    }
    lines.push('');
  }
  
  // Key People
  if (data.keyPeople && data.keyPeople.length > 0) {
    lines.push('KEY PEOPLE');
    lines.push('─'.repeat(80));
    data.keyPeople.forEach((person: any) => {
      lines.push(`${person.name} — ${person.role}`);
      if (person.bio) {
        lines.push(`  ${person.bio}`);
      }
      lines.push('');
    });
  }
  
  // Products/Services
  if (data.products && data.products.length > 0) {
    lines.push('OFFERINGS');
    lines.push('─'.repeat(80));
    data.products.forEach((product: any) => {
      lines.push(`${product.name}${product.category ? ` (${product.category})` : ''}`);
      if (product.description) {
        lines.push(`  ${product.description}`);
      }
      if (product.features && product.features.length > 0) {
        lines.push('  Features:');
        product.features.forEach((feature: string) => {
          lines.push(`    • ${feature}`);
        });
      }
      if (product.pricing) {
        lines.push(`  Pricing: ${product.pricing}`);
      }
      lines.push('');
    });
  }
  
  // Testimonials
  if (data.testimonials && data.testimonials.length > 0) {
    lines.push('TESTIMONIALS');
    lines.push('─'.repeat(80));
    data.testimonials.forEach((testimonial: any) => {
      lines.push(`"${testimonial.content}"`);
      lines.push(`  — ${testimonial.author}${testimonial.role ? `, ${testimonial.role}` : ''}`);
      if (testimonial.rating) {
        lines.push(`  Rating: ${'⭐'.repeat(Math.floor(testimonial.rating))}`);
      }
      lines.push('');
    });
  }
  
  // FAQs
  if (data.faqs && data.faqs.length > 0) {
    lines.push('FREQUENTLY ASKED QUESTIONS');
    lines.push('─'.repeat(80));
    data.faqs.forEach((faq: any, i: number) => {
      lines.push(`Q${i + 1}: ${faq.question}`);
      lines.push(`A: ${faq.answer}`);
      lines.push('');
    });
  }
  
  // Marketing CTAs
  if (data.marketingCTAs && data.marketingCTAs.length > 0) {
    lines.push('MARKETING CTAs');
    lines.push('─'.repeat(80));
    lines.push(data.marketingCTAs.slice(0, 15).join(', '));
    lines.push('');
  }
  
  // Trust Signals
  if (data.trustSignals && data.trustSignals.length > 0) {
    lines.push('TRUST SIGNALS');
    lines.push('─'.repeat(80));
    data.trustSignals.forEach((signal: any) => {
      lines.push(`[${signal.type.toUpperCase()}] ${signal.name}`);
    });
    lines.push('');
  }
  
  // Footer
  lines.push('═'.repeat(80));
  lines.push(`Report Generated: ${new Date().toLocaleString()}`);
  lines.push(`Source: ${data.sourceUrl}`);
  lines.push('═'.repeat(80));
  
  return lines.join('\n');
}
