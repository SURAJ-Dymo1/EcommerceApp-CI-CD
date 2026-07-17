import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi.responses import Response

from app.core.config import settings
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.api.v1.endpoints import auth, products, cart, orders

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics setup
REQUEST_COUNT = Counter(
    "http_requests_total", 
    "Total HTTP Requests", 
    ["method", "endpoint", "http_status"]
)
REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds", 
    "HTTP Request Latency", 
    ["method", "endpoint"]
)

@app.middleware("http")
async def prometheus_middleware(request: Request, call_next):
    # Exclude /metrics from latency tracking to avoid self-pollution
    if request.url.path == "/metrics":
        return await call_next(request)

    start_time = time.time()
    response = await call_next(request)
    latency = time.time() - start_time
    
    # Record metrics
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        http_status=response.status_code
    ).inc()
    
    REQUEST_LATENCY.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(latency)
    
    return response

# Startup/shutdown lifecycles
@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

# Metrics endpoint
@app.get("/metrics")
def metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

# Health endpoint
@app.get("/health")
def health():
    return {"status": "healthy", "service": settings.PROJECT_NAME}

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(products.router, prefix=f"{settings.API_V1_STR}/products", tags=["Products"])
app.include_router(cart.router, prefix=f"{settings.API_V1_STR}/cart", tags=["Cart"])
app.include_router(orders.router, prefix=f"{settings.API_V1_STR}/orders", tags=["Orders"])
