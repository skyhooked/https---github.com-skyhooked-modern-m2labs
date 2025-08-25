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
      // Try to get real Easyship rates first
      const subtotal = items.reduce((sum, item) => sum + (item.declared_customs_value * item.quantity), 0);
      
      // Build Easyship payload according to v2024-09 API format
      const easyshipPayload = {
        origin_address: {
          line_1: originAddress.line_1,
          line_2: originAddress.line_2 || '',
          city: originAddress.city,
          state: originAddress.state,
          postal_code: originAddress.postal_code,
          country_alpha2: originAddress.country_alpha2,
          phone: originAddress.phone || ''
        },
        destination_address: {
          line_1: destinationAddress.line_1,
          line_2: destinationAddress.line_2 || '',
          city: destinationAddress.city,
          state: destinationAddress.state,
          postal_code: destinationAddress.postal_code,
          country_alpha2: destinationAddress.country_alpha2,
          phone: destinationAddress.phone || ''
        },
        parcels: [{
          box: {
            slug: 'custom',
            length: boxDimensions.length,
            width: boxDimensions.width,
            height: boxDimensions.height,
            actual_weight: totalWeight
          },
          items: items.map(item => ({
            description: item.description,
            category: item.category,
            sku: item.sku,
            quantity: item.quantity,
            actual_weight: item.actual_weight,
            declared_currency: item.declared_currency,
            declared_customs_value: item.declared_customs_value,
            hs_code: item.hs_code,
            origin_country_alpha2: item.origin_country_alpha2
          }))
        }],
        shipping_settings: {
          units: {
            weight: 'kg',
            dimensions: 'cm'
          }
        }
      };

      const response = await fetch('/api/easyship/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(easyshipPayload),
      });

      if (response.ok) {
        // Success - use real Easyship rates
        const data = await response.json();
        const easyshipRates = data.all || [];
        
        // Convert Easyship format to our ShippingRate format
        const convertedRates: ShippingRate[] = easyshipRates.map((rate: any) => ({
          courier_id: rate.courier_id,
          courier_name: rate.courier_name,
          courier_logo_url: rate.courier_logo_url,
          service_name: rate.service_name,
          service_type: rate.service_type || 'standard',
          total_charge: rate.total_charge,
          currency: rate.currency || 'USD',
          min_delivery_time: rate.min_delivery_time,
          max_delivery_time: rate.max_delivery_time,
          estimated_delivery_date: rate.estimated_delivery_date,
          description: rate.description,
          tracking_available: rate.tracking_available || false,
          insurance_available: rate.insurance_available || false,
          signature_required: rate.signature_required || false
        }));

        // Add free shipping if order qualifies and no free option exists
        const hasFreeShipping = convertedRates.some(rate => rate.total_charge === 0);
        if (subtotal >= 50 && !hasFreeShipping) {
          convertedRates.unshift({
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

        setRates(convertedRates);
      } else {
        // Fallback to mock rates if Easyship fails
        console.warn('Easyship API failed, using fallback rates');
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
          }
        ];

        // Add free shipping for fallback rates too
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
      }
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