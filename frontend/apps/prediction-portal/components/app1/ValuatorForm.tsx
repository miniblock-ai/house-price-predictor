'use client';

import { useState } from 'react';

interface FormState {
  sqft: string;
  bedrooms: string;
}

interface FormErrors {
  sqft?: string;
  bedrooms?: string;
}

function validate(sqft: string, bedrooms: string): FormErrors {
  const errors: FormErrors = {};
  if (!sqft.trim()) {
    errors.sqft = 'Square footage is required';
  } else if (Number(sqft) <= 0) {
    errors.sqft = 'Square footage must be greater than 0';
  }
  if (!bedrooms.trim()) {
    errors.bedrooms = 'Bedrooms is required';
  } else if (!Number.isInteger(Number(bedrooms)) || Number(bedrooms) < 1) {
    errors.bedrooms = 'Bedrooms must be at least 1';
  }
  return errors;
}

function calculate(sqft: number, bedrooms: number): number {
  return sqft * 150 + bedrooms * 10000;
}

export function ValuatorForm() {
  const [form, setForm] = useState<FormState>({ sqft: '', bedrooms: '' });
  const [price, setPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate(form.sqft, form.bedrooms);
    if (errors.sqft) {
      setError(errors.sqft);
      setPrice(null);
      return;
    }
    if (errors.bedrooms) {
      setError(errors.bedrooms);
      setPrice(null);
      return;
    }
    setError(null);
    const result = calculate(Number(form.sqft), Number(form.bedrooms));
    setPrice(result);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label htmlFor="sqft" className="block text-sm font-medium text-neutral-900 mb-1">
            Square Footage
          </label>
          <input
            id="sqft"
            type="number"
            data-testid="input-sqft"
            value={form.sqft}
            onChange={(e) => setForm({ ...form, sqft: e.target.value })}
            className="w-full border border-neutral-300 rounded-card px-3 py-2 text-sm focus:outline-2 focus:outline-primary-500"
            aria-label="Square footage"
          />
        </div>
        <div>
          <label htmlFor="bedrooms" className="block text-sm font-medium text-neutral-900 mb-1">
            Bedrooms
          </label>
          <input
            id="bedrooms"
            type="number"
            data-testid="input-bedrooms"
            value={form.bedrooms}
            onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
            className="w-full border border-neutral-300 rounded-card px-3 py-2 text-sm focus:outline-2 focus:outline-primary-500"
            aria-label="Bedrooms"
          />
        </div>
        <button
          type="submit"
          data-testid="predict-button"
          className="px-4 py-2 bg-primary-500 text-white rounded-card font-medium hover:bg-primary-700 transition-colors"
        >
          Predict
        </button>
        {error && (
          <p data-testid="error-message" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {price !== null && (
          <p data-testid="price-result" className="text-xl font-bold text-primary-700">
            ${price.toLocaleString()}
          </p>
        )}
      </div>
    </form>
  );
}
