/* ───────────── Response Envelope ───────────── */

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface ApiError {
  code: number;
  message: string;
}

/* ───────────── House Features ───────────── */

export interface HouseFeatures {
  square_footage: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
  lot_size: number;
  distance_to_city_center: number;
  school_rating: number;
}

/* ───────────── Statistics ───────────── */

export interface MarketStatisticsDto {
  total_listings: number;
  average_price: number;
  median_price: number;
  average_price_per_sqft: number;
  price_distribution: Array<{
    bucket: string;
    count: number;
  }>;
}

/* ───────────── Listings ───────────── */

export interface PropertyListingDto {
  id: number;
  square_footage: number;
  bedrooms: number;
  bathrooms: number;
  price: number;
  year_built: number;
  lot_size: number;
  distance_to_city_center: number;
  school_rating: number;
}

export interface PaginatedListingsDto {
  content: PropertyListingDto[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

/* ───────────── What-If ───────────── */

export interface WhatIfRequest {
  features: [HouseFeatures];
}

export interface WhatIfDto {
  predicted_price: number;
  baseline_price: number;
  delta: number;
  delta_percent: number;
  input_features: HouseFeatures;
  baseline_features: HouseFeatures;
  /** Optional — backend may return confidence bounds from the ML model */
  confidence_lower?: number;
  confidence_upper?: number;
}

/* ───────────── Baseline ───────────── */

export interface BaselineDto {
  baseline_price: number;
  baseline_features: HouseFeatures;
}

/* ───────────── Filter Params ───────────── */

export interface ListingsFilterParams {
  min_price?: number;
  max_price?: number;
  min_school_rating?: number;
  max_school_rating?: number;
  year_built_from?: number;
  year_built_to?: number;
  min_size_sqft?: number;
  max_size_sqft?: number;
  page?: number;
  size?: number;
  sort?: string;
}
