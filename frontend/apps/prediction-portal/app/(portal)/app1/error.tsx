'use client';

import { ErrorDisplay } from '@project/shared-ui';

export default function App1Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <ErrorDisplay message={error.message || 'Something went wrong'} onRetry={reset} />
    </div>
  );
}
