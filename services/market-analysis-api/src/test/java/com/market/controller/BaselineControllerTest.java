package com.market.controller;

import com.market.dto.ApiResponse;
import com.market.dto.BaselineResult;
import com.market.service.BaselineService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BaselineControllerTest {

    @Mock
    private BaselineService baselineService;

    @Test
    void getBaselineProperty_shouldReturnBaselineData() {
        Map<String, Object> features = new LinkedHashMap<>();
        features.put("square_footage", 1650.0);
        features.put("bedrooms", 3);
        features.put("bathrooms", 2.0);
        features.put("year_built", 1997);
        features.put("lot_size", 7000.0);
        features.put("distance_to_city_center", 4.0);
        features.put("school_rating", 7.7);

        BaselineResult result = new BaselineResult(240000.0, features);
        when(baselineService.getBaseline()).thenReturn(Mono.just(result));

        BaselineController controller = new BaselineController(baselineService);
        ApiResponse<BaselineResult> response = controller.getBaselineProperty().block();

        assertEquals(200, response.getCode());
        assertEquals("success", response.getMessage());

        BaselineResult data = response.getData();
        assertEquals(240000.0, data.getBaselinePrice(), 0.001);
        assertEquals(features, data.getBaselineFeatures());
    }

    @Test
    void getBaselineProperty_whenServiceFails_shouldPropagateError() {
        when(baselineService.getBaseline())
                .thenReturn(Mono.error(new IllegalStateException("Unable to compute baseline: dataset is empty")));

        BaselineController controller = new BaselineController(baselineService);

        assertThrows(IllegalStateException.class, () -> controller.getBaselineProperty().block());
    }
}
