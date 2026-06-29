package com.market.dto;

import java.util.Map;

public class WhatIfResponse {

    private double predictedPrice;
    private double baselinePrice;
    private double delta;
    private double deltaPercent;
    private Map<String, Object> inputFeatures;
    private Map<String, Object> baselineFeatures;

    public double getPredictedPrice() { return predictedPrice; }
    public void setPredictedPrice(double predictedPrice) { this.predictedPrice = predictedPrice; }

    public double getBaselinePrice() { return baselinePrice; }
    public void setBaselinePrice(double baselinePrice) { this.baselinePrice = baselinePrice; }

    public double getDelta() { return delta; }
    public void setDelta(double delta) { this.delta = delta; }

    public double getDeltaPercent() { return deltaPercent; }
    public void setDeltaPercent(double deltaPercent) { this.deltaPercent = deltaPercent; }

    public Map<String, Object> getInputFeatures() { return inputFeatures; }
    public void setInputFeatures(Map<String, Object> inputFeatures) { this.inputFeatures = inputFeatures; }

    public Map<String, Object> getBaselineFeatures() { return baselineFeatures; }
    public void setBaselineFeatures(Map<String, Object> baselineFeatures) { this.baselineFeatures = baselineFeatures; }
}
