'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, Button } from '@project/shared-ui';
import { analyzeWhatIf, getBaselineProperty } from '@/lib/app2/client';
import type { WhatIfDto, HouseFeatures } from '@/lib/app2/types';
import { PredictionDisplay } from './PredictionDisplay';
import { WhatIfError } from './WhatIfError';

const FALLBACK_FEATURES: HouseFeatures = {
  square_footage: 2000,
  bedrooms: 3,
  bathrooms: 2,
  year_built: 2005,
  lot_size: 8000,
  distance_to_city_center: 5,
  school_rating: 7.5,
};

const FIELDS: Array<{
  key: keyof HouseFeatures;
  label: string;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  testId: string;
}> = [
  {
    key: 'square_footage',
    label: 'Square Footage',
    min: 500,
    max: 5000,
    step: 50,
    format: (v) => v.toLocaleString(),
    testId: 'content.what-if.form.square-footage',
  },
  { key: 'bedrooms', label: 'Bedrooms', min: 1, max: 10, step: 1, testId: 'content.what-if.form.bedrooms' },
  { key: 'bathrooms', label: 'Bathrooms', min: 1, max: 10, step: 0.5, testId: 'content.what-if.form.bathrooms' },
  { key: 'year_built', label: 'Year Built', min: 1800, max: 2030, step: 1, testId: 'content.what-if.form.year-built' },
  {
    key: 'lot_size',
    label: 'Lot Size',
    min: 1000,
    max: 50000,
    step: 100,
    format: (v) => v.toLocaleString(),
    testId: 'content.what-if.form.lot-size',
  },
  { key: 'distance_to_city_center', label: 'Distance to Center', min: 0, max: 20, step: 0.1, testId: 'content.what-if.form.distance' },
  { key: 'school_rating', label: 'School Rating', min: 0, max: 10, step: 0.1, testId: 'content.what-if.form.school-rating' },
];

export function WhatIfForm() {
  const [features, setFeatures] = useState<HouseFeatures | null>(null);
  const [baselineLoading, setBaselineLoading] = useState(true);
  const [baselineError, setBaselineError] = useState<string | null>(null);
  const [result, setResult] = useState<WhatIfDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBaselineLoading(true);
    setBaselineError(null);

    getBaselineProperty()
      .then((baseline) => {
        if (!cancelled) {
          setFeatures(baseline.baseline_features);
          setBaselineLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setBaselineError(e instanceof Error ? e.message : 'Failed to load baseline');
          setBaselineLoading(false);
          // Do NOT fall back to hardcoded defaults — would cause non-zero delta
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const updateFeature = (key: keyof HouseFeatures, value: number) => {
    setFeatures((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const adjustFeature = (key: keyof HouseFeatures, delta: number) => {
    setFeatures((prev) => {
      if (!prev) return prev;
      const field = FIELDS.find((f) => f.key === key);
      if (!field) return prev;
      const raw = prev[key] + delta;
      const clamped = Math.min(field.max, Math.max(field.min, raw));
      const stepped = Math.round(clamped / field.step) * field.step;
      return { ...prev, [key]: Math.round(stepped * 10) / 10 };
    });
  };

  const handleCalculate = useCallback(async () => {
    if (!features) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeWhatIf({ features: [features] });
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [features]);

  // Loading state
  if (baselineLoading) {
    return (
      <div data-testid="content.what-if.loading.baseline" className="flex items-center justify-center py-16">
        <p className="text-sm text-neutral-400">Loading baseline values...</p>
      </div>
    );
  }

  // Error state — no fallback to hardcoded defaults
  if (baselineError) {
    return (
      <div data-testid="content.what-if.error" className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-sm text-red-500">Failed to load baseline: {baselineError}</p>
        <p className="text-xs text-neutral-400">Run Analysis is unavailable until baseline loads.</p>
      </div>
    );
  }

  // features should be set now
  if (!features) return null;

  return (
    <div data-testid="content.what-if" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <Card title="Scenario Setup">
        <div className="space-y-5">
          {FIELDS.map(({ key, label, format, testId }) => (
            <div key={key} className="flex items-center gap-3">
              <label htmlFor={`whatif-${key}`} className="text-sm text-neutral-500 w-36 shrink-0">
                {label}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-700 tabular-nums w-16 text-right">
                  {format ? format(FALLBACK_FEATURES[key]) : FALLBACK_FEATURES[key]}
                </span>
                <span className="text-neutral-300">→</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => adjustFeature(key, -FIELDS.find((f) => f.key === key)!.step)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-100 text-neutral-500 hover:bg-neutral-50 transition-colors text-sm"
                    aria-label={`Decrease ${label}`}
                  >
                    −
                  </button>
                  <span
                    id={`whatif-${key}`}
                    data-testid={testId}
                    className="text-sm font-semibold text-neutral-900 tabular-nums w-20 text-center"
                  >
                    {format ? format(features[key]) : features[key]}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustFeature(key, FIELDS.find((f) => f.key === key)!.step)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-100 text-neutral-500 hover:bg-neutral-50 transition-colors text-sm"
                    aria-label={`Increase ${label}`}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-neutral-100">
            <Button data-testid="content.what-if.run" onClick={handleCalculate} disabled={loading}>
              {loading ? 'Running Analysis...' : 'Run Analysis'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Result */}
      <div>
        {error && <WhatIfError message={error} onRetry={handleCalculate} />}
        {result && !error && <PredictionDisplay result={result} />}
        {!result && !error && (
          <Card>
            <p className="text-sm text-neutral-400 text-center py-8">
              Adjust parameters and click Run Analysis to see predicted price changes.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
