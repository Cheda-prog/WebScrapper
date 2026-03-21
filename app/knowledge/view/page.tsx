'use client';

import { useState, useEffect } from 'react';
import { KnowledgeBase } from '@/types/knowledge';
import Link from 'next/link';

type ViewMode = 'card' | 'table' | 'detail';

export default function ViewKnowledgePage() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [filteredBases, setFilteredBases] = useState<KnowledgeBase[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null);

  useEffect(() => {
    // Load from localStorage (in production, this would be Supabase)
    const saved = JSON.parse(localStorage.getItem('knowledgeBases') || '[]');
    setKnowledgeBases(saved);
    setFilteredBases(saved);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = knowledgeBases.filter(kb =>
        kb.companyInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kb.companyInfo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kb.companyInfo.industry?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBases(filtered);
    } else {
      setFilteredBases(knowledgeBases);
    }
  }, [searchQuery, knowledgeBases]);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this knowledge base?')) {
      const updated = knowledgeBases.filter(kb => kb.id !== id);
      setKnowledgeBases(updated);
      setFilteredBases(updated);
      localStorage.setItem('knowledgeBases', JSON.stringify(updated));
      if (selectedKB?.id === id) {
        setSelectedKB(null);
      }
    }
  };

  const downloadJSON = (kb: KnowledgeBase) => {
    const dataStr = JSON.stringify(kb, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `knowledge-${kb.companyInfo.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Saved Knowledge Bases
        </h1>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company name, description, or industry..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('card')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'card'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('detail')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'detail'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Detail
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Showing {filteredBases.length} of {knowledgeBases.length} knowledge bases
        </p>

        {/* Content based on view mode */}
        {filteredBases.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {knowledgeBases.length === 0
                ? 'No saved knowledge bases yet. Create one from the Build Knowledge page!'
                : 'No results found for your search.'}
            </p>
            {knowledgeBases.length === 0 && (
              <Link
                href="/knowledge"
                className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Build Knowledge Base
              </Link>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'card' && <CardView bases={filteredBases} onDelete={handleDelete} onDownload={downloadJSON} />}
            {viewMode === 'table' && <TableView bases={filteredBases} onDelete={handleDelete} onDownload={downloadJSON} />}
            {viewMode === 'detail' && (
              <DetailView
                bases={filteredBases}
                selectedKB={selectedKB}
                onSelect={setSelectedKB}
                onDelete={handleDelete}
                onDownload={downloadJSON}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CardView({ bases, onDelete, onDownload }: {
  bases: KnowledgeBase[];
  onDelete: (id: string) => void;
  onDownload: (kb: KnowledgeBase) => void;
}) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bases.map((kb) => (
        <div key={kb.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {kb.companyInfo.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
            {kb.companyInfo.description}
          </p>
          <div className="space-y-2 mb-4">
            {kb.companyInfo.industry && (
              <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                {kb.companyInfo.industry}
              </span>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Scraped: {new Date(kb.scrapedAt).toLocaleDateString()}
            </p>
            <a
              href={kb.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline block truncate"
            >
              {kb.sourceUrl}
            </a>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onDownload(kb)}
              className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
            >
              Download
            </button>
            <button
              onClick={() => kb.id && onDelete(kb.id)}
              className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function TableView({ bases, onDelete, onDownload }: {
  bases: KnowledgeBase[];
  onDelete: (id: string) => void;
  onDownload: (kb: KnowledgeBase) => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Industry
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Scraped Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {bases.map((kb) => (
              <tr key={kb.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {kb.companyInfo.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">
                    {kb.companyInfo.description}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {kb.companyInfo.industry || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(kb.scrapedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onDownload(kb)}
                      className="text-purple-600 hover:text-purple-900 dark:text-purple-400"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => kb.id && onDelete(kb.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetailView({ bases, selectedKB, onSelect, onDelete, onDownload }: {
  bases: KnowledgeBase[];
  selectedKB: KnowledgeBase | null;
  onSelect: (kb: KnowledgeBase) => void;
  onDelete: (id: string) => void;
  onDownload: (kb: KnowledgeBase) => void;
}) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* List */}
      <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 max-h-screen overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Knowledge Bases</h3>
        <div className="space-y-2">
          {bases.map((kb) => (
            <div
              key={kb.id}
              onClick={() => onSelect(kb)}
              className={`p-3 rounded-md cursor-pointer transition-colors ${
                selectedKB?.id === kb.id
                  ? 'bg-blue-100 dark:bg-blue-900'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                {kb.companyInfo.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(kb.scrapedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Detail */}
      <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        {selectedKB ? (
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedKB.companyInfo.name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedKB.companyInfo.description}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onDownload(selectedKB)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                >
                  Download
                </button>
                <button
                  onClick={() => selectedKB.id && onDelete(selectedKB.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <InfoSection label="Website" value={selectedKB.sourceUrl} isLink />
              <InfoSection label="Industry" value={selectedKB.companyInfo.industry} />
              <InfoSection label="Location" value={selectedKB.companyInfo.location?.join(', ')} />
              
              {selectedKB.positioning?.companyPitch && (
                <InfoSection label="Company Pitch" value={selectedKB.positioning.companyPitch} />
              )}

              {selectedKB.products && selectedKB.products.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Products/Services ({selectedKB.products.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedKB.products.slice(0, 3).map((product, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{product.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{product.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedKB.onlinePresence?.socialMedia && selectedKB.onlinePresence.socialMedia.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Social Media</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedKB.onlinePresence.socialMedia.map((social, idx) => (
                      <a
                        key={idx}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-800"
                      >
                        {social.platform}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500 dark:text-gray-400">
              Select a knowledge base to view details
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoSection({ label, value, isLink }: { label: string; value?: string; isLink?: boolean }) {
  if (!value) return null;
  
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</h4>
      {isLink ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-400">{value}</p>
      )}
    </div>
  );
}
