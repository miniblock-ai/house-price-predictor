package com.market.validator;

import com.market.model.FilterParams;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class FilterParamsValidatorTest {

    private final FilterParamsValidator validator = new FilterParamsValidator();

    // ── validateSegment ──

    @Test
    void nullSegment_shouldThrow() {
        assertThrows(FilterParamsValidator.InvalidFilterException.class,
                () -> validator.validateSegment(null));
    }

    @Test
    void blankSegment_shouldThrow() {
        assertThrows(FilterParamsValidator.InvalidFilterException.class,
                () -> validator.validateSegment("   "));
    }

    @Test
    void segmentWithoutColon_shouldThrow() {
        assertThrows(FilterParamsValidator.InvalidFilterException.class,
                () -> validator.validateSegment("invalidsegment"));
    }

    @Test
    void segmentWithEmptyValue_shouldThrow() {
        assertThrows(FilterParamsValidator.InvalidFilterException.class,
                () -> validator.validateSegment("key:"));
    }

    @Test
    void priceRangeValid_shouldPass() {
        assertDoesNotThrow(() -> validator.validateSegment("price_range:100000-500000"));
    }

    @Test
    void priceRangeInvalidFormat_shouldThrow() {
        assertThrows(FilterParamsValidator.InvalidFilterException.class,
                () -> validator.validateSegment("price_range:100000"));
    }

    @Test
    void priceRangeNonNumeric_shouldThrow() {
        assertThrows(FilterParamsValidator.InvalidFilterException.class,
                () -> validator.validateSegment("price_range:abc-def"));
    }

    @Test
    void unknownKey_shouldThrow() {
        assertThrows(FilterParamsValidator.InvalidFilterException.class,
                () -> validator.validateSegment("unknown_key:value"));
    }

    @Test
    void schoolRatingValid_shouldPass() {
        assertDoesNotThrow(() -> validator.validateSegment("school_rating:1-10"));
    }

    @Test
    void yearBuiltValid_shouldPass() {
        assertDoesNotThrow(() -> validator.validateSegment("year_built:2000-2020"));
    }

    @Test
    void sizeRangeValid_shouldPass() {
        assertDoesNotThrow(() -> validator.validateSegment("size_range:1000-5000"));
    }

    // ── validateFilters ──

    @Test
    void nullParams_shouldReturn() {
        assertDoesNotThrow(() -> validator.validateFilters(null));
    }

    @Test
    void minPriceGreaterThanMax_shouldThrow() {
        FilterParams params = new FilterParams();
        params.setMinPrice(500000.0);
        params.setMaxPrice(100000.0);
        assertThrows(FilterParamsValidator.InvalidFilterException.class,
                () -> validator.validateFilters(params));
    }

    @Test
    void minSchoolRatingGreaterThanMax_shouldThrow() {
        FilterParams params = new FilterParams();
        params.setMinSchoolRating(8.0);
        params.setMaxSchoolRating(3.0);
        assertThrows(FilterParamsValidator.InvalidFilterException.class,
                () -> validator.validateFilters(params));
    }

    @Test
    void yearBuiltFromGreaterThanTo_shouldThrow() {
        FilterParams params = new FilterParams();
        params.setYearBuiltFrom(2020);
        params.setYearBuiltTo(2000);
        assertThrows(FilterParamsValidator.InvalidFilterException.class,
                () -> validator.validateFilters(params));
    }

    @Test
    void minSizeSqftGreaterThanMax_shouldThrow() {
        FilterParams params = new FilterParams();
        params.setMinSizeSqft(5000.0);
        params.setMaxSizeSqft(1000.0);
        assertThrows(FilterParamsValidator.InvalidFilterException.class,
                () -> validator.validateFilters(params));
    }

    @Test
    void validRange_shouldPass() {
        FilterParams params = new FilterParams();
        params.setMinPrice(100000.0);
        params.setMaxPrice(500000.0);
        assertDoesNotThrow(() -> validator.validateFilters(params));
    }
}
