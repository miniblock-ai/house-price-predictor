package com.market.controller;

import com.market.dto.ApiResponse;
import com.market.dto.WhatIfRequest;
import com.market.dto.WhatIfResponse;
import com.market.service.WhatIfService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/market")
public class WhatIfController {

    private final WhatIfService whatIfService;

    public WhatIfController(WhatIfService whatIfService) {
        this.whatIfService = whatIfService;
    }

    @PostMapping("/what-if")
    public Mono<ResponseEntity<ApiResponse<WhatIfResponse>>> analyze(@RequestBody WhatIfRequest request) {
        if (request.getFeatures() == null || request.getFeatures().isEmpty()
                || request.getFeatures().get(0) == null) {
            return Mono.just(ResponseEntity.badRequest()
                    .body(ApiResponse.error(400201, "Missing required field: features")));
        }
        return whatIfService.analyze(request)
                .map(response -> ResponseEntity.ok(ApiResponse.success(response)));
    }
}
