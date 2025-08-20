'use client';

import React from 'react';

interface Review {
  id: string;
  rating: number;
  title?: string;
  content?: string;
  isVerified: boolean;
  helpfulVotes: number;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

interface ReviewCardProps {
  review: Review;
  onHelpfulVote?: (reviewId: string) => void;
}

export default function ReviewCard({ review, onHelpfulVote }: ReviewCardProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white">
      <div className="flex items-start space-x-4">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-[#FF8A3D] rounded-full flex items-center justify-center text-black font-semibold">
            {review.user ? getInitials(review.user.firstName, review.user.lastName) : '?'}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                {renderStars(review.rating)}
              </div>
              {review.isVerified && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified Purchase
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
          </div>

          {/* User Name */}
          <div className="text-sm font-medium text-gray-900 mb-1">
            {review.user ? `${review.user.firstName} ${review.user.lastName.charAt(0)}.` : 'Anonymous'}
          </div>

          {/* Review Title */}
          {review.title && (
            <h4 className="text-lg font-medium text-gray-900 mb-2">{review.title}</h4>
          )}

          {/* Review Content */}
          {review.content && (
            <p className="text-gray-700 mb-4 leading-relaxed">{review.content}</p>
          )}

          {/* Helpful Votes */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onHelpfulVote?.(review.id)}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L9 6v11m4-10v3M9 10h1m4-4h1" />
                </svg>
                <span>Helpful ({review.helpfulVotes})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
