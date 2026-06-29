# Pydantic schemas tests
# T2: Implement Pydantic schemas - validation

import pytest
from pydantic import ValidationError
from app.models.schemas import ValuationRequest, BatchRequest


class TestValuationRequest:
    def test_valid_request(self):
        req = ValuationRequest(
            square_footage=2000,
            bedrooms=3,
            bathrooms=2,
            year_built=2010,
            lot_size=5000,
            distance_to_city_center=5.2,
            school_rating=8,
        )
        assert req.square_footage == 2000
        assert req.bedrooms == 3

    def test_bedrooms_minimum(self):
        with pytest.raises(ValidationError):
            ValuationRequest(
                square_footage=2000, bedrooms=0, bathrooms=2, year_built=2010,
                lot_size=5000, distance_to_city_center=5.2, school_rating=8,
            )

    def test_year_built_range(self):
        with pytest.raises(ValidationError):
            ValuationRequest(
                square_footage=2000, bedrooms=3, bathrooms=2, year_built=1799,
                lot_size=5000, distance_to_city_center=5.2, school_rating=8,
            )
        with pytest.raises(ValidationError):
            ValuationRequest(
                square_footage=2000, bedrooms=3, bathrooms=2, year_built=2051,
                lot_size=5000, distance_to_city_center=5.2, school_rating=8,
            )

    def test_square_footage_range(self):
        with pytest.raises(ValidationError):
            ValuationRequest(
                square_footage=400, bedrooms=3, bathrooms=2, year_built=2010,
                lot_size=5000, distance_to_city_center=5.2, school_rating=8,
            )

    def test_lot_size_range(self):
        with pytest.raises(ValidationError):
            ValuationRequest(
                square_footage=2000, bedrooms=3, bathrooms=2, year_built=2010,
                lot_size=999, distance_to_city_center=5.2, school_rating=8,
            )
        with pytest.raises(ValidationError):
            ValuationRequest(
                square_footage=2000, bedrooms=3, bathrooms=2, year_built=2010,
                lot_size=100001, distance_to_city_center=5.2, school_rating=8,
            )

    def test_school_rating_range(self):
        with pytest.raises(ValidationError):
            ValuationRequest(
                square_footage=2000, bedrooms=3, bathrooms=2, year_built=2010,
                lot_size=5000, distance_to_city_center=5.2, school_rating=11,
            )

    def test_distance_range(self):
        with pytest.raises(ValidationError):
            ValuationRequest(
                square_footage=2000, bedrooms=3, bathrooms=2, year_built=2010,
                lot_size=5000, distance_to_city_center=-1, school_rating=8,
            )
        with pytest.raises(ValidationError):
            ValuationRequest(
                square_footage=2000, bedrooms=3, bathrooms=2, year_built=2010,
                lot_size=5000, distance_to_city_center=51, school_rating=8,
            )

    def test_bathrooms_minimum(self):
        with pytest.raises(ValidationError):
            ValuationRequest(
                square_footage=2000, bedrooms=3, bathrooms=0, year_built=2010,
                lot_size=5000, distance_to_city_center=5.2, school_rating=8,
            )

    def test_bathrooms_float_accepted(self):
        req = ValuationRequest(
            square_footage=2000, bedrooms=3, bathrooms=2.5, year_built=2010,
            lot_size=5000, distance_to_city_center=5.2, school_rating=8,
        )
        assert req.bathrooms == 2.5


class TestBatchRequest:
    def test_valid_batch_request(self):
        req = BatchRequest(
            properties=[
                ValuationRequest(square_footage=2000, bedrooms=3, bathrooms=2,
                                 year_built=2010, lot_size=5000,
                                 distance_to_city_center=5.2, school_rating=8),
                ValuationRequest(square_footage=1500, bedrooms=2, bathrooms=1,
                                 year_built=2000, lot_size=3000,
                                 distance_to_city_center=3.0, school_rating=7),
            ]
        )
        assert len(req.properties) == 2

    def test_batch_min_items(self):
        with pytest.raises(ValidationError):
            BatchRequest(
                properties=[
                    ValuationRequest(square_footage=2000, bedrooms=3, bathrooms=2,
                                     year_built=2010, lot_size=5000,
                                     distance_to_city_center=5.2, school_rating=8),
                ]
            )

    def test_batch_max_items(self):
        props = [
            ValuationRequest(square_footage=2000, bedrooms=3, bathrooms=2,
                             year_built=2010, lot_size=5000,
                             distance_to_city_center=5.2, school_rating=8)
            for _ in range(6)
        ]
        with pytest.raises(ValidationError):
            BatchRequest(properties=props)
