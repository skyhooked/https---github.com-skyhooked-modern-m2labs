'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface CartItem {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  addedAt: string;
  updatedAt: string;
  variant?: {
    id: string;
    name: string;
    sku: string;
    price: number;
    product?: {
      id: string;
      name: string;
      slug: string;
      basePrice: number;
      images?: {
        id: string;
        url: string;
        altText?: string;
        isMainImage: boolean;
      }[];
    };
  };
}

interface Cart {
  id: string | null;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  currency: string;
}

interface CartContextType {
  cart: Cart;
  loading: boolean;
  addToCart: (variantId: string, quantity: number, unitPrice: number) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const emptyCart: Cart = {
  id: null,
  items: [],
  subtotal: 0,
  itemCount: 0,
  currency: 'USD',
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [loading, setLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<number>(0);

  // Generate or get session ID for guest users
  useEffect(() => {
    if (!user) {
      let guestSessionId = localStorage.getItem('m2labs_session_id');
      if (!guestSessionId) {
        guestSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('m2labs_session_id', guestSessionId);
      }
      setSessionId(guestSessionId);
    }
  }, [user]);

  // Load cart when user or sessionId changes (but not immediately after updates)
  useEffect(() => {
    if (user || sessionId) {
      const now = Date.now();
      // Only refresh if it's been more than 1 second since last update
      if (now - lastUpdated > 1000) {
        refreshCart();
      }
    }
  }, [user, sessionId]);

  const refreshCart = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (!user && sessionId) {
        params.append('sessionId', sessionId);
      }
      
      const response = await fetch(`/api/cart?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        const cart = data.cart || emptyCart;
        // Ensure items is always an array
        if (cart && !cart.items) {
          cart.items = [];
        }
        setCart(cart);
      } else {
        console.error('Failed to fetch cart');
        setCart(emptyCart);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCart(emptyCart);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (variantId: string, quantity: number, unitPrice: number) => {
    try {
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variantId,
          quantity,
          unitPrice,
          cartId: cart.id,
          sessionId: !user ? sessionId : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const cart = data.cart;
        // Ensure items is always an array
        if (cart && !cart.items) {
          cart.items = [];
        }
        setCart(cart);
        setLastUpdated(Date.now());
        
        // Show success feedback
        setIsCartOpen(true);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const updateCartItem = async (itemId: string, quantity: number) => {
    try {
      const response = await fetch('/api/cart/items', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId, quantity }),
      });

      if (response.ok) {
        setLastUpdated(Date.now());
        await refreshCart();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update cart item');
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const response = await fetch(`/api/cart/items?itemId=${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLastUpdated(Date.now());
        await refreshCart();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove item from cart');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      // Remove all items from cart
      if (cart.items && cart.items.length > 0) {
        const promises = cart.items.map(item => removeFromCart(item.id));
        await Promise.all(promises);
      }
      setCart(emptyCart);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen(!isCartOpen);

  const value = {
    cart,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
    isCartOpen,
    openCart,
    closeCart,
    toggleCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
