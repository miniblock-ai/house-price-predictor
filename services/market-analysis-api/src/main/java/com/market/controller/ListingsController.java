package com.market.controller;

import com.market.dto.ApiResponse;
import com.market.dto.PageDto;
import com.market.dto.PropertyListingDto;
import com.market.model.FilterParams;
import com.market.service.ListingsService;
import com.market.validator.FilterParamsValidator;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/market")
public class ListingsController {

    private final ListingsService listingsService;
    private final FilterParamsValidator validator;

    public ListingsController(ListingsService listingsService, FilterParamsValidator validator) {
        this.listingsService = listingsService;
        this.validator = validator;
    }

    @GetMapping("/listings")
    public Mono<ApiResponse<PageDto<PropertyListingDto>>> getListings(
            @RequestParam(required = false) Double min_price,
            @RequestParam(required = false) Double max_price,
            @RequestParam(required = false) Double min_school_rating,
            @RequestParam(required = false) Double max_school_rating,
            @RequestParam(required = false) Integer year_built_from,
            @RequestParam(required = false) Integer year_built_to,
            @RequestParam(required = false) Double min_size_sqft,
            @RequestParam(required = false) Double max_size_sqft,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "price,asc") String sort) {

        FilterParams params = new FilterParams();
        params.setMinPrice(min_price);
        params.setMaxPrice(max_price);
        params.setMinSchoolRating(min_school_rating);
        params.setMaxSchoolRating(max_school_rating);
        params.setYearBuiltFrom(year_built_from);
        params.setYearBuiltTo(year_built_to);
        params.setMinSizeSqft(min_size_sqft);
        params.setMaxSizeSqft(max_size_sqft);

        validator.validateFilters(params);

        return listingsService.getListings(params, page, size, sort)
                .map(result -> ApiResponse.success(result));
    }
}
