interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = '1rem', className }: SkeletonProps) {
  return (
    <div
      className={`bg-neutral-100 rounded animate-pulse ${className ?? ''}`}
      style={{ width, height }}
      data-testid="skeleton"
    />
  );
}
