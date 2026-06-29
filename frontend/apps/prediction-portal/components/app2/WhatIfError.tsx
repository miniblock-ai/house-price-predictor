'use client';

import { ErrorDisplay } from '@project/shared-ui';

interface WhatIfErrorProps {
  message: string;
  onRetry: () => void;
}

export function WhatIfError({ message, onRetry }: WhatIfErrorProps) {
  return (
    <div data-testid="content.what-if.error">
      <ErrorDisplay message={message} onRetry={onRetry} />
    </div>
  );
}
