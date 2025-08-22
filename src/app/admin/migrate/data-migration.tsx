'use client';

import { useState } from 'react';

interface MigrationStatus {
  artists: {
    in_d1: number;
    in_json: number;
    missing_from_d1: number;
  };
  news: {
    in_d1: number;
    in_json: number;
    missing_from_d1: number;
  };
}

interface MigrationResults {
  artists: { migrated: number; skipped: number; errors: string[] };
  news: { migrated: number; skipped: number; errors: string[] };
}

export default function DataMigration() {
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [results, setResults] = useState<MigrationResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/migrate-data');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check status');
    }
    setLoading(false);
  };

  const runMigration = async () => {
    if (!confirm('Are you sure you want to migrate data to D1? This will copy any missing data from JSON files to the database.')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/migrate-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ migrate: true })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResults(data.results);
        // Refresh status
        setTimeout(checkStatus, 1000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run migration');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Data Migration to D1 Database</h1>
        <p className="text-gray-600 mt-2">
          Migrate artist and news data from JSON files to Cloudflare D1 database
        </p>
      </div>

      {/* Check Status */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Current Data Status</h2>
          <button
            onClick={checkStatus}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Status'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {status && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Artists Data</h3>
              <div className="bg-gray-50 rounded-md p-4 space-y-2">
                <div className="flex justify-between">
                  <span>In D1 Database:</span>
                  <span className="font-mono">{status.artists.in_d1}</span>
                </div>
                <div className="flex justify-between">
                  <span>In JSON Files:</span>
                  <span className="font-mono">{status.artists.in_json}</span>
                </div>
                <div className="flex justify-between">
                  <span>Missing from D1:</span>
                  <span className={`font-mono ${status.artists.missing_from_d1 > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {status.artists.missing_from_d1}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">News Data</h3>
              <div className="bg-gray-50 rounded-md p-4 space-y-2">
                <div className="flex justify-between">
                  <span>In D1 Database:</span>
                  <span className="font-mono">{status.news.in_d1}</span>
                </div>
                <div className="flex justify-between">
                  <span>In JSON Files:</span>
                  <span className="font-mono">{status.news.in_json}</span>
                </div>
                <div className="flex justify-between">
                  <span>Missing from D1:</span>
                  <span className={`font-mono ${status.news.missing_from_d1 > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {status.news.missing_from_d1}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Migration Button */}
      {status && (status.artists.missing_from_d1 > 0 || status.news.missing_from_d1 > 0) && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-orange-800 mb-2">Migration Needed</h3>
          <p className="text-orange-700 mb-4">
            Some data is missing from the D1 database. Click below to migrate it safely.
          </p>
          <button
            onClick={runMigration}
            disabled={loading}
            className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Migrating...' : 'Run Migration'}
          </button>
        </div>
      )}

      {/* Migration Results */}
      {results && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">Migration Results</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Artists</h4>
              <div className="space-y-1 text-sm">
                <div>Migrated: <span className="font-mono text-green-600">{results.artists.migrated}</span></div>
                <div>Skipped: <span className="font-mono text-gray-600">{results.artists.skipped}</span></div>
                {results.artists.errors.length > 0 && (
                  <div className="text-red-600">
                    Errors: {results.artists.errors.length}
                    <ul className="ml-4 mt-1">
                      {results.artists.errors.map((error, i) => (
                        <li key={i} className="text-xs">• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">News</h4>
              <div className="space-y-1 text-sm">
                <div>Migrated: <span className="font-mono text-green-600">{results.news.migrated}</span></div>
                <div>Skipped: <span className="font-mono text-gray-600">{results.news.skipped}</span></div>
                {results.news.errors.length > 0 && (
                  <div className="text-red-600">
                    Errors: {results.news.errors.length}
                    <ul className="ml-4 mt-1">
                      {results.news.errors.map((error, i) => (
                        <li key={i} className="text-xs">• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status All Good */}
      {status && status.artists.missing_from_d1 === 0 && status.news.missing_from_d1 === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">✅ All Data Migrated!</h3>
          <p className="text-green-700">
            All your artist and news data is already in the D1 database. You can safely remove the JSON file dependencies.
          </p>
        </div>
      )}
    </div>
  );
}
