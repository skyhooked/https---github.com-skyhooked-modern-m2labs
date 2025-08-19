'use client';

import { useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';

declare global {
  interface Window {
    FoxyCart: any;
  }
}

// Sample product data - you'll want to replace this with your actual product catalog
const products = [
  {
    id: 'bomber-overdrive',
    name: 'The Bomber Overdrive',
    price: 199.99,
    image: '/images/M2-Labs-The-Bomber-Overdrive-1.jpg',
    description: 'Thick tone. Punchy drive. No survivors. The signature M2 Labs overdrive pedal.',
    sku: 'M2L-BOMBER-001',
    category: 'overdrive'
  },
  // Add more products as needed
];

export default function Shop() {
  const { user } = useAuth();

  useEffect(() => {
    // Initialize Foxy when component mounts
    initializeFoxy();
  }, []);

  useEffect(() => {
    // Update customer info when user changes
    if (user && window.FoxyCart) {
      setupFoxyCustomer();
    }
  }, [user]);

  const initializeFoxy = () => {
    // Load Foxy script if not already loaded
    if (!window.FoxyCart) {
      const script = document.createElement('script');
      script.src = 'https://cdn.foxycart.com/m2-labs/loader.js';
      script.async = true;
      script.onload = () => {
        setupFoxyCustomer();
      };
      document.head.appendChild(script);
    } else {
      setupFoxyCustomer();
    }
  };

  const setupFoxyCustomer = async () => {
    if (!user || !window.FoxyCart) return;

    try {
      // Pre-populate customer information for logged-in users
      window.FoxyCart.customer = {
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        // Add phone if available
        ...(user.phone && { phone: user.phone })
      };
    } catch (error) {
      console.error('Failed to setup Foxy customer:', error);
    }
  };

  return (
    <Layout>
      <section className="py-16 bg-[#36454F]">
        <div className="max-w-7xl mx-auto px-5">
          <h2 className="text-3xl font-bold mb-6 text-center text-[#F5F5F5]">M2 Labs Store</h2>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <p className="text-center text-secondary mb-8 max-w-2xl mx-auto">
              Discover our handcrafted guitar pedals. Each pedal comes with our transferable lifetime warranty
              and is built to inspire your creativity.
            </p>
            
            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <div key={product.id} className="bg-gray-50 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gray-200 relative">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/TBO-Pedal-HERO.webp'; // Fallback image
                      }}
                    />
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{product.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-[#FF8A3D]">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500">SKU: {product.sku}</span>
                    </div>

                    {/* Foxy Add to Cart Form */}
                    <form 
                      action="https://m2-labs.foxycart.com/cart" 
                      method="post" 
                      acceptCharset="utf-8"
                      className="foxycart"
                    >
                      <input type="hidden" name="name" value={product.name} />
                      <input type="hidden" name="price" value={product.price} />
                      <input type="hidden" name="code" value={product.sku} />
                      <input type="hidden" name="image" value={product.image} />
                      <input type="hidden" name="url" value={typeof window !== 'undefined' ? window.location.href : ''} />
                      <input type="hidden" name="category" value={product.category} />
                      
                      {/* Quantity selector */}
                      <div className="flex items-center justify-between mb-4">
                        <label htmlFor={`quantity-${product.id}`} className="text-sm font-medium text-gray-700">
                          Quantity:
                        </label>
                        <select 
                          id={`quantity-${product.id}`}
                          name="quantity" 
                          className="ml-2 border border-gray-300 rounded px-3 py-1 text-sm"
                          defaultValue="1"
                        >
                          {[1, 2, 3, 4, 5].map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#FF8A3D] text-black font-semibold py-3 px-4 rounded-md hover:bg-[#FF8A3D]/90 transition-colors"
                      >
                        Add to Cart
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>

            {/* Foxy Setup Instructions */}
            <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Foxy.io Setup Instructions</h3>
              <p className="text-sm text-blue-700 mb-4">
                To complete the Foxy.io integration:
              </p>
              <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
                <li>Sign up for a Foxy.io account at <a href="https://foxy.io" target="_blank" rel="noopener noreferrer" className="underline">foxy.io</a></li>
                <li>Get your subdomain from your Foxy admin</li>
                <li>Replace 'YOUR_SUBDOMAIN' in the cart URLs and script src</li>
                <li>Configure your store settings in Foxy admin</li>
                <li>Set up webhooks to sync orders with your database</li>
              </ol>
              <p className="text-xs text-blue-600 mt-4">
                Foxy handles all payment processing and provides a hosted cart that integrates seamlessly with your existing site.
              </p>
            </div>

            {/* Cart and Customer Links */}
            <div className="mt-8 flex justify-center space-x-4">
              <a 
                href="https://m2-labs.foxycart.com/cart?cart=view" 
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m-.4-2L4 1H1M7 13L5.4 5H21l-1.5 8M7 13v4a2 2 0 002 2h6a2 2 0 002-2v-4M9 17h6" />
                </svg>
                View Cart
              </a>
              {user && (
                <a 
                  href="https://m2-labs.foxycart.com/checkout" 
                  className="inline-flex items-center px-4 py-2 bg-[#FF8A3D] text-black rounded-md hover:bg-[#FF8A3D]/90 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Customer Account
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
