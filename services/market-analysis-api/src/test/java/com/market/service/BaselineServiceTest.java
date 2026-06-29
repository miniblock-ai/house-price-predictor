package com.market.service;

import com.market.client.PredictionClient;
import com.market.dto.BaselineResult;
import com.market.model.PropertyRecord;
import com.market.repository.PropertyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BaselineServiceTest {

    @Mock
    private PropertyRepository propertyRepository;

    @Mock
    private PredictionClient predictionClient;

    private BaselineService baselineService;

    @BeforeEach
    void setUp() {
        baselineService = new BaselineService(propertyRepository, predictionClient);
    }

    private List<PropertyRecord> createSampleRecords() {
        return List.of(
                new PropertyRecord(1, 1500, 3, 2.0, 1995, 6000, 3.0, 7.0, 200000.0),
                new PropertyRecord(2, 2000, 3, 2.0, 2000, 7000, 4.0, 7.5, 250000.0),
                new PropertyRecord(3, 2500, 4, 2.5, 2005, 8000, 5.0, 8.0, 300000.0),
                new PropertyRecord(4, 1800, 3, 2.0, 1998, 6500, 3.5, 7.2, 220000.0),
                new PropertyRecord(5, 2200, 4, 2.5, 2002, 7500, 4.5, 7.8, 270000.0)
        );
    }

    @Test
    void getBaseline_shouldComputeAndCacheBaseline() {
        List<PropertyRecord> records = createSampleRecords();
        when(propertyRepository.findAll()).thenReturn(records);

        // ML API returns prediction for the nearest neighbor
        Map<String, Object> mlResult = Map.of("predictions", List.of(240000.0));
        when(predictionClient.predict(any())).thenReturn(Mono.just(mlResult));

        // First call — should compute
        BaselineResult result1 = baselineService.getBaseline().block();

        assertNotNull(result1);
        assertTrue(result1.getBaselinePrice() > 0);
        assertNotNull(result1.getBaselineFeatures());
        assertEquals(7, result1.getBaselineFeatures().size());

        // Verify all 7 feature fields are present
        Map<String, Object> features = result1.getBaselineFeatures();
        assertTrue(features.containsKey("square_footage"));
        assertTrue(features.containsKey("bedrooms"));
        assertTrue(features.containsKey("bathrooms"));
        assertTrue(features.containsKey("year_built"));
        assertTrue(features.containsKey("lot_size"));
        assertTrue(features.containsKey("distance_to_city_center"));
        assertTrue(features.containsKey("school_rating"));

        // Second call — should use cache, not recompute
        BaselineResult result2 = baselineService.getBaseline().block();

        assertNotNull(result2);
        assertEquals(result1.getBaselinePrice(), result2.getBaselinePrice(), 0.001);
        assertEquals(result1.getBaselineFeatures(), result2.getBaselineFeatures());

        // findAll() should only be called once (cached)
        verify(propertyRepository, times(1)).findAll();
        // predict() should only be called once (cached)
        verify(predictionClient, times(1)).predict(any());
    }

    @Test
    void getBaselinePrice_shouldReturnCachedPrice() {
        List<PropertyRecord> records = createSampleRecords();
        when(propertyRepository.findAll()).thenReturn(records);

        Map<String, Object> mlResult = Map.of("predictions", List.of(240000.0));
        when(predictionClient.predict(any())).thenReturn(Mono.just(mlResult));

        // First call getBaseline to populate cache
        baselineService.getBaseline().block();

        // getBaselinePrice should return the cached price
        double price = baselineService.getBaselinePrice().block();
        assertEquals(240000.0, price, 0.001);
    }

    @Test
    void getBaseline_withEmptyDataset_shouldThrowException() {
        when(propertyRepository.findAll()).thenReturn(List.of());

        assertThrows(IllegalStateException.class,
                () -> baselineService.getBaseline().block());
    }

    @Test
    void getBaseline_nearestNeighbor_shouldBeRealRecord() {
        List<PropertyRecord> records = createSampleRecords();
        when(propertyRepository.findAll()).thenReturn(records);

        Map<String, Object> mlResult = Map.of("predictions", List.of(240000.0));
        when(predictionClient.predict(any())).thenReturn(Mono.just(mlResult));

        BaselineResult result = baselineService.getBaseline().block();
        assertNotNull(result);

        // The baseline features should match one of the real records
        Map<String, Object> features = result.getBaselineFeatures();
        boolean matchesRealRecord = records.stream().anyMatch(r ->
                Math.abs(r.getSquareFootage() - (Double) features.get("square_footage")) < 0.01
                        && r.getBedrooms() == (Integer) features.get("bedrooms")
                        && Math.abs(r.getBathrooms() - (Double) features.get("bathrooms")) < 0.01
                        && r.getYearBuilt() == (Integer) features.get("year_built")
                        && Math.abs(r.getLotSize() - (Double) features.get("lot_size")) < 0.01
                        && Math.abs(r.getDistanceToCityCenter() - (Double) features.get("distance_to_city_center")) < 0.01
                        && Math.abs(r.getSchoolRating() - (Double) features.get("school_rating")) < 0.01
        );
        assertTrue(matchesRealRecord, "Baseline features must match a real record from the dataset");
    }

    @Test
    void getBaseline_withSingleRecord_shouldReturnThatRecord() {
        PropertyRecord single = new PropertyRecord(1, 2000, 3, 2.0, 2000, 7000, 4.0, 7.5, 250000.0);
        when(propertyRepository.findAll()).thenReturn(List.of(single));

        Map<String, Object> mlResult = Map.of("predictions", List.of(250000.0));
        when(predictionClient.predict(any())).thenReturn(Mono.just(mlResult));

        BaselineResult result = baselineService.getBaseline().block();
        assertNotNull(result);
        assertEquals(250000.0, result.getBaselinePrice(), 0.001);
        assertEquals(2000.0, (Double) result.getBaselineFeatures().get("square_footage"), 0.001);
    }
}
