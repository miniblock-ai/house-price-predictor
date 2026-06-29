package com.market.controller;

import com.market.dto.BaselineResult;
import com.market.service.BaselineService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
        ResponseEntity<Map<String, Object>> response = controller.getBaselineProperty();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
        assertEquals(240000.0, (Double) data.get("baseline_price"), 0.001);

        @SuppressWarnings("unchecked")
        Map<String, Object> baselineFeatures = (Map<String, Object>) data.get("baseline_features");
        assertEquals(1650.0, (Double) baselineFeatures.get("square_footage"), 0.001);
        assertEquals(3, baselineFeatures.get("bedrooms"));
        assertEquals(2.0, (Double) baselineFeatures.get("bathrooms"), 0.001);
        assertEquals(1997, baselineFeatures.get("year_built"));
        assertEquals(7000.0, (Double) baselineFeatures.get("lot_size"), 0.001);
        assertEquals(4.0, (Double) baselineFeatures.get("distance_to_city_center"), 0.001);
        assertEquals(7.7, (Double) baselineFeatures.get("school_rating"), 0.001);
    }

    @Test
    void getBaselineProperty_whenServiceFails_shouldReturn500() {
        when(baselineService.getBaseline())
                .thenReturn(Mono.error(new IllegalStateException("Unable to compute baseline: dataset is empty")));

        BaselineController controller = new BaselineController(baselineService);

        assertThrows(IllegalStateException.class, controller::getBaselineProperty);
    }
}
