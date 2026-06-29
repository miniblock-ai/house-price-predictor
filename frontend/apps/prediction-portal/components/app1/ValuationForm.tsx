'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card } from '@project/shared-ui';
import { toast } from 'sonner';
import { estimatePrice, ApiClientError } from '@/lib/app1/client';
import { saveToStorage } from './ValuationHistory';
import { useComparison } from '@/lib/app1/ComparisonContext';
import type { ValuationRequest, ValuationResponse } from '@/lib/app1/types';
import { ValuationResult } from './ValuationResult';

interface FormState {
  square_footage: string;
  bedrooms: string;
  bathrooms: string;
  year_built: string;
  lot_size: string;
  distance_to_city_center: string;
  school_rating: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const INITIAL_FORM: FormState = {
  square_footage: '',
  bedrooms: '',
  bathrooms: '',
  year_built: '',
  lot_size: '',
  distance_to_city_center: '',
  school_rating: '',
};

const LABELS: Record<keyof FormState, string> = {
  square_footage: 'Square Footage',
  bedrooms: 'Bedrooms',
  bathrooms: 'Bathrooms',
  year_built: 'Year Built',
  lot_size: 'Lot Size (sqft)',
  distance_to_city_center: 'Distance to City Center (mi)',
  school_rating: 'School Rating (0-10)',
};

const TEST_IDS: Record<keyof FormState, string> = {
  square_footage: 'input-sqft',
  bedrooms: 'input-bedrooms',
  bathrooms: 'input-bathrooms',
  year_built: 'input-year-built',
  lot_size: 'input-lot-size',
  distance_to_city_center: 'input-distance',
  school_rating: 'input-school-rating',
};

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.square_footage.trim()) {
    errors.square_footage = 'Square footage is required';
  } else if (Number(form.square_footage) < 500 || Number(form.square_footage) > 10000) {
    errors.square_footage = 'Square footage must be between 500 and 10,000';
  }

  if (!form.bedrooms.trim()) {
    errors.bedrooms = 'Bedrooms is required';
  } else if (!Number.isInteger(Number(form.bedrooms)) || Number(form.bedrooms) < 1 || Number(form.bedrooms) > 10) {
    errors.bedrooms = 'Bedrooms must be between 1 and 10';
  }

  if (!form.bathrooms.trim()) {
    errors.bathrooms = 'Bathrooms is required';
  } else if (Number(form.bathrooms) < 1 || Number(form.bathrooms) > 10) {
    errors.bathrooms = 'Bathrooms must be between 1 and 10';
  }

  if (!form.year_built.trim()) {
    errors.year_built = 'Year built is required';
  } else if (Number(form.year_built) < 1800 || Number(form.year_built) > 2050) {
    errors.year_built = 'Year built must be between 1800 and 2050';
  }

  if (!form.lot_size.trim()) {
    errors.lot_size = 'Lot size is required';
  } else if (Number(form.lot_size) < 1000 || Number(form.lot_size) > 100000) {
    errors.lot_size = 'Lot size must be between 1,000 and 100,000 sqft';
  }

  if (!form.distance_to_city_center.trim()) {
    errors.distance_to_city_center = 'Distance is required';
  } else if (Number(form.distance_to_city_center) < 0 || Number(form.distance_to_city_center) > 50) {
    errors.distance_to_city_center = 'Distance must be between 0 and 50 miles';
  }

  if (!form.school_rating.trim()) {
    errors.school_rating = 'School rating is required';
  } else if (Number(form.school_rating) < 0 || Number(form.school_rating) > 10) {
    errors.school_rating = 'School rating must be between 0 and 10';
  }

  return errors;
}

function toRequest(form: FormState): ValuationRequest {
  return {
    square_footage: Number(form.square_footage),
    bedrooms: Number(form.bedrooms),
    bathrooms: Number(form.bathrooms),
    year_built: Number(form.year_built),
    lot_size: Number(form.lot_size),
    distance_to_city_center: Number(form.distance_to_city_center),
    school_rating: Number(form.school_rating),
  };
}

export function ValuationForm() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [result, setResult] = useState<ValuationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'validation' | 'api' | null>(null);
  const [loading, setLoading] = useState(false);
  const { addItem, isAdded, isMax } = useComparison();

  const alreadyAdded = useMemo(
    () => (result ? isAdded(result.input_features) : false),
    [result, isAdded],
  );

  const handleChange = useCallback((field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorType(null);
    setResult(null);

    const errors = validateForm(form);
    const errorMessages = Object.values(errors).filter(Boolean);
    if (errorMessages.length > 0) {
      setError(errorMessages.join('. '));
      setErrorType('validation');
      return;
    }

    setLoading(true);
    try {
      const data = await estimatePrice(toRequest(form));
      saveToStorage(data);
      setResult(data);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
      setErrorType('api');
    } finally {
      setLoading(false);
    }
  }, [form]);

  const fields = Object.keys(INITIAL_FORM) as (keyof FormState)[];

  return (
    <div className="space-y-6">
      <Card title="Property Features">
        <p className="text-sm text-neutral-500 mb-4">
          Enter property details to get an instant valuation.
        </p>
        <form onSubmit={handleSubmit} data-testid="valuation-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {fields.map((field) => (
              <div key={field}>
                <label
                  htmlFor={field}
                  className="block text-sm font-medium text-neutral-900 mb-1"
                >
                  {LABELS[field]}
                </label>
                <input
                  id={field}
                  type="number"
                  step={field === 'school_rating' ? '1' : 'any'}
                  data-testid={TEST_IDS[field]}
                  value={form[field]}
                  onChange={handleChange(field)}
                  className="w-full border border-neutral-300 rounded-card px-3 py-2 text-sm focus:outline-2 focus:outline-primary-500"
                  aria-label={LABELS[field]}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              data-testid="btn-get-valuation"
              disabled={loading}
              className="px-6 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Calculating…' : 'Get Valuation'}
            </button>
          </div>

          {error && (
            <p
              data-testid={errorType === 'api' ? 'error-api' : 'error-validation'}
              className="mt-3 text-sm text-error"
            >
              {error}
            </p>
          )}
        </form>
      </Card>

      {result && (
        <>
          <ValuationResult result={result} />
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                addItem(result);
                toast.success('Added to comparison');
              }}
              disabled={alreadyAdded || isMax}
              data-testid="btn-add-to-compare"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                alreadyAdded
                  ? 'bg-neutral-100 text-neutral-400 cursor-default'
                  : 'bg-primary text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {alreadyAdded
                ? 'Added ✓'
                : isMax
                  ? 'Compare Full (Max 3)'
                  : 'Add to Compare'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
