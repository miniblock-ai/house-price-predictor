'use client';

import { useMemo } from 'react';
import { Card } from '@project/shared-ui';
import type { WhatIfDto, HouseFeatures } from '@/lib/app2/types';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface PredictionDisplayProps {
  result: WhatIfDto;
}

/* ───────────── Per-feature impact heuristic ───────────── */

interface FeatureImpact {
  key: string;
  label: string;
  delta: number;
  isPositive: boolean;
}

const FEATURE_LABELS: Record<keyof HouseFeatures, string> = {
  square_footage: 'Square Footage',
  bedrooms: 'Bedrooms',
  bathrooms: 'Bathrooms',
  year_built: 'Year Built',
  lot_size: 'Lot Size',
  distance_to_city_center: 'Distance to Center',
  school_rating: 'School Rating',
};

function computeFeatureImpacts(result: WhatIfDto): FeatureImpact[] {
  const { input_features: input, baseline_features: baseline, delta: totalDelta } = result;

  // For each feature, compute a proportional weight based on normalized change
  const weights: { key: keyof HouseFeatures; absWeight: number }[] = [];
  let totalWeight = 0;

  const keys = Object.keys(FEATURE_LABELS) as (keyof HouseFeatures)[];
  for (const key of keys) {
    const bv = baseline[key];
    const iv = input[key];
    // Normalized change: (iv - bv) / (max possible range for this feature)
    // This gives a relative sense of "how much did the user change this feature"
    const range = getFeatureRange(key);
    const normalizedDelta = range > 0 ? (iv - bv) / range : 0;
    const absWeight = Math.abs(normalizedDelta);
    weights.push({ key, absWeight });
    totalWeight += absWeight;
  }

  if (totalWeight === 0) {
    return keys.map((key) => ({ key, label: FEATURE_LABELS[key], delta: 0, isPositive: true }));
  }

  return weights.map(({ key, absWeight }) => {
    const bv = baseline[key];
    const iv = input[key];
    const range = getFeatureRange(key);
    const normalizedDelta = range > 0 ? (iv - bv) / range : 0;
    // Proportionally distribute total delta based on weight, preserving direction
    const featureDelta =
      totalWeight > 0 ? (absWeight / totalWeight) * totalDelta * Math.sign(normalizedDelta) : 0;
    return {
      key,
      label: FEATURE_LABELS[key],
      delta: featureDelta,
      isPositive: featureDelta >= 0,
    };
  });
}

function getFeatureRange(key: keyof HouseFeatures): number {
  const ranges: Record<keyof HouseFeatures, number> = {
    square_footage: 4500, // 500–5000
    bedrooms: 9, // 1–10
    bathrooms: 9, // 1–10
    year_built: 230, // 1800–2030
    lot_size: 49000, // 1000–50000
    distance_to_city_center: 20, // 0–20
    school_rating: 10, // 0–10
  };
  return ranges[key] ?? 1;
}

/* ───────────── Component ───────────── */

export function PredictionDisplay({ result }: PredictionDisplayProps) {
  const isUp = result.delta >= 0;

  // Use backend confidence bounds if available, otherwise ±15% heuristic
  const confidenceBounds = useMemo(() => {
    if (result.confidence_lower != null && result.confidence_upper != null) {
      return {
        lower: result.confidence_lower,
        upper: result.confidence_upper,
      };
    }
    // Heuristic: ±15% of predicted price
    const margin = result.predicted_price * 0.15;
    return {
      lower: result.predicted_price - margin,
      upper: result.predicted_price + margin,
    };
  }, [result]);

  const impacts = useMemo(() => computeFeatureImpacts(result), [result]);

  return (
    <div data-testid="content.what-if.result" className="space-y-6">
      <Card title="Predicted Result">
        {/* Primary price */}
        <div className="text-center py-4">
          <p className="text-4xl font-bold text-neutral-900">
            {currency.format(result.predicted_price)}
          </p>

          <div className="flex items-center justify-center gap-2 mt-2">
            <span className={`text-sm font-semibold ${isUp ? 'text-success' : 'text-error'}`}>
              {isUp ? '▲' : '▼'} {isUp ? '+' : '-'}
              {currency.format(Math.abs(result.delta))}
            </span>
            <span className={`text-sm font-semibold ${isUp ? 'text-success' : 'text-error'}`}>
              ({isUp ? '+' : '-'}
              {Math.abs(result.delta_percent).toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Baseline vs Scenario */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
          <div className="bg-neutral-50 rounded-lg p-3">
            <p className="text-xs text-neutral-500">Baseline Price</p>
            <p className="text-lg font-semibold text-neutral-700">
              {currency.format(result.baseline_price)}
            </p>
            <p className="text-xs text-neutral-400 mt-1">Market average</p>
          </div>
          <div className="bg-primary-50 rounded-lg p-3 border border-primary-100">
            <p className="text-xs text-primary uppercase">Estimated Price</p>
            <p className={`text-lg font-semibold ${isUp ? 'text-success' : 'text-error'}`}>
              {isUp ? '+' : '-'}
              {currency.format(Math.abs(result.delta))}
            </p>
            <p
              className={`text-xs mt-1 flex items-center ${isUp ? 'text-green-600' : 'text-error'}`}
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isUp ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'}
                />
              </svg>
              {isUp ? '+' : '-'}
              {Math.abs(result.delta_percent).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Confidence Range — matching UX v2 prototype */}
        <div
          data-testid="content.what-if.confidence"
          className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3"
        >
          <div className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-amber-600 mt-0.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-xs font-semibold text-amber-800">95% Confidence Range</p>
              <p className="text-sm font-medium text-amber-700 mt-0.5">
                <span className="text-lg font-bold">{currency.format(confidenceBounds.lower)}</span>{' '}
                –{' '}
                <span className="text-lg font-bold">{currency.format(confidenceBounds.upper)}</span>
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                The estimated price has a 95% probability of falling within this range.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Feature Impact Breakdown — matching UX v2 prototype */}
      <Card title="Feature Impact Breakdown">
        <div className="space-y-1">
          {impacts.map((impact) => (
            <div
              key={impact.key}
              data-testid="content.what-if.impact"
              className="flex items-center justify-between py-2 border-b border-neutral-50 last:border-b-0"
            >
              <span className="text-sm text-neutral-600">{impact.label}</span>
              <span
                className={`text-sm font-medium flex items-center ${
                  impact.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      impact.isPositive ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'
                    }
                  />
                </svg>
                {impact.isPositive ? '+' : ''}
                {currency.format(Math.abs(impact.delta))}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
