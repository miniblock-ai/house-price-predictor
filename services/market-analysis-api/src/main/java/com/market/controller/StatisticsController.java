package com.market.controller;

import com.market.dto.ApiResponse;
import com.market.dto.MarketStatisticsDto;
import com.market.model.FilterParams;
import com.market.service.StatisticsService;
import com.market.validator.FilterParamsValidator;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/api/v1/market")
public class StatisticsController {

    private final StatisticsService statisticsService;
    private final FilterParamsValidator validator;

    public StatisticsController(StatisticsService statisticsService, FilterParamsValidator validator) {
        this.statisticsService = statisticsService;
        this.validator = validator;
    }

    @GetMapping("/statistics")
    public Mono<ResponseEntity<ApiResponse<MarketStatisticsDto>>> getStatistics(
            @RequestParam(value = "segment", required = false) List<String> segments) {

        FilterParams filters = parseSegments(segments);
        return statisticsService.getStatistics(filters)
                .map(stats -> ResponseEntity.ok(ApiResponse.success(stats)));
    }

    private FilterParams parseSegments(List<String> segments) {
        if (segments == null || segments.isEmpty()) {
            return null;
        }
        FilterParams params = new FilterParams();
        for (String segment : segments) {
            validator.validateSegment(segment);
            String[] parts = segment.split(":", 2);
            String key = parts[0].trim().toLowerCase();
            String value = parts[1].trim();

            switch (key) {
                case "price_range" -> {
                    String[] range = value.split("-");
                    params.setMinPrice(Double.parseDouble(range[0].trim()));
                    params.setMaxPrice(Double.parseDouble(range[1].trim()));
                }
                case "school_rating" -> {
                    String[] range = value.split("-");
                    params.setMinSchoolRating(Double.parseDouble(range[0].trim()));
                    params.setMaxSchoolRating(Double.parseDouble(range[1].trim()));
                }
                case "year_built" -> {
                    String[] range = value.split("-");
                    params.setYearBuiltFrom(Integer.parseInt(range[0].trim()));
                    params.setYearBuiltTo(Integer.parseInt(range[1].trim()));
                }
                case "size_range" -> {
                    String[] range = value.split("-");
                    params.setMinSizeSqft(Double.parseDouble(range[0].trim()));
                    params.setMaxSizeSqft(Double.parseDouble(range[1].trim()));
                }
            }
        }
        validator.validateFilters(params);
        return params;
    }
}
