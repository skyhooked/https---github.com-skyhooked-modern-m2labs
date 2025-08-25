import React from 'react';

interface ShippingRate {
  courier_id: string;
  courier_name: string;
  service_name: string;
  total_charge: number;
  min_delivery_time: number;
  max_delivery_time: number;
  currency: string;
}

interface ShippingOptionsProps {
  rates: {
    cheapest?: ShippingRate;
    fastest?: ShippingRate;
    bestValue?: ShippingRate;
  };
  selectedRate?: ShippingRate;
  onSelectRate: (rate: ShippingRate) => void;
  loading: boolean;
  error?: string | null;
}

export const ShippingOptions: React.FC<ShippingOptionsProps> = ({
  rates,
  selectedRate,
  onSelectRate,
  loading,
  error
}) => {
  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF8A3D]"></div>
        <p className="mt-2 text-gray-600">Loading shipping options...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error loading shipping rates: {error}
        </div>
        <p className="mt-2 text-sm text-gray-600">
          We'll calculate shipping costs after you continue to payment.
        </p>
      </div>
    );
  }

  const options = [
    { key: 'cheapest', rate: rates.cheapest, label: 'Cheapest' },
    { key: 'fastest', rate: rates.fastest, label: 'Fastest' },
    { key: 'bestValue', rate: rates.bestValue, label: 'Best Value' }
  ].filter(option => option.rate);

  if (options.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          No shipping options available for this address.
        </div>
        <p className="mt-2 text-sm text-gray-600">
          We'll calculate shipping costs after you continue to payment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Shipping Options</h3>
      <div className="space-y-3">
        {options.map(({ key, rate, label }) => (
          <label
            key={key}
            className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedRate?.courier_id === rate!.courier_id
                ? 'border-[#FF8A3D] bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="shipping"
              checked={selectedRate?.courier_id === rate!.courier_id}
              onChange={() => onSelectRate(rate!)}
              className="sr-only"
            />
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-gray-900">
                  {rate!.courier_name} - {rate!.service_name}
                </div>
                <div className="text-sm text-gray-600">
                  {label} • {rate!.min_delivery_time}-{rate!.max_delivery_time} business days
                </div>
              </div>
              <div className="font-semibold text-gray-900">
                ${rate!.total_charge.toFixed(2)}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};
