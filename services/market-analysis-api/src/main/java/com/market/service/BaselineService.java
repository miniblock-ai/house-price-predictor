package com.market.service;

import com.github.benmanes.caffeine.cache.AsyncCache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.market.client.PredictionClient;
import com.market.dto.BaselineResult;
import com.market.model.PropertyRecord;
import com.market.repository.PropertyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
public class BaselineService {

    private static final Logger log = LoggerFactory.getLogger(BaselineService.class);

    private final PropertyRepository propertyRepository;
    private final PredictionClient predictionClient;
    private final AsyncCache<String, BaselineResult> baselineCache;

    public BaselineService(PropertyRepository propertyRepository, PredictionClient predictionClient) {
        this.propertyRepository = propertyRepository;
        this.predictionClient = predictionClient;
        this.baselineCache = Caffeine.newBuilder()
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .maximumSize(10)
                .buildAsync();
    }

    /**
     * Returns the baseline property (typical property + ML-predicted price).
     * Uses AsyncCache — concurrent requests share the same async computation.
     */
    public Mono<BaselineResult> getBaseline() {
        CompletableFuture<BaselineResult> future = baselineCache.get("baseline",
                (k, exec) -> computeBaseline().toFuture());
        return Mono.fromFuture(future);
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
            return toFeatureMap(nearest);
        }).flatMap(baselineFeatures -> {
            // Step 5: Call ML API reactively (retryWhen handles transient failures in PredictionClient)
            Map<String, Object> predictRequest = new LinkedHashMap<>();
            predictRequest.put("features", List.of(baselineFeatures));

            return predictionClient.predict(predictRequest)
                    .map(mlResult -> {
                        double baselinePrice = extractPrice(mlResult);

                        BaselineResult result = new BaselineResult(baselinePrice, baselineFeatures);
                        log.info("Baseline computed: price={}, features={}", baselinePrice, baselineFeatures);
                        return result;
                    });
        });
    }

    private Map<String, Double> computeMedianFeatures(List<PropertyRecord> records) {
        // Single pass: collect all feature values to avoid 7 stream traversals
        List<Double> sqft = new ArrayList<>(records.size());
        List<Integer> beds = new ArrayList<>(records.size());
        List<Double> baths = new ArrayList<>(records.size());
        List<Integer> years = new ArrayList<>(records.size());
        List<Double> lots = new ArrayList<>(records.size());
        List<Double> dists = new ArrayList<>(records.size());
        List<Double> schools = new ArrayList<>(records.size());

        for (PropertyRecord r : records) {
            sqft.add(r.getSquareFootage());
            beds.add(r.getBedrooms());
            baths.add(r.getBathrooms());
            years.add(r.getYearBuilt());
            lots.add(r.getLotSize());
            dists.add(r.getDistanceToCityCenter());
            schools.add(r.getSchoolRating());
        }

        sqft.sort(null);
        beds.sort(null);
        baths.sort(null);
        years.sort(null);
        lots.sort(null);
        dists.sort(null);
        schools.sort(null);

        Map<String, Double> median = new LinkedHashMap<>();
        median.put("square_footage", medianOfDoubles(sqft));
        median.put("bedrooms", (double) medianOfInts(beds));
        median.put("bathrooms", medianOfDoubles(baths));
        median.put("year_built", (double) medianOfInts(years));
        median.put("lot_size", medianOfDoubles(lots));
        median.put("distance_to_city_center", medianOfDoubles(dists));
        median.put("school_rating", medianOfDoubles(schools));
        return median;
    }

    private double medianOfDoubles(List<Double> sorted) {
        int n = sorted.size();
        if (n % 2 == 0) {
            return (sorted.get(n / 2 - 1) + sorted.get(n / 2)) / 2.0;
        } else {
            return sorted.get(n / 2);
        }
    }

    private int medianOfInts(List<Integer> sorted) {
        int n = sorted.size();
        if (n % 2 == 0) {
            return (sorted.get(n / 2 - 1) + sorted.get(n / 2)) / 2;
        } else {
            return sorted.get(n / 2);
        }
    }

    private void computeRanges(List<PropertyRecord> records,
                                Map<String, Double> minValues,
                                Map<String, Double> maxValues) {
        // Single pass: compute min/max for all features in one traversal
        double minSqft = Double.MAX_VALUE, maxSqft = Double.MIN_VALUE;
        int minBeds = Integer.MAX_VALUE, maxBeds = Integer.MIN_VALUE;
        double minBaths = Double.MAX_VALUE, maxBaths = Double.MIN_VALUE;
        int minYear = Integer.MAX_VALUE, maxYear = Integer.MIN_VALUE;
        double minLot = Double.MAX_VALUE, maxLot = Double.MIN_VALUE;
        double minDist = Double.MAX_VALUE, maxDist = Double.MIN_VALUE;
        double minSchool = Double.MAX_VALUE, maxSchool = Double.MIN_VALUE;

        for (PropertyRecord r : records) {
            if (r.getSquareFootage() < minSqft) minSqft = r.getSquareFootage();
            if (r.getSquareFootage() > maxSqft) maxSqft = r.getSquareFootage();
            if (r.getBedrooms() < minBeds) minBeds = r.getBedrooms();
            if (r.getBedrooms() > maxBeds) maxBeds = r.getBedrooms();
            if (r.getBathrooms() < minBaths) minBaths = r.getBathrooms();
            if (r.getBathrooms() > maxBaths) maxBaths = r.getBathrooms();
            if (r.getYearBuilt() < minYear) minYear = r.getYearBuilt();
            if (r.getYearBuilt() > maxYear) maxYear = r.getYearBuilt();
            if (r.getLotSize() < minLot) minLot = r.getLotSize();
            if (r.getLotSize() > maxLot) maxLot = r.getLotSize();
            if (r.getDistanceToCityCenter() < minDist) minDist = r.getDistanceToCityCenter();
            if (r.getDistanceToCityCenter() > maxDist) maxDist = r.getDistanceToCityCenter();
            if (r.getSchoolRating() < minSchool) minSchool = r.getSchoolRating();
            if (r.getSchoolRating() > maxSchool) maxSchool = r.getSchoolRating();
        }

        minValues.put("square_footage", minSqft);
        maxValues.put("square_footage", maxSqft);
        minValues.put("bedrooms", (double) minBeds);
        maxValues.put("bedrooms", (double) maxBeds);
        minValues.put("bathrooms", minBaths);
        maxValues.put("bathrooms", maxBaths);
        minValues.put("year_built", (double) minYear);
        maxValues.put("year_built", (double) maxYear);
        minValues.put("lot_size", minLot);
        maxValues.put("lot_size", maxLot);
        minValues.put("distance_to_city_center", minDist);
        maxValues.put("distance_to_city_center", maxDist);
        minValues.put("school_rating", minSchool);
        maxValues.put("school_rating", maxSchool);
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
}
