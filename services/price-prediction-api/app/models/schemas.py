from pydantic import BaseModel, Field


class HouseFeatures(BaseModel):
    """Single property features for prediction."""

    square_footage: float = Field(..., gt=0, description="Total square footage")
    bedrooms: int = Field(..., ge=1, description="Number of bedrooms")
    bathrooms: float = Field(..., ge=1, description="Number of bathrooms")
    year_built: int = Field(..., ge=1800, le=2030, description="Year built")
    lot_size: float = Field(..., gt=0, description="Lot size in sq ft")
    distance_to_city_center: float = Field(
        ..., ge=0, description="Distance to city center (miles)"
    )
    school_rating: float = Field(
        ..., ge=0, le=10, description="School rating (0-10)"
    )


class PredictRequest(BaseModel):
    """Prediction request — accepts an array of features.

    Single prediction: {"features": [{"square_footage": 1550, ...}]}
    Batch prediction:  {"features": [{...}, {...}]}
    """

    features: list[HouseFeatures]


class PredictResponse(BaseModel):
    """Prediction response."""

    predictions: list[float] = Field(
        ..., description="Predicted house prices"
    )
    model: str = Field(..., description="Model type used for prediction")


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(..., description="Service health status")
    model_loaded: bool = Field(
        ..., description="Whether model is loaded and ready"
    )
    model_type: str | None = Field(
        None, description="Type of the loaded model"
    )


class ModelInfoResponse(BaseModel):
    """Model metadata response."""

    model_type: str = Field(
        ..., description="Type of regression model"
    )
    coefficients: dict[str, float] | list[float] = Field(
        ..., description="Model coefficients per feature"
    )
    intercept: float = Field(..., description="Model intercept")
    metrics: dict[str, float] = Field(
        ..., description="Performance metrics (R², MSE, MAE)"
    )
    features: list[str] = Field(
        ..., description="Feature names in order"
    )
