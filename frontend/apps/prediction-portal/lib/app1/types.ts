/* ───────────── Response Envelope ───────────── */

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/* ───────────── Valuation Request ───────────── */

export interface ValuationRequest {
  square_footage: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
  lot_size: number;
  distance_to_city_center: number;
  school_rating: number;
}

/* ───────────── Single Valuation ───────────── */

export interface ValuationResponse {
  predicted_price: number;
  currency: string;
  input_features: ValuationRequest;
  model_version: string;
  timestamp: string;
}

/* ───────────── Batch Valuation ───────────── */

export interface BatchRequest {
  properties: ValuationRequest[];
}

export interface RankedValuationData extends ValuationResponse {
  rank: number;
}

export interface BatchResponse {
  predictions: RankedValuationData[];
  model_version: string;
}

/* ───────────── Health ───────────── */

export interface EstimatorHealthData {
  status: 'healthy' | 'degraded';
  ml_api_reachable: boolean;
  model_version: string;
}
