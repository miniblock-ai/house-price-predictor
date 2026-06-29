package com.market.dto;

import java.util.List;
import java.util.Map;

public class WhatIfRequest {

    private List<Map<String, Object>> features;

    public List<Map<String, Object>> getFeatures() { return features; }
    public void setFeatures(List<Map<String, Object>> features) { this.features = features; }
}
