import { Skeleton } from '@project/shared-ui';

export function DashboardSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6">
      {/* Page Header Skeleton */}
      <div className="mb-8">
        <Skeleton width="14rem" height="1.75rem" />
        <div className="mt-1">
          <Skeleton width="20rem" height="0.875rem" />
        </div>
      </div>

      {/* Filter Panel Skeleton */}
      <div className="mb-6 bg-white rounded-card shadow-sm border border-neutral-100 p-4">
        <div className="flex flex-wrap gap-4">
          <Skeleton width="10rem" height="2.5rem" />
          <Skeleton width="16rem" height="2.5rem" />
          <Skeleton width="10rem" height="2.5rem" />
          <Skeleton width="10rem" height="2.5rem" />
          <Skeleton width="14rem" height="2.5rem" />
        </div>
      </div>

      {/* Stat Cards Skeleton */}
      <div className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton height="6rem" />
          <Skeleton height="6rem" />
          <Skeleton height="6rem" />
          <Skeleton height="6rem" />
        </div>
      </div>

      {/* Data Table Skeleton */}
      <div className="bg-white rounded-card shadow-sm border border-neutral-100 p-6">
        <Skeleton width="10rem" height="1.25rem" />
        <div className="mt-4 space-y-3">
          <Skeleton height="2.5rem" /> {/* Header */}
          <Skeleton height="2rem" />
          <Skeleton height="2rem" />
          <Skeleton height="2rem" />
          <Skeleton height="2rem" />
          <Skeleton height="2rem" />
        </div>
      </div>
    </div>
  );
}
