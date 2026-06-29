package com.market.client;

import com.market.exception.MlApiUnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Component
public class PredictionClient {

    private static final Logger log = LoggerFactory.getLogger(PredictionClient.class);

    private final WebClient webClient;

    public PredictionClient(@Qualifier("mlApiWebClient") WebClient webClient) {
        this.webClient = webClient;
    }

    public Mono<Map<String, Object>> predict(Map<String, Object> request) {
        log.info("Calling ML API /predict with features");
        return webClient.post()
                .uri("/predict")
                .bodyValue(request)
                .retrieve()
                .onStatus(status -> status.isError(), clientResponse -> {
                    log.warn("ML API returned status {}", clientResponse.statusCode());
                    return clientResponse.bodyToMono(String.class)
                            .defaultIfEmpty("")
                            .map(body -> new MlApiUnavailableException(
                                    "ML API returned status " + clientResponse.statusCode() + ": " + body));
                })
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .doOnSuccess(result -> log.info("ML API prediction successful"))
                .doOnError(e -> log.error("ML API call failed: {}", e.getMessage()))
                .onErrorMap(e -> !(e instanceof MlApiUnavailableException),
                        e -> new MlApiUnavailableException("Failed to call ML API: " + e.getMessage()));
    }
}
