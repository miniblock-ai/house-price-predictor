package com.market.dto;

import java.util.List;
import java.util.Map;

public class MarketStatisticsDto {

    private long totalListings;
    private double averagePrice;
    private double medianPrice;
    private double averagePricePerSqft;
    private List<Map<String, Object>> priceDistribution;

    public long getTotalListings() { return totalListings; }
    public void setTotalListings(long totalListings) { this.totalListings = totalListings; }

    public double getAveragePrice() { return averagePrice; }
    public void setAveragePrice(double averagePrice) { this.averagePrice = averagePrice; }

    public double getMedianPrice() { return medianPrice; }
    public void setMedianPrice(double medianPrice) { this.medianPrice = medianPrice; }

    public double getAveragePricePerSqft() { return averagePricePerSqft; }
    public void setAveragePricePerSqft(double averagePricePerSqft) { this.averagePricePerSqft = averagePricePerSqft; }

    public List<Map<String, Object>> getPriceDistribution() { return priceDistribution; }
    public void setPriceDistribution(List<Map<String, Object>> priceDistribution) { this.priceDistribution = priceDistribution; }
}
