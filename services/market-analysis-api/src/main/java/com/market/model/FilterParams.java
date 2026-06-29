package com.market.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class FilterParams {

    private Double minPrice;
    private Double maxPrice;
    private Double minSchoolRating;
    private Double maxSchoolRating;
    private Integer yearBuiltFrom;
    private Integer yearBuiltTo;
    private Double minSizeSqft;
    private Double maxSizeSqft;

    public FilterParams() {
    }

    public Double getMinPrice() { return minPrice; }
    public void setMinPrice(Double minPrice) { this.minPrice = minPrice; }

    public Double getMaxPrice() { return maxPrice; }
    public void setMaxPrice(Double maxPrice) { this.maxPrice = maxPrice; }

    public Double getMinSchoolRating() { return minSchoolRating; }
    public void setMinSchoolRating(Double minSchoolRating) { this.minSchoolRating = minSchoolRating; }

    public Double getMaxSchoolRating() { return maxSchoolRating; }
    public void setMaxSchoolRating(Double maxSchoolRating) { this.maxSchoolRating = maxSchoolRating; }

    public Integer getYearBuiltFrom() { return yearBuiltFrom; }
    public void setYearBuiltFrom(Integer yearBuiltFrom) { this.yearBuiltFrom = yearBuiltFrom; }

    public Integer getYearBuiltTo() { return yearBuiltTo; }
    public void setYearBuiltTo(Integer yearBuiltTo) { this.yearBuiltTo = yearBuiltTo; }

    public Double getMinSizeSqft() { return minSizeSqft; }
    public void setMinSizeSqft(Double minSizeSqft) { this.minSizeSqft = minSizeSqft; }

    public Double getMaxSizeSqft() { return maxSizeSqft; }
    public void setMaxSizeSqft(Double maxSizeSqft) { this.maxSizeSqft = maxSizeSqft; }
}
