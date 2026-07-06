package com.market.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.market.client.PredictionClient;
import com.market.dto.BaselineResult;
import com.market.exception.MlApiUnavailableException;
import com.market.model.PropertyRecord;
import com.market.repository.PropertyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class BaselineService {

    private static final Logger log = LoggerFactory.getLogger(BaselineService.class);

    static final int ML_API_RETRY_MAX = 3;
    static final long ML_API_RETRY_BASE_MS = 500;

    private final PropertyRepository propertyRepository;
    private final PredictionClient predictionClient;
    private final Cache<String, BaselineResult> baselineCache;

    public BaselineService(PropertyRepository propertyRepository, PredictionClient predictionClient) {
        this.propertyRepository = propertyRepository;
        this.predictionClient = predictionClient;
        this.baselineCache = Caffeine.newBuilder()
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .maximumSize(10)
                .build();
    }

    /**
     * Returns the baseline property (typical property + ML-predicted price).
     * Uses cache — recomputes only on cache miss.
     */
    public Mono<BaselineResult> getBaseline() {
        BaselineResult cached = baselineCache.getIfPresent("baseline");
        if (cached != null) {
            log.debug("Baseline cache hit");
            return Mono.just(cached);
        }
        log.debug("Baseline cache miss — computing");
        return computeBaseline();
    }

    /**
     * Returns only the cached baseline price (for WhatIfService).
     * Assumes getBaseline() has been called at least once to populate the cache.
     */
    public Mono<Double> getBaselinePrice() {
        return getBaseline().map(BaselineResult::getBaselinePrice);
    }

    private Mono<BaselineResult> computeBaseline() {
        return Mono.fromCallable(() -> {
            List<PropertyRecord> records = propertyRepository.findAll();
            if (records.isEmpty()) {
                throw new IllegalStateException("Unable to compute baseline: dataset is empty");
            }

            // Step 1: Compute median feature vector
            Map<String, Double> median = computeMedianFeatures(records);

            // Step 2: Compute range for each feature (for normalization)
            Map<String, Double> minValues = new LinkedHashMap<>();
            Map<String, Double> maxValues = new LinkedHashMap<>();
            computeRanges(records, minValues, maxValues);

            // Step 3: Find nearest neighbor (normalized Euclidean distance)
            PropertyRecord nearest = findNearestNeighbor(records, median, minValues, maxValues);

            // Step 4: Build baseline features map
            Map<String, Object> baselineFeatures = toFeatureMap(nearest);

            // Step 5: Call ML API to get predicted price for the typical property
            Map<String, Object> predictRequest = new LinkedHashMap<>();
            predictRequest.put("features", List.of(baselineFeatures));

            // We need to call ML API synchronously here since we're in a blocking context
            // Retry with backoff handles transient failures (e.g. Docker cold start)
            Map<String, Object> mlResult = callMlApiWithRetry(predictRequest);
            double baselinePrice = extractPrice(mlResult);

            BaselineResult result = new BaselineResult(baselinePrice, baselineFeatures);
            baselineCache.put("baseline", result);
            log.info("Baseline computed: price={}, features={}", baselinePrice, baselineFeatures);
            return result;
        }).subscribeOn(Schedulers.boundedElastic());
    }

    private Map<String, Double> computeMedianFeatures(List<PropertyRecord> records) {
        int n = records.size();
        List<Double> sqft = records.stream().map(PropertyRecord::getSquareFootage).sorted().collect(Collectors.toList());
        List<Integer> beds = records.stream().map(PropertyRecord::getBedrooms).sorted().collect(Collectors.toList());
        List<Double> baths = records.stream().map(PropertyRecord::getBathrooms).sorted().collect(Collectors.toList());
        List<Integer> years = records.stream().map(PropertyRecord::getYearBuilt).sorted().collect(Collectors.toList());
        List<Double> lots = records.stream().map(PropertyRecord::getLotSize).sorted().collect(Collectors.toList());
        List<Double> dists = records.stream().map(PropertyRecord::getDistanceToCityCenter).sorted().collect(Collectors.toList());
        List<Double> schools = records.stream().map(PropertyRecord::getSchoolRating).sorted().collect(Collectors.toList());

        Map<String, Double> median = new LinkedHashMap<>();
        median.put("square_footage", medianOfDoubles(sqft, n));
        median.put("bedrooms", (double) medianOfInts(beds, n));
        median.put("bathrooms", medianOfDoubles(baths, n));
        median.put("year_built", (double) medianOfInts(years, n));
        median.put("lot_size", medianOfDoubles(lots, n));
        median.put("distance_to_city_center", medianOfDoubles(dists, n));
        median.put("school_rating", medianOfDoubles(schools, n));
        return median;
    }

    private double medianOfDoubles(List<Double> sorted, int n) {
        if (n % 2 == 0) {
            return (sorted.get(n / 2 - 1) + sorted.get(n / 2)) / 2.0;
        } else {
            return sorted.get(n / 2);
        }
    }

    private int medianOfInts(List<Integer> sorted, int n) {
        if (n % 2 == 0) {
            return (sorted.get(n / 2 - 1) + sorted.get(n / 2)) / 2;
        } else {
            return sorted.get(n / 2);
        }
    }

    private void computeRanges(List<PropertyRecord> records,
                                Map<String, Double> minValues,
                                Map<String, Double> maxValues) {
        minValues.put("square_footage", records.stream().mapToDouble(PropertyRecord::getSquareFootage).min().orElse(0));
        maxValues.put("square_footage", records.stream().mapToDouble(PropertyRecord::getSquareFootage).max().orElse(0));
        minValues.put("bedrooms", (double) records.stream().mapToInt(PropertyRecord::getBedrooms).min().orElse(0));
        maxValues.put("bedrooms", (double) records.stream().mapToInt(PropertyRecord::getBedrooms).max().orElse(0));
        minValues.put("bathrooms", records.stream().mapToDouble(PropertyRecord::getBathrooms).min().orElse(0));
        maxValues.put("bathrooms", records.stream().mapToDouble(PropertyRecord::getBathrooms).max().orElse(0));
        minValues.put("year_built", (double) records.stream().mapToInt(PropertyRecord::getYearBuilt).min().orElse(0));
        maxValues.put("year_built", (double) records.stream().mapToInt(PropertyRecord::getYearBuilt).max().orElse(0));
        minValues.put("lot_size", records.stream().mapToDouble(PropertyRecord::getLotSize).min().orElse(0));
        maxValues.put("lot_size", records.stream().mapToDouble(PropertyRecord::getLotSize).max().orElse(0));
        minValues.put("distance_to_city_center", records.stream().mapToDouble(PropertyRecord::getDistanceToCityCenter).min().orElse(0));
        maxValues.put("distance_to_city_center", records.stream().mapToDouble(PropertyRecord::getDistanceToCityCenter).max().orElse(0));
        minValues.put("school_rating", records.stream().mapToDouble(PropertyRecord::getSchoolRating).min().orElse(0));
        maxValues.put("school_rating", records.stream().mapToDouble(PropertyRecord::getSchoolRating).max().orElse(0));
    }

    private PropertyRecord findNearestNeighbor(List<PropertyRecord> records,
                                                Map<String, Double> median,
                                                Map<String, Double> minValues,
                                                Map<String, Double> maxValues) {
        PropertyRecord nearest = null;
        double minDistance = Double.MAX_VALUE;

        for (PropertyRecord record : records) {
            double distance = normalizedEuclideanDistance(record, median, minValues, maxValues);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = record;
            }
        }
        return nearest;
    }

    private double normalizedEuclideanDistance(PropertyRecord record,
                                                Map<String, Double> median,
                                                Map<String, Double> minValues,
                                                Map<String, Double> maxValues) {
        double sum = 0.0;
        sum += Math.pow(normalize(record.getSquareFootage(), minValues.get("square_footage"), maxValues.get("square_footage"))
                - normalize(median.get("square_footage"), minValues.get("square_footage"), maxValues.get("square_footage")), 2);
        sum += Math.pow(normalize(record.getBedrooms(), minValues.get("bedrooms"), maxValues.get("bedrooms"))
                - normalize(median.get("bedrooms"), minValues.get("bedrooms"), maxValues.get("bedrooms")), 2);
        sum += Math.pow(normalize(record.getBathrooms(), minValues.get("bathrooms"), maxValues.get("bathrooms"))
                - normalize(median.get("bathrooms"), minValues.get("bathrooms"), maxValues.get("bathrooms")), 2);
        sum += Math.pow(normalize(record.getYearBuilt(), minValues.get("year_built"), maxValues.get("year_built"))
                - normalize(median.get("year_built"), minValues.get("year_built"), maxValues.get("year_built")), 2);
        sum += Math.pow(normalize(record.getLotSize(), minValues.get("lot_size"), maxValues.get("lot_size"))
                - normalize(median.get("lot_size"), minValues.get("lot_size"), maxValues.get("lot_size")), 2);
        sum += Math.pow(normalize(record.getDistanceToCityCenter(), minValues.get("distance_to_city_center"), maxValues.get("distance_to_city_center"))
                - normalize(median.get("distance_to_city_center"), minValues.get("distance_to_city_center"), maxValues.get("distance_to_city_center")), 2);
        sum += Math.pow(normalize(record.getSchoolRating(), minValues.get("school_rating"), maxValues.get("school_rating"))
                - normalize(median.get("school_rating"), minValues.get("school_rating"), maxValues.get("school_rating")), 2);
        return Math.sqrt(sum);
    }

    private double normalize(double value, double min, double max) {
        if (max == min) return 0.5;
        return (value - min) / (max - min);
    }

    private Map<String, Object> toFeatureMap(PropertyRecord record) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("square_footage", record.getSquareFootage());
        map.put("bedrooms", record.getBedrooms());
        map.put("bathrooms", record.getBathrooms());
        map.put("year_built", record.getYearBuilt());
        map.put("lot_size", record.getLotSize());
        map.put("distance_to_city_center", record.getDistanceToCityCenter());
        map.put("school_rating", record.getSchoolRating());
        return map;
    }

    private double extractPrice(Map<String, Object> mlResult) {
        if (mlResult.containsKey("predictions")) {
            @SuppressWarnings("unchecked")
            var predictions = (List<Number>) mlResult.get("predictions");
            if (predictions != null && !predictions.isEmpty()) {
                return predictions.get(0).doubleValue();
            }
        }
        if (mlResult.containsKey("predicted_price")) {
            return ((Number) mlResult.get("predicted_price")).doubleValue();
        }
        log.warn("ML API response format unexpected: {}", mlResult);
        throw new IllegalStateException("Unexpected ML API response format");
    }

    /**
     * Calls ML API with retry and exponential backoff.
     * Handles transient failures on the first request after restart:
     * - ML API worker lazy-loading dependencies on first /predict call
     * - Reactor Netty connection pool warm-up
     * - Brief network glitches
     * Note: Docker cold start is NOT the main cause — the CI health check
     * (docker-run-prediction.ps1) already waits for model_loaded=True.
     */
    private Map<String, Object> callMlApiWithRetry(Map<String, Object> predictRequest) {
        MlApiUnavailableException lastException = null;
        for (int attempt = 0; attempt < ML_API_RETRY_MAX; attempt++) {
            try {
                Map<String, Object> result = predictionClient.predict(predictRequest).block();
                log.info("ML API call succeeded on attempt {}/{}", attempt + 1, ML_API_RETRY_MAX);
                return result;
            } catch (MlApiUnavailableException e) {
                lastException = e;
                if (attempt < ML_API_RETRY_MAX - 1) {
                    long delay = ML_API_RETRY_BASE_MS * (1L << attempt); // 500ms, 1000ms, 2000ms
                    log.warn("ML API call failed on attempt {}/{} (retrying in {}ms): {}",
                            attempt + 1, ML_API_RETRY_MAX, delay, e.getMessage());
                    try {
                        Thread.sleep(delay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new MlApiUnavailableException("Retry interrupted", ie);
                    }
                } else {
                    log.error("ML API call failed after {} attempts", ML_API_RETRY_MAX);
                }
            }
        }
        throw lastException;
    }
}
