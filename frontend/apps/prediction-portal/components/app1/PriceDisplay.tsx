interface PriceDisplayProps {
  price: number | null;
  sqft: number;
  bedrooms: number;
}

export function PriceDisplay({ price, sqft, bedrooms }: PriceDisplayProps) {
  if (price === null) return null;

  return (
    <div className="bg-primary-50 border border-primary-200 rounded-card p-4 mt-4" data-testid="price-display">
      <p className="text-3xl font-bold text-primary-700">
        ${price.toLocaleString()}
      </p>
      <p className="text-sm text-primary-500 mt-1">
        {sqft} sqft · {bedrooms} beds
      </p>
    </div>
  );
}
