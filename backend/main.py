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
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
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



async def get_current_user(authorization: str = Header(...)) -> str:
    # The header looks like: "Bearer eyJhbGciOi..."
    # We split on the space to get just the token part
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
 
    token = authorization.split(" ")[1]
 
    try:
        # Ask Supabase to verify this token and tell us who it belongs to
        response = supabase.auth.get_user(token)
        return response.user.id   # this is the user's uuid
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
 
 
@app.post("/auth/register")
def register(body: RegisterRequest):
    """
    Creates a new Supabase Auth user and a matching profile row.
    
    Since Supabase Auth requires an email, we construct a fake one:
    "username@rinse.app". The user never sees this — they always log in
    with their username, and we reconstruct the fake email server-side.
 
    The profile row is created automatically by the database trigger we set
    up in Supabase (handle_new_user), which reads the username out of
    user_metadata. But we double-check it exists here just in case.
    """
    fake_email = f"{body.username.lower()}@rinse.app"
 
    try:
        # sign_up() creates the user in Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": fake_email,
            "password": body.password,
            "options": {
                # user_metadata is extra data attached to the auth user.
                # Our database trigger reads this to create the profile row.
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
        # The session contains the access token the frontend needs to store
        "access_token": auth_response.session.access_token if auth_response.session else None,
    }

 
@app.post("/auth/login")
def login(body: LoginRequest):
    """
    Logs in with username + password.
    Returns an access token the frontend stores and sends with every request.
    """
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
    """
    Invalidates the user's session on Supabase.
    The frontend should also delete the stored token after calling this.
    """
    supabase.auth.sign_out()
    return { "message": "Logged out" }


@app.get("/profile")
def get_profile(user_id: str = Depends(get_current_user)):
    """
    Returns the current user's profile (username, schedule, shower time).
    Called right after login so the frontend can load the user's settings.
 
    Depends(get_current_user) means: "run get_current_user first, inject
    the returned user_id into this function as an argument." If the token
    is invalid, get_current_user raises a 401 and this function never runs.
    """
    response = (
        supabase.table("profiles")
        .select("*")
        .eq("id", user_id)   # .eq() = WHERE id = user_id
        .single()            # .single() expects exactly one row, raises if not found
        .execute()
    )
 
    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")
 
    return response.data
 

@app.put("/profile")
def update_profile(body: UpdateProfileRequest, user_id: str = Depends(get_current_user)):
    """
    Updates schedule_interval and/or shower_time.
    Called when the user picks a new schedule in the Schedule modal.
 
    We validate schedule_interval here so bad values never reach the database.
    The DB has a CHECK constraint too, but it's good to fail early with a
    clear error message rather than a cryptic database error.
    """
    valid_schedules = {"daily", "every-other", "every-two"}
    if body.schedule_interval and body.schedule_interval not in valid_schedules:
        raise HTTPException(status_code=400, detail=f"schedule_interval must be one of {valid_schedules}")
 
    # Build the update dict with only the fields that were actually sent
    # (we skip None values so we don't overwrite fields the user didn't touch)
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
    """
    Returns all of the user's calendar overrides.
    The frontend uses these to know which days were manually toggled.
    """
    response = (
        supabase.table("shower_overrides")
        .select("date, is_shower_day")
        .eq("user_id", user_id)
        .execute()
    )
 
    # Return as a dict of { "YYYY-MM-DD": true/false } — easier for the
    # frontend to look up by date than looping through a list
    return { row["date"]: row["is_shower_day"] for row in response.data }
 
@app.post("/overrides")
def set_override(body: OverrideRequest, user_id: str = Depends(get_current_user)):
    """
    Adds or updates a single calendar day override.
    
    upsert() = INSERT ... ON CONFLICT DO UPDATE
    If a row with this (user_id, date) already exists, it updates it.
    If not, it inserts a new row.
    This means you don't need separate "add" and "remove" endpoints —
    one endpoint handles both cases.
    """
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
    """
    Removes a specific override (reverts that day back to the schedule).
    `date` comes from the URL path: DELETE /overrides/2025-04-20
    """
    supabase.table("shower_overrides").delete().eq("user_id", user_id).eq("date", date).execute()
    return { "message": "Override removed" }
 


@app.post("/log")
def log_shower(user_id: str = Depends(get_current_user), duration_seconds: Optional[int] = None):
    """
    Records that the user took a shower right now.
    Optionally includes how long the timer ran (from the TimerModal).
    This is the foundation for a future history/stats screen.
    """
    response = (
        supabase.table("shower_logs")
        .insert({
            "user_id": user_id,
            "duration_seconds": duration_seconds,
            # logged_at defaults to now() in the database, so we don't send it
        })
        .execute()
    )
 
    return { "message": "Shower logged" }
 
 
@app.get("/log")
def get_shower_history(user_id: str = Depends(get_current_user)):
    """
    Returns the user's past shower sessions, newest first.
    Useful for a future history screen or streak calculation.
    """
    response = (
        supabase.table("shower_logs")
        .select("*")
        .eq("user_id", user_id)
        .order("logged_at", desc=True)
        .limit(30)   # last 30 sessions
        .execute()
    )
 
    return response.data
 
 
# ── Health check ──────────────────────────────────────────────────────────────
 
@app.get("/")
def root():
    # A simple ping endpoint. Useful for Railway to confirm the server is up.
    return { "status": "ok", "app": "Rinse API" }

'''
@app.get("/")
def root():
    return {"message": "message received"}

@app.get("/stuff")
def get_stuff():
    response = supabase.table("ex_table").select("*").execute()
    return response.data
'''