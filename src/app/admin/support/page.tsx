'use client';

import React, { useState, useEffect } from 'react';
import AuthWrapper from '@/components/admin/AuthWrapper';
import AdminLayout from '@/components/admin/AdminLayout';

export const runtime = 'edge'

interface SupportTicket {
  id: string;
  subject: string;
  category: 'general' | 'technical' | 'warranty' | 'shipping' | 'billing' | 'other';
  status: 'open' | 'in_progress' | 'waiting_for_customer' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customerName: string;
  customerEmail: string;
  userId?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  messages?: Array<{
    id: string;
    message: string;
    isInternal: boolean;
    userId?: string;
    createdAt: string;
  }>;
}

export default function SupportManagement() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/support/tickets');
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Error fetching support tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setTickets(tickets.map(ticket => 
          ticket.id === ticketId ? { ...ticket, status: status as any } : ticket
        ));
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: status as any });
        }
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const response = await fetch(`/api/admin/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          isInternal: false
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedTicket({
          ...selectedTicket,
          messages: [...(selectedTicket.messages || []), data.message]
        });
        setNewMessage('');
        
        // Update ticket status to in_progress if it was open
        if (selectedTicket.status === 'open') {
          updateTicketStatus(selectedTicket.id, 'in_progress');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'waiting_for_customer': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (selectedTicket) {
    return (
      <AuthWrapper>
        <AdminLayout>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-[#FF8A3D] hover:text-[#FF8A3D]/80 mb-2"
                >
                  ← Back to Support Tickets
                </button>
                <h1 className="text-3xl font-bold text-gray-900">{selectedTicket.subject}</h1>
                <p className="text-gray-600 mt-2">
                  From {selectedTicket.customerName} • {new Date(selectedTicket.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedTicket.status)}`}>
                  {selectedTicket.status.replace('_', ' ').toUpperCase()}
                </span>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_for_customer">Waiting for Customer</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Messages */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg border shadow-sm">
                  {/* Messages List */}
                  <div className="p-6 max-h-96 overflow-y-auto">
                    <div className="space-y-4">
                      {selectedTicket.messages?.map((message, index) => (
                        <div key={message.id} className={`flex ${message.isInternal ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.isInternal 
                              ? 'bg-[#FF8A3D] text-black' 
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <p className="text-sm">{message.message}</p>
                            <p className={`text-xs mt-1 ${
                              message.isInternal ? 'text-black/70' : 'text-gray-500'
                            }`}>
                              {new Date(message.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )) || (
                        <p className="text-gray-500 text-center py-8">No messages yet</p>
                      )}
                    </div>
                  </div>

                  {/* Reply Form */}
                  <div className="border-t p-6">
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your response..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D] resize-none"
                        />
                      </div>
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={sendMessage}
                          disabled={sendingMessage || !newMessage.trim()}
                          className="bg-[#FF8A3D] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#FF8A3D]/80 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sendingMessage ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="bg-white rounded-lg border shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Name</label>
                      <p className="text-gray-900">{selectedTicket.customerName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{selectedTicket.customerEmail}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Category</label>
                      <p className="text-gray-900 capitalize">{selectedTicket.category}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Priority</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg border shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="space-y-3">
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                      View Customer Orders
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                      Create Warranty Claim
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                      Send Email Notification
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AdminLayout>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Support Management</h1>
              <p className="text-gray-600 mt-2">
                Manage customer support tickets and inquiries
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 border shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{tickets.length}</div>
              <div className="text-sm text-gray-600">Total Tickets</div>
            </div>
            <div className="bg-white rounded-lg p-6 border shadow-sm">
              <div className="text-2xl font-bold text-red-600">
                {tickets.filter(t => t.status === 'open').length}
              </div>
              <div className="text-sm text-gray-600">Open Tickets</div>
            </div>
            <div className="bg-white rounded-lg p-6 border shadow-sm">
              <div className="text-2xl font-bold text-yellow-600">
                {tickets.filter(t => t.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="bg-white rounded-lg p-6 border shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {tickets.filter(t => t.status === 'resolved').length}
              </div>
              <div className="text-sm text-gray-600">Resolved</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by subject, customer name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                />
              </div>
              <div className="flex gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_for_customer">Waiting for Customer</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                >
                  <option value="all">All Categories</option>
                  <option value="general">General</option>
                  <option value="technical">Technical</option>
                  <option value="warranty">Warranty</option>
                  <option value="shipping">Shipping</option>
                  <option value="billing">Billing</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF8A3D]"></div>
                <p className="mt-2 text-gray-600">Loading support tickets...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">💬</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No support tickets found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Support tickets will appear here when customers submit inquiries.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{ticket.subject}</div>
                            <div className="text-sm text-gray-500">
                              {ticket.messages?.length || 0} message{(ticket.messages?.length || 0) !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{ticket.customerName}</div>
                            <div className="text-sm text-gray-500">{ticket.customerEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                            {ticket.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                              {ticket.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority.toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setSelectedTicket(ticket)}
                            className="text-[#FF8A3D] hover:text-[#FF8A3D]/80"
                          >
                            View & Reply
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </AuthWrapper>
  );
}
