package com.market.controller;

import com.market.dto.BaselineResult;
import com.market.service.BaselineService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/market")
public class BaselineController {

    private static final Logger log = LoggerFactory.getLogger(BaselineController.class);

    private final BaselineService baselineService;

    public BaselineController(BaselineService baselineService) {
        this.baselineService = baselineService;
    }

    @GetMapping("/baseline-property")
    public ResponseEntity<Map<String, Object>> getBaselineProperty() {
        log.info("GET /baseline-property called");
        BaselineResult baseline = baselineService.getBaseline().block();

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("baseline_price", baseline.getBaselinePrice());
        data.put("baseline_features", baseline.getBaselineFeatures());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("code", 200);
        response.put("message", "success");
        response.put("data", data);

        return ResponseEntity.ok(response);
    }
}
