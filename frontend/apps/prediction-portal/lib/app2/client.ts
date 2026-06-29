import type {
  ApiResponse,
  BaselineDto,
  MarketStatisticsDto,
  PaginatedListingsDto,
  ListingsFilterParams,
  WhatIfRequest,
  WhatIfDto,
} from './types';

// In browser: use relative URL (Next.js proxy handles routing).
// In SSR (Node.js): need absolute URL — default to local Next.js dev server.
const API_BASE =
  typeof window === 'undefined' ? process.env.API_BASE_URL || 'http://localhost:3001' : '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isGet = !options?.method || options.method === 'GET';
  const res = await fetch(`${API_BASE}${path}`, {
    headers: isGet ? undefined : { 'Content-Type': 'application/json' },
    ...options,
  });

  // Non-JSON response (e.g. PDF blob)
  if (!res.headers.get('content-type')?.includes('application/json')) {
    return res as unknown as T;
  }

  const body: ApiResponse<T> = await res.json();

  if (!res.ok || body.code >= 400) {
    throw new ApiClientError(
      body.message || `Request failed with status ${res.status}`,
      body.code,
      res.status
    );
  }

  return body.data;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public code: number,
    public httpStatus: number
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/* ───────────── Statistics ───────────── */

export function getStatistics(segments?: string[]): Promise<MarketStatisticsDto> {
  const params = segments?.length
    ? `?${segments.map((s) => `segment=${encodeURIComponent(s)}`).join('&')}`
    : '';
  return request<MarketStatisticsDto>(`/api/v1/market/statistics${params}`);
}

/* ───────────── Listings ───────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toQueryString(params: Record<string, any>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (!entries.length) return '';
  return (
    '?' +
    entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
  );
}

export function getListings(filters: ListingsFilterParams): Promise<PaginatedListingsDto> {
  return request<PaginatedListingsDto>(
    `/api/v1/market/listings${toQueryString(filters as Record<string, unknown>)}`
  );
}

/* ───────────── Baseline ───────────── */

export function getBaselineProperty(): Promise<BaselineDto> {
  return request<BaselineDto>('/api/v1/market/baseline-property');
}

/* ───────────── What-If ───────────── */

export function analyzeWhatIf(req: WhatIfRequest): Promise<WhatIfDto> {
  return request<WhatIfDto>('/api/v1/market/what-if', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

/* ───────────── Export ───────────── */

export async function exportPdf(filters: Record<string, unknown>): Promise<Blob> {
  const res = await fetch(`${API_BASE}/api/v1/market/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format: 'pdf', ...filters }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiClientError(body.message || 'Export failed', body.code || res.status, res.status);
  }

  return res.blob();
}
