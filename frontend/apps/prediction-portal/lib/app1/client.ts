import type { ApiResponse, ValuationRequest, ValuationResponse, BatchResponse } from './types';

const API_BASE = '';
const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await attemptRequest<T>(path, options);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Unknown error');
      // Only retry on network/timeout errors, not 4xx
      if (err instanceof ApiClientError && err.httpStatus > 0 && err.httpStatus < 500) {
        throw err;
      }
      if (attempt < MAX_RETRIES) {
        const delay = Math.min(500 * Math.pow(2, attempt), 2000);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}

async function attemptRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const isGet = !options?.method || options.method === 'GET';

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: isGet ? undefined : { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiClientError('Request timed out', 0, 0);
    }
    throw new ApiClientError(
      err instanceof Error ? err.message : 'Network request failed',
      0,
      0,
    );
  }
  clearTimeout(timeoutId);

  let body: ApiResponse<T>;
  try {
    body = await res.json();
  } catch {
    throw new ApiClientError('Invalid response from server', 0, res.status);
  }

  if (!res.ok || body.code >= 400) {
    throw new ApiClientError(body.message || `Request failed with status ${res.status}`, body.code, res.status);
  }

  return body.data;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public code: number,
    public httpStatus: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/* ───────────── Single Valuation ───────────── */

export function estimatePrice(features: ValuationRequest): Promise<ValuationResponse> {
  return request<ValuationResponse>('/api/v1/valuation', {
    method: 'POST',
    body: JSON.stringify(features),
  });
}

/* ───────────── Batch Valuation ───────────── */

export function batchEstimate(properties: ValuationRequest[]): Promise<BatchResponse> {
  return request<BatchResponse>('/api/v1/valuation/batch', {
    method: 'POST',
    body: JSON.stringify({ properties }),
  });
}
