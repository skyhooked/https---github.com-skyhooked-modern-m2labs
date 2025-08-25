'use client';

import React from 'react';
import { ShippingRate } from '@/hooks/useShippingRates';

interface ShippingOptionsProps {
  rates: ShippingRate[];
  selectedRate: ShippingRate | null;
  onSelectRate: (rate: ShippingRate) => void;
  loading: boolean;
  error: string | null;
}

export function ShippingOptions({
  rates,
  selectedRate,
  onSelectRate,
  loading,
  error
}: ShippingOptionsProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Getting shipping options...</h3>
        <div className="flex items-center space-x-3">
          <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-[#FF8A3D]"></div>
          <span className="text-gray-600">Calculating shipping rates...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Shipping Options</h3>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <div className="text-gray-600 text-sm">
          Please check your address and try again, or contact support if the issue persists.
        </div>
      </div>
    );
  }

  if (rates.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Shipping Options</h3>
        <div className="text-gray-600">
          No shipping options available for this address. Please verify your address or contact support.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Choose Shipping Method</h3>
      
      <div className="space-y-3">
        {rates.map((rate, index) => (
          <div
            key={`${rate.courier_id}-${rate.service_name}-${index}`}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedRate && 
              selectedRate.courier_id === rate.courier_id && 
              selectedRate.service_name === rate.service_name
                ? 'border-[#FF8A3D] bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelectRate(rate)}
          >
            <div className="flex items-center">
              <input
                type="radio"
                name="shippingRate"
                checked={
                  !!(selectedRate && 
                  selectedRate.courier_id === rate.courier_id && 
                  selectedRate.service_name === rate.service_name)
                }
                onChange={() => onSelectRate(rate)}
                className="h-4 w-4 text-[#FF8A3D] focus:ring-[#FF8A3D] border-gray-300"
              />
              
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {rate.courier_name}
                      </span>
                      <span className="text-gray-600">
                        {rate.service_name}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-500 mt-1">
                      {rate.min_delivery_time === rate.max_delivery_time
                        ? `${rate.min_delivery_time} business day${rate.min_delivery_time > 1 ? 's' : ''}`
                        : `${rate.min_delivery_time}-${rate.max_delivery_time} business days`
                      }
                      {rate.description && ` • ${rate.description}`}
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      {rate.tracking_available && (
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Tracking
                        </span>
                      )}
                      
                      {rate.insurance_available && (
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Insurance
                        </span>
                      )}
                      
                      {rate.signature_required && (
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Signature Required
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {rate.total_charge === 0 ? 'FREE' : `$${rate.total_charge.toFixed(2)}`}
                    </div>
                    {rate.service_type === 'express' && (
                      <div className="text-xs text-orange-600 font-medium">EXPRESS</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedRate && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-green-700">
              Selected: {selectedRate.courier_name} {selectedRate.service_name} - 
              {selectedRate.total_charge === 0 ? ' FREE' : ` $${selectedRate.total_charge.toFixed(2)}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}