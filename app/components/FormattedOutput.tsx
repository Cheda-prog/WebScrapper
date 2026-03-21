/**
 * Knowledge Base Formatter
 * 
 * Formats scraped data into a clean, readable report like the Account IT example
 */

import { KnowledgeBase } from '@/types/knowledge';

interface FormattedOutputProps {
  data: KnowledgeBase;
  url: string;
}

export default function FormattedOutput({ data, url }: FormattedOutputProps) {
  const { companyInfo, positioning, customers, branding, products, testimonials, keyPeople, faqs, onlinePresence } = data;

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      {/* Company Name Header */}
      <h1 className="text-4xl font-bold mb-6 text-gray-900">{companyInfo.name || 'Company Report'}</h1>

      {/* Overview Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b-2 border-gray-300 pb-2">Overview</h2>
        <p className="text-gray-700 leading-relaxed mb-4">{companyInfo.description || 'No description available.'}</p>
      </section>

      {/* Company Details */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b-2 border-gray-300 pb-2">Company Details</h2>
        <div className="space-y-2 text-gray-700">
          <p><strong>Website:</strong> <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{url}</a></p>
          {companyInfo.industry && <p><strong>Industry:</strong> {companyInfo.industry}</p>}
          {companyInfo.businessModel && <p><strong>Business Model:</strong> {companyInfo.businessModel}</p>}
          {companyInfo.foundedYear && <p><strong>Year Founded:</strong> {companyInfo.foundedYear}</p>}
          {companyInfo.location && companyInfo.location.length > 0 && (
            <p><strong>Locations:</strong> {companyInfo.location.join(', ')}</p>
          )}
        </div>
      </section>

      {/* Pitch */}
      {positioning?.companyPitch && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b-2 border-gray-300 pb-2">Pitch</h2>
          <p className="text-gray-700 leading-relaxed">{positioning.companyPitch}</p>
        </section>
      )}

      {/* Market & Customers */}
      {customers && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b-2 border-gray-300 pb-2">Market & Customers</h2>
          <div className="space-y-4 text-gray-700">
            {customers.targetAudience && customers.targetAudience.length > 0 && (
              <p><strong>Target Audience:</strong> {customers.targetAudience.join(', ')}</p>
            )}
            {customers.customerNeeds && customers.customerNeeds.length > 0 && (
              <div>
                <strong>Customer Needs:</strong>
                <p className="mt-2 leading-relaxed">{customers.customerNeeds.join('. ')}</p>
              </div>
            )}
            {customers.personas && customers.personas.length > 0 && (
              <div>
                <strong>Personas:</strong>
                <ul className="mt-2 list-disc list-inside">
                  {customers.personas.map((persona, idx) => (
                    <li key={idx}>{persona}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTAs */}
      {data.marketingCTAs && data.marketingCTAs.length > 0 && (
        <section className="mb-8">
          <div className="text-gray-700">
            <p><strong>CTAs:</strong> {data.marketingCTAs.join(', ')}</p>
          </div>
        </section>
      )}

      {/* Founding Story */}
      {positioning?.foundingStory && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b-2 border-gray-300 pb-2">Founding Story</h2>
          <p className="text-gray-700 leading-relaxed">{positioning.foundingStory}</p>
        </section>
      )}

      {/* Branding & Style */}
      {branding && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b-2 border-gray-300 pb-2">Branding & Style</h2>
          <div className="space-y-2 text-gray-700">
            {branding.writingStyle && <p><strong>Writing Style:</strong> {branding.writingStyle}</p>}
            {branding.fonts && branding.fonts.length > 0 && (
              <p><strong>Fonts:</strong> {branding.fonts.join(', ')}</p>
            )}
            {branding.primaryColors && branding.primaryColors.length > 0 && (
              <div>
                <p><strong>Colors:</strong></p>
                <div className="flex gap-4 mt-2">
                  {branding.primaryColors.map((color, idx) => (
                    <div key={idx} className="text-center">
                      <div 
                        className="w-16 h-16 rounded border border-gray-300" 
                        style={{ backgroundColor: color }}
                      ></div>
                      <p className="text-sm mt-1">{color}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {branding.logoUrl && (
              <div>
                <p><strong>Logo:</strong></p>
                <img src={branding.logoUrl} alt="Company Logo" className="mt-2 max-w-xs" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Online Presence */}
      {onlinePresence && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b-2 border-gray-300 pb-2">Online Presence</h2>
          <div className="space-y-2 text-gray-700">
            {onlinePresence.email && (
              <p><strong>Email:</strong> {onlinePresence.email}</p>
            )}
            {onlinePresence.phone && (
              <p><strong>Phone:</strong> {onlinePresence.phone}</p>
            )}
            {onlinePresence.blogUrl && (
              <p><strong>Blog:</strong> <a href={onlinePresence.blogUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{onlinePresence.blogUrl}</a></p>
            )}
            {onlinePresence.socialMedia && onlinePresence.socialMedia.length > 0 && (
              <div>
                <strong>Social Media:</strong>
                <ul className="mt-2 list-disc list-inside">
                  {onlinePresence.socialMedia.map((social, idx) => (
                    <li key={idx}>
                      <strong>{social.platform}:</strong> <a href={social.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{social.url}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Key People */}
      {keyPeople && keyPeople.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b-2 border-gray-300 pb-2">Key People</h2>
          <div className="space-y-6">
            {keyPeople.map((member, idx) => (
              <div key={idx} className="border-l-4 border-gray-300 pl-4">
                <h3 className="text-xl font-semibold text-gray-900">{member.name} — {member.role}</h3>
                {member.bio && <p className="text-gray-700 mt-2 leading-relaxed">{member.bio}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Products/Services/Offerings */}
      {products && products.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b-2 border-gray-300 pb-2">Offerings</h2>
          <div className="space-y-6">
            {products.map((product, idx) => (
              <div key={idx} className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {product.name}
                  {product.category && <span className="text-gray-600 font-normal"> ({product.category})</span>}
                </h3>
                {product.features && product.features.length > 0 && (
                  <p className="text-gray-600 mt-1"><strong>Features:</strong> {product.features.join('. ')}</p>
                )}
                {product.description && (
                  <p className="text-gray-700 mt-2 leading-relaxed">{product.description}</p>
                )}
                {product.pricing && (
                  <p className="text-gray-600 mt-2"><strong>Pricing:</strong> {product.pricing}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials && testimonials.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b-2 border-gray-300 pb-2">Testimonials</h2>
          <div className="space-y-4">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-700 italic">"{testimonial.content}"</p>
                <p className="text-gray-600 mt-2 text-sm">
                  — {testimonial.author}
                  {testimonial.role && <span>, {testimonial.role}</span>}
                </p>
                {testimonial.rating && (
                  <p className="text-yellow-500 mt-1">{'★'.repeat(testimonial.rating)}{'☆'.repeat(5 - testimonial.rating)}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQs */}
      {faqs && faqs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b-2 border-gray-300 pb-2">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx}>
                <h3 className="text-lg font-semibold text-gray-900">Q: {faq.question}</h3>
                <p className="text-gray-700 mt-1 leading-relaxed">A: {faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer with timestamp */}
      <footer className="mt-12 pt-6 border-t border-gray-300 text-sm text-gray-500 text-center">
        Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
      </footer>
    </div>
  );
}
