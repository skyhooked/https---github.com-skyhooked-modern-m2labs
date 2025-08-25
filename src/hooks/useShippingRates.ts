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
          city: originAddress.city,
          state: originAddress.state,
          postal_code: originAddress.postal_code,
          country_alpha2: originAddress.country_alpha2
        },
        destination_address: {
          line_1: destinationAddress.line_1,
          city: destinationAddress.city,
          state: destinationAddress.state,
          postal_code: destinationAddress.postal_code,
          country_alpha2: destinationAddress.country_alpha2
        },
        parcels: [{
          box: {
            slug: 'custom',
            length: boxDimensions.length,
            width: boxDimensions.width,
            height: boxDimensions.height
          },
          total_actual_weight: totalWeight,
          items: items.map(item => ({
            description: item.description || 'Guitar Effects Pedal',
            quantity: item.quantity,
            actual_weight: item.actual_weight,
            declared_currency: 'USD',
            declared_customs_value: item.declared_customs_value,
            hs_code: item.hs_code || '854370',
            origin_country_alpha2: 'US'
          }))
        }],
        shipping_settings: {
          units: {
            weight: 'kg',
            dimensions: 'cm'
          }
        }
      };

      console.log('📤 Frontend sending payload:', JSON.stringify(easyshipPayload, null, 2));

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
        console.log('✅ Easyship API Success - Got real rates:', easyshipRates.length, 'options');
        
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

        // Let Easyship handle all shipping options - no custom free shipping logic

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

        // No custom free shipping in fallback either

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