import type { ValuationResponse } from '@/lib/app1/types';

interface ValuationResultProps {
  result: ValuationResponse;
}

export function ValuationResult({ result }: ValuationResultProps) {
  const price = result.predicted_price;

  return (
    <div data-testid="valuation-result">
      <div className="bg-white rounded-card shadow-sm border border-neutral-100 p-6 text-center">
        <p className="text-sm text-neutral-500">Estimated Value</p>
        <p
          className="text-4xl font-bold text-primary-700 mt-1"
          data-testid="result-estimated-value"
        >
          ${price.toLocaleString('en-US', { minimumFractionDigits: 0 })}
        </p>
        <p className="text-sm text-neutral-400 mt-1">
          Model: {result.model_version}
        </p>
      </div>
    </div>
  );
}
