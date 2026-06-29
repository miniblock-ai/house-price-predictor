from datetime import datetime
from pydantic import BaseModel, Field


class ValuationRequest(BaseModel):
    square_footage: float = Field(..., ge=500)
    bedrooms: int = Field(..., ge=1)
    bathrooms: float = Field(..., ge=1)
    year_built: int = Field(..., ge=1800, le=2050)
    lot_size: float = Field(..., ge=1000, le=100_000)
    distance_to_city_center: float = Field(..., ge=0, le=50)
    school_rating: int = Field(..., ge=0, le=10)


class BatchRequest(BaseModel):
    properties: list[ValuationRequest] = Field(..., min_length=2, max_length=5)


class ValuationResponse(BaseModel):
    predicted_price: float
    currency: str
    input_features: dict
    model_version: str
    timestamp: str
    rank: int | None = None


class BatchResponse(BaseModel):
    predictions: list[ValuationResponse]
    model_version: str
