'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Link from 'next/link';

export const runtime = 'edge';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'waiting_for_customer' | 'resolved' | 'closed';
  priority: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

interface SupportMessage {
  id: string;
  ticketId: string;
  userId?: string;
  isInternal: boolean;
  message: string;
  attachments?: string[];
  createdAt: string;
}

export default function SupportTickets() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`/api/support/tickets?userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoadingTickets(false);
    }
  };

  const loadTicketMessages = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/admin/support/tickets/${ticket.id}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendReply = async () => {
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
          isInternal: false, // Customer message
          userId: user?.id
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data.data]);
        setNewMessage('');
        
        // Update ticket status to in_progress if it was resolved/closed
        if (selectedTicket.status === 'resolved' || selectedTicket.status === 'closed') {
          // You might want to add an API endpoint to update ticket status
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'waiting_for_customer': return 'bg-purple-100 text-purple-800';
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

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <section className="py-16 bg-[#36454F] min-h-screen">
        <div className="max-w-content mx-auto px-5">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/account"
              className="text-[#FF8A3D] hover:text-[#FF8A3D]/80 mb-4 inline-block"
            >
              ← Back to Account
            </Link>
            <h1 className="text-3xl font-bold text-white">Support Tickets</h1>
            <p className="text-gray-300 mt-2">
              View and manage your support tickets
            </p>
          </div>

          {selectedTicket ? (
            /* Ticket Detail View */
            <div className="bg-white rounded-lg shadow">
              {/* Ticket Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-[#FF8A3D] hover:text-[#FF8A3D]/80"
                  >
                    ← Back to Tickets
                  </button>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-gray-900">{selectedTicket.subject}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Ticket #{selectedTicket.ticketNumber} • Created {new Date(selectedTicket.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Messages */}
              <div className="p-6 max-h-96 overflow-y-auto">
                {loadingMessages ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">Loading messages...</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.isInternal ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.isInternal 
                            ? 'bg-gray-100 text-gray-900' 
                            : 'bg-[#FF8A3D] text-black'
                        }`}>
                          <p className="text-sm">{message.message}</p>
                          <p className={`text-xs mt-1 ${
                            message.isInternal ? 'text-gray-500' : 'text-black/70'
                          }`}>
                            {message.isInternal ? 'Support Team' : 'You'} • {new Date(message.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No messages yet</p>
                    )}
                  </div>
                )}
              </div>

              {/* Reply Form */}
              {selectedTicket.status !== 'closed' && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your reply..."
                      className="flex-1 min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
                      disabled={sendingMessage}
                    />
                    <button
                      onClick={sendReply}
                      disabled={!newMessage.trim() || sendingMessage}
                      className="bg-[#FF8A3D] text-black px-4 py-2 rounded-md hover:bg-[#FF8A3D]/80 disabled:opacity-50 disabled:cursor-not-allowed self-end"
                    >
                      {sendingMessage ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Tickets List View */
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Your Support Tickets</h2>
              </div>
              
              {loadingTickets ? (
                <div className="p-6 text-center">
                  <div className="text-gray-500">Loading tickets...</div>
                </div>
              ) : tickets.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ticket
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{ticket.subject}</div>
                              <div className="text-sm text-gray-500">
                                #{ticket.ticketNumber} • {ticket.messageCount || 0} message{(ticket.messageCount || 0) !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                              {ticket.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {ticket.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => loadTicketMessages(ticket)}
                              className="text-[#FF8A3D] hover:text-[#FF8A3D]/80"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="text-4xl mb-4">🎫</div>
                  <p className="text-gray-500 text-lg">No support tickets yet</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Submit a support request using the chat bubble on any page
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
