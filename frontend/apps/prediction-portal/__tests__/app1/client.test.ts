import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { estimatePrice, batchEstimate, ApiClientError } from '@/lib/app1/client';
import type { ValuationRequest, ValuationResponse } from '@/lib/app1/types';

const VALID_REQUEST: ValuationRequest = {
  square_footage: 2000,
  bedrooms: 3,
  bathrooms: 2,
  year_built: 2010,
  lot_size: 5000,
  distance_to_city_center: 5.2,
  school_rating: 8,
};

const MOCK_RESPONSE: ValuationResponse = {
  predicted_price: 425000,
  currency: 'USD',
  input_features: VALID_REQUEST,
  model_version: 'LinearRegression',
  timestamp: '2026-06-15T10:30:00Z',
};

function mockOkResponse(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve({ code: 200, message: 'success', data }),
  });
}

describe('estimatePrice', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls POST /api/v1/valuation with correct body and returns data', async () => {
    const mockFetch = mockOkResponse(MOCK_RESPONSE);
    vi.stubGlobal('fetch', mockFetch);

    const promise = estimatePrice(VALID_REQUEST);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/valuation'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(VALID_REQUEST),
      }),
    );
    expect(result).toEqual(MOCK_RESPONSE);
  });

  it('throws ApiClientError on non-ok response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ code: 400100, message: 'Field required: bedrooms' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(estimatePrice(VALID_REQUEST)).rejects.toThrow(ApiClientError);
    await expect(estimatePrice(VALID_REQUEST)).rejects.toThrow('Field required: bedrooms');
  });

  it('does not retry on 4xx errors', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ code: 400100, message: 'Bad request' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(estimatePrice(VALID_REQUEST)).rejects.toThrow(ApiClientError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retries on network failure and succeeds', async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(mockOkResponse(MOCK_RESPONSE)());
    vi.stubGlobal('fetch', mockFetch);

    const promise = estimatePrice(VALID_REQUEST);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual(MOCK_RESPONSE);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('throws ApiClientError on timeout', async () => {
    const mockFetch = vi.fn().mockImplementation(
      () => new Promise((_, reject) => {
        const err = new DOMException('The operation was aborted', 'AbortError');
        reject(err);
      }),
    );
    vi.stubGlobal('fetch', mockFetch);

    const promise = estimatePrice(VALID_REQUEST);
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow(ApiClientError);
    await expect(promise).rejects.toThrow('Request timed out');
  });

  it('retries with exponential backoff', async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new TypeError('Fail 1'))
      .mockRejectedValueOnce(new TypeError('Fail 2'))
      .mockResolvedValueOnce(mockOkResponse(MOCK_RESPONSE)());
    vi.stubGlobal('fetch', mockFetch);

    const promise = estimatePrice(VALID_REQUEST);
    await vi.runAllTimersAsync();
    const result = await promise;

    // 3 calls: original + 2 retries
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(result).toEqual(MOCK_RESPONSE);
  });
});

describe('batchEstimate', () => {
  it('calls POST /api/v1/valuation/batch with array of properties', async () => {
    const mockFetch = mockOkResponse({
      predictions: [
        { ...MOCK_RESPONSE, rank: 1 },
        { ...MOCK_RESPONSE, rank: 2 },
      ],
      model_version: 'LinearRegression',
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await batchEstimate([VALID_REQUEST, VALID_REQUEST]);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/valuation/batch'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ properties: [VALID_REQUEST, VALID_REQUEST] }),
      }),
    );
    expect(result.predictions).toHaveLength(2);
    expect(result.model_version).toBe('LinearRegression');
  });
});
