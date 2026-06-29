'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useComparison } from '@/lib/app1/ComparisonContext';

export function ComparisonBar() {
  const { items, count, isMax, clearAll } = useComparison();
  const router = useRouter();

  if (count === 0) return null;

  const label = isMax ? `Compare (${count}) — Max` : `Compare (${count})`;

  return (
    <div
      data-testid="comparison-bar"
      className="fixed bottom-0 left-0 right-0 z-40 h-12 bg-white border-t border-neutral-200 shadow-sm"
    >
      <div className="max-w-screen-2xl mx-auto h-full px-4 flex items-center justify-between">
        <button
          onClick={() => router.push('/app1/compare')}
          data-testid="comparison-count"
          className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
          </svg>
          {label}
        </button>

        <button
          onClick={() => {
            clearAll();
            toast.success('Comparison cleared');
          }}
          data-testid="btn-clear-comparison"
          className="text-xs text-neutral-400 hover:text-error transition-colors flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear
        </button>
      </div>
    </div>
  );
}
