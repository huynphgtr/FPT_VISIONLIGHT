import sqlite3
import os
import textwrap

# Đường dẫn đến file DB (Sẽ bị xóa và tạo mới)
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'app.db')

SCHEMA_SQL = textwrap.dedent("""
PRAGMA foreign_keys = ON;

CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN','STAFF')),
    created_at DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE floors (
    floor_id INTEGER PRIMARY KEY AUTOINCREMENT,
    floor_name TEXT NOT NULL
);

CREATE TABLE areas (
    area_id INTEGER PRIMARY KEY AUTOINCREMENT,
    floor_id INTEGER NOT NULL,
    area_name TEXT NOT NULL,
    area_type TEXT,
    FOREIGN KEY (floor_id) REFERENCES floors (floor_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE devices (
    device_id INTEGER PRIMARY KEY AUTOINCREMENT,
    area_id INTEGER NOT NULL,
    device_type TEXT NOT NULL,
    device_name TEXT,
    ip_address TEXT,
    mac_address TEXT,
    mqtt_topic TEXT,
    status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online','offline','unknown')),
    FOREIGN KEY (area_id) REFERENCES areas (area_id) ON DELETE CASCADE
);

CREATE TABLE area_status (
    area_id INTEGER PRIMARY KEY,
    override_until DATETIME,
    last_priority INTEGER,
    current_mode TEXT,
    FOREIGN KEY (area_id) REFERENCES areas (area_id) ON DELETE CASCADE
);

CREATE TABLE config_param (
    area_id INTEGER PRIMARY KEY,
    min_person INTEGER NOT NULL DEFAULT 1 CHECK(min_person >= 0),
    lux_threshold INTEGER NOT NULL DEFAULT 0 CHECK(lux_threshold >= 0),
    override_timeout INTEGER NOT NULL DEFAULT 0 CHECK(override_timeout >= 0),
    off_delay INTEGER NOT NULL DEFAULT 0 CHECK(off_delay >= 0),
    FOREIGN KEY (area_id) REFERENCES areas (area_id) ON DELETE CASCADE
);

CREATE TABLE schedules (
    schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    area_id INTEGER NOT NULL,
    start_time TIME, -- Dùng TIME thay vì DATETIME cho lịch lặp lại
    end_time TIME,
    days_of_week TEXT, -- VD: 'Mon,Tue,Wed'
    action_state TEXT CHECK (action_state IN ('ON','OFF')),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
    FOREIGN KEY (area_id) REFERENCES areas (area_id) ON DELETE CASCADE
);

CREATE TABLE history_log (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    area_id INTEGER,
    event_type TEXT,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (area_id) REFERENCES areas (area_id) ON DELETE SET NULL
);

CREATE INDEX idx_devices_area ON devices(area_id);
CREATE INDEX idx_schedules_area ON schedules(area_id);
CREATE INDEX idx_history_area ON history_log(area_id);
""")

def recreate_db():
    abs_path = os.path.abspath(DB_PATH)
    
    # BƯỚC 1: XÓA DB CŨ
    if os.path.exists(abs_path):
        try:
            os.remove(abs_path)
            print(f"🗑️ Đã xóa Database cũ tại: {abs_path}")
        except PermissionError:
            print(f"❌ Lỗi: File DB đang được mở bởi ứng dụng khác. Hãy tắt nó trước.")
            return

    # BƯỚC 2: TẠO DB MỚI VÀ SCHEMA
    db_dir = os.path.dirname(abs_path)
    if not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

    conn = sqlite3.connect(abs_path)
    try:
        conn.execute("PRAGMA foreign_keys = ON;")
        cur = conn.cursor()
        cur.executescript(SCHEMA_SQL)
        conn.commit()
        print(f"✨ Đã khởi tạo Database mới thành công!")
        
        # Kiểm tra danh sách bảng
        cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cur.fetchall()
        print(f"📊 Danh sách bảng đã tạo: {[t[0] for t in tables]}")
    finally:
        conn.close()

if __name__ == '__main__':
    recreate_db()