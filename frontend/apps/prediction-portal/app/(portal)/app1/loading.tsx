import { Skeleton } from '@project/shared-ui';

export default function App1Loading() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Skeleton width="60%" height="1.5rem" className="mb-2" />
      <Skeleton width="80%" height="1rem" className="mb-6" />
      <div className="bg-white rounded-card shadow-sm border border-neutral-100 p-6">
        <Skeleton width="40%" height="1.25rem" className="mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i}>
              <Skeleton width="60%" height="0.75rem" className="mb-1" />
              <Skeleton width="100%" height="2.25rem" />
            </div>
          ))}
        </div>
        <Skeleton width="30%" height="2.25rem" className="mt-4" />
      </div>
    </div>
  );
}
