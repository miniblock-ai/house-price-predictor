import { Skeleton } from '@project/shared-ui';

export default function CompareLoading() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <Skeleton height="1.5rem" width="12rem" className="mb-4" />
      <Skeleton height="2.5rem" width="16rem" className="mb-4" />
      <Skeleton height="300px" className="rounded-xl" />
    </div>
  );
}
