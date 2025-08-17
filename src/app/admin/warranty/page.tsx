'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AuthWrapper from '@/components/admin/AuthWrapper';
import { WarrantyClaim } from '@/libs/auth';
export const runtime = 'edge'

export default function WarrantyManagement() {
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const response = await fetch('/api/admin/warranty');
      if (response.ok) {
        const data = await response.json();
        setClaims(data.claims);
      } else {
        setError('Failed to load warranty claims');
      }
    } catch (error) {
      setError('Failed to load warranty claims');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateClaim = async () => {
    if (!selectedClaim || !updateStatus) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/warranty', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimId: selectedClaim.id,
          status: updateStatus,
          notes: notes || undefined
        }),
      });

      if (response.ok) {
        await fetchClaims();
        setSelectedClaim(null);
        setUpdateStatus('');
        setNotes('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update warranty claim');
      }
    } catch (error) {
      setError('Failed to update warranty claim');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'under_review':
        return 'Under Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const getClaimStats = () => {
    const total = claims.length;
    const pending = claims.filter(claim => claim.status === 'submitted').length;
    const reviewing = claims.filter(claim => claim.status === 'under_review').length;
    const approved = claims.filter(claim => claim.status === 'approved').length;
    const completed = claims.filter(claim => claim.status === 'completed').length;

    return { total, pending, reviewing, approved, completed };
  };

  const stats = getClaimStats();

  return (
    <AuthWrapper>
      <AdminLayout>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Warranty Management</h1>
            <p className="mt-2 text-gray-600">
              Manage and track warranty claims from customers
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{stats.total}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Claims</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{stats.pending}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{stats.reviewing}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Under Review</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.reviewing}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{stats.approved}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Approved</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.approved}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{stats.completed}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.completed}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Claims Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Recent Claims</h2>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="text-lg text-gray-600">Loading warranty claims...</div>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <div className="text-red-600 mb-4">{error}</div>
                  <button
                    onClick={fetchClaims}
                    className="px-4 py-2 bg-[#FF8A3D] text-black rounded-md hover:bg-[#FF8A3D]/80"
                  >
                    Retry
                  </button>
                </div>
              ) : claims.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-500">No warranty claims found</div>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Claim Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {claims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            Claim #{claim.id}
                          </div>
                          <div className="text-sm text-gray-500">
                            Order #{claim.orderId}
                          </div>
                          <div className="text-sm text-gray-500">
                            Serial: {claim.serialNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {claim.productName}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {claim.issue}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(claim.status)}`}>
                            {getStatusText(claim.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(claim.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedClaim(claim);
                              setUpdateStatus(claim.status);
                              setNotes(claim.notes || '');
                            }}
                            className="text-[#FF8A3D] hover:text-[#FF8A3D]/80 mr-4"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Update Modal */}
          {selectedClaim && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Manage Warranty Claim #{selectedClaim.id}
                  </h3>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Product:</strong> {selectedClaim.productName}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Serial:</strong> {selectedClaim.serialNumber}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Issue:</strong> {selectedClaim.issue}
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={updateStatus}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#FF8A3D] focus:border-[#FF8A3D] sm:text-sm"
                    >
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under Review</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#FF8A3D] focus:border-[#FF8A3D] sm:text-sm"
                      placeholder="Add notes about this claim..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setSelectedClaim(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateClaim}
                      disabled={isUpdating}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-[#FF8A3D] hover:bg-[#FF8A3D]/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? 'Updating...' : 'Update Claim'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthWrapper>
  );
}
