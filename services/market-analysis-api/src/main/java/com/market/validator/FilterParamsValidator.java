package com.market.validator;

import com.market.model.FilterParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class FilterParamsValidator {

    private static final Logger log = LoggerFactory.getLogger(FilterParamsValidator.class);

    public void validateSegment(String segment) {
        if (segment == null || segment.isBlank()) {
            throw new InvalidFilterException("Filter segment must not be empty");
        }

        String[] parts = segment.split(":", 2);
        if (parts.length < 2 || parts[1].isBlank()) {
            throw new InvalidFilterException("Filter format must be key:value — got: " + segment);
        }

        String key = parts[0].trim().toLowerCase();
        String value = parts[1].trim();

        switch (key) {
            case "price_range", "school_rating", "year_built", "size_range" -> {
                String[] rangeParts = value.split("-");
                if (rangeParts.length != 2) {
                    throw new InvalidFilterException("Range filter must be in format min-max for key: " + key);
                }
                try {
                    Double.parseDouble(rangeParts[0].trim());
                    Double.parseDouble(rangeParts[1].trim());
                } catch (NumberFormatException e) {
                    throw new InvalidFilterException("Range values must be numeric for key: " + key);
                }
            }
            default ->
                    throw new InvalidFilterException("Unknown filter key: " + key
                            + ". Valid keys: price_range, school_rating, year_built, size_range");
        }
    }

    public void validateFilters(FilterParams params) {
        if (params == null) {
            return;
        }
        if (params.getMinPrice() != null && params.getMaxPrice() != null
                && params.getMinPrice() > params.getMaxPrice()) {
            throw new InvalidFilterException("min_price must be less than or equal to max_price");
        }
        if (params.getMinSchoolRating() != null && params.getMaxSchoolRating() != null
                && params.getMinSchoolRating() > params.getMaxSchoolRating()) {
            throw new InvalidFilterException("min_school_rating must be less than or equal to max_school_rating");
        }
        if (params.getYearBuiltFrom() != null && params.getYearBuiltTo() != null
                && params.getYearBuiltFrom() > params.getYearBuiltTo()) {
            throw new InvalidFilterException("year_built_from must be less than or equal to year_built_to");
        }
        if (params.getMinSizeSqft() != null && params.getMaxSizeSqft() != null
                && params.getMinSizeSqft() > params.getMaxSizeSqft()) {
            throw new InvalidFilterException("min_size_sqft must be less than or equal to max_size_sqft");
        }
    }

    public static class InvalidFilterException extends RuntimeException {
        public InvalidFilterException(String message) {
            super(message);
        }
    }
}
