import os
import asyncio
import logging
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel, HttpUrl
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("reels_scheduler")

router = APIRouter(prefix="/api/reels", tags=["Reels Scheduler"])

DB_PATH = "reels_scheduler.db"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS scheduled_reels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                ig_user_id TEXT NOT NULL,
                access_token TEXT NOT NULL,
                video_url TEXT NOT NULL,
                caption TEXT DEFAULT '',
                scheduled_at TEXT NOT NULL,
                status TEXT DEFAULT 'PENDING',
                meta_container_id TEXT,
                meta_media_id TEXT,
                error_log TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS connected_accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                provider TEXT DEFAULT 'instagram',
                account_name TEXT NOT NULL,
                ig_user_id TEXT NOT NULL,
                access_token TEXT NOT NULL,
                profile_picture_url TEXT DEFAULT '',
                status TEXT DEFAULT 'ACTIVE',
                created_at TEXT NOT NULL
            )
        """)
        # Remover contas de teste legadas com mock token
        conn.execute("DELETE FROM connected_accounts WHERE access_token LIKE 'mock_token%'")
        
        # Pre-popular conta padrão do usuário se a tabela estiver vazia
        cursor = conn.execute("SELECT COUNT(*) as count FROM connected_accounts")
        if cursor.fetchone()["count"] == 0:
            now_iso = datetime.now(timezone.utc).isoformat()
            conn.execute("""
                INSERT INTO connected_accounts (user_id, provider, account_name, ig_user_id, access_token, profile_picture_url, status, created_at)
                VALUES 
                ('usr_123', 'instagram', '@henriviniciuscasemiro', '28568074059463119', 'IGAGKXTzZCmGd5BZAGFIV3hSX2pYM09OR2hQZAm5WTFQ4bF9fWlg3RDBGYTd6blh6MDc5dGtJX2hIQVA5d2ZA2a2o5OWowemJnaXBGeWxuc01qVmhjcHNYSnN5UWlSV293NDFxMEtkanFRNVA3QzhCV2xYQmFobTVFaUh3T29CS2JWVQZDZD', 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=150', 'ACTIVE', ?)
            """, (now_iso,))

        conn.commit()


init_db()


# --- Pydantic Schemas ---

class ReelItem(BaseModel):
    video_url: str
    caption: Optional[str] = ""


class BulkScheduleRequest(BaseModel):
    user_id: str
    ig_user_id: str
    access_token: str
    videos: List[ReelItem]
    start_date: str  # Format: YYYY-MM-DD
    times_per_day: List[str]  # e.g., ["09:00", "14:00", "18:00", "21:00"]


class ConnectAccountMockRequest(BaseModel):
    user_id: str
    account_name: str  # e.g. "@minha_loja"
    provider: Optional[str] = "instagram"


class ConnectMetaOAuthRequest(BaseModel):
    user_id: str
    short_lived_token: str
    client_id: Optional[str] = None
    client_secret: Optional[str] = None



class SingleScheduleRequest(BaseModel):
    user_id: str
    ig_user_id: str
    access_token: str
    video_url: str
    caption: Optional[str] = ""
    scheduled_at: Optional[str] = None
    publish_now: Optional[bool] = False



# --- Meta Graph API Integration (com suporte a Modo de Teste/Mock) ---

def is_mock_token(token: str) -> bool:
    return not token or token.lower().startswith("mock") or token == "test_token" or token == "EAAG_TEST"


def get_graph_base_url(token: str) -> str:
    if token and token.startswith("IGAG"):
        return "https://graph.instagram.com/v20.0"
    return "https://graph.facebook.com/v20.0"


async def create_reels_container(ig_user_id: str, access_token: str, video_url: str, caption: str) -> str:
    if is_mock_token(access_token):
        logger.info("[MOCK MODE] Simulando criação de container de Reel na Meta API...")
        await asyncio.sleep(1)
        return f"mock_container_{int(datetime.now().timestamp())}"

    base_url = get_graph_base_url(access_token)
    url = f"{base_url}/{ig_user_id}/media"
    payload = {
        "caption": caption,
        "access_token": access_token
    }

    # Se for vídeo/Reels ou se a URL for vídeo .mp4 / .mov
    if video_url.lower().endswith(('.mp4', '.mov', '.webm')) or "video" in video_url.lower():
        payload["media_type"] = "REELS"
        payload["video_url"] = video_url
        payload["share_to_feed"] = "true"
    else:
        payload["image_url"] = video_url

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, data=payload)
        res_data = response.json()
        
        if response.status_code != 200 or "id" not in res_data:
            error_msg = str(res_data.get("error", {}).get("message", response.text))
            raise Exception(f"Erro ao criar container do Reel/Post na Meta: {error_msg}")
        
        return res_data["id"]


async def wait_for_container_ready(container_id: str, access_token: str, max_retries: int = 20, delay_seconds: int = 10) -> bool:
    if container_id.startswith("mock__") or container_id.startswith("mock_container") or is_mock_token(access_token):
        logger.info("[MOCK MODE] Simulando renderização do vídeo pela Meta (3 segundos)...")
        await asyncio.sleep(3)
        return True

    base_url = get_graph_base_url(access_token)
    url = f"{base_url}/{container_id}"
    params = {
        "fields": "status_code,status",
        "access_token": access_token
    }
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        for attempt in range(max_retries):
            response = await client.get(url, params=params)
            res_data = response.json()
            
            status_code = str(res_data.get("status_code", "")).upper()
            logger.info(f"Polling container {container_id} [Tentativa {attempt+1}/{max_retries}]: {status_code}")
            
            if status_code == "FINISHED" or not status_code: # Imagens podem não ter status_code longo
                return True
            elif status_code in ["ERROR", "EXPIRED"]:
                raise Exception(f"Processamento do vídeo falhou na Meta. Status: {status_code}")
            
            await asyncio.sleep(delay_seconds)
            
    return True


async def publish_reels_container(ig_user_id: str, access_token: str, container_id: str) -> str:
    if container_id.startswith("mock_container") or is_mock_token(access_token):
        logger.info("[MOCK MODE] Simulando publicação final do Reel no perfil do Instagram...")
        await asyncio.sleep(1)
        return f"mock_media_1789{int(datetime.now().timestamp())}"

    base_url = get_graph_base_url(access_token)
    url = f"{base_url}/{ig_user_id}/media_publish"
    payload = {
        "creation_id": container_id,
        "access_token": access_token
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, data=payload)
        res_data = response.json()
        
        if response.status_code != 200 or "id" not in res_data:
            error_msg = str(res_data.get("error", {}).get("message", response.text))
            raise Exception(f"Erro ao publicar Reel na Meta: {error_msg}")
        
        return res_data["id"]




async def process_and_publish_reel(reel_id: int):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM scheduled_reels WHERE id = ?", (reel_id,)).fetchone()
        if not row or row["status"] not in ["PENDING", "FAILED"]:
            return

        conn.execute("UPDATE scheduled_reels SET status = 'PROCESSING', updated_at = ? WHERE id = ?", 
                     (datetime.now(timezone.utc).isoformat(), reel_id))
        conn.commit()

    try:
        logger.info(f"Iniciando publicação do Reel ID #{reel_id}...")
        
        # Step 1: Criar Container
        container_id = await create_reels_container(
            ig_user_id=row["ig_user_id"],
            access_token=row["access_token"],
            video_url=row["video_url"],
            caption=row["caption"]
        )
        
        with get_db() as conn:
            conn.execute("UPDATE scheduled_reels SET meta_container_id = ? WHERE id = ?", (container_id, reel_id))
            conn.commit()

        # Step 2: Aguardar o vídeo ser processado pelos servidores do Instagram
        await wait_for_container_ready(container_id, row["access_token"])

        # Step 3: Publicar
        media_id = await publish_reels_container(
            ig_user_id=row["ig_user_id"],
            access_token=row["access_token"],
            container_id=container_id
        )

        with get_db() as conn:
            conn.execute("""
                UPDATE scheduled_reels 
                SET status = 'PUBLISHED', meta_media_id = ?, updated_at = ? 
                WHERE id = ?
            """, (media_id, datetime.now(timezone.utc).isoformat(), reel_id))
            conn.commit()

        logger.info(f"Reel #{reel_id} publicado com sucesso! Media ID: {media_id}")

    except Exception as e:
        err_msg = str(e)
        logger.error(f"Falha ao publicar Reel #{reel_id}: {err_msg}")
        with get_db() as conn:
            conn.execute("""
                UPDATE scheduled_reels 
                SET status = 'FAILED', error_log = ?, updated_at = ? 
                WHERE id = ?
            """, (err_msg, datetime.now(timezone.utc).isoformat(), reel_id))
            conn.commit()


# --- Background Scheduler Loop ---

async def start_reels_background_worker():
    logger.info("Módulo de Agendamento Automático de Reels Ativado (Worker iniciado)")
    while True:
        try:
            now_iso = datetime.now(timezone.utc).isoformat()
            with get_db() as conn:
                rows = conn.execute("""
                    SELECT id FROM scheduled_reels 
                    WHERE status = 'PENDING' AND scheduled_at <= ?
                    ORDER BY scheduled_at ASC
                """, (now_iso,)).fetchall()

            for r in rows:
                asyncio.create_task(process_and_publish_reel(r["id"]))

        except Exception as e:
            logger.error(f"Erro no loop do worker de agendamento: {e}")

        await asyncio.sleep(30)


from typing import List, Optional, Dict, Any

# --- API Routes ---

@router.post("/schedule-bulk")
async def schedule_bulk_reels(payload: BulkScheduleRequest):
    """
    Agenda múltiplos vídeos de Reels distribuídos ao longo dos dias e horários especificados.
    Exemplo: 20 vídeos postando 4 vezes por dia (09:00, 14:00, 18:00, 21:00) distribuirá em 5 dias automaticamente.
    """
    if not payload.videos:
        raise HTTPException(status_code=400, detail="Lista de vídeos vazia.")
    if not payload.times_per_day:
        raise HTTPException(status_code=400, detail="Especifique ao menos um horário por dia.")

    try:
        base_date = datetime.strptime(payload.start_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de data inválido. Use YYYY-MM-DD.")

    scheduled_items: List[Dict[str, Any]] = []
    now_str = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        for idx, video in enumerate(payload.videos):
            day_offset = idx // len(payload.times_per_day)
            time_idx = idx % len(payload.times_per_day)

            time_str = payload.times_per_day[time_idx]
            hour, minute = map(int, time_str.split(":"))

            target_dt = base_date + timedelta(days=day_offset)
            target_dt = target_dt.replace(hour=hour, minute=minute, second=0)
            scheduled_at_iso = target_dt.isoformat()

            cursor = conn.execute("""
                INSERT INTO scheduled_reels 
                (user_id, ig_user_id, access_token, video_url, caption, scheduled_at, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
            """, (
                payload.user_id,
                payload.ig_user_id,
                payload.access_token,
                video.video_url,
                video.caption or "",
                scheduled_at_iso,
                now_str,
                now_str
            ))
            scheduled_items.append({
                "id": cursor.lastrowid,
                "video_url": video.video_url,
                "scheduled_at": scheduled_at_iso
            })
        conn.commit()

    res: Dict[str, Any] = {
        "status": "success",
        "message": f"{len(scheduled_items)} Reels agendados com sucesso!",
        "scheduled_reels": scheduled_items
    }
    return res


@router.get("/scheduled")
async def get_scheduled_reels(user_id: str, status: Optional[str] = None):
    with get_db() as conn:
        query = "SELECT * FROM scheduled_reels WHERE user_id = ?"
        params: List[str] = [user_id]
        if status:
            query += " AND status = ?"
            params.append(status)
        query += " ORDER BY scheduled_at ASC"
        
        rows = conn.execute(query, params).fetchall()
        result: List[Dict[str, Any]] = [dict(r) for r in rows]
        return result




@router.post("/publish-now/{reel_id}")
async def publish_now(reel_id: int, background_tasks: BackgroundTasks):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM scheduled_reels WHERE id = ?", (reel_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Reel não encontrado.")

    background_tasks.add_task(process_and_publish_reel, reel_id)
    return {"status": "success", "message": f"Publicação imediata iniciada para o Reel #{reel_id}."}


@router.delete("/{reel_id}")
async def cancel_scheduled_reel(reel_id: int):
    with get_db() as conn:
        conn.execute("UPDATE scheduled_reels SET status = 'CANCELLED', updated_at = ? WHERE id = ?", 
                     (datetime.now(timezone.utc).isoformat(), reel_id))
        conn.commit()
    return {"status": "success", "message": f"Reel #{reel_id} cancelado."}


class ConnectAccountRealRequest(BaseModel):
    user_id: str
    account_name: str  # e.g. "@henriviniciuscasemiro"
    ig_user_id: str
    access_token: str
    provider: Optional[str] = "instagram"
    profile_picture_url: Optional[str] = ""


@router.get("/accounts")
async def get_connected_accounts(user_id: str):
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM connected_accounts WHERE user_id = ? ORDER BY id DESC", (user_id,)).fetchall()
        return [dict(r) for r in rows]


@router.post("/connect-account")
async def connect_account(payload: ConnectAccountRealRequest):
    now_str = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        existing = conn.execute("SELECT id FROM connected_accounts WHERE user_id = ? AND ig_user_id = ?", 
                                (payload.user_id, payload.ig_user_id)).fetchone()
        if existing:
            conn.execute("""
                UPDATE connected_accounts 
                SET account_name = ?, access_token = ?, profile_picture_url = ?, status = 'ACTIVE' 
                WHERE id = ?
            """, (payload.account_name, payload.access_token, payload.profile_picture_url or "", existing["id"]))
            account_id: int = existing["id"]
        else:
            cursor = conn.execute("""
                INSERT INTO connected_accounts (user_id, provider, account_name, ig_user_id, access_token, profile_picture_url, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
            """, (payload.user_id, payload.provider or 'instagram', payload.account_name, payload.ig_user_id, payload.access_token, payload.profile_picture_url or "", now_str))
            account_id: int = cursor.lastrowid or 0
        conn.commit()
    return {"status": "success", "account_id": account_id, "message": "Conta conectada com sucesso!"}


@router.delete("/accounts/{account_id}")
async def delete_connected_account(account_id: int):
    with get_db() as conn:
        conn.execute("DELETE FROM connected_accounts WHERE id = ?", (account_id,))
        conn.commit()
    return {"status": "success", "message": "Conta removida com sucesso!"}



@router.post("/schedule-single")
async def schedule_single_reel(payload: SingleScheduleRequest, background_tasks: BackgroundTasks):
    now_dt = datetime.now(timezone.utc)
    now_str = now_dt.isoformat()
    sched_time = payload.scheduled_at if payload.scheduled_at and not payload.publish_now else now_str

    with get_db() as conn:
        cursor = conn.execute("""
            INSERT INTO scheduled_reels 
            (user_id, ig_user_id, access_token, video_url, caption, scheduled_at, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
        """, (
            payload.user_id,
            payload.ig_user_id,
            payload.access_token,
            payload.video_url,
            payload.caption or "",
            sched_time,
            now_str,
            now_str
        ))
        reel_id = cursor.lastrowid
        conn.commit()
        
    if reel_id is None:
        raise HTTPException(status_code=500, detail="Falha ao criar Reel no banco de dados.")

    if payload.publish_now or not payload.scheduled_at:
        logger.info(f"[INSTANT PUBLISH] Disparando Reel #{reel_id} imediatamente para o Instagram!")
        background_tasks.add_task(process_and_publish_reel, reel_id)
    else:
        try:
            sched_dt = datetime.fromisoformat(payload.scheduled_at.replace("Z", "+00:00"))
            if sched_dt <= now_dt:
                background_tasks.add_task(process_and_publish_reel, reel_id)
        except Exception:
            background_tasks.add_task(process_and_publish_reel, reel_id)

    return {"status": "success", "reel_id": reel_id, "message": "Publicação disparada com sucesso!"}



# --- OAuth 2.0 & Webhook Integration Endpoints ---

META_APP_ID = "27750914347899358"  # ID do App do Instagram retornado na tela do Meta
META_VERIFY_TOKEN = "speedpost_secret_webhook_verify_token_2026"


@router.get("/webhook")
async def verify_webhook(hub_mode: Optional[str] = Query(None, alias="hub.mode"),
                         hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
                         hub_challenge: Optional[str] = Query(None, alias="hub.challenge")):
    """
    Endpoint de verificação de Webhook exigido pelo Meta (Passo 2 da tela de configuração).
    """
    if hub_mode == "subscribe" and hub_verify_token == META_VERIFY_TOKEN:
        logger.info("[WEBHOOK] Webhook do Meta verificado com sucesso!")
        return int(hub_challenge) if hub_challenge and hub_challenge.isdigit() else hub_challenge
    raise HTTPException(status_code=403, detail="Token de verificação de webhook inválido.")


@router.post("/webhook")
async def receive_webhook_event(payload: Dict[str, Any]):
    """
    Recebe atualizações de status de mídia e notificações em tempo real do Meta.
    """
    logger.info(f"[WEBHOOK EVENT] Recebido do Meta: {payload}")
    return {"status": "success"}


@router.get("/oauth/url")
async def get_oauth_url(redirect_uri: str = "http://localhost:7001/api/reels/oauth/callback"):
    """
    Gera a URL de Login da Empresa no Instagram (Passo 3 da tela de configuração).
    """
    scope = "instagram_basic,instagram_content_publish"
    url = f"https://api.instagram.com/oauth/authorize?client_id={META_APP_ID}&redirect_uri={redirect_uri}&scope={scope}&response_type=code"
    return {"oauth_url": url}


import shutil
from fastapi import File, UploadFile

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploaded_media")
os.makedirs(UPLOAD_DIR, exist_ok=True)


async def upload_to_public_cdn(file_path: str, filename: str) -> str:
    """
    SaaS Cloud Storage CDN Uploader.
    Sobe o arquivo local para a CDN pública de alta velocidade,
    retornando a URL HTTPS pública para a Meta Graph API baixar o vídeo.
    """
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            with open(file_path, "rb") as f:
                res = await client.post("https://tmpfiles.org/api/v1/upload", files={"file": (filename, f)})
            if res.status_code == 200:
                data = res.json()
                raw_url = str(data.get("data", {}).get("url", ""))
                if raw_url:
                    cdn_url = raw_url.replace("tmpfiles.org/", "tmpfiles.org/dl/")
                    logger.info(f"[CDN UPLOAD] Arquivo enviado para CDN pública: {cdn_url}")
                    return cdn_url
    except Exception as e:
        logger.warning(f"[CDN UPLOAD ERROR] Fallback ativado: {e}")
    return f"http://localhost:7001/uploaded_media/{os.path.basename(file_path)}"


from PIL import Image


@router.post("/upload")
async def upload_media_file(file: UploadFile = File(...)):
    """
    Salva arquivos de vídeo e imagem enviados da interface e gera URL HTTPS CDN para a Meta API.
    Converte automaticamente imagens .jfif, .webp, etc. para JPEG (.jpg) compatível com o Instagram.
    """
    clean_filename = f"{int(datetime.now().timestamp())}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, clean_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Se for uma imagem não-padrão (ex: .jfif, .webp, .bmp), converte para .jpg nativo da Meta API
    ext = os.path.splitext(clean_filename)[1].lower()
    if ext in [".jfif", ".webp", ".bmp", ".tiff", ".gif"]:
        try:
            with Image.open(file_path) as img:
                rgb_img = img.convert("RGB")
                jpg_filename = os.path.splitext(clean_filename)[0] + ".jpg"
                jpg_path = os.path.join(UPLOAD_DIR, jpg_filename)
                rgb_img.save(jpg_path, "JPEG", quality=95)
                file_path = jpg_path
                clean_filename = jpg_filename
                logger.info(f"[IMAGE CONVERT] Convertido de {ext} para .jpg: {clean_filename}")
        except Exception as e:
            logger.warning(f"[IMAGE CONVERT ERROR] {e}")
        
    cdn_public_url = await upload_to_public_cdn(file_path, clean_filename)
    logger.info(f"[UPLOAD] Mídia salva com sucesso. CDN HTTPS URL: {cdn_public_url}")
    
    return {
        "status": "success",
        "filename": file.filename,
        "url": cdn_public_url
    }





