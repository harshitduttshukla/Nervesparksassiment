import { useState } from "react";


const API_BASE_URL = import.meta.env.API_BASE_URL;

function RagQueryInterface() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");

  const handleQuery = async () => {
    if (!query.trim()) {
      setError("Please enter a query");
      return;
    }

    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const res = await fetch(`https://nervesparks12.onrender.com/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err.message || "Failed to get response");
      console.error("Query error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleQuery();
    }
  };

  const clearResponse = () => {
    setResponse(null);
    setError("");
    setQuery("");
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-4">
      {/* Query Input Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Ask Your Documents</h3>
            <p className="text-sm text-gray-500">Query your uploaded documents with natural language</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask anything about your documents... (e.g., 'What is the minimum sale?', 'Show me the sales data for East region')"
              className="w-full p-4 pr-12 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200"
              rows="3"
              disabled={loading}
            />
            {query && (
              <button
                onClick={clearResponse}
                className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleQuery}
              disabled={loading || !query.trim()}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                loading || !query.trim()
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Searching...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search Documents
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
      </div>

      {/* Response Section */}
      {response && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Answer Header */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="font-bold text-gray-800">Answer</h4>
            </div>
          </div>

          {/* Answer Content */}
          <div className="p-6">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {response.answer}
              </p>
            </div>

            {/* Sources Section */}
            {response.sources && response.sources.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Sources ({response.sources.length})
                </h5>
                <div className="space-y-3">
                  {response.sources.map((source, index) => (
                    <div key={source.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">
                            {index + 1}
                          </span>
                          <span className="font-medium text-gray-700">
                            {source.metadata?.source || 'Unknown Source'}
                          </span>
                          {source.metadata?.page && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                              Page {source.metadata.page}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          Match: {Math.round(source.score * 100)}%
                        </span>
                      </div>
                      {source.metadata?.excerpt && (
                        <div className="text-sm text-gray-600 bg-white rounded p-3 border-l-2 border-blue-200">
                          <p className="font-mono text-xs leading-relaxed">
                            {source.metadata.excerpt.length > 200 
                              ? source.metadata.excerpt.substring(0, 200) + "..." 
                              : source.metadata.excerpt}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RagQueryInterface;