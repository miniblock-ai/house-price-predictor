'use client';

import * as Slider from '@radix-ui/react-slider';

interface RangeSliderProps {
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Increment step */
  step?: number;
  /** Current value range [min, max] */
  value: [number, number];
  /** Called when user drags a handle */
  onValueChange: (value: [number, number]) => void;
  /** Display label */
  label?: string;
  /** Format a value for display (e.g. "$1,000", "7.1") */
  formatValue?: (value: number) => string;
  /** data-testid prefix (applied to root) */
  testId?: string;
  /** Optional className override */
  className?: string;
}

export function RangeSlider({
  min = 0,
  max = 100,
  step = 1,
  value,
  onValueChange,
  label,
  formatValue,
  testId,
  className = '',
}: RangeSliderProps) {
  return (
    <div className={className} data-testid={testId}>
      {label && (
        <label className="block text-xs font-medium text-gray-500 mb-2">{label}</label>
      )}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs text-gray-400 w-16 text-right tabular-nums">
          {formatValue ? formatValue(value[0]) : value[0]}
        </span>
        <Slider.Root
          className="relative flex items-center flex-1 h-5 cursor-pointer"
          min={min}
          max={max}
          step={step}
          value={[value[0], value[1]]}
          onValueChange={(v) => onValueChange([v[0], v[1]])}
        >
          <Slider.Track className="bg-gray-200 relative grow rounded-full h-1.5">
            <Slider.Range className="absolute bg-primary rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb className="block w-4 h-4 bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 transition-shadow cursor-grab active:cursor-grabbing" />
          <Slider.Thumb className="block w-4 h-4 bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 transition-shadow cursor-grab active:cursor-grabbing" />
        </Slider.Root>
        <span className="text-xs text-gray-400 w-16 tabular-nums">
          {formatValue ? formatValue(value[1]) : value[1]}
        </span>
      </div>
    </div>
  );
}
