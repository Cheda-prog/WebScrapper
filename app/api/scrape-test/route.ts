import { NextRequest, NextResponse } from 'next/server';
import { scrapeWebsiteEnhanced } from '@/lib/scraper-enhanced';

/**
 * Test endpoint that returns scraped data in a readable format
 * Access via: GET /api/scrape-test?url=https://account-it.net/
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url') || 'https://account-it.net/';

    console.log('🔍 Testing scrape of:', url);

    // Validate URL format
    let normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Scrape the website with enhanced extraction
    const startTime = Date.now();
    const scrapedData = await scrapeWebsiteEnhanced(normalizedUrl);
    const duration = Date.now() - startTime;

    console.log(`✅ Scraping completed in ${duration}ms`);

    // Return formatted data with enhanced summary
    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      url: normalizedUrl,
      scraped: scrapedData,
      summary: {
        companyName: scrapedData.companyInfo.name,
        industry: scrapedData.companyInfo.industry,
        businessModel: scrapedData.companyInfo.businessModel,
        foundedYear: scrapedData.companyInfo.foundedYear,
        description: scrapedData.companyInfo.description?.substring(0, 200) + '...',
        locations: scrapedData.companyInfo.location?.length || 0,
        productsFound: scrapedData.products?.length || 0,
        testimonialsFound: scrapedData.testimonials?.length || 0,
        faqsFound: scrapedData.faqs?.length || 0,
        keyPeopleFound: scrapedData.keyPeople?.length || 0,
        socialMediaFound: scrapedData.onlinePresence?.socialMedia?.length || 0,
        colorsFound: scrapedData.branding?.primaryColors?.length || 0,
        fontsFound: scrapedData.branding?.fonts?.length || 0,
        ctasFound: scrapedData.marketingCTAs?.length || 0,
        trustSignalsFound: scrapedData.trustSignals?.length || 0,
      }
    });
  } catch (error) {
    console.error('❌ Test scrape error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to scrape website',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
