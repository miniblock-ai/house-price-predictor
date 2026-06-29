import { WhatIfForm } from '@/components/app2/WhatIfForm';

export default function WhatIfPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 data-testid="content.what-if.title" className="text-2xl font-bold text-gray-900">What-If Analysis</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Adjust parameters to see predicted price changes.
        </p>
      </div>

      <WhatIfForm />
    </div>
  );
}
