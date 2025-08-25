import { useState, useCallback } from 'react';

interface Address {
  line_1: string;
  city: string;
  state: string;
  postal_code: string;
  country_alpha2: string;
}

interface ShippingItem {
  description: string;
  category: string;
  sku: string;
  quantity: number;
  actual_weight: number; // in kg
  declared_currency: string;
  declared_customs_value: number;
}

interface ShippingRate {
  courier_id: string;
  courier_name: string;
  service_name: string;
  total_charge: number;
  min_delivery_time: number;
  max_delivery_time: number;
  currency: string;
}

export const useShippingRates = () => {
  const [rates, setRates] = useState<{
    all: ShippingRate[];
    cheapest?: ShippingRate;
    fastest?: ShippingRate;
    bestValue?: ShippingRate;
  }>({ all: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRates = useCallback(async (
    originAddress: Address,
    destinationAddress: Address,
    items: ShippingItem[],
    boxDimensions: { length: number; width: number; height: number },
    totalWeight: number // in kg
  ) => {
    setLoading(true);
    setError(null);

    const payload = {
      origin_address: originAddress,
      destination_address: destinationAddress,
      parcels: [{
        items: items.map(item => ({
          description: item.description,
          sku: item.sku,
          quantity: item.quantity,
          dimensions: { length: 0, width: 0, height: 0 }, // Individual item dims
          actual_weight: item.actual_weight,
          declared_currency: item.declared_currency,
          declared_customs_value: item.declared_customs_value,
          item_category_id: 1
        })),
        box: boxDimensions,
        total_actual_weight: totalWeight
      }],

    };

    try {
      const response = await fetch('/api/easyship/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      setRates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get shipping rates');
      setRates({ all: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  return { rates, loading, error, getRates };
};
