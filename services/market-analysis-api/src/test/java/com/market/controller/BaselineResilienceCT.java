package com.market.controller;

import com.github.tomakehurst.wiremock.junit5.WireMockExtension;
import com.market.model.PropertyRecord;
import com.market.repository.PropertyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.util.List;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.wireMockConfig;
import static org.mockito.Mockito.when;

/**
 * Component Test: Baseline endpoint resilience against transient ML API failures.
 *
 * Uses WebTestClient (reactive) + WireMock for ML API.
 *
 * Scenario 1: ML API always 503 → retry exhausted → 503 + error message
 * Scenario 2: ML API 503 then 200 → retry succeeds → 200 + baseline_price
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class BaselineResilienceCT {

    @RegisterExtension
    static WireMockExtension mlApi = WireMockExtension.newInstance()
            .options(wireMockConfig().dynamicPort())
            .build();

    @Autowired
    private WebTestClient webTestClient;

    @MockitoBean
    private PropertyRepository propertyRepository;

    @DynamicPropertySource
    static void configure(DynamicPropertyRegistry registry) {
        registry.add("market.ml-api.url", () -> "http://localhost:" + mlApi.getPort());
    }

    @BeforeEach
    void setUp() {
        mlApi.resetAll();

        List<PropertyRecord> records = List.of(
                new PropertyRecord(1, 1500, 3, 2.0, 1995, 6000, 3.0, 7.0, 200000.0),
                new PropertyRecord(2, 2000, 3, 2.0, 2000, 7000, 4.0, 7.5, 250000.0),
                new PropertyRecord(3, 2500, 4, 2.5, 2005, 8000, 5.0, 8.0, 300000.0),
                new PropertyRecord(4, 1800, 3, 2.0, 1998, 6500, 3.5, 7.2, 220000.0),
                new PropertyRecord(5, 2200, 4, 2.5, 2002, 7500, 4.5, 7.8, 270000.0)
        );
        when(propertyRepository.findAll()).thenReturn(records);
        when(propertyRepository.isLoaded()).thenReturn(true);
    }

    @Test
    void shouldReturn503_WhenAllRetriesExhausted() {
        // Given: ML API always returns 503 (all 3 retries will be exhausted)
        mlApi.stubFor(post(urlEqualTo("/predict"))
                .willReturn(aResponse()
                        .withStatus(503)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"error\":\"Service Unavailable\"}")));

        // When/Then: all retries exhausted → 503 error with message
        webTestClient.get()
                .uri("/api/v1/market/baseline-property")
                .exchange()
                .expectStatus().is5xxServerError()
                .expectBody()
                .jsonPath("$.code").isNotEmpty()
                .jsonPath("$.message").exists();
    }

    @Test
    void shouldRetryAndSucceedAfterTransient503() {
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

        // When/Then: retry succeeds
        webTestClient.get()
                .uri("/api/v1/market/baseline-property")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.code").isEqualTo(200)
                .jsonPath("$.message").isEqualTo("success")
                .jsonPath("$.data.baseline_price").isNumber()
                .jsonPath("$.data.baseline_features").isMap();
    }
}
