interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div
      className="rounded-card border border-error/30 bg-error/5 p-6 text-center"
      data-testid="error-display"
    >
      <p className="text-error mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors cursor-pointer"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
