'use client';

import { useState } from 'react';

interface Candidate {
  filePath: string;
  lineNumber: number;
  candidateString: string;
  reason?: string;
}

interface ScanResult {
  success: boolean;
  candidates: Candidate[];
  filesScanned: number;
  scanPath?: string;
  error?: string;
}

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');

  const handleUrlScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/scan-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl }),
      });

      const data: ScanResult = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        candidates: [],
        filesScanned: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/scan-upload', {
        method: 'POST',
        body: formData,
      });

      const data: ScanResult = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        candidates: [],
        filesScanned: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
            Secret Leakage Detector
          </h1>
          <p className="text-gray-400 text-lg">
            AI-Powered GitHub Repository Security Scanner
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('url')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'url'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Scan Repository URL
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'upload'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Upload ZIP File
          </button>
        </div>

        {/* URL Scan Form */}
        {activeTab === 'url' && (
          <form onSubmit={handleUrlScan} className="mb-8 bg-gray-800 rounded-lg p-6 shadow-xl">
            <div className="mb-4">
              <label htmlFor="repoUrl" className="block text-sm font-medium mb-2 text-gray-300">
                Repository URL
              </label>
              <input
                type="text"
                id="repoUrl"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
            >
              {loading ? 'Scanning...' : 'Scan Repository'}
            </button>
          </form>
        )}

        {/* Upload Form */}
        {activeTab === 'upload' && (
          <form onSubmit={handleUploadScan} className="mb-8 bg-gray-800 rounded-lg p-6 shadow-xl">
            <div className="mb-4">
              <label htmlFor="file" className="block text-sm font-medium mb-2 text-gray-300">
                Upload ZIP File
              </label>
              <input
                type="file"
                id="file"
                accept=".zip"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white file:cursor-pointer hover:file:bg-blue-600"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !file}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
            >
              {loading ? 'Scanning...' : 'Scan ZIP File'}
            </button>
          </form>
        )}

        {/* Results */}
        {result && (
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              {result.success ? (
                <>
                  <span className="text-green-400">✓</span> Scan Complete
                </>
              ) : (
                <>
                  <span className="text-red-400">✗</span> Scan Failed
                </>
              )}
            </h2>

            {result.error && (
              <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400">
                <p className="font-semibold">Error:</p>
                <p>{result.error}</p>
              </div>
            )}

            {result.success && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Files Scanned</p>
                    <p className="text-3xl font-bold">{result.filesScanned}</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Candidates Found</p>
                    <p className="text-3xl font-bold text-yellow-400">{result.candidates.length}</p>
                  </div>
                </div>

                {result.candidates.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Potential Secrets Detected:</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {result.candidates.map((candidate, index) => (
                        <div
                          key={index}
                          className="bg-gray-700 border border-yellow-600/50 rounded-lg p-4 hover:border-yellow-500 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-sm text-gray-400 font-mono">
                              {candidate.filePath}
                            </p>
                            <span className="bg-yellow-600 text-xs px-2 py-1 rounded">
                              Line {candidate.lineNumber}
                            </span>
                          </div>
                          <div className="bg-gray-900 p-3 rounded font-mono text-sm overflow-x-auto">
                            <code className="text-yellow-300">{candidate.candidateString}</code>
                          </div>
                          {candidate.reason && (
                            <p className="text-xs text-gray-400 mt-2">
                              <span className="font-semibold">Reason:</span> {candidate.reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.candidates.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-lg">
                      No potential secrets detected!
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
