from supabase import create_client
from dotenv import load_dotenv
load_dotenv()
import os

url = os.getenv("supabase_url")
key = os.getenv("supabase_key")

supabase = create_client(url, key)
