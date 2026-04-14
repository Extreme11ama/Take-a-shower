from fastapi import FastAPI
from supabase_client import supabase

app = FastAPI()

@app.get("/")
def root():
    return {"message": "message received"}

@app.get("/stuff")
def get_stuff():
    response = supabase.table("ex_table").select("*").execute()
    return response.data
