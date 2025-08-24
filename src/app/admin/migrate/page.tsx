'use client';

import React, { useState } from 'react';
import AuthWrapper from '@/components/admin/AuthWrapper';
import AdminLayout from '@/components/admin/AdminLayout';
import DataMigration from './data-migration';

export const runtime = 'edge'

export default function MigratePage() {
  const [migrating, setMigrating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'data' | 'schema'>('data');
  
  // News custom sections migration state
  const [newsCustomSectionsMigrating, setNewsCustomSectionsMigrating] = useState(false);
  const [newsCustomSectionsResults, setNewsCustomSectionsResults] = useState<any>(null);

  const runMigration = async () => {
    setMigrating(true);
    setResults(null);

    try {
      const response = await fetch('/api/admin/migrate-enhanced-fields', {
        method: 'POST',
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({
        success: false,
        error: 'Failed to run migration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setMigrating(false);
    }
  };

  const runNewsCustomSectionsMigration = async () => {
    setNewsCustomSectionsMigrating(true);
    setNewsCustomSectionsResults(null);

    try {
      const response = await fetch('/api/admin/migrate-news-custom-sections', {
        method: 'POST',
      });

      const data = await response.json();
      setNewsCustomSectionsResults(data);
    } catch (error) {
      setNewsCustomSectionsResults({
        success: false,
        error: 'Failed to run news custom sections migration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setNewsCustomSectionsMigrating(false);
    }
  };

  return (
    <AuthWrapper>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Database Migration Tools</h1>
            <p className="text-gray-600 mt-2">
              Migrate data and database schema
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('data')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'data'
                    ? 'border-[#FF8A3D] text-[#FF8A3D]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Data Migration (JSON → D1)
              </button>
              <button
                onClick={() => setActiveTab('schema')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'schema'
                    ? 'border-[#FF8A3D] text-[#FF8A3D]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Schema Migration
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'data' ? (
            <DataMigration />
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Enhanced Fields Migration</h2>
                <p className="text-gray-600 mb-4">
                  This migration adds the following missing columns:
                </p>
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Products table:</h3>
                  <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1 ml-4">
                    <li>youtubeVideoId (TEXT) - For embedding YouTube videos</li>
                    <li>features (TEXT) - JSON array of product features</li>
                    <li>toggleOptions (TEXT) - JSON object for toggle settings</li>
                    <li>powerConsumption (TEXT) - Power consumption details</li>
                    <li>relatedProducts (TEXT) - JSON array of related product IDs</li>
                  </ul>
                  <h3 className="font-medium text-gray-900 mb-2">Artists table:</h3>
                  <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1 ml-4">
                    <li>imageStyle (TEXT) - Image display style (square, portrait, landscape, circle)</li>
                    <li>useCustomTemplate (BOOLEAN) - Whether to use custom page template</li>
                    <li>customTemplatePath (TEXT) - Path to custom template file</li>
                    <li>customSections (TEXT) - JSON array of custom page sections</li>
                  </ul>
                </div>

                <button
                  onClick={runMigration}
                  disabled={migrating}
                  className="bg-[#FF8A3D] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#FF8A3D]/80 disabled:opacity-50"
                >
                  {migrating ? 'Running Migration...' : 'Run Migration'}
                </button>

                {results && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Migration Results</h3>
                    {results.success ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-green-800 font-medium mb-2">✅ {results.message}</div>
                        {results.results && (
                          <div className="space-y-2">
                            {results.results.map((result: any, index: number) => (
                              <div key={index} className="text-sm">
                                <span className="font-mono text-gray-700">{result.migration}</span>
                                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                  result.status === 'success' ? 'bg-green-100 text-green-800' :
                                  result.status === 'already_exists' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {result.status === 'success' ? '✅ Success' :
                                   result.status === 'already_exists' ? '⚠️ Already exists' :
                                   `❌ Error: ${result.error}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="text-red-800 font-medium">❌ Migration Failed</div>
                        <div className="text-red-700 text-sm mt-1">{results.error}</div>
                        {results.details && (
                          <div className="text-red-600 text-xs mt-2 font-mono">{results.details}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-blue-800 font-medium mb-2">ℹ️ What this fixes:</div>
                <div className="text-blue-700 text-sm">
                  Recent updates added enhanced product fields (YouTube videos, features, toggle options, etc.) and artist image styling options. 
                  If your database was created before these updates, you'll need to run this migration to add the missing columns.
                  <br/><br/>
                  <strong>This will specifically fix:</strong> "no such column: imageStyle" error when editing artists.
                </div>
              </div>
            </div>
          )}

          {/* News Custom Sections Migration */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">News Custom Sections Migration</h2>
              <p className="text-gray-600 mt-1">Add support for custom sections in news articles</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="text-gray-600">
                    Run this migration to enable custom sections functionality in news articles.
                  </div>
                </div>

                <button
                  onClick={() => runNewsCustomSectionsMigration()}
                  disabled={newsCustomSectionsMigrating}
                  className="bg-[#FF8A3D] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#FF8A3D]/80 disabled:opacity-50"
                >
                  {newsCustomSectionsMigrating ? 'Running Migration...' : 'Run News Custom Sections Migration'}
                </button>

                {newsCustomSectionsResults && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Migration Results</h3>
                    {newsCustomSectionsResults.success ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-green-800 font-medium mb-2">✅ {newsCustomSectionsResults.message}</div>
                        {newsCustomSectionsResults.results && (
                          <div className="space-y-2">
                            {newsCustomSectionsResults.results.map((result: string, index: number) => (
                              <div key={index} className="text-sm text-green-700">
                                {result}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="text-red-800 font-medium">❌ Migration Failed</div>
                        <div className="text-red-700 text-sm mt-1">{newsCustomSectionsResults.error}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <div className="text-blue-800 font-medium mb-2">ℹ️ What this enables:</div>
                <div className="text-blue-700 text-sm">
                  This migration adds support for custom sections in news articles, allowing you to add:
                  <br/>• Custom text sections with rich formatting
                  <br/>• Image galleries with multiple photos
                  <br/>• Embedded videos (YouTube support)
                  <br/>• Custom HTML content blocks
                  <br/><br/>
                  <strong>This will fix:</strong> Custom sections not appearing in published news articles.
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AuthWrapper>
  );
}
