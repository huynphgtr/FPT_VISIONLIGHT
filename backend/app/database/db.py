# from sqlalchemy import create_engine
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker
# import os
# from dotenv import load_dotenv

# load_dotenv()

# # SQLite database URL - defaults to app.db in project root
# SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

# # SQLite requires check_same_thread=False to work with async operations
# if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
#     engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
# else:
#     engine = create_engine(SQLALCHEMY_DATABASE_URL)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# Base = declarative_base()

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

import sqlite3
import os
from dotenv import load_dotenv
from scripts.create_schema_sqlite import DB_PATH

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
DB_PATH = DATABASE_URL.replace("sqlite:///", "") if DATABASE_URL.startswith("sqlite:///") else DATABASE_URL

def get_db_connection():
    """Connections to the SQLite database."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False, timeout=10)
    conn.row_factory = sqlite3.Row
    # Bật chế độ WAL
    conn.execute("PRAGMA journal_mode=WAL;")
    # Thiết lập thời gian chờ (timeout) là 10 giây thay vì báo lỗi ngay lập tức
    conn.execute("PRAGMA busy_timeout=10000;")
    try:
        yield conn
    finally:
        conn.close()