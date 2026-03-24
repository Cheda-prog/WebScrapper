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

# Instructions:
# 1.make an .env.local file
# 2. Go to https://app.supabase.com
# 3. Select your project (or create one if you haven't)
# 4. Go to Project Settings > API
# 5 fill out these 3 variables NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# 6 For Ai enchancement go to https://build.nvidia.com/ 
# 7 Click the standard generate API key and then fill out this variable NVIDIA_API_KEY 


## Directory Structure

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


