'use client';

import React, { useState, useEffect } from 'react';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';
import EditReviewForm from './EditReviewForm';
import { useAuth } from '@/contexts/AuthContext';

interface Review {
  id: string;
  userId: string;
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

interface ReviewsListProps {
  productId: string;
}

export default function ReviewsList({ productId }: ReviewsListProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'>('newest');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [productId, sortBy]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reviews?productId=${productId}&sortBy=${sortBy}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmitted = () => {
    setShowForm(false);
    fetchReviews();
  };

  const handleHelpfulVote = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
      });

      if (response.ok) {
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, helpfulVotes: review.helpfulVotes + 1 }
            : review
        ));
      }
    } catch (error) {
      console.error('Error voting helpful:', error);
    }
  };

  const handleEditReview = (reviewId: string) => {
    setEditingReviewId(reviewId);
    setShowForm(false); // Close new review form if open
  };

  const handleSaveEdit = async (reviewId: string, data: { rating: number; title?: string; content: string }) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        setReviews(prev => prev.map(review => 
          review.id === reviewId ? result.review : review
        ));
        setEditingReviewId(null);
      } else {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update review');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      throw error; // Re-throw to be handled by the form
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReviews(prev => prev.filter(review => review.id !== reviewId));
      } else {
        const result = await response.json();
        alert(result.error || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review. Please try again.');
    }
  };

  const canEditReview = (review: Review) => {
    return user && review.userId === user.id;
  };

  const canDeleteReview = (review: Review) => {
    return user && (review.userId === user.id || user.role === 'admin');
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const sizeClasses = size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
    
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`${sizeClasses} ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const distribution = getRatingDistribution();
  const averageRating = parseFloat(getAverageRating().toString());

  return (
    <div className="space-y-8">
      {/* Reviews Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">{getAverageRating()}</div>
            <div className="flex items-center justify-center mb-2">
              {renderStars(averageRating, 'lg')}
            </div>
            <p className="text-gray-600">
              Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = distribution[rating as keyof typeof distribution];
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-900 w-8">
                    {rating} ★
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Write Review Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Customer Reviews</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#FF8A3D] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#FF8A3D]/80 transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <ReviewForm
          productId={productId}
          onReviewSubmitted={handleReviewSubmitted}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Sort Controls */}
      {reviews.length > 0 && (
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <p className="text-gray-600">
            {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-[#FF8A3D] focus:border-[#FF8A3D]"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF8A3D]"></div>
          <p className="mt-2 text-gray-600">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">⭐</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-600 mb-6">
            Be the first to share your thoughts about this product.
          </p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#FF8A3D] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#FF8A3D]/80 transition-colors"
            >
              Write the First Review
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map(review => (
            <div key={review.id}>
              {editingReviewId === review.id ? (
                <EditReviewForm
                  review={review}
                  onSave={handleSaveEdit}
                  onCancel={() => setEditingReviewId(null)}
                />
              ) : (
                <ReviewCard
                  review={review}
                  onHelpfulVote={handleHelpfulVote}
                  onEdit={handleEditReview}
                  onDelete={handleDeleteReview}
                  canEdit={canEditReview(review)}
                  canDelete={canDeleteReview(review)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
