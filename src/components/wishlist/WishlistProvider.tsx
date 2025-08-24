'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface WishlistItem {
  id: string;
  productId: string;
  variantId?: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    images?: Array<{
      url: string;
      altText?: string;
      isMainImage: boolean;
    }>;
  };
  variant?: {
    id: string;
    name: string;
    price?: number;
  };
  addedAt: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  isInWishlist: (productId: string, variantId?: string) => boolean;
  addToWishlist: (productId: string, variantId?: string) => Promise<void>;
  removeFromWishlist: (productId: string, variantId?: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setItems([]);
    }
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch('/api/wishlist');
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const isInWishlist = (productId: string, variantId?: string) => {
    return items.some(item => 
      item.productId === productId && 
      (!variantId || item.variantId === variantId)
    );
  };

  const addToWishlist = async (productId: string, variantId?: string) => {
    if (!user) {
      alert('Please sign in to add items to your wishlist');
      return;
    }

    if (isInWishlist(productId, variantId)) {
      return; // Already in wishlist
    }

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, variantId }),
      });

      if (response.ok) {
        const data = await response.json();
        setItems(prev => [...prev, data.item]);
        
        // Show success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
        notification.innerHTML = '✅ Added to wishlist!';
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
          notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
          notification.style.transform = 'translateX(full)';
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 300);
        }, 3000);
      } else {
        throw new Error('Failed to add to wishlist');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      alert('Failed to add to wishlist. Please try again.');
    }
  };

  const removeFromWishlist = async (productId: string, variantId?: string) => {
    if (!user) return;

    try {
      const response = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, variantId }),
      });

      if (response.ok) {
        setItems(prev => prev.filter(item => 
          !(item.productId === productId && 
            (!variantId || item.variantId === variantId))
        ));
      } else {
        throw new Error('Failed to remove from wishlist');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      alert('Failed to remove from wishlist. Please try again.');
    }
  };

  const clearWishlist = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/wishlist/clear', {
        method: 'POST',
      });

      if (response.ok) {
        setItems([]);
      } else {
        throw new Error('Failed to clear wishlist');
      }
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      alert('Failed to clear wishlist. Please try again.');
    }
  };

  return (
    <WishlistContext.Provider value={{
      items,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      clearWishlist,
      loading
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
