package com.market.service;

import com.market.model.FilterParams;
import com.market.model.PropertyRecord;
import com.market.dto.MarketStatisticsDto;
import com.market.repository.PropertyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StatisticsServiceTest {

    @Mock
    private PropertyRepository propertyRepository;

    private StatisticsService statisticsService;

    @BeforeEach
    void setUp() {
        statisticsService = new StatisticsService(propertyRepository);
    }

    @Test
    void computeAggregates_shouldReturnCorrectValuesForFullDataset() {
        List<PropertyRecord> records = List.of(
                createRecord(1, 2000, 3, 2, 2010, 8000, 5.0, 8.0, 450000),
                createRecord(2, 1500, 2, 1, 2000, 6000, 3.0, 7.0, 300000),
                createRecord(3, 2500, 4, 3, 2020, 10000, 7.0, 9.0, 600000)
        );

        MarketStatisticsDto stats = statisticsService.computeAggregates(records, null);

        assertEquals(3, stats.getTotalListings());
        assertEquals(450000.0, stats.getAveragePrice(), 0.001);
        assertEquals(450000.0, stats.getMedianPrice(), 0.001);
        assertEquals(225.0, stats.getAveragePricePerSqft(), 0.001);
        assertNotNull(stats.getPriceDistribution());
        assertFalse(stats.getPriceDistribution().isEmpty());
    }

    @Test
    void computeAggregates_shouldComputeCorrectMedianForEvenNumberOfRecords() {
        List<PropertyRecord> records = List.of(
                createRecord(1, 2000, 3, 2, 2010, 8000, 5.0, 8.0, 100000),
                createRecord(2, 1500, 2, 1, 2000, 6000, 3.0, 7.0, 200000),
                createRecord(3, 1500, 2, 1, 2000, 6000, 3.0, 7.0, 300000),
                createRecord(4, 2500, 4, 3, 2020, 10000, 7.0, 9.0, 400000)
        );

        MarketStatisticsDto stats = statisticsService.computeAggregates(records, null);

        assertEquals(4, stats.getTotalListings());
        assertEquals(250000.0, stats.getMedianPrice(), 0.001);
    }

    @Test
    void computeAggregates_shouldReturnZerosForEmptyDataset() {
        List<PropertyRecord> records = List.of();

        MarketStatisticsDto stats = statisticsService.computeAggregates(records, null);

        assertEquals(0, stats.getTotalListings());
        assertEquals(0.0, stats.getAveragePrice(), 0.001);
        assertEquals(0.0, stats.getMedianPrice(), 0.001);
        assertEquals(0.0, stats.getAveragePricePerSqft(), 0.001);
        assertTrue(stats.getPriceDistribution().isEmpty());
    }

    @Test
    void computeAggregates_shouldDistributePricesIntoCorrectBuckets() {
        List<PropertyRecord> records = List.of(
                createRecord(1, 2000, 3, 2, 2010, 8000, 5.0, 8.0, 150000),
                createRecord(2, 2000, 3, 2, 2010, 8000, 5.0, 8.0, 250000),
                createRecord(3, 2000, 3, 2, 2010, 8000, 5.0, 8.0, 400000),
                createRecord(4, 2000, 3, 2, 2010, 8000, 5.0, 8.0, 550000)
        );

        MarketStatisticsDto stats = statisticsService.computeAggregates(records, null);

        assertEquals(4, stats.getTotalListings());
        var dist = stats.getPriceDistribution();
        assertEquals(4, dist.size());

        assertEquals(1, dist.get(0).get("count"));  // 0-200k
        assertEquals(1, dist.get(1).get("count"));  // 200k-350k
        assertEquals(1, dist.get(2).get("count"));  // 350k-500k
        assertEquals(1, dist.get(3).get("count"));  // 500k+
    }

    @Test
    void computeAggregates_withFilters_shouldReturnScopedResults() {
        List<PropertyRecord> allRecords = List.of(
                createRecord(1, 2000, 3, 2, 2010, 8000, 5.0, 8.0, 450000),
                createRecord(2, 1500, 2, 1, 2000, 6000, 3.0, 7.0, 300000)
        );
        FilterParams filters = new FilterParams();
        filters.setMinPrice(350000.0);
        when(propertyRepository.findFiltered(filters)).thenReturn(
                List.of(allRecords.get(0))
        );

        MarketStatisticsDto stats = statisticsService.computeAggregates(allRecords, filters);

        assertEquals(1, stats.getTotalListings());
        assertEquals(450000.0, stats.getAveragePrice(), 0.001);
    }

    @Test
    void getStatistics_shouldComputeAndCache() {
        List<PropertyRecord> records = List.of(createRecord(1, 2000, 3, 2, 2010, 8000, 5.0, 8.0, 450000));
        when(propertyRepository.findAll()).thenReturn(records);

        MarketStatisticsDto result = statisticsService.getStatistics(null).block();

        assertNotNull(result);
        assertEquals(1, result.getTotalListings());

        // Second call should hit cache (no more findAll)
        MarketStatisticsDto cached = statisticsService.getStatistics(null).block();
        assertNotNull(cached);
        assertEquals(1, cached.getTotalListings());
        verify(propertyRepository, times(1)).findAll();
    }

    @Test
    void getMedianPrice_emptyRecords_shouldReturnZero() {
        when(propertyRepository.findAll()).thenReturn(List.of());

        Double result = statisticsService.getMedianPrice(null).block();

        assertNotNull(result);
        assertEquals(0.0, result, 0.001);
    }

    @Test
    void computeAggregates_singleRecord_shouldMatchItself() {
        List<PropertyRecord> records = List.of(createRecord(1, 2000, 3, 2, 2010, 8000, 5.0, 8.0, 350000));

        MarketStatisticsDto stats = statisticsService.computeAggregates(records, null);

        assertEquals(1, stats.getTotalListings());
        assertEquals(350000.0, stats.getAveragePrice(), 0.001);
        assertEquals(350000.0, stats.getMedianPrice(), 0.001);
    }

    private PropertyRecord createRecord(long id, double sqft, int beds, double baths,
                                        int year, double lotSize, double distance,
                                        double schoolRating, double price) {
        return new PropertyRecord(id, sqft, beds, baths, year, lotSize, distance, schoolRating, price);
    }
}
