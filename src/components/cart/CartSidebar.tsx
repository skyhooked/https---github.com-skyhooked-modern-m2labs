'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from './CartProvider';

export default function CartSidebar() {
  const { cart, isCartOpen, closeCart, updateCartItem, removeFromCart, loading } = useCart();

  if (!isCartOpen) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cart.currency,
    }).format(price);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={closeCart}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[9999] transform transition-transform duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Shopping Cart ({cart.itemCount})
            </h2>
            <button
              onClick={closeCart}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF8A3D]"></div>
              </div>
            ) : cart.items.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Your cart is empty</h3>
                <p className="mt-2 text-gray-500">
                  Add some items to get started!
                </p>
                <div className="mt-6">
                  <Link
                    href="/shop"
                    onClick={closeCart}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-black bg-[#FF8A3D] hover:bg-[#FF8A3D]/80 transition-colors"
                  >
                    Continue shopping
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={(quantity) => updateCartItem(item.id, quantity)}
                    onRemove={() => removeFromCart(item.id)}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          {cart.items.length > 0 && (
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-medium text-gray-900">Subtotal</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(cart.subtotal)}
                </span>
              </div>
              
              <div className="space-y-3">
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-black bg-[#FF8A3D] hover:bg-[#FF8A3D]/80 transition-colors"
                >
                  Checkout
                </Link>
                
                <Link
                  href="/shop"
                  onClick={closeCart}
                  className="w-full flex justify-center items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Continue shopping
                </Link>
              </div>
              
              <p className="mt-4 text-xs text-gray-500 text-center">
                Shipping and taxes calculated at checkout
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

interface CartItemProps {
  item: any;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  formatPrice: (price: number) => string;
}

function CartItem({ item, onUpdateQuantity, onRemove, formatPrice }: CartItemProps) {
  const [isUpdating, setIsUpdating] = React.useState(false);
  
  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) {
      onRemove();
      return;
    }
    
    setIsUpdating(true);
    try {
      await onUpdateQuantity(newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-start space-x-4 py-4 border-b border-gray-200 last:border-b-0">
      {/* Product Image */}
      <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
        {item.variant?.product?.image ? (
          <Image
            src={item.variant.product.image}
            alt={item.variant?.product?.name || 'Product'}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">
          {item.variant?.product?.name || 'Unknown Product'}
        </h4>
        {item.variant?.name && item.variant.name !== item.variant?.product?.name && (
          <p className="text-sm text-gray-500">{item.variant.name}</p>
        )}
        <p className="text-sm text-gray-500">SKU: {item.variant?.sku}</p>
        
        {/* Quantity Controls */}
        <div className="flex items-center mt-2 space-x-2">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={isUpdating}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-center">
            {item.quantity}
          </span>
          
          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={isUpdating}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Price and Remove */}
      <div className="flex flex-col items-end space-y-2">
        <p className="text-sm font-medium text-gray-900">
          {formatPrice(item.unitPrice * item.quantity / 100)}
        </p>
        
        <button
          onClick={onRemove}
          className="text-red-600 hover:text-red-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
