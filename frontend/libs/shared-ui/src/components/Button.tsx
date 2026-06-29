import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: 'primary' | 'secondary';
  href?: string;
  children: ReactNode;
}

export function Button({ variant = 'primary', href, children, className, ...props }: ButtonProps) {
  const classNames = [
    'px-4 py-2 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
    variant === 'secondary'
      ? 'bg-white border border-neutral-100 text-neutral-900 hover:bg-neutral-50'
      : 'bg-primary-500 text-white hover:bg-primary-700',
    className ?? '',
  ].join(' ');

  if (href) {
    return (
      <a href={href} className={classNames} data-testid="button" data-variant={variant}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={classNames}
      data-testid="button"
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  );
}
