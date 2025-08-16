'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BandsinTownEvent {
  id: string;
  title: string;
  datetime: string;
  venue: {
    name: string;
    city: string;
    region: string;
    country: string;
  };
  offers: Array<{
    type: 'Tickets' | 'RSVP';
    url: string;
    status: 'available' | 'unavailable';
  }>;
  url: string;
  on_sale_datetime?: string;
  description?: string;
}

interface BandsinTownWidgetProps {
  artistName: string;
  appId?: string;
  maxEvents?: number;
  className?: string;
}

export default function BandsinTownWidget({ 
  artistName, 
  appId = 'M2Labs', 
  maxEvents = 10,
  className = '' 
}: BandsinTownWidgetProps) {
  const [events, setEvents] = useState<BandsinTownEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!artistName) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('Fetching events for artist:', artistName);

        // Use our proxy API to avoid CORS issues
        const response = await fetch(
          `/api/bandsintown?artist=${encodeURIComponent(artistName)}&app_id=${appId}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            // Artist not found or no events
            setEvents([]);
            return;
          }
          
          // Try to get error details from response
          let errorMessage = `API error: ${response.status}`;
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch {
            // Ignore JSON parse errors, use default message
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('Received events data:', data);
        
        // Handle error responses that come back as 200 but contain error info
        if (data.error) {
          throw new Error(data.error);
        }
        
        // Limit to maxEvents
        const limitedEvents = Array.isArray(data) ? data.slice(0, maxEvents) : [];
        setEvents(limitedEvents);

      } catch (err) {
        console.error('Bandsintown widget error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load events');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [artistName, appId, maxEvents]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get venue location string
  const getVenueLocation = (venue: BandsinTownEvent['venue']) => {
    const parts = [venue.city, venue.region, venue.country].filter(Boolean);
    return parts.join(', ');
  };

  // Get primary action button for event
  const getEventAction = (event: BandsinTownEvent) => {
    // Check for ticket offers first
    const ticketOffer = event.offers?.find(offer => 
      offer.type === 'Tickets' && offer.status === 'available'
    );
    
    if (ticketOffer) {
      return {
        text: 'Buy Tickets',
        url: ticketOffer.url,
        style: 'bg-[#FF8A3D] hover:bg-[#FF8A3D]/80 text-black'
      };
    }

    // Check for RSVP
    const rsvpOffer = event.offers?.find(offer => offer.type === 'RSVP');
    if (rsvpOffer) {
      return {
        text: 'RSVP',
        url: rsvpOffer.url,
        style: 'bg-[#36454F] hover:bg-[#36454F]/80 text-white'
      };
    }

    // Fallback to event page with "Notify Me" trigger
    return {
      text: 'Notify Me',
      url: `${event.url}&trigger=notify_me`,
      style: 'bg-gray-600 hover:bg-gray-700 text-white'
    };
  };

  if (loading) {
    return (
      <div className={`bg-[#36454F] py-8 px-5 ${className}`}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#F5F5F5] mb-6 text-center">Upcoming Shows</h2>
          <div className="bg-white/10 rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF8A3D] mx-auto mb-3"></div>
            <p className="text-[#F5F5F5]/80">Loading tour dates...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-[#36454F] py-8 px-5 ${className}`}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#F5F5F5] mb-6 text-center">Upcoming Shows</h2>
          <div className="bg-white/10 rounded-lg p-6 text-center">
            <p className="text-[#F5F5F5]/80">Unable to load tour dates</p>
          </div>
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className={`bg-[#36454F] py-8 px-5 ${className}`}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#F5F5F5] mb-6 text-center">Upcoming Shows</h2>
          <div className="bg-white/10 rounded-lg p-6 text-center">
            <p className="text-[#F5F5F5] text-lg font-medium mb-2">No Upcoming Shows</p>
            <p className="text-[#F5F5F5]/80 mb-4">{artistName} doesn't have any upcoming shows.</p>
            <Link
              href={`https://www.bandsintown.com/a/${encodeURIComponent(artistName)}?came_from=267&app_id=${appId}&trigger=track`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-[#FF8A3D] text-black rounded-lg font-medium hover:bg-[#FF8A3D]/80 transition-colors"
            >
              Track Artist
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#36454F] py-16 px-5 ${className}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-[#F5F5F5]">Upcoming Shows</h2>
          <Link
            href={`https://www.bandsintown.com/a/${encodeURIComponent(artistName)}?came_from=267&app_id=${appId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FF8A3D] hover:text-[#FF8A3D]/80 text-sm font-medium"
          >
            View All →
          </Link>
        </div>

        <div className="space-y-4">
          {events.map((event) => {
            const action = getEventAction(event);
            
            return (
              <div
                key={event.id}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/15 transition-all duration-200"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Event Info */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                      <div className="text-[#FF8A3D] font-bold text-lg">
                        {formatDate(event.datetime)}
                      </div>
                      <div className="text-[#F5F5F5]/80 text-sm">
                        {formatTime(event.datetime)}
                      </div>
                    </div>
                    
                    <h3 className="text-[#F5F5F5] font-bold text-xl mb-1">
                      {event.venue.name}
                    </h3>
                    
                    <p className="text-[#F5F5F5]/80 mb-2">
                      {getVenueLocation(event.venue)}
                    </p>
                    
                    {event.title && event.title !== event.venue.name && (
                      <p className="text-[#F5F5F5]/60 text-sm">
                        {event.title}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Link
                      href={action.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-6 py-2 rounded-lg font-medium transition-colors text-center ${action.style}`}
                    >
                      {action.text}
                    </Link>
                    
                    <Link
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 border border-[#F5F5F5]/30 text-[#F5F5F5] rounded-lg font-medium hover:bg-white/10 transition-colors text-center"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Powered by Bandsintown */}
        <div className="text-center mt-8">
          <Link
            href="https://bandsintown.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#F5F5F5]/40 text-xs hover:text-[#F5F5F5]/60 transition-colors"
          >
            Powered by Bandsintown
          </Link>
        </div>
      </div>
    </div>
  );
}
