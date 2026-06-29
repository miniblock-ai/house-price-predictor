package com.market.service;

import com.market.client.PredictionClient;
import com.market.dto.BaselineResult;
import com.market.dto.WhatIfRequest;
import com.market.dto.WhatIfResponse;
import com.market.exception.MlApiUnavailableException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import reactor.core.publisher.Mono;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WhatIfServiceTest {

    @Mock
    private PredictionClient predictionClient;

    @Mock
    private BaselineService baselineService;

    private WhatIfService whatIfService;

    private final Map<String, Object> baselineFeatures = new LinkedHashMap<>() {{
        put("square_footage", 1650.0);
        put("bedrooms", 3);
        put("bathrooms", 2.0);
        put("year_built", 1997);
        put("lot_size", 7000.0);
        put("distance_to_city_center", 4.0);
        put("school_rating", 7.7);
    }};

    @BeforeEach
    void setUp() {
        whatIfService = new WhatIfService(predictionClient, baselineService);
    }

    @Test
    void analyze_shouldComputeDeltaFromBaseline() {
        WhatIfRequest request = new WhatIfRequest();
        request.setFeatures(List.of(Map.of(
                "square_footage", 2500.0,
                "bedrooms", 4,
                "bathrooms", 2.5,
                "year_built", 2008,
                "lot_size", 9600.0,
                "distance_to_city_center", 5.0,
                "school_rating", 8.8
        )));

        Map<String, Object> mlResult = Map.of("predictions", List.of(380000.0));
        when(predictionClient.predict(any())).thenReturn(Mono.just(mlResult));
        when(baselineService.getBaselinePrice()).thenReturn(Mono.just(240000.0));
        when(baselineService.getBaseline()).thenReturn(Mono.just(new BaselineResult(240000.0, baselineFeatures)));

        WhatIfResponse response = whatIfService.analyze(request).block();

        assertEquals(380000.0, response.getPredictedPrice(), 0.001);
        assertEquals(240000.0, response.getBaselinePrice(), 0.001);
        assertEquals(140000.0, response.getDelta(), 0.001);
        assertEquals(58.33, response.getDeltaPercent(), 0.01);
        assertNotNull(response.getInputFeatures());
        assertNotNull(response.getBaselineFeatures());
        assertEquals(7, response.getBaselineFeatures().size());
        assertEquals(1650.0, (Double) response.getBaselineFeatures().get("square_footage"), 0.001);
    }

    @Test
    void analyze_withNoChange_shouldReturnZeroDelta() {
        WhatIfRequest request = new WhatIfRequest();
        request.setFeatures(List.of(Map.of(
                "square_footage", 1650.0,
                "bedrooms", 3,
                "bathrooms", 2.0,
                "year_built", 1997,
                "lot_size", 7000.0,
                "distance_to_city_center", 4.0,
                "school_rating", 7.7
        )));

        Map<String, Object> mlResult = Map.of("predictions", List.of(240000.0));
        when(predictionClient.predict(any())).thenReturn(Mono.just(mlResult));
        when(baselineService.getBaselinePrice()).thenReturn(Mono.just(240000.0));
        when(baselineService.getBaseline()).thenReturn(Mono.just(new BaselineResult(240000.0, baselineFeatures)));

        WhatIfResponse response = whatIfService.analyze(request).block();

        assertEquals(240000.0, response.getPredictedPrice(), 0.001);
        assertEquals(0.0, response.getDelta(), 0.001);
        assertEquals(0.0, response.getDeltaPercent(), 0.01);
    }

    @Test
    void analyze_whenMlApiFails_shouldPropagateException() {
        WhatIfRequest request = new WhatIfRequest();
        request.setFeatures(List.of(Map.of(
                "square_footage", 2500.0,
                "bedrooms", 4,
                "bathrooms", 2.5,
                "year_built", 2008,
                "lot_size", 9600.0,
                "distance_to_city_center", 5.0,
                "school_rating", 8.8
        )));

        when(predictionClient.predict(any())).thenReturn(Mono.error(new RuntimeException("Connection refused")));

        assertThrows(RuntimeException.class, () -> whatIfService.analyze(request).block());
    }

    @Test
    void analyze_withEmptyFeatures_shouldThrowIllegalArgument() {
        WhatIfRequest request = new WhatIfRequest();
        request.setFeatures(List.of());

        assertThrows(IllegalArgumentException.class, () -> whatIfService.analyze(request).block());
    }

    @Test
    void fallbackPrediction_shouldReturnMlApiUnavailableError() {
        WhatIfRequest request = new WhatIfRequest();
        request.setFeatures(List.of(Map.of("square_footage", 2000.0, "bedrooms", 3, "bathrooms", 2.0, "year_built", 2000, "lot_size", 5000.0, "distance_to_city_center", 5.0, "school_rating", 7.0)));

        Mono<WhatIfResponse> result = whatIfService.fallbackPrediction(request, new RuntimeException("timeout"));

        assertThrows(MlApiUnavailableException.class, result::block);
    }

    @Test
    void analyze_withSingleFeatureList_shouldHandleSingleMap() {
        WhatIfRequest request = new WhatIfRequest();
        request.setFeatures(List.of(Map.of(
                "square_footage", 1650.0, "bedrooms", 3, "bathrooms", 2.0,
                "year_built", 1997, "lot_size", 7000.0,
                "distance_to_city_center", 4.0, "school_rating", 7.7
        )));

        Map<String, Object> mlResult = Map.of("predictions", List.of(240000.0));
        when(predictionClient.predict(any())).thenReturn(Mono.just(mlResult));
        when(baselineService.getBaselinePrice()).thenReturn(Mono.just(240000.0));
        when(baselineService.getBaseline()).thenReturn(Mono.just(new BaselineResult(240000.0, baselineFeatures)));

        WhatIfResponse response = whatIfService.analyze(request).block();

        assertEquals(0.0, response.getDelta(), 0.001);
        assertEquals(240000.0, response.getPredictedPrice(), 0.001);
    }
}
