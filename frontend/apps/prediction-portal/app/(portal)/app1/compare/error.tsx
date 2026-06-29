'use client';

export default function CompareError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-sm border border-dashed border-error p-8 text-center">
        <svg className="w-10 h-10 text-error mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-sm text-error mb-4">Something went wrong loading the comparison view.</p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-1 text-sm text-white bg-primary px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
