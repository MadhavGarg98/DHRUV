import asyncio
import mimetypes
import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import Response
from starlette.types import Scope
from sqlalchemy.orm import Session

# Explicitly register standard web MIME types so Linux/Docker and Windows never fallback to application/octet-stream
mimetypes.init()
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("application/javascript", ".mjs")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("application/json", ".json")
mimetypes.add_type("application/manifest+json", ".webmanifest")
mimetypes.add_type("font/woff", ".woff")
mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("image/png", ".png")
mimetypes.add_type("image/jpeg", ".jpg")
mimetypes.add_type("image/jpeg", ".jpeg")
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("image/x-icon", ".ico")

from app.db import SessionLocal, get_db, is_station_mode, station_id
from app.routes import auth, cargo, emergency, sync, weather
from app.services.sos_escalation import evaluate_sos_escalations
from app.station_seed import seed_station_node
from app.uplink import uplink_worker


async def escalation_background_worker():
    """15-second background tick for evaluating SOS escalations."""
    while True:
        try:
            await asyncio.sleep(15)
            if SessionLocal is not None:
                with SessionLocal() as db:
                    evaluate_sos_escalations(db)
        except asyncio.CancelledError:
            break
        except Exception:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize station node seed and uplink worker if STATION_MODE
    uplink_task = None
    if is_station_mode and SessionLocal is not None:
        try:
            with SessionLocal() as db:
                seed_station_node(db, target_station_id=int(station_id or 1))
            uplink_task = asyncio.create_task(uplink_worker.run_loop())
        except Exception as err:
            print(f"Error initializing station node: {err}")
    else:
        # Central Cloud Hub mode: ensure tables exist if not already migrated
        try:
            from app.db import Base, engine
            import app.models  # noqa: F401 - registers all ORM models
            Base.metadata.create_all(bind=engine)
        except Exception as err:
            print(f"Warning: Automatic schema verification failed: {err}")

    escalation_task = asyncio.create_task(escalation_background_worker())

    yield

    escalation_task.cancel()
    if uplink_task is not None:
        uplink_task.cancel()


app = FastAPI(title="DHRUV Polar API", lifespan=lifespan)

# Production-safe CORS configuration
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:3000",
    "http://localhost:5001",
    "https://dhruvauto.netlify.app",
]
frontend_url_env = os.environ.get("FRONTEND_URL", "").strip()
if frontend_url_env:
    for origin in frontend_url_env.split(","):
        cleaned_origin = origin.strip().rstrip("/")
        if cleaned_origin and cleaned_origin not in allowed_origins:
            allowed_origins.append(cleaned_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "DHRUV Polar API",
        "mode": "station" if is_station_mode else "central",
        "station_id": int(station_id) if is_station_mode else None,
    }


@app.post("/api/alerts/evaluate")
def trigger_alerts_evaluate(db: Session = Depends(get_db)):
    escalations = evaluate_sos_escalations(db)
    return {"status": "ok", "escalations": escalations}


app.include_router(auth.router)
app.include_router(sync.router)
app.include_router(emergency.router)
app.include_router(cargo.router)
app.include_router(weather.router)

class SPAStaticFiles(StaticFiles):
    """
    Serves static assets from client/dist with correct MIME types and falls back to index.html
    for client-side SPA routes (React Router), while protecting API and documentation routes.
    """
    async def get_response(self, path: str, scope: Scope) -> Response:
        clean_path = path.strip("/")
        if (
            clean_path.startswith("api")
            or clean_path.startswith("docs")
            or clean_path == "openapi.json"
            or clean_path.startswith("redoc")
        ):
            raise StarletteHTTPException(status_code=404, detail="API route not found")
        try:
            response = await super().get_response(path, scope)
            if response.status_code == 404:
                return await super().get_response("index.html", scope)
            return response
        except StarletteHTTPException as exc:
            if exc.status_code == 404:
                return await super().get_response("index.html", scope)
            raise


# Serve built frontend in Station Node mode or production deployment
potential_dist_paths = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "client", "dist")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "static")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "dist")),
]
client_dist = next((p for p in potential_dist_paths if os.path.isdir(p)), None)

if client_dist:
    app.mount("/", SPAStaticFiles(directory=client_dist, html=True), name="spa")
else:
    @app.get("/")
    def read_root():
        return {
            "status": "DHRUV API Online",
            "mode": "station" if is_station_mode else "central",
        }