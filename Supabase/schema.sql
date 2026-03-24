-- =====================================================
-- COMPLETE WEB SCRAPPER DATABASE SCHEMA FOR SUPABASE
-- =====================================================
-- DROP EXISTING SCHEMA WITH CASCADE AND RECREATE EVERYTHING
-- Run this entire script in your Supabase SQL editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing schema if it exists (CASCADE will remove dependent objects)
DROP TABLE IF EXISTS trust_signals CASCADE;
DROP TABLE IF EXISTS competitors CASCADE;
DROP TABLE IF EXISTS faqs CASCADE;
DROP TABLE IF EXISTS testimonials CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS key_people CASCADE;
DROP TABLE IF EXISTS social_media CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS knowledge_bases CASCADE;
DROP TABLE IF EXISTS knowledge_base_json CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS create_knowledge_base_version() CASCADE;

-- =====================================================
-- PRIMARY STORAGE TABLE (JSON Approach - Preferred)
-- =====================================================
CREATE TABLE knowledge_base_json (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT NOT NULL,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL,
  company_name TEXT,
  company_description TEXT,
  full_data JSONB NOT NULL, -- Complete KnowledgeBase object as JSON
  ai_pitch TEXT, -- AI-generated pitch (THIS WAS MISSING!)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STRUCTURED TABLES (Fallback Approach)
-- =====================================================

-- Companies table (main entity)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  website TEXT NOT NULL UNIQUE,
  industry TEXT,
  business_model TEXT,
  company_size TEXT,
  founded_year TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge bases table (stores scraped data with versioning)
CREATE TABLE knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  is_latest BOOLEAN DEFAULT TRUE,
  
  -- Positioning
  company_pitch TEXT,
  ai_generated_pitch TEXT, -- THIS WAS MISSING IN ORIGINAL SCHEMA!
  founding_story TEXT,
  value_proposition TEXT,
  mission_statement TEXT,
  
  -- Customers
  target_audience TEXT[], -- Array of strings
  customer_needs TEXT[],
  personas TEXT[],
  
  -- Branding
  tone_of_voice TEXT,
  writing_style TEXT,
  primary_colors TEXT[],
  fonts TEXT[],
  logo_url TEXT,
  
  -- Contact & Online Presence
  email TEXT,
  phone TEXT,
  blog_url TEXT,
  
  -- Marketing
  marketing_ctas TEXT[],
  blog_topics TEXT[],
  
  -- Metadata
  raw_metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations table (many-to-many with companies)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  country TEXT,
  is_headquarters BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social media links
CREATE TABLE social_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  followers_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Key people
CREATE TABLE key_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products/Services
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  pricing TEXT,
  features TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Testimonials
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  role TEXT,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FAQs
CREATE TABLE faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitors
CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  differentiator TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trust signals (awards, certifications, partnerships)
CREATE TABLE trust_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('award', 'certification', 'partnership', 'media')),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  date_received DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- JSON table indexes
CREATE INDEX idx_knowledge_base_json_created_at ON knowledge_base_json(created_at);
CREATE INDEX idx_knowledge_base_json_company_name ON knowledge_base_json(company_name);
CREATE INDEX idx_knowledge_base_json_source_url ON knowledge_base_json(source_url);
CREATE INDEX idx_knowledge_base_json_scraped_at ON knowledge_base_json(scraped_at);

-- Structured table indexes
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_website ON companies(website);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_knowledge_bases_company_id ON knowledge_bases(company_id);
CREATE INDEX idx_knowledge_bases_is_latest ON knowledge_bases(is_latest);
CREATE INDEX idx_knowledge_bases_created_at ON knowledge_bases(created_at);
CREATE INDEX idx_products_company_id ON products(company_id);
CREATE INDEX idx_testimonials_company_id ON testimonials(company_id);
CREATE INDEX idx_faqs_company_id ON faqs(company_id);
CREATE INDEX idx_key_people_company_id ON key_people(company_id);
CREATE INDEX idx_competitors_company_id ON competitors(company_id);
CREATE INDEX idx_trust_signals_company_id ON trust_signals(company_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE knowledge_base_json ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_signals ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PERMISSIVE POLICIES (ALLOW ALL FOR DEVELOPMENT)
-- =====================================================
-- NOTE: In production, you should restrict these policies based on your auth requirements

-- JSON table policies
CREATE POLICY "Allow all operations on knowledge_base_json" ON knowledge_base_json FOR ALL USING (true);

-- Structured table policies
CREATE POLICY "Allow all operations on companies" ON companies FOR ALL USING (true);
CREATE POLICY "Allow all operations on knowledge_bases" ON knowledge_bases FOR ALL USING (true);
CREATE POLICY "Allow all operations on locations" ON locations FOR ALL USING (true);
CREATE POLICY "Allow all operations on social_media" ON social_media FOR ALL USING (true);
CREATE POLICY "Allow all operations on key_people" ON key_people FOR ALL USING (true);
CREATE POLICY "Allow all operations on products" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations on testimonials" ON testimonials FOR ALL USING (true);
CREATE POLICY "Allow all operations on faqs" ON faqs FOR ALL USING (true);
CREATE POLICY "Allow all operations on competitors" ON competitors FOR ALL USING (true);
CREATE POLICY "Allow all operations on trust_signals" ON trust_signals FOR ALL USING (true);

-- =====================================================
-- UTILITY FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp trigger to relevant tables
CREATE TRIGGER update_knowledge_base_json_updated_at BEFORE UPDATE ON knowledge_base_json
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_bases_updated_at BEFORE UPDATE ON knowledge_bases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create a new version when updating knowledge base
CREATE OR REPLACE FUNCTION create_knowledge_base_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark previous versions as not latest
  UPDATE knowledge_bases
  SET is_latest = FALSE
  WHERE company_id = NEW.company_id AND id != NEW.id;
  
  -- Increment version
  NEW.version = (
    SELECT COALESCE(MAX(version), 0) + 1
    FROM knowledge_bases
    WHERE company_id = NEW.company_id
  );
  
  NEW.is_latest = TRUE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER knowledge_base_versioning BEFORE INSERT ON knowledge_bases
  FOR EACH ROW EXECUTE FUNCTION create_knowledge_base_version();

-- =====================================================
-- TEST THE SETUP
-- =====================================================

-- Insert a test record to verify JSON table works
INSERT INTO knowledge_base_json (
  source_url, 
  scraped_at, 
  company_name, 
  company_description, 
  full_data,
  ai_pitch
) VALUES (
  'https://test-setup.com',
  NOW(),
  'Test Setup Company',
  'Test Description for Schema Setup',
  '{"test": "schema_setup_successful", "companyInfo": {"name": "Test Company"}}',
  'This is a test AI-generated pitch to verify the ai_pitch column works.'
);

-- Verify the setup worked
SELECT 
  'Schema setup completed successfully!' as status,
  'knowledge_base_json table' as primary_table,
  count(*) as test_records_count
FROM knowledge_base_json 
WHERE source_url = 'https://test-setup.com';

-- Show all tables created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN (
  'knowledge_base_json', 
  'companies', 
  'knowledge_bases',
  'locations',
  'social_media', 
  'key_people',
  'products',
  'testimonials',
  'faqs',
  'competitors',
  'trust_signals'
) AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Final success message
SELECT 
  '🎉 DATABASE SCHEMA SETUP COMPLETE!' as message,
  'Your web scrapper can now save data to Supabase!' as status;