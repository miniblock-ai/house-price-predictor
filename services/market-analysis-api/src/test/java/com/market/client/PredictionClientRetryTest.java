package com.market.client;

import com.github.tomakehurst.wiremock.junit5.WireMockExtension;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.test.StepVerifier;

import java.util.Map;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.wireMockConfig;

/**
 * Unit test for PredictionClient.retryWhen behavior.
 *
 * RED phase: no retryWhen → predict() fails on 503 → error propagated
 * GREEN phase: retryWhen added → predict() retries and succeeds
 */
class PredictionClientRetryTest {

    @RegisterExtension
    static WireMockExtension mlApi = WireMockExtension.newInstance()
            .options(wireMockConfig().dynamicPort())
            .build();

    @Test
    void predict_shouldRetryOn503AndSucceed() {
        // Given: ML API returns 503 on first call, 200 on retry
        mlApi.stubFor(post(urlEqualTo("/predict"))
                .inScenario("Cold Start")
                .whenScenarioStateIs("Started")
                .willSetStateTo("Retry")
                .willReturn(aResponse()
                        .withStatus(503)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"error\":\"Service Unavailable\"}")));

        mlApi.stubFor(post(urlEqualTo("/predict"))
                .inScenario("Cold Start")
                .whenScenarioStateIs("Retry")
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"predictions\":[240000.0]}")));

        WebClient webClient = WebClient.builder()
                .baseUrl("http://localhost:" + mlApi.getPort())
                .build();
        PredictionClient client = new PredictionClient(webClient);

        // When/Then: predict should retry and eventually succeed
        StepVerifier.create(client.predict(Map.of("features", "[{}]")))
                .expectNextMatches(result ->
                        result.containsKey("predictions") &&
                        ((Number) ((java.util.List) result.get("predictions")).get(0)).doubleValue() == 240000.0)
                .verifyComplete();
    }
}
