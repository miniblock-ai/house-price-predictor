from fastapi import APIRouter, Depends
from app.models.schemas import ValuationRequest
from app.services.valuation_service import ValuationService
from app.dependencies import ml_client

router = APIRouter()


def get_valuation_service():
    return ValuationService(ml_client)


@router.post("/valuation")
async def valuation(
    req: ValuationRequest,
    service: ValuationService = Depends(get_valuation_service),
):
    result = await service.evaluate_single(req)
    return {
        "code": 200,
        "message": "success",
        "data": result.model_dump(),
    }
