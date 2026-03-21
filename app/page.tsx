import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            MoFlo Knowledge Builder
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
            Transform company websites into structured, actionable knowledge bases
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Link href="/knowledge">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <div className="text-4xl mb-4">🔍</div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                  Build Knowledge
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Enter a company website URL and automatically extract valuable business insights
                </p>
              </div>
            </Link>
            
            <Link href="/knowledge/view">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <div className="text-4xl mb-4">📚</div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                  View Knowledge
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Browse, search, and manage your saved knowledge bases
                </p>
              </div>
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              What We Extract
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div>📊 Company Info</div>
              <div>🎯 Positioning</div>
              <div>👥 Target Customers</div>
              <div>🎨 Branding</div>
              <div>🌐 Online Presence</div>
              <div>💼 Products/Services</div>
              <div>⭐ Testimonials</div>
              <div>❓ FAQs</div>
              <div>🏆 Trust Signals</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
