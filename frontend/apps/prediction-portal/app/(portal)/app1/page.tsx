import { ValuationForm } from '@/components/app1/ValuationForm';
import { ValuationHistory } from '@/components/app1/ValuationHistory';

export default function App1Page() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900" data-testid="page-title">Property Value Estimator</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Enter property details to get an instant valuation.
        </p>
      </div>
      <ValuationForm />
      <hr className="border-neutral-200" />
      <ValuationHistory />
    </div>
  );
}
