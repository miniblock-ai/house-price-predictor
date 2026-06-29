package com.market.service;

import com.market.client.PredictionClient;
import com.market.dto.BaselineResult;
import com.market.dto.WhatIfRequest;
import com.market.dto.WhatIfResponse;
import com.market.exception.MlApiUnavailableException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class WhatIfService {

    private static final Logger log = LoggerFactory.getLogger(WhatIfService.class);

    private final PredictionClient predictionClient;
    private final BaselineService baselineService;

    public WhatIfService(PredictionClient predictionClient, BaselineService baselineService) {
        this.predictionClient = predictionClient;
        this.baselineService = baselineService;
    }

    @CircuitBreaker(name = "mlApi", fallbackMethod = "fallbackPrediction")
    public Mono<WhatIfResponse> analyze(WhatIfRequest request) {
        if (request.getFeatures() == null || request.getFeatures().isEmpty()) {
            return Mono.error(new IllegalArgumentException("features must not be empty"));
        }

        Map<String, Object> inputFeatures = request.getFeatures().get(0);

        Map<String, Object> predictRequest = new LinkedHashMap<>();
        predictRequest.put("features", request.getFeatures());

        return predictionClient.predict(predictRequest)
                .flatMap(mlResult ->
                    baselineService.getBaselinePrice()
                        .flatMap(baselinePrice ->
                            baselineService.getBaseline()
                                .map(baseline -> {
                                    double predictedPrice = extractPrice(mlResult);
                                    double delta = predictedPrice - baselinePrice;
                                    double deltaPercent = baselinePrice > 0 ? (delta / baselinePrice) * 100.0 : 0.0;

                                    WhatIfResponse response = new WhatIfResponse();
                                    response.setPredictedPrice(Math.round(predictedPrice * 100.0) / 100.0);
                                    response.setBaselinePrice(Math.round(baselinePrice * 100.0) / 100.0);
                                    response.setDelta(Math.round(delta * 100.0) / 100.0);
                                    response.setDeltaPercent(Math.round(deltaPercent * 100.0) / 100.0);
                                    response.setInputFeatures(inputFeatures);
                                    response.setBaselineFeatures(baseline.getBaselineFeatures());
                                    return response;
                                })
                        )
                );
    }

    public Mono<WhatIfResponse> fallbackPrediction(WhatIfRequest request, Throwable t) {
        log.warn("What-if fallback triggered: {}", t.getMessage());
        return Mono.error(new MlApiUnavailableException("ML prediction service temporarily unavailable, retry after 30s"));
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
        throw new MlApiUnavailableException("Unexpected ML API response format");
    }
}
