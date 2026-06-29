package com.market.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.market.dto.MarketStatisticsDto;
import com.market.model.FilterParams;
import com.market.model.PropertyRecord;
import com.market.repository.PropertyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class StatisticsService {

    private static final Logger log = LoggerFactory.getLogger(StatisticsService.class);

    private final PropertyRepository propertyRepository;
    private final Cache<String, MarketStatisticsDto> statsCache;

    public StatisticsService(PropertyRepository propertyRepository) {
        this.propertyRepository = propertyRepository;
        this.statsCache = Caffeine.newBuilder()
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .maximumSize(100)
                .recordStats()
                .build();
    }

    public Mono<MarketStatisticsDto> getStatistics(FilterParams filters) {
        String cacheKey = buildCacheKey(filters);
        MarketStatisticsDto cached = statsCache.getIfPresent(cacheKey);
        if (cached != null) {
            log.debug("Cache hit for statistics: {}", cacheKey);
            return Mono.just(cached);
        }
        log.debug("Cache miss for statistics: {}", cacheKey);
        return Mono.fromCallable(() -> {
            List<PropertyRecord> records = propertyRepository.findAll();
            MarketStatisticsDto result = computeAggregates(records, filters);
            statsCache.put(cacheKey, result);
            return result;
        }).subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<Double> getMedianPrice(FilterParams filters) {
        return Mono.fromCallable(() -> {
            List<PropertyRecord> records = (filters == null)
                    ? propertyRepository.findAll()
                    : propertyRepository.findFiltered(filters);
            if (records.isEmpty()) return 0.0;
            List<Double> prices = records.stream()
                    .map(PropertyRecord::getPrice)
                    .sorted()
                    .collect(Collectors.toList());
            int n = prices.size();
            if (n % 2 == 0) {
                return (prices.get(n / 2 - 1) + prices.get(n / 2)) / 2.0;
            } else {
                return prices.get(n / 2);
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }

    public MarketStatisticsDto computeAggregates(List<PropertyRecord> records, FilterParams filters) {
        List<PropertyRecord> filtered = (filters == null)
                ? records
                : propertyRepository.findFiltered(filters);

        MarketStatisticsDto stats = new MarketStatisticsDto();
        stats.setTotalListings(filtered.size());

        if (filtered.isEmpty()) {
            stats.setAveragePrice(0.0);
            stats.setMedianPrice(0.0);
            stats.setAveragePricePerSqft(0.0);
            stats.setPriceDistribution(new ArrayList<>());
            return stats;
        }

        double avgPrice = filtered.stream()
                .mapToDouble(PropertyRecord::getPrice)
                .average()
                .orElse(0.0);
        stats.setAveragePrice(Math.round(avgPrice * 100.0) / 100.0);

        stats.setMedianPrice(Math.round(computeMedian(filtered) * 100.0) / 100.0);

        double totalPrice = filtered.stream().mapToDouble(PropertyRecord::getPrice).sum();
        double totalSqft = filtered.stream().mapToDouble(PropertyRecord::getSquareFootage).sum();
        stats.setAveragePricePerSqft(totalSqft > 0
                ? Math.round((totalPrice / totalSqft) * 100.0) / 100.0
                : 0.0);

        stats.setPriceDistribution(computePriceDistribution(filtered));

        return stats;
    }

    private double computeMedian(List<PropertyRecord> records) {
        if (records.isEmpty()) return 0.0;
        List<Double> prices = records.stream()
                .map(PropertyRecord::getPrice)
                .sorted()
                .collect(Collectors.toList());
        int n = prices.size();
        if (n % 2 == 0) {
            return (prices.get(n / 2 - 1) + prices.get(n / 2)) / 2.0;
        } else {
            return prices.get(n / 2);
        }
    }

    private double getMedianPriceSync(FilterParams filters) {
        List<PropertyRecord> records = (filters == null)
                ? propertyRepository.findAll()
                : propertyRepository.findFiltered(filters);
        if (records.isEmpty()) return 0.0;
        List<Double> prices = records.stream()
                .map(PropertyRecord::getPrice)
                .sorted()
                .collect(Collectors.toList());
        int n = prices.size();
        if (n % 2 == 0) {
            return (prices.get(n / 2 - 1) + prices.get(n / 2)) / 2.0;
        } else {
            return prices.get(n / 2);
        }
    }

    private List<Map<String, Object>> computePriceDistribution(List<PropertyRecord> records) {
        long low = records.stream().filter(r -> r.getPrice() < 200000).count();
        long midLow = records.stream().filter(r -> r.getPrice() >= 200000 && r.getPrice() < 350000).count();
        long midHigh = records.stream().filter(r -> r.getPrice() >= 350000 && r.getPrice() < 500000).count();
        long high = records.stream().filter(r -> r.getPrice() >= 500000).count();

        return List.of(
                Map.of("bucket", "0-200k", "count", (int) low),
                Map.of("bucket", "200k-350k", "count", (int) midLow),
                Map.of("bucket", "350k-500k", "count", (int) midHigh),
                Map.of("bucket", "500k+", "count", (int) high)
        );
    }

    private String buildCacheKey(FilterParams filters) {
        return "statistics:" + (filters == null ? "all" : Integer.toHexString(filters.hashCode()));
    }
}
