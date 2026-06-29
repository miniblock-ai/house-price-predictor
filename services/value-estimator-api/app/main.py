from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.dependencies import ml_client
from app.routers import valuation, valuation_batch


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await ml_client._client.aclose()


app = FastAPI(title="Property Value Estimator API", version="v1.0", lifespan=lifespan)
app.include_router(valuation.router, prefix="/api/v1")
app.include_router(valuation_batch.router, prefix="/api/v1")


@app.get("/api/v1/health")
async def health():
    ml_reachable = await ml_client.health_check()
    return {
        "code": 200,
        "message": "success",
        "data": {
            "status": "healthy" if ml_reachable else "degraded",
            "ml_api_reachable": ml_reachable,
            "model_version": "LinearRegression" if ml_reachable else "unknown",
        },
    }
