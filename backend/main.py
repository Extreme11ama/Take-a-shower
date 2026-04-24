from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from supabase_client import supabase
import os
import asyncio


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://take-a-shower.vercel.app"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RegisterRequest(BaseModel):
    username: str
    password: str
 
class LoginRequest(BaseModel):
    username: str
    password: str

class UpdateProfileRequest(BaseModel):
    # Optional means the field doesn't have to be included 
    # useful for partial updates (only send what changed)
    schedule_interval: Optional[str] = None
    shower_time: Optional[str] = None
 
class OverrideRequest(BaseModel):
    date: str           # YYYY-MM-DD
    is_shower_day: bool

class NoteRequest(BaseModel):
    date: str
    note: str



async def get_current_user(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
 
    token = authorization.split(" ")[1]
 
    try:
        response = supabase.auth.get_user(token)
        return response.user.id   # this is the user's uuid
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
 
 
@app.post("/auth/register")
def register(body: RegisterRequest):
    fake_email = f"{body.username.lower()}@rinse.app"
 
    try:
        auth_response = supabase.auth.sign_up({
            "email": fake_email,
            "password": body.password,
            "options": {
                "data": { "username": body.username }
            }
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
 
    if not auth_response.user:
        raise HTTPException(status_code=400, detail="Registration failed")
 
    return {
        "message": "Account created",
        "user_id": auth_response.user.id,
        "access_token": auth_response.session.access_token if auth_response.session else None,
    }

 
@app.post("/auth/login")
def login(body: LoginRequest):
    fake_email = f"{body.username.lower()}@rinse.app"
 
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": fake_email,
            "password": body.password,
        })
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid username or password")
 
    if not auth_response.user or not auth_response.session:
        raise HTTPException(status_code=401, detail="Invalid username or password")
 
    return {
        "access_token": auth_response.session.access_token,
        "user_id": auth_response.user.id,
        "username": body.username,
    }
 

@app.post("/auth/logout")
def logout(user_id: str = Depends(get_current_user)):
    supabase.auth.sign_out()
    return { "message": "Logged out" }


@app.get("/profile")
def get_profile(user_id: str = Depends(get_current_user)):
    response = (
        supabase.table("profiles")
        .select("*")
        .eq("id", user_id)   # .eq() = WHERE id = user_id
        .single()            # .single() returns one row
        .execute()
    )
 
    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")
 
    return response.data
 

@app.put("/profile")
def update_profile(body: UpdateProfileRequest, user_id: str = Depends(get_current_user)):
    valid_schedules = {"daily", "every-other", "every-two"}
    if body.schedule_interval and body.schedule_interval not in valid_schedules:
        raise HTTPException(status_code=400, detail=f"schedule_interval must be one of {valid_schedules}")
 
    updates = {}
    if body.schedule_interval is not None:
        updates["schedule_interval"] = body.schedule_interval
    if body.shower_time is not None:
        updates["shower_time"] = body.shower_time
 
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
 
    response = (
        supabase.table("profiles")
        .update(updates)
        .eq("id", user_id)
        .execute()
    )
 
    return { "message": "Profile updated", "data": response.data }

@app.get("/overrides")
def get_overrides(user_id: str = Depends(get_current_user)):
    response = (
        supabase.table("shower_overrides")
        .select("date, is_shower_day")
        .eq("user_id", user_id)
        .execute()
    )
 
    return { row["date"]: row["is_shower_day"] for row in response.data }
 
@app.post("/overrides")
def set_override(body: OverrideRequest, user_id: str = Depends(get_current_user)):
    response = (
        supabase.table("shower_overrides")
        .upsert({
            "user_id": user_id,
            "date": body.date,
            "is_shower_day": body.is_shower_day,
        })
        .execute()
    )
 
    return { "message": "Override saved" }
 

@app.delete("/overrides/{date}")
def delete_override(date: str, user_id: str = Depends(get_current_user)):
    supabase.table("shower_overrides").delete().eq("user_id", user_id).eq("date", date).execute()
    return { "message": "Override removed" }

@app.delete("/overrides")
def clear_overrides(user_id: str = Depends(get_current_user)):
    supabase.table("shower_overrides").delete().eq("user_id", user_id).execute()
    return { "message": "All overrides cleared" }
 


@app.post("/log")
def log_shower(user_id: str = Depends(get_current_user), duration_seconds: Optional[int] = None):
    response = (
        supabase.table("shower_logs")
        .insert({
            "user_id": user_id,
            "duration_seconds": duration_seconds,
        })
        .execute()
    )
 
    return { "message": "Shower logged" }
 
 
@app.get("/log")
def get_shower_history(user_id: str = Depends(get_current_user)):
    response = (
        supabase.table("shower_logs")
        .select("*")
        .eq("user_id", user_id)
        .order("logged_at", desc=True)
        .limit(30)   # last 30 sessions
        .execute()
    )
 
    return response.data

@app.get("/notes")
def get_notes(user_id: str = Depends(get_current_user)):
    response = (
        supabase.table("shower_notes")
        .select("date, note")
        .eq("user_id", user_id)
        .execute()
    )
    return { row["date"]: row["note"] for row in response.data }

@app.post("/notes")
def save_note(body: NoteRequest, user_id: str = Depends(get_current_user)):
    supabase.table("shower_notes").upsert({
        "user_id": user_id,
        "date": body.date,
        "note": body.note,
        "updated_at": "now()",
    }).execute()
    return { "message": "Note saved" }

@app.delete("/notes/{date}")
def delete_note(date: str, user_id: str = Depends(get_current_user)):
    supabase.table("shower_notes").delete().eq("user_id", user_id).eq("date", date).execute()
    return { "message": "Note deleted" }
 
 
# ── Health check ──────────────────────────────────────────────────────────────
 
@app.get("/")
def root():
    return { "status": "ok", "app": "Rinse API" }

