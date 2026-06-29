'use client';

import { ErrorDisplay } from '@project/shared-ui';

export default function App2Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <ErrorDisplay message={error.message || 'Something went wrong'} onRetry={reset} />
    </div>
  );
}
