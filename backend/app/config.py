import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "withme-super-secret-production-key-2026")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "withme-jwt-ultra-secure-key-2026")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv("JWT_ACCESS_EXP_HOURS", "24")))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_REFRESH_EXP_DAYS", "30")))
    
    _db_url = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(BASE_DIR, 'withme.db')}"
    )
    if _db_url and _db_url.startswith("postgres://"):
        _db_url = _db_url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URI = _db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
    
    # Discovery & Matching weights
    WEIGHT_INTERESTS = 0.25
    WEIGHT_GOALS = 0.20
    WEIGHT_ACTIVITY = 0.20
    WEIGHT_SKILLS = 0.10
    WEIGHT_AVAILABILITY = 0.10
    WEIGHT_LOCATION = 0.15
