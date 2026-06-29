package com.market.dto;

public class PropertyListingDto {

    private long id;
    private double squareFootage;
    private int bedrooms;
    private double bathrooms;
    private int yearBuilt;
    private double lotSize;
    private double distanceToCityCenter;
    private double schoolRating;
    private double price;

    public PropertyListingDto() {
    }

    public PropertyListingDto(long id, double sqft, int beds, double baths,
                              int yearBuilt, double lotSize, double distance,
                              double schoolRating, double price) {
        this.id = id;
        this.squareFootage = sqft;
        this.bedrooms = beds;
        this.bathrooms = baths;
        this.yearBuilt = yearBuilt;
        this.lotSize = lotSize;
        this.distanceToCityCenter = distance;
        this.schoolRating = schoolRating;
        this.price = price;
    }

    public long getId() { return id; }
    public void setId(long id) { this.id = id; }

    public double getSquareFootage() { return squareFootage; }
    public void setSquareFootage(double squareFootage) { this.squareFootage = squareFootage; }

    public int getBedrooms() { return bedrooms; }
    public void setBedrooms(int bedrooms) { this.bedrooms = bedrooms; }

    public double getBathrooms() { return bathrooms; }
    public void setBathrooms(double bathrooms) { this.bathrooms = bathrooms; }

    public int getYearBuilt() { return yearBuilt; }
    public void setYearBuilt(int yearBuilt) { this.yearBuilt = yearBuilt; }

    public double getLotSize() { return lotSize; }
    public void setLotSize(double lotSize) { this.lotSize = lotSize; }

    public double getDistanceToCityCenter() { return distanceToCityCenter; }
    public void setDistanceToCityCenter(double distanceToCityCenter) { this.distanceToCityCenter = distanceToCityCenter; }

    public double getSchoolRating() { return schoolRating; }
    public void setSchoolRating(double schoolRating) { this.schoolRating = schoolRating; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
}
