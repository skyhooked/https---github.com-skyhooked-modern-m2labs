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
    return <div className="p-4 text-center">Loading shipping options...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  const options = [
    { key: 'cheapest', rate: rates.cheapest, label: 'Cheapest' },
    { key: 'fastest', rate: rates.fastest, label: 'Fastest' },
    { key: 'bestValue', rate: rates.bestValue, label: 'Best Value' }
  ].filter(option => option.rate);

  if (options.length === 0) {
    return <div className="p-4">No shipping options available</div>;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Shipping Options</h3>
      {options.map(({ key, rate, label }) => (
        <label
          key={key}
          className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
            selectedRate?.courier_id === rate!.courier_id
              ? 'border-blue-500 bg-blue-50'
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
              <div className="font-medium">
                {rate!.courier_name} - {rate!.service_name}
              </div>
              <div className="text-sm text-gray-600">
                {label} • {rate!.min_delivery_time}-{rate!.max_delivery_time} business days
              </div>
            </div>
            <div className="font-semibold">
              ${rate!.total_charge.toFixed(2)}
            </div>
          </div>
        </label>
      ))}
    </div>
  );
};
