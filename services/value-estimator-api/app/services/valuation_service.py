from datetime import datetime, timezone
from app.models.schemas import ValuationRequest, BatchRequest, ValuationResponse, BatchResponse
from app.services.ml_client import MLClient


class ValuationService:
    def __init__(self, ml_client: MLClient):
        self.ml_client = ml_client

    async def evaluate_single(self, req: ValuationRequest) -> ValuationResponse:
        features = [req.model_dump()]
        ml_resp = await self.ml_client.predict(features)
        predictions = ml_resp.get("predictions", [])
        model = ml_resp.get("model", "unknown")
        return ValuationResponse(
            predicted_price=predictions[0] if predictions else 0.0,
            currency="USD",
            input_features=req.model_dump(),
            model_version=model,
            timestamp=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        )

    async def evaluate_batch(self, req: BatchRequest) -> BatchResponse:
        features = [p.model_dump() for p in req.properties]
        ml_resp = await self.ml_client.predict(features)
        predictions = ml_resp.get("predictions", [])
        model = ml_resp.get("model", "unknown")

        results = []
        for pred, prop in zip(predictions, req.properties):
            results.append(ValuationResponse(
                predicted_price=pred,
                currency="USD",
                input_features=prop.model_dump(),
                model_version=model,
                timestamp=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            ))

        results.sort(key=lambda r: r.predicted_price, reverse=True)
        for i, r in enumerate(results):
            r.rank = i + 1

        return BatchResponse(predictions=results, model_version=model)
