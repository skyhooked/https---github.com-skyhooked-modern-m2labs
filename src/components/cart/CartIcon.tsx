'use client';

import React from 'react';
import { useCart } from './CartProvider';

export default function CartIcon() {
  const { cart, toggleCart } = useCart();

  return (
    <button
      onClick={toggleCart}
      className="relative p-2 text-[#F5F5F5] hover:text-[#FF8A3D] transition-colors"
      aria-label="Shopping cart"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H19M7 13v6a2 2 0 002 2h8a2 2 0 002-2v-6"
        />
      </svg>
      
      {/* Cart count badge */}
      {cart.itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-[#FF8A3D] text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {cart.itemCount > 99 ? '99+' : cart.itemCount}
        </span>
      )}
    </button>
  );
}
