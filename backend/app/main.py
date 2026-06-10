from __future__ import annotations

import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import cleaning, datasets, exports, reports
from app.core.config import get_settings
from app.core.logging import configure_logging, request_id_var
from app.services.cleaning_service import CleaningService
from app.services.errors import NotFoundError, ValidationError

REQUEST_ID_HEADER = "X-Request-ID"

settings = get_settings()
configure_logging(settings.log_level)


@asynccontextmanager
async def lifespan(_: FastAPI):
    # BackgroundTasks die with the process; without this, jobs interrupted by
    # a restart would stay pending/running forever and clients would poll them
    # indefinitely. Best-effort: a failure here (e.g. migrations not applied
    # yet) must not prevent the API from starting.
    from app.core.logging import get_logger
    from app.db.session import SessionLocal

    session = SessionLocal()
    try:
        CleaningService(session).recover_stale_jobs()
    except Exception:  # noqa: BLE001
        get_logger(__name__).exception("Stale job recovery failed at startup")
    finally:
        session.close()
    yield


app = FastAPI(title="Data Cleaner", version="1.0.0", lifespan=lifespan)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    """Reuse an incoming X-Request-ID or mint one, expose it on logs + response."""
    request_id = request.headers.get(REQUEST_ID_HEADER) or uuid.uuid4().hex
    token = request_id_var.set(request_id)
    try:
        response = await call_next(request)
    finally:
        request_id_var.reset(token)
    response.headers[REQUEST_ID_HEADER] = request_id
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[REQUEST_ID_HEADER],
)


@app.exception_handler(NotFoundError)
async def _not_found(_: Request, exc: NotFoundError) -> JSONResponse:
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(ValidationError)
async def _validation(_: Request, exc: ValidationError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.exception_handler(ValueError)
async def _value_error(_: Request, exc: ValueError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(datasets.router)
app.include_router(cleaning.router)
app.include_router(reports.router)
app.include_router(exports.router)
