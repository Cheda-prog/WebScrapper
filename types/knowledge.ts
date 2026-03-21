export interface CompanyInfo {
  name: string;
  description: string;
  website: string;
  industry?: string;
  businessModel?: string;
  location?: string[];
  companySize?: string;
  foundedYear?: string;
}

export interface Positioning {
  companyPitch?: string;
  foundingStory?: string;
  valueProposition?: string;
  missionStatement?: string;
}

export interface Customer {
  targetAudience?: string[];
  customerNeeds?: string[];
  personas?: string[];
}

export interface Branding {
  toneOfVoice?: string;
  writingStyle?: string;
  primaryColors?: string[];
  fonts?: string[];
  logoUrl?: string;
}

export interface OnlinePresence {
  socialMedia?: {
    platform: string;
    url: string;
  }[];
  blogUrl?: string;
  email?: string;
  phone?: string;
}

export interface KeyPerson {
  name: string;
  role: string;
  bio?: string;
  imageUrl?: string;
}

export interface Product {
  name: string;
  description?: string;
  features?: string[];
  pricing?: string;
  category?: string;
}

export interface Testimonial {
  author: string;
  role?: string;
  content: string;
  rating?: number;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Competitor {
  name: string;
  website?: string;
  differentiator?: string;
}

export interface TrustSignal {
  type: string; // 'award', 'certification', 'partnership', 'media'
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface KnowledgeBase {
  id?: string;
  sourceUrl: string;
  scrapedAt: string;
  companyInfo: CompanyInfo;
  positioning?: Positioning;
  customers?: Customer;
  branding?: Branding;
  onlinePresence?: OnlinePresence;
  keyPeople?: KeyPerson[];
  products?: Product[];
  testimonials?: Testimonial[];
  faqs?: FAQ[];
  competitors?: Competitor[];
  trustSignals?: TrustSignal[];
  marketingCTAs?: string[];
  blogTopics?: string[];
  rawMetadata?: {
    title?: string;
    metaDescription?: string;
    ogTags?: Record<string, string>;
  };
}

export interface ScraperResponse {
  success: boolean;
  data?: KnowledgeBase;
  error?: string;
}
