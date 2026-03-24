'use client';

import { useState } from 'react';
import { KnowledgeBase } from '@/types/knowledge';
import Link from 'next/link';

export default function KnowledgePage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);


  const handleScrape = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError(null);
    setKnowledgeBase(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout

      const response = await fetch('/api/analyze-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (result.success) {
        setKnowledgeBase(result.data);
        // Data is automatically saved to Supabase by the API
        if (result.saved) {
          console.log('Saved to Supabase:', result.saved);
        }
      } else {
        setError(result.error || 'Failed to scrape website');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('abort')) {
        setError('Request timed out. The website may be slow to respond.');
      } else {
        setError('An error occurred while scraping the website: ' + errorMessage);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Save is now automatic - data is saved to Supabase during scraping
  // This function is kept for the download feature
  const handlePrint = () => {
    if (!knowledgeBase) return;
    window.print();
  };

  const downloadJSON = () => {
    if (!knowledgeBase) return;

    const dataStr = JSON.stringify(knowledgeBase, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `knowledge-${knowledgeBase.companyInfo.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Build Knowledge Base
        </h1>

        {/* URL Input Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enter Company Website URL
          </label>
          <div className="flex gap-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={loading}
            />
            <button
              onClick={handleScrape}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Scraping...' : 'Scrape Website'}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-red-600 dark:text-red-400 text-sm">{error}</p>
          )}
        </div>

        {/* Results Section */}
        {knowledgeBase && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Extracted Knowledge
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Print
                </button>
                <button
                  onClick={downloadJSON}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Download JSON
                </button>
                <Link 
                  href="/knowledge/view"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-flex items-center"
                >
                  View All Saved
                </Link>
              </div>
            </div>

            <div className="space-y-6">
                {/* Company Info */}
                <Section title="Company Information">
                  <DataField label="Name" value={knowledgeBase.companyInfo.name} />
                  <DataField label="Website" value={knowledgeBase.companyInfo.website} />
                  <DataField label="Description" value={knowledgeBase.companyInfo.description} />
                  <DataField label="Industry" value={knowledgeBase.companyInfo.industry} />
                  <DataField label="Location" value={knowledgeBase.companyInfo.location?.join(', ')} />
                </Section>

                {/* Positioning */}
                {knowledgeBase.positioning && (
                  <Section title="Positioning">
                    <DataField label="Company Pitch" value={knowledgeBase.positioning.companyPitch} />
                    <DataField label="Value Proposition" value={knowledgeBase.positioning.valueProposition} />
                    <DataField label="Mission Statement" value={knowledgeBase.positioning.missionStatement} />
                    {knowledgeBase.positioning.aiGeneratedPitch && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-bold text-purple-600 dark:text-purple-400">🤖 AI-Generated Pitch</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {knowledgeBase.positioning.aiGeneratedPitch}
                        </p>
                      </div>
                    )}
                  </Section>
                )}

                {/* Customers */}
                {knowledgeBase.customers && (
                  <Section title="Target Customers">
                    <DataField label="Target Audience" value={knowledgeBase.customers.targetAudience?.join(', ')} />
                    <DataField label="Customer Needs" value={knowledgeBase.customers.customerNeeds?.join(', ')} />
                  </Section>
                )}

                {/* Branding */}
                {knowledgeBase.branding && (
                  <Section title="Branding">
                    <DataField label="Primary Colors" value={
                      knowledgeBase.branding.primaryColors?.map(color => (
                        <span key={color} className="inline-flex items-center gap-2 mr-2">
                          <span className="inline-block w-6 h-6 rounded border" style={{ backgroundColor: color }}></span>
                          {color}
                        </span>
                      ))
                    } />
                    {knowledgeBase.branding.logoUrl && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo</p>
                        <img src={knowledgeBase.branding.logoUrl} alt="Company Logo" className="max-w-xs" />
                      </div>
                    )}
                  </Section>
                )}

                {/* Online Presence */}
                {knowledgeBase.onlinePresence && (
                  <Section title="Online Presence">
                    <DataField label="Email" value={knowledgeBase.onlinePresence.email} />
                    <DataField label="Phone" value={knowledgeBase.onlinePresence.phone} />
                    {knowledgeBase.onlinePresence.socialMedia && knowledgeBase.onlinePresence.socialMedia.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Social Media</p>
                        <div className="flex flex-wrap gap-2">
                          {knowledgeBase.onlinePresence.socialMedia.map((social, idx) => (
                            <a
                              key={idx}
                              href={social.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800"
                            >
                              {social.platform}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </Section>
                )}

                {/* Products */}
                {knowledgeBase.products && knowledgeBase.products.length > 0 && (
                  <Section title="Products/Services">
                    {knowledgeBase.products.map((product, idx) => (
                      <div key={idx} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{product.name}</h4>
                        {product.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{product.description}</p>
                        )}
                        {product.features && product.features.length > 0 && (
                          <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300 list-disc list-inside">
                            {product.features.map((feature, fidx) => (
                              <li key={fidx}>{feature}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </Section>
                )}

                {/* Testimonials */}
                {knowledgeBase.testimonials && knowledgeBase.testimonials.length > 0 && (
                  <Section title="Testimonials">
                    {knowledgeBase.testimonials.map((testimonial, idx) => (
                      <div key={idx} className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{testimonial.content}"</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">- {testimonial.author}</p>
                      </div>
                    ))}
                  </Section>
                )}

                {/* FAQs */}
                {knowledgeBase.faqs && knowledgeBase.faqs.length > 0 && (
                  <Section title="FAQs">
                    {knowledgeBase.faqs.map((faq, idx) => (
                      <div key={idx} className="mb-3">
                        <p className="font-medium text-gray-900 dark:text-white">{faq.question}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{faq.answer}</p>
                      </div>
                    ))}
                  </Section>
                )}

                {/* Marketing CTAs */}
                {knowledgeBase.marketingCTAs && knowledgeBase.marketingCTAs.length > 0 && (
                  <Section title="Marketing CTAs">
                    <div className="flex flex-wrap gap-2">
                      {knowledgeBase.marketingCTAs.map((cta, idx) => (
                        <span key={idx} className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md text-sm">
                          {cta}
                        </span>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Trust Signals */}
                {knowledgeBase.trustSignals && knowledgeBase.trustSignals.length > 0 && (
                  <Section title="Trust Signals">
                    {knowledgeBase.trustSignals.map((signal, idx) => (
                      <div key={idx} className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                        {signal.name}
                      </div>
                    ))}
                  </Section>
                )}

                {/* AI Enrichments Metadata */}
                {knowledgeBase.aiEnrichments && (
                  <Section title="AI Enrichments">
                    <DataField label="Enriched At" value={knowledgeBase.aiEnrichments.enrichedAt} />
                    {knowledgeBase.aiEnrichments.enrichedFields && knowledgeBase.aiEnrichments.enrichedFields.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fields Enriched by AI: </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {knowledgeBase.aiEnrichments.enrichedFields.map((field, idx) => (
                            <span key={idx} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs">
                              {field}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </Section>
                )}
              </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
      {children}
    </div>
  );
}

function DataField({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  
  return (
    <div className="mb-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}: </span>
      <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>
    </div>
  );
}
