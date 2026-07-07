package com.market.controller;

import com.market.dto.ApiResponse;
import com.market.dto.BaselineResult;
import com.market.service.BaselineService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/market")
public class BaselineController {

    private static final Logger log = LoggerFactory.getLogger(BaselineController.class);

    private final BaselineService baselineService;

    public BaselineController(BaselineService baselineService) {
        this.baselineService = baselineService;
    }

    @GetMapping("/baseline-property")
    public Mono<ApiResponse<BaselineResult>> getBaselineProperty() {
        log.info("GET /baseline-property called");
        return baselineService.getBaseline()
                .map(ApiResponse::success);
    }
}
