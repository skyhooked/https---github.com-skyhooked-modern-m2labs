'use client';

import { useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';

declare global {
  interface Window {
    Ecwid: any;
    xProductBrowser: any;
    ec: any;
  }
}

export default function Shop() {
  const { user } = useAuth();

  useEffect(() => {
    // Initialize Ecwid when component mounts
    initializeEcwid();
  }, []);

  useEffect(() => {
    // Update SSO when user changes
    if (user && window.Ecwid) {
      setupEcwidSSO();
    }
  }, [user]);

  const initializeEcwid = () => {
    // Load Ecwid script if not already loaded
    if (!window.Ecwid) {
      const script = document.createElement('script');
      script.src = 'https://app.ecwid.com/script.js?shop_id=YOUR_SHOP_ID';
      script.async = true;
      script.onload = () => {
        setupEcwidSSO();
        initializeStore();
      };
      document.head.appendChild(script);
    } else {
      setupEcwidSSO();
    }
  };

  const setupEcwidSSO = async () => {
    if (!user || !window.Ecwid) return;

    try {
      // Get SSO token from our API
      const response = await fetch('/api/ecwid/sso');
      if (response.ok) {
        const data = await response.json();
        if (data.sso) {
          // Configure Ecwid SSO
          window.Ecwid.OnAPILoaded.add(() => {
            window.Ecwid.setSignedInCustomer({
              email: data.sso.user.email,
              name: data.sso.user.name,
              token: data.sso.token
            });
          });
        }
      }
    } catch (error) {
      console.error('Failed to setup Ecwid SSO:', error);
    }
  };

  const initializeStore = () => {
    if (window.xProductBrowser) {
      window.xProductBrowser(
        'categoriesPerRow=3',
        'views=grid(20,3) list(60) table(60)',
        'categoryView=grid',
        'searchView=list',
        'id=shop'
      );
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
            
            {/* Ecwid Store Integration */}
            <div id="shop" className="min-h-80">
              {/* This is where Ecwid will render the store */}
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF8A3D]"></div>
                <p className="mt-4 text-gray-600">Loading store...</p>
              </div>
            </div>

            {/* Temporary placeholder - remove when Ecwid is configured */}
            <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">Store Configuration Needed</h3>
              <p className="text-sm text-yellow-700 mb-4">
                To complete the Ecwid integration, you'll need to:
              </p>
              <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
                <li>Sign up for an Ecwid account at <a href="https://ecwid.com" target="_blank" rel="noopener noreferrer" className="underline">ecwid.com</a></li>
                <li>Get your Store ID from your Ecwid admin panel</li>
                <li>Update the environment variables with your Ecwid credentials</li>
                <li>Replace 'YOUR_SHOP_ID' in the script URL above with your actual Store ID</li>
                <li>Configure your product catalog in Ecwid</li>
              </ol>
              <p className="text-xs text-yellow-600 mt-4">
                Once configured, customers will be able to shop seamlessly with automatic login from your website.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
