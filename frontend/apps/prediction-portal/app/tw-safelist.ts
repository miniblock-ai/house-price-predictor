/**
 * Tailwind v4 safelist for @project/shared-ui components.
 *
 * Tailwind v4 scans source files for class names as plain text.
 * This file ensures classes used by shared-ui workspace package
 * (which is outside the portal's scan scope) are generated.
 *
 * NOTE: Do NOT import this file anywhere — it's for Tailwind scanning only.
 */

// ─── NavBar ───────────────────────────────────────────────────
const _nav = [
  'bg-primary-700', 'text-white', 'h-16', 'fixed', 'top-0', 'left-0', 'right-0', 'z-50', 'shadow-sm',
  'max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'h-full', 'flex', 'items-center', 'justify-between',
  'gap-2', 'w-7', 'h-7', 'text-lg', 'font-semibold', 'tracking-tight',
  'hidden', 'md:flex', 'gap-1',
  'px-3', 'py-2', 'rounded-md', 'text-sm', 'font-medium', 'transition-colors',
  'text-white', 'bg-white/20', 'border-b-2', 'border-white',
  'text-white/70', 'hover:text-white', 'hover:bg-white/10',
  'w-8', 'h-8', 'rounded-full', 'bg-white/20', 'shrink-0',
];

// ─── Skeleton ─────────────────────────────────────────────────
const _skeleton = [
  'bg-neutral-100', 'rounded', 'animate-pulse',
];

// ─── StatCard ─────────────────────────────────────────────────
const _statcard = [
  'bg-white', 'rounded-card', 'shadow-sm', 'border', 'border-neutral-100', 'p-4',
  'text-sm', 'text-neutral-500',
  'text-2xl', 'font-bold', 'text-neutral-900', 'mt-1',
  'flex', 'items-center', 'gap-1', 'mt-1',
  'text-success', 'text-xs', 'font-medium',
  'text-error',
  'text-neutral-500', 'text-xs',
];

// ─── Button ───────────────────────────────────────────────────
const _button = [
  'px-4', 'py-2', 'rounded-lg', 'font-medium', 'transition-colors',
  'focus-visible:outline-2', 'focus-visible:outline-offset-2',
  'bg-primary-500', 'text-white', 'hover:bg-primary-700',
  'bg-neutral-100', 'text-neutral-500', 'cursor-not-allowed',
  'opacity-50', 'cursor-not-allowed',
];

// ─── Card ─────────────────────────────────────────────────────
const _card = [
  'bg-white', 'rounded-card', 'shadow-sm', 'border', 'border-neutral-100', 'p-6',
];

// ─── ErrorDisplay ─────────────────────────────────────────────
const _error = [
  'bg-red-50', 'border', 'border-red-200', 'rounded-card', 'p-4', 'flex', 'items-start', 'gap-3',
  'text-red-600', 'font-semibold', 'text-sm',
  'text-red-500', 'text-sm', 'mt-1',
  'mt-3', 'px-3', 'py-1.5', 'text-xs', 'font-medium', 'text-red-600',
  'border', 'border-red-300', 'rounded-md', 'hover:bg-red-100', 'transition-colors',
];

// Prevent tree-shaking — these are discovered by Tailwind scanner
void _nav;
void _skeleton;
void _statcard;
void _button;
void _card;
void _error;

export {};
