# MoFlo Knowledge Builder

A Next.js application that scrapes company websites and saves structured business data to Supabase.

**🚀 Pure Web Scraping - No AI Required!**

## Features

- **Web Scraping**: Automatically extracts comprehensive business information from any company website using Cheerio
- **Structured Data Extraction**: Collects company info, positioning, customers, branding, products, testimonials, FAQs, and more
- **Supabase Integration**: All scraped data automatically saved to Supabase database
- **Formatted Reports**: Clean, readable output styled like professional business reports (see Account IT example)
- **Export Options**: Download data as JSON or print formatted reports
- **Database Versioning**: Keeps history of scrapes with version tracking
- **Modern UI**: Built with Next.js 15, TypeScript, and Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Scraping**: Cheerio + Axios
- **Database**: Supabase (PostgreSQL)
- **State Management**: React hooks and Context

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works great!) - https://app.supabase.com

📖 **For detailed setup instructions, see [SETUP.md](SETUP.md)**

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd WebScrapper
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a project at https://app.supabase.com
   - Run `Supabase/schema.sql` in Supabase SQL Editor
   - Get your API credentials from Project Settings → API

4. Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

5. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Building a Knowledge Base

1. Navigate to `/knowledge`
2. Enter a company website URL (e.g., `https://example.com`)
3. Click "Scrape Website"
4. Review the extracted data
5. Edit if needed (click "Edit Mode")
6. Save or download as JSON

### Viewing Saved Knowledge Bases

1. Navigate to `/knowledge/view`
2. Browse saved knowledge bases in your preferred view mode
3. Search by company name, industry, or description
4. Download or delete knowledge bases as needed

## Architecture

### Directory Structure

```
WebScrapper/
├── app/
│   ├── api/
│   │   └── scrape/
│   │       └── route.ts          # Scraping API endpoint
│   ├── knowledge/
│   │   ├── page.tsx              # Build knowledge base page
│   │   └── view/
│   │       └── page.tsx          # View saved knowledge bases
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── lib/
│   └── scraper.ts                # Web scraping logic
├── types/
│   └── knowledge.ts              # TypeScript interfaces
├── Supabase/
│   └── schema.sql                # Database schema
└── package.json
```

### Data Schema

The application extracts and structures data into the following categories:

1. **Company Information**: Name, description, website, industry, location, size
2. **Positioning**: Pitch, founding story, value proposition, mission
3. **Customers**: Target audience, customer needs, personas
4. **Branding**: Colors, fonts, logo, tone of voice
5. **Online Presence**: Social media, email, phone
6. **Key People**: Names, roles, bios
7. **Products/Services**: Names, descriptions, features, pricing
8. **Testimonials**: Customer reviews and feedback
9. **FAQs**: Common questions and answers
10. **Competitors**: Competitor analysis
11. **Trust Signals**: Awards, certifications, partnerships
12. **Marketing CTAs**: Call-to-action buttons and messages

See `types/knowledge.ts` for detailed TypeScript interfaces.

## Database Schema

The Supabase database uses a normalized schema with the following key tables:

- `companies`: Main company information
- `knowledge_bases`: Scraped data with versioning support
- `products`, `testimonials`, `faqs`: Related entities
- `social_media`, `locations`, `key_people`: Company details
- `competitors`, `trust_signals`: Additional insights

**Key Features**:
- Row Level Security (RLS) for data protection
- Automatic versioning for knowledge base updates
- Indexes for optimized queries
- Triggers for timestamp management

See `Supabase/schema.sql` for the complete schema.

## AI/LLM Integration

While this demo doesn't use live AI, the data structure is optimized for LLM processing. Here are example prompts for future AI integration:

### Prompt 1: Generate Company Pitch
```
Given the following company data extracted from their website:

Company Name: {companyInfo.name}
Description: {companyInfo.description}
Industry: {companyInfo.industry}
Products: {products.map(p => p.name).join(', ')}
Value Proposition: {positioning.valueProposition}

Task: Generate a compelling 2-paragraph company pitch that highlights their unique value proposition and target market. The pitch should be suitable for investor presentations or executive summaries.
```

### Prompt 2: Create Customer Personas
```
Based on this company's website data:

Target Audience: {customers.targetAudience.join(', ')}
Customer Needs: {customers.customerNeeds.join(', ')}
Products: {products.map(p => ({ name: p.name, description: p.description }))}
Testimonials: {testimonials.map(t => t.content).join('\n')}

Task: Create 3 detailed customer personas including:
- Demographics
- Pain points
- Goals
- How the company's product solves their problems
- Preferred communication channels
```

### Prompt 3: Generate Marketing Content
```
Using the following company knowledge base:

Company: {companyInfo.name}
Industry: {companyInfo.industry}
Products: {products}
Branding Tone: {branding.toneOfVoice}
Existing CTAs: {marketingCTAs.join(', ')}
FAQs: {faqs}

Task: Generate 5 social media posts (LinkedIn, Twitter) that:
- Highlight key product features
- Address customer pain points from the FAQs
- Match the company's tone of voice
- Include strong CTAs similar to the existing ones
- Are optimized for engagement
```

## Handling Missing or Incomplete Data

The scraper implements several strategies for handling missing data:

1. **Graceful Degradation**: All optional fields use TypeScript's optional chaining
2. **Multiple Extraction Methods**: Tries multiple selectors and fallback strategies
3. **Metadata Fallbacks**: Uses OpenGraph tags and meta descriptions when primary content is unavailable
4. **User Editing**: Edit mode allows manual correction of incomplete data
5. **Validation**: API validates URLs and provides clear error messages

For AI enrichment, missing data can be handled by:
- Using LLMs to infer missing fields from available data
- Cross-referencing with external APIs (LinkedIn, Crunchbase)
- Generating placeholder content with clear labels
- Prompting users to manually fill critical gaps

## Future Enhancements

- [ ] Real-time AI integration for data enrichment
- [ ] Multi-page scraping for deeper insights
- [ ] Competitor analysis automation
- [ ] Screenshot capture and visual analysis
- [ ] Export to multiple formats (PDF, CSV, Markdown)
- [ ] Team collaboration features
- [ ] API access for third-party integrations
- [ ] Scheduled re-scraping for data freshness

## Example Output

See `examples/sample-knowledge-base.json` for a complete example of scraped data.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ for MoFlo
