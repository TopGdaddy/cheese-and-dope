from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import re
import logging
import bcrypt
import jwt
import asyncio
import random
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import socketio as socketio_lib

# Global variables - initialized at runtime in startup()
client = None
db = None

# Configure CORS with explicit allowed origins
allowed_origins = [
    "http://localhost:3000",
    "https://urbanlogix.netlify.app",
    "https://cheese-and-dope-bhumikaachaudhary002-8056s-projects.vercel.app"
]

# Add FRONTEND_URL from environment if set
frontend_url = os.environ.get("FRONTEND_URL")
if frontend_url and frontend_url not in allowed_origins:
    allowed_origins.append(frontend_url)

# Socket.IO server for real-time truck tracking
sio = socketio_lib.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=allowed_origins,
    logger=False,
    engineio_logger=False
)

fastapi_app = FastAPI()
api_router = APIRouter(prefix="/api")
JWT_ALGORITHM = "HS256"

# Apply CORS middleware before any routes
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ========== AUTH HELPERS ==========

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def get_jwt_secret():
    return os.environ.get("JWT_SECRET", "changeme-set-JWT_SECRET-env-var")

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=24), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        if "organization_id" in user:
            user["organization_id"] = str(user["organization_id"])
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# ========== MODELS ==========

class RegisterInput(BaseModel):
    name: str
    email: str
    password: str
    role: str = "regular"
    organization_name: Optional[str] = None

class LoginInput(BaseModel):
    email: str
    password: str

class LocationUpdate(BaseModel):
    lat: float
    lng: float
    speed: float = 0
    heading: float = 0
    accuracy: float = 0

class ReportCreate(BaseModel):
    lat: float
    lng: float
    category: str
    report_type: str
    severity: str
    description: str
    time_advisory: Optional[str] = None

class SlotCreate(BaseModel):
    route_name: str
    start_time: str
    end_time: str
    date: str
    max_capacity: int = 15

class SlotBookInput(BaseModel):
    slot_id: str

class VoteInput(BaseModel):
    vote_type: str

class ReportStatusUpdate(BaseModel):
    status: str

# ========== HEALTH ENDPOINT ==========

@api_router.get("/health")
async def health_check():
    """Health check endpoint for Railway"""
    return {"status": "ok"}

# ========== AUTH ENDPOINTS ==========

@api_router.post("/auth/register")
async def register(input_data: RegisterInput):
    email = input_data.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    if input_data.role not in ["regular", "driver", "organization"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    user_doc = {
        "name": input_data.name, "email": email,
        "password_hash": hash_password(input_data.password),
        "role": input_data.role, "created_at": datetime.now(timezone.utc).isoformat()
    }

    if input_data.role == "organization" and input_data.organization_name:
        org_result = await db.organizations.insert_one({
            "name": input_data.organization_name, "contact_email": email,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        user_doc["organization_id"] = str(org_result.inserted_id)

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)

    resp_data = {"id": user_id, "name": input_data.name, "email": email, "role": input_data.role}
    if "organization_id" in user_doc:
        resp_data["organization_id"] = user_doc["organization_id"]

    response = JSONResponse(content=resp_data)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return response

@api_router.post("/auth/login")
async def login(input_data: LoginInput):
    email = input_data.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)

    resp_data = {"id": user_id, "name": user["name"], "email": user["email"], "role": user["role"]}
    if "organization_id" in user:
        resp_data["organization_id"] = str(user["organization_id"])

    response = JSONResponse(content=resp_data)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return response

@api_router.post("/auth/logout")
async def logout():
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("access_token", path="/", secure=True, samesite="none")
    response.delete_cookie("refresh_token", path="/", secure=True, samesite="none")
    return response

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return {"id": user["_id"], "name": user["name"], "email": user["email"], "role": user["role"],
            "organization_id": user.get("organization_id")}

# ========== TRUCK / LOCATION ENDPOINTS ==========

@api_router.get("/trucks/live-positions")
async def get_live_positions():
    positions = await db.live_positions.find({}, {"_id": 0}).to_list(100)
    return positions

@api_router.post("/location/update")
async def update_location(loc: LocationUpdate, request: Request):
    user = await get_current_user(request)
    if user["role"] != "driver":
        raise HTTPException(status_code=403, detail="Only drivers can update location")

    position_doc = {
        "truck_id": user["_id"], "driver_id": user["_id"],
        "driver_name": user["name"], "org_name": "Independent",
        "lat": loc.lat, "lng": loc.lng, "speed": loc.speed,
        "heading": loc.heading, "accuracy": loc.accuracy,
        "status": "in_transit", "is_mock": False, "route_name": "Live GPS",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.live_positions.update_one({"truck_id": user["_id"]}, {"$set": position_doc}, upsert=True)

    # Store history
    await db.location_history.insert_one({
        "driver_id": user["_id"], "lat": loc.lat, "lng": loc.lng,
        "speed": loc.speed, "heading": loc.heading,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    return {"status": "ok"}

@api_router.post("/driver/start-trip")
async def start_trip(request: Request):
    user = await get_current_user(request)
    if user["role"] != "driver":
        raise HTTPException(status_code=403, detail="Only drivers")
    await db.trips.update_one(
        {"driver_id": user["_id"], "status": "active"},
        {"$set": {"driver_id": user["_id"], "driver_name": user["name"],
                  "status": "active", "started_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"status": "trip_started"}

@api_router.post("/driver/stop-trip")
async def stop_trip(request: Request):
    user = await get_current_user(request)
    if user["role"] != "driver":
        raise HTTPException(status_code=403, detail="Only drivers")
    await db.trips.update_one(
        {"driver_id": user["_id"], "status": "active"},
        {"$set": {"status": "completed", "ended_at": datetime.now(timezone.utc).isoformat()}}
    )
    await db.live_positions.delete_one({"truck_id": user["_id"]})
    return {"status": "trip_stopped"}

@api_router.get("/driver/trip")
async def get_trip(request: Request):
    user = await get_current_user(request)
    trip = await db.trips.find_one({"driver_id": user["_id"], "status": "active"}, {"_id": 0})
    return trip or {"status": "no_active_trip"}

# ========== SLOT ENDPOINTS ==========

@api_router.get("/slots")
async def get_slots(date: Optional[str] = None, route: Optional[str] = None):
    query = {}
    if date:
        query["date"] = date
    if route:
        query["route_name"] = route
    slots = await db.delivery_slots.find(query, {"_id": 0}).to_list(200)
    return slots

@api_router.post("/slots")
async def create_slot(slot: SlotCreate, request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    slot_doc = {
        "slot_id": str(ObjectId()), "route_name": slot.route_name,
        "start_time": slot.start_time, "end_time": slot.end_time,
        "date": slot.date, "max_capacity": slot.max_capacity,
        "booked_count": 0, "congestion_level": "low",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.delivery_slots.insert_one(slot_doc)
    slot_doc.pop("_id", None)
    return slot_doc

@api_router.post("/slots/book")
async def book_slot(booking: SlotBookInput, request: Request):
    user = await get_current_user(request)
    if user["role"] not in ["organization", "admin"]:
        raise HTTPException(status_code=403, detail="Organization or admin only")
    slot = await db.delivery_slots.find_one({"slot_id": booking.slot_id})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if slot["booked_count"] >= slot["max_capacity"]:
        raise HTTPException(status_code=400, detail="Slot is full")

    new_count = slot["booked_count"] + 1
    ratio = new_count / slot["max_capacity"]
    congestion = "low" if ratio < 0.5 else ("medium" if ratio < 0.8 else "high")

    await db.delivery_slots.update_one(
        {"slot_id": booking.slot_id},
        {"$inc": {"booked_count": 1}, "$set": {"congestion_level": congestion}}
    )
    booking_doc = {
        "booking_id": str(ObjectId()), "slot_id": booking.slot_id,
        "user_id": user["_id"], "user_name": user["name"],
        "organization_id": user.get("organization_id"),
        "status": "booked", "booked_at": datetime.now(timezone.utc).isoformat()
    }
    await db.slot_bookings.insert_one(booking_doc)
    booking_doc.pop("_id", None)
    return booking_doc

@api_router.get("/slots/bookings")
async def get_bookings(request: Request):
    user = await get_current_user(request)
    query = {}
    if user["role"] == "organization":
        query["organization_id"] = user.get("organization_id")
    bookings = await db.slot_bookings.find(query, {"_id": 0}).to_list(100)
    return bookings

# ========== REPORT ENDPOINTS ==========

@api_router.get("/reports")
async def get_reports(status: Optional[str] = None, category: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    reports = await db.ground_reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return reports

@api_router.post("/reports")
async def create_report(report: ReportCreate, request: Request):
    user = await get_current_user(request)
    report_doc = {
        "report_id": str(ObjectId()), "user_id": user["_id"], "user_name": user["name"],
        "lat": report.lat, "lng": report.lng, "category": report.category,
        "report_type": report.report_type, "severity": report.severity,
        "description": report.description, "time_advisory": report.time_advisory,
        "upvotes": 0, "downvotes": 0, "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.ground_reports.insert_one(report_doc)
    report_doc.pop("_id", None)
    return report_doc

@api_router.post("/reports/{report_id}/vote")
async def vote_report(report_id: str, vote: VoteInput, request: Request):
    user = await get_current_user(request)
    existing = await db.report_votes.find_one({"report_id": report_id, "user_id": user["_id"]})

    if existing:
        if existing["vote_type"] == vote.vote_type:
            return {"message": "Already voted"}
        await db.report_votes.update_one(
            {"report_id": report_id, "user_id": user["_id"]},
            {"$set": {"vote_type": vote.vote_type}}
        )
        inc_field = {"upvotes": 1, "downvotes": -1} if vote.vote_type == "upvote" else {"upvotes": -1, "downvotes": 1}
        await db.ground_reports.update_one({"report_id": report_id}, {"$inc": inc_field})
    else:
        await db.report_votes.insert_one({
            "report_id": report_id, "user_id": user["_id"],
            "vote_type": vote.vote_type, "created_at": datetime.now(timezone.utc).isoformat()
        })
        field = "upvotes" if vote.vote_type == "upvote" else "downvotes"
        await db.ground_reports.update_one({"report_id": report_id}, {"$inc": {field: 1}})

    report = await db.ground_reports.find_one({"report_id": report_id}, {"_id": 0})
    return report

# ========== ADMIN ENDPOINTS ==========

@api_router.get("/admin/stats")
async def get_admin_stats(request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return {
        "total_users": await db.users.count_documents({}),
        "total_drivers": await db.users.count_documents({"role": "driver"}),
        "total_organizations": await db.users.count_documents({"role": "organization"}),
        "total_regular_users": await db.users.count_documents({"role": "regular"}),
        "active_trucks": await db.live_positions.count_documents({}),
        "total_reports": await db.ground_reports.count_documents({}),
        "active_reports": await db.ground_reports.count_documents({"status": "active"}),
        "total_slots": await db.delivery_slots.count_documents({}),
        "total_bookings": await db.slot_bookings.count_documents({}),
        "carbon_saved_kg": round(await db.slot_bookings.count_documents({}) * 2.3, 1),
        "avg_congestion_reduction": 28.5
    }

@api_router.get("/admin/users")
async def get_admin_users(request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    users = await db.users.find({}, {"password_hash": 0}).to_list(500)
    for u in users:
        u["_id"] = str(u["_id"])
        if "organization_id" in u:
            u["organization_id"] = str(u["organization_id"])
    return users

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

@api_router.put("/admin/reports/{report_id}/status")
async def update_report_status(report_id: str, update: ReportStatusUpdate, request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    if update.status not in ["active", "under_review", "resolved", "invalid"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.ground_reports.update_one({"report_id": report_id}, {"$set": {"status": update.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"message": "Status updated"}

# ========== ORG ENDPOINTS ==========

@api_router.get("/org/fleet")
async def get_org_fleet(request: Request):
    user = await get_current_user(request)
    if user["role"] not in ["organization", "admin"]:
        raise HTTPException(status_code=403, detail="Organization only")
    return await db.live_positions.find({}, {"_id": 0}).to_list(100)

@api_router.get("/org/stats")
async def get_org_stats(request: Request):
    user = await get_current_user(request)
    if user["role"] not in ["organization", "admin"]:
        raise HTTPException(status_code=403, detail="Organization only")
    org_id = user.get("organization_id")
    bookings = await db.slot_bookings.count_documents({"organization_id": org_id}) if org_id else 0
    return {
        "total_bookings": bookings, "active_trucks": await db.live_positions.count_documents({}),
        "delivery_completion_rate": 87.5, "avg_delivery_time_min": 45,
        "fuel_saved_liters": round(bookings * 3.2, 1)
    }

# ========== MOCK TRUCK SIMULATOR ==========

MOCK_ROUTES = [
    {"name": "Western Express Highway", "driver_name": "Rahul Sharma", "org_name": "MH Logistics",
     "speed_range": (35, 50), "waypoints": [
        [19.1600, 72.8490], [19.1500, 72.8510], [19.1400, 72.8540], [19.1300, 72.8560],
        [19.1200, 72.8580], [19.1100, 72.8610], [19.1000, 72.8630], [19.0900, 72.8650],
        [19.0800, 72.8670], [19.0700, 72.8690], [19.0600, 72.8500]]},
    {"name": "Eastern Express Highway", "driver_name": "Amit Patel", "org_name": "Swift Transport",
     "speed_range": (30, 45), "waypoints": [
        [19.1800, 72.9600], [19.1700, 72.9550], [19.1600, 72.9500], [19.1500, 72.9450],
        [19.1400, 72.9400], [19.1300, 72.9350], [19.1200, 72.9300], [19.1100, 72.9250],
        [19.1000, 72.9200], [19.0900, 72.9150], [19.0800, 72.9100]]},
    {"name": "Marine Drive Circuit", "driver_name": "Suresh Kumar", "org_name": "Ocean Freight",
     "speed_range": (20, 35), "waypoints": [
        [18.9440, 72.8230], [18.9400, 72.8240], [18.9360, 72.8255], [18.9320, 72.8275],
        [18.9290, 72.8300], [18.9300, 72.8330], [18.9330, 72.8350], [18.9370, 72.8345],
        [18.9410, 72.8330], [18.9440, 72.8300], [18.9450, 72.8260]]},
    {"name": "BKC-Worli Corridor", "driver_name": "Vikram Singh", "org_name": "Metro Carriers",
     "speed_range": (25, 40), "waypoints": [
        [19.0650, 72.8680], [19.0600, 72.8650], [19.0550, 72.8610], [19.0500, 72.8570],
        [19.0450, 72.8530], [19.0400, 72.8490], [19.0350, 72.8450], [19.0300, 72.8400],
        [19.0250, 72.8350], [19.0200, 72.8300], [19.0180, 72.8250]]},
    {"name": "Andheri-Juhu Route", "driver_name": "Deepak Joshi", "org_name": "City Express",
     "speed_range": (20, 35), "waypoints": [
        [19.1130, 72.8700], [19.1120, 72.8650], [19.1100, 72.8600], [19.1080, 72.8550],
        [19.1060, 72.8500], [19.1050, 72.8450], [19.1040, 72.8400], [19.1050, 72.8350],
        [19.1070, 72.8300], [19.1090, 72.8270], [19.1100, 72.8250]]}
]

mock_truck_state = {}

async def mock_truck_simulator():
    global mock_truck_state
    for i in range(len(MOCK_ROUTES)):
        mock_truck_state[f"mock_{i+1}"] = {
            "waypoint_idx": random.randint(0, len(MOCK_ROUTES[i]["waypoints"]) - 2),
            "progress": 0.0, "direction": 1
        }

    while True:
        try:
            for i, route in enumerate(MOCK_ROUTES):
                truck_id = f"mock_{i+1}"
                state = mock_truck_state[truck_id]
                wps = route["waypoints"]
                idx = state["waypoint_idx"]
                next_idx = idx + state["direction"]

                if next_idx >= len(wps) or next_idx < 0:
                    state["direction"] *= -1
                    next_idx = idx + state["direction"]

                state["progress"] += 0.12 + random.random() * 0.08
                if state["progress"] >= 1.0:
                    state["progress"] = 0.0
                    state["waypoint_idx"] = next_idx
                    idx = next_idx
                    next_idx = idx + state["direction"]
                    if next_idx >= len(wps) or next_idx < 0:
                        state["direction"] *= -1
                        next_idx = idx + state["direction"]

                safe_next = min(max(next_idx, 0), len(wps) - 1)
                t = state["progress"]
                lat = wps[idx][0] + (wps[safe_next][0] - wps[idx][0]) * t + random.uniform(-0.0002, 0.0002)
                lng = wps[idx][1] + (wps[safe_next][1] - wps[idx][1]) * t + random.uniform(-0.0002, 0.0002)

                position_doc = {
                    "truck_id": truck_id, "driver_id": truck_id,
                    "driver_name": route["driver_name"], "org_name": route["org_name"],
                    "lat": round(lat, 6), "lng": round(lng, 6),
                    "speed": round(random.uniform(*route["speed_range"]), 1),
                    "heading": round(random.uniform(0, 360), 1),
                    "status": "in_transit", "is_mock": True,
                    "route_name": route["name"],
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                await db.live_positions.update_one(
                    {"truck_id": truck_id},
                    {"$set": position_doc},
                    upsert=True
                )
                # Broadcast via Socket.IO
                await sio.emit('truck-position-update', position_doc)
            await asyncio.sleep(3)
        except Exception as e:
            logger.error(f"Mock simulator error: {e}")
            await asyncio.sleep(5)

# ========== SEED FUNCTIONS ==========

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email, "password_hash": hash_password(admin_password),
            "name": "System Admin", "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

async def seed_delivery_slots():
    if await db.delivery_slots.count_documents({}) > 0:
        return
    routes = ["MG Road Commercial Zone", "Western Express Highway", "Eastern Freeway", "Marine Drive", "BKC Business District"]
    times = [("08:00","09:00"),("09:00","10:00"),("10:00","11:00"),("11:00","12:00"),
             ("12:00","13:00"),("13:00","14:00"),("14:00","15:00"),("15:00","16:00"),
             ("16:00","17:00"),("17:00","18:00")]
    for d in range(7):
        date = (datetime.now(timezone.utc) + timedelta(days=d)).strftime("%Y-%m-%d")
        for route in routes:
            for s, e in times:
                booked = random.randint(0, 12)
                ratio = booked / 15
                cong = "low" if ratio < 0.5 else ("medium" if ratio < 0.8 else "high")
                await db.delivery_slots.insert_one({
                    "slot_id": str(ObjectId()), "route_name": route,
                    "start_time": s, "end_time": e, "date": date,
                    "max_capacity": 15, "booked_count": booked,
                    "congestion_level": cong, "created_at": datetime.now(timezone.utc).isoformat()
                })
    logger.info("Delivery slots seeded")

async def seed_sample_reports():
    if await db.ground_reports.count_documents({}) > 0:
        return
    reports = [
        {"report_id": str(ObjectId()), "user_id": "system", "user_name": "Traffic Bot",
         "lat": 19.0760, "lng": 72.8777, "category": "traffic_incident", "report_type": "Accident",
         "severity": "critical", "description": "Two trucks collided at Junction 3 on MG Road. Right lane blocked. Police on scene.",
         "time_advisory": "Avoid MG Road 2:00-4:00 PM today", "upvotes": 47, "downvotes": 3,
         "status": "active", "created_at": datetime.now(timezone.utc).isoformat()},
        {"report_id": str(ObjectId()), "user_id": "system", "user_name": "Weather Watch",
         "lat": 19.1200, "lng": 72.9300, "category": "weather", "report_type": "Heavy Fog",
         "severity": "moderate", "description": "Heavy fog on Eastern Express Highway reducing visibility to 50m.",
         "time_advisory": "Expected to clear by 10 AM", "upvotes": 23, "downvotes": 2,
         "status": "active", "created_at": datetime.now(timezone.utc).isoformat()},
        {"report_id": str(ObjectId()), "user_id": "system", "user_name": "Road Inspector",
         "lat": 19.0500, "lng": 72.8400, "category": "road_condition", "report_type": "Pothole",
         "severity": "minor", "description": "Large pothole on Park Road near signal. Left side affected.",
         "time_advisory": None, "upvotes": 8, "downvotes": 1,
         "status": "active", "created_at": datetime.now(timezone.utc).isoformat()}
    ]
    for r in reports:
        await db.ground_reports.insert_one(r)
    logger.info("Sample reports seeded")

# ========== SOCKET.IO EVENT HANDLERS ==========

@sio.event
async def connect(sid, environ):
    logger.info(f'Socket.IO client connected: {sid}')

@sio.event
async def disconnect(sid):
    logger.info(f'Socket.IO client disconnected: {sid}')

@sio.on('location-update')
async def handle_location_update(sid, data):
    """Handle real-time GPS location from driver app"""
    try:
        position_doc = {
            "truck_id": data.get("driver_id", sid),
            "driver_id": data.get("driver_id", sid),
            "driver_name": data.get("driver_name", "Unknown Driver"),
            "org_name": data.get("org_name", "Independent"),
            "lat": float(data["lat"]),
            "lng": float(data["lng"]),
            "speed": float(data.get("speed", 0)),
            "heading": float(data.get("heading", 0)),
            "accuracy": float(data.get("accuracy", 0)),
            "status": "in_transit",
            "is_mock": False,
            "route_name": "Live GPS",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

        # Store in DB
        await db.live_positions.update_one(
            {"truck_id": position_doc["truck_id"]},
            {"$set": position_doc},
            upsert=True
        )

        # Store history
        await db.location_history.insert_one({
            "driver_id": position_doc["driver_id"],
            "lat": position_doc["lat"], "lng": position_doc["lng"],
            "speed": position_doc["speed"], "heading": position_doc["heading"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

        # Broadcast to ALL connected clients instantly
        await sio.emit('truck-position-update', position_doc)
        logger.info(f'Location broadcast for driver {position_doc["driver_name"]}: {position_doc["lat"]},{position_doc["lng"]}')

    except Exception as e:
        logger.error(f'Socket location-update error: {e}')

@sio.on('stop-tracking')
async def handle_stop_tracking(sid, data):
    """Handle driver stopping their trip via socket"""
    try:
        driver_id = data.get("driver_id")
        if driver_id:
            await db.live_positions.delete_one({"truck_id": driver_id})
            await db.trips.update_one(
                {"driver_id": driver_id, "status": "active"},
                {"$set": {"status": "completed", "ended_at": datetime.now(timezone.utc).isoformat()}}
            )
            await sio.emit('truck-removed', {"truck_id": driver_id})
            logger.info(f'Driver {driver_id} stopped tracking')
    except Exception as e:
        logger.error(f'Socket stop-tracking error: {e}')

# ========== STARTUP ==========

@fastapi_app.on_event("startup")
async def startup():
    # Initialize database connection at runtime (not build time)
    global client, db
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "test_database")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    logger.info(f"Connected to MongoDB: {db_name}")
    
    await db.users.create_index("email", unique=True)
    await db.live_positions.create_index("truck_id", unique=True)
    await db.ground_reports.create_index("report_id", unique=True)
    await db.delivery_slots.create_index("slot_id", unique=True)
    await db.report_votes.create_index([("report_id", 1), ("user_id", 1)], unique=True)

    await seed_admin()
    await seed_delivery_slots()
    await seed_sample_reports()

    os.makedirs("/app/memory", exist_ok=True)
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"# Test Credentials\n\n## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: admin\n\n")
        f.write("## Auth Endpoints\n- POST /api/auth/login\n- POST /api/auth/register\n- POST /api/auth/logout\n- GET /api/auth/me\n")

    asyncio.create_task(mock_truck_simulator())
    logger.info("Application started successfully")

@fastapi_app.on_event("shutdown")
async def shutdown():
    client.close()

fastapi_app.include_router(api_router)

# Wrap FastAPI with Socket.IO ASGI app - this becomes the main 'app' for uvicorn
app = socketio_lib.ASGIApp(sio, other_asgi_app=fastapi_app, socketio_path='/api/socket.io')

if __name__ == "__main__":
    import uvicorn
    PORT = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=PORT)
