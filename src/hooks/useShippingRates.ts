import { useState } from 'react';

export interface ShippingRate {
  courier_id: string;
  courier_name: string;
  courier_logo_url?: string;
  service_name: string;
  service_type: string;
  total_charge: number;
  currency: string;
  min_delivery_time: number;
  max_delivery_time: number;
  estimated_delivery_date?: string;
  description?: string;
  tracking_available: boolean;
  insurance_available: boolean;
  signature_required: boolean;
}

export interface ShippingItem {
  description: string;
  category: string;
  sku: string;
  quantity: number;
  actual_weight: number; // in kg
  declared_currency: string;
  declared_customs_value: number;
  hs_code: string;
  origin_country_alpha2: string;
}

export interface Address {
  line_1: string;
  line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country_alpha2: string;
  phone?: string;
}

export interface BoxDimensions {
  length: number; // cm
  width: number;  // cm
  height: number; // cm
}

export function useShippingRates() {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRates = async (
    originAddress: Address,
    destinationAddress: Address,
    items: ShippingItem[],
    boxDimensions: BoxDimensions,
    totalWeight: number
  ) => {
    setLoading(true);
    setError(null);

    try {
      // For now, return mock shipping rates until Easyship is properly configured
      // This prevents the build from failing and allows the checkout to work
      const mockRates: ShippingRate[] = [
        {
          courier_id: 'usps',
          courier_name: 'USPS',
          service_name: 'Ground Advantage',
          service_type: 'standard',
          total_charge: 8.99,
          currency: 'USD',
          min_delivery_time: 3,
          max_delivery_time: 5,
          description: 'Standard ground shipping',
          tracking_available: true,
          insurance_available: true,
          signature_required: false
        },
        {
          courier_id: 'usps',
          courier_name: 'USPS',
          service_name: 'Priority Mail',
          service_type: 'express',
          total_charge: 12.99,
          currency: 'USD',
          min_delivery_time: 1,
          max_delivery_time: 3,
          description: 'Faster delivery with tracking',
          tracking_available: true,
          insurance_available: true,
          signature_required: false
        },
        {
          courier_id: 'fedex',
          courier_name: 'FedEx',
          service_name: 'Ground',
          service_type: 'standard',
          total_charge: 11.49,
          currency: 'USD',
          min_delivery_time: 2,
          max_delivery_time: 5,
          description: 'Reliable ground shipping',
          tracking_available: true,
          insurance_available: true,
          signature_required: false
        }
      ];

      // Add free shipping if order qualifies
      const subtotal = items.reduce((sum, item) => sum + (item.declared_customs_value * item.quantity), 0);
      if (subtotal >= 50) {
        mockRates.unshift({
          courier_id: 'free',
          courier_name: 'Free Shipping',
          service_name: 'Standard Shipping',
          service_type: 'standard',
          total_charge: 0,
          currency: 'USD',
          min_delivery_time: 3,
          max_delivery_time: 7,
          description: 'Free shipping on orders over $50',
          tracking_available: true,
          insurance_available: false,
          signature_required: false
        });
      }

      setRates(mockRates);

      // TODO: Replace with actual Easyship API call when ready
      /*
      const response = await fetch('/api/easyship/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin_address: originAddress,
          destination_address: destinationAddress,
          items,
          box: {
            ...boxDimensions,
            actual_weight: totalWeight
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get shipping rates');
      }

      const data = await response.json();
      setRates(data.rates || []);
      */
    } catch (err) {
      console.error('Error fetching shipping rates:', err);
      setError(err instanceof Error ? err.message : 'Failed to get shipping rates');
      setRates([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    rates,
    loading,
    error,
    getRates
  };
}