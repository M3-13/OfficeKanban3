import os

DB_PATH = os.environ.get("DB_PATH", "officekanban.db")
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-me-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = int(os.environ.get("JWT_EXPIRY_HOURS", "24"))

DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite+aiosqlite:///{DB_PATH}")
