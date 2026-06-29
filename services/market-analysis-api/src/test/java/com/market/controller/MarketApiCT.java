package com.market.controller;

import com.github.tomakehurst.wiremock.client.WireMock;
import com.github.tomakehurst.wiremock.junit5.WireMockExtension;
import com.market.dto.ApiResponse;
import com.market.dto.MarketStatisticsDto;
import com.market.dto.PageDto;
import com.market.dto.PropertyListingDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.util.List;
import java.util.Map;

import org.springframework.test.context.TestPropertySource;
import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.wireMockConfig;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = "spring.jackson.property-naming-strategy=SNAKE_CASE")
class MarketApiCT {

    @RegisterExtension
    static WireMockExtension mlApi = WireMockExtension.newInstance()
            .options(wireMockConfig().dynamicPort())
            .build();

    @Autowired
    private TestRestTemplate restTemplate;

    @DynamicPropertySource
    static void configureMlApi(DynamicPropertyRegistry registry) {
        registry.add("market.ml-api.url", mlApi::baseUrl);
    }

    @Test
    void health_shouldReturnHealthy() {
        var response = restTemplate.getForEntity("/api/v1/health", ApiResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCode()).isEqualTo(200);
    }

    @Test
    void health_shouldIncludeDatasetInfo() {
        var response = restTemplate.getForEntity("/api/v1/health", Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
        assertThat(data.get("status")).isEqualTo("healthy");
        assertThat(data.get("dataset_loaded")).isEqualTo(true);
        assertThat(data.get("dataset_size")).isEqualTo(50);
    }

    @Test
    void statistics_shouldReturnAggregates() {
        var response = restTemplate.getForEntity(
                "/api/v1/market/statistics", ApiResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData()).isNotNull();
    }

    @Test
    void statistics_withSegmentFilter_shouldReturnFilteredResults() {
        var response = restTemplate.getForEntity(
                "/api/v1/market/statistics?segment=price_range:300000-500000", ApiResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void statistics_withInvalidSegment_shouldReturn400() {
        var response = restTemplate.getForEntity(
                "/api/v1/market/statistics?segment=invalid_key:value", Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().get("code")).isEqualTo(400200);
    }

    @Test
    void listings_shouldReturnPagedResults() {
        var response = restTemplate.getForEntity(
                "/api/v1/market/listings?page=0&size=5", ApiResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData()).isNotNull();
    }

    @Test
    void listings_shouldRespectPageSize() {
        var response = restTemplate.getForEntity(
                "/api/v1/market/listings?page=0&size=3", Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
        List<?> content = (List<?>) data.get("content");
        assertThat(content).hasSize(3);
        assertThat(data.get("total_elements")).isEqualTo(50);
    }

    @Test
    void listings_withPriceFilter_shouldReturnFilteredResults() {
        var response = restTemplate.getForEntity(
                "/api/v1/market/listings?min_price=400000&max_price=500000", Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
        List<?> content = (List<?>) data.get("content");
        assertThat(content).isNotEmpty();
        // Verify all returned items have price within range
        content.forEach(item -> {
            Map<String, Object> listing = (Map<String, Object>) item;
            double price = ((Number) listing.get("price")).doubleValue();
            assertThat(price).isBetween(400000.0, 500000.0);
        });
    }

    @Test
    void whatIf_shouldReturnPredictionViaWireMock() {
        mlApi.stubFor(WireMock.post("/predict")
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {"predictions":[380000.0],"model":"LinearRegression"}
                                """)));

        var request = Map.of("features", List.of(Map.of(
                "square_footage", 2500,
                "bedrooms", 4,
                "bathrooms", 2.5,
                "year_built", 2008,
                "lot_size", 9600,
                "distance_to_city_center", 5.0,
                "school_rating", 8.8
        )));
        var response = restTemplate.postForEntity(
                "/api/v1/market/what-if", request, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("predicted_price");
        assertThat(response.getBody()).contains("baseline_price");
        assertThat(response.getBody()).contains("delta_percent");
    }

    @Test
    void export_shouldReturnPdf() {
        // Spec-compliant: all params in request body
        var response = restTemplate.postForEntity(
                "/api/v1/market/export",
                Map.of("format", "pdf"), byte[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotEmpty();
        assertThat(response.getHeaders().getContentType().toString()).contains("pdf");
    }

    @Test
    void export_withFilters_shouldReturnPdf() {
        var response = restTemplate.postForEntity(
                "/api/v1/market/export",
                Map.of("format", "pdf", "min_price", 300000, "max_price", 500000), byte[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotEmpty();
    }

    @Test
    void export_shouldReturn400OnNoData() {
        // Use max_price filter so low that no properties match (snake_case for Jackson)
        var response = restTemplate.postForEntity(
                "/api/v1/market/export",
                Map.of("format", "pdf", "max_price", 1.0), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).contains("400202");
    }

    @Test
    void whatIf_withMissingFeatures_shouldReturn400() {
        var request = Map.of("features", List.of());
        var response = restTemplate.postForEntity(
                "/api/v1/market/what-if", request, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).contains("400201");
    }

    @Test
    void whatIf_withMlApiError_shouldReturn503() {
        mlApi.stubFor(WireMock.post("/predict")
                .willReturn(aResponse().withStatus(500)));

        var request = Map.of("features", List.of(Map.of(
                "square_footage", 2500, "bedrooms", 4, "bathrooms", 2.5,
                "year_built", 2008, "lot_size", 9600,
                "distance_to_city_center", 5.0, "school_rating", 8.8
        )));
        var response = restTemplate.postForEntity(
                "/api/v1/market/what-if", request, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
    }

    @Test
    void statistics_withMultipleSegments_shouldApplyAll() {
        var response = restTemplate.getForEntity(
                "/api/v1/market/statistics?segment=price_range:300000-500000&segment=year_built:2000-2020",
                ApiResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
