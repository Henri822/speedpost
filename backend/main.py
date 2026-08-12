# Load environment variables first
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import asyncio

from config import IS_DEBUG_ENABLED
from routes import reels_scheduler, home

app = FastAPI(title="SpeedPost API", version="1.0.0")

try:
    from uploaded_assets import configure_uploaded_asset_routes
    configure_uploaded_asset_routes(app)
except Exception:
    pass

uploaded_dir = os.path.join(os.path.dirname(__file__), "uploaded_media")
os.makedirs(uploaded_dir, exist_ok=True)
app.mount("/uploaded_media", StaticFiles(directory=uploaded_dir), name="uploaded_media")

@app.on_event("startup")
async def log_debug_mode() -> None:
    debug_status = "ENABLED" if IS_DEBUG_ENABLED else "DISABLED"
    print(f"SpeedPost Backend rodando com sucesso. Debug mode: {debug_status}.")

@app.on_event("startup")
async def start_reels_worker_task() -> None:
    asyncio.create_task(reels_scheduler.start_reels_background_worker())

# Configure CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core SpeedPost routes (Obrigatorias)
app.include_router(reels_scheduler.router)
app.include_router(home.router)

# Legacy routes opcionalmente carregadas se dependencias existirem
try:
    from routes import generate_code, screenshot, capabilities, evals, export, design_systems, prompt_reports, agent_runs, eval_sets
    app.include_router(generate_code.router)
    app.include_router(screenshot.router)
    app.include_router(capabilities.router)
    app.include_router(evals.router)
    app.include_router(export.router)
    app.include_router(design_systems.router)
    app.include_router(prompt_reports.router)
    app.include_router(agent_runs.router)
    app.include_router(eval_sets.router)
except Exception as e:
    print(f"Modulos legados ignorados com sucesso (dependencias de terceiros nao necessarias): {e}")
