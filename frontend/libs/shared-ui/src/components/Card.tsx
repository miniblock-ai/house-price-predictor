import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className }: CardProps) {
  return (
    <div className={`bg-white rounded-card shadow-sm border border-neutral-100 p-6 ${className ?? ''}`} data-testid="card">
      {title && <h2 className="text-lg font-semibold text-neutral-900 mb-4">{title}</h2>}
      {children}
    </div>
  );
}
