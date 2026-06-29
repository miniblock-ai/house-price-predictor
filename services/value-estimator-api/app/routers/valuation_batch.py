from fastapi import APIRouter, Depends
from app.models.schemas import BatchRequest
from app.services.valuation_service import ValuationService
from app.dependencies import ml_client

router = APIRouter()


def get_valuation_service():
    return ValuationService(ml_client)


@router.post("/valuation/batch")
async def valuation_batch(
    req: BatchRequest,
    service: ValuationService = Depends(get_valuation_service),
):
    result = await service.evaluate_batch(req)
    return {
        "code": 200,
        "message": "success",
        "data": {
            "predictions": [p.model_dump() for p in result.predictions],
            "model_version": result.model_version,
        },
    }
