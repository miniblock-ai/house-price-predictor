package com.market.dto;

import java.util.Map;

/**
 * Result of the baseline property computation.
 * Contains the ML-predicted price and the 7 feature values of the typical property.
 */
public class BaselineResult {

    private double baselinePrice;
    private Map<String, Object> baselineFeatures;

    public BaselineResult() {
    }

    public BaselineResult(double baselinePrice, Map<String, Object> baselineFeatures) {
        this.baselinePrice = baselinePrice;
        this.baselineFeatures = baselineFeatures;
    }

    public double getBaselinePrice() {
        return baselinePrice;
    }

    public void setBaselinePrice(double baselinePrice) {
        this.baselinePrice = baselinePrice;
    }

    public Map<String, Object> getBaselineFeatures() {
        return baselineFeatures;
    }

    public void setBaselineFeatures(Map<String, Object> baselineFeatures) {
        this.baselineFeatures = baselineFeatures;
    }
}
