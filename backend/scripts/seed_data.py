import sqlite3
import os
from datetime import datetime, timedelta

# Đường dẫn đến file DB
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'app.db')

def seed_data():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON;")
    cur = conn.cursor()

    try:
        print("Đang làm sạch dữ liệu cũ...")
        
        # Xóa các bảng phụ trước để tránh vi phạm ràng buộc Foreign Key
        cur.execute("DELETE FROM history_log")
        cur.execute("DELETE FROM schedules")
        cur.execute("DELETE FROM area_status")
        cur.execute("DELETE FROM config_param")
        cur.execute("DELETE FROM devices")
        cur.execute("DELETE FROM areas")
        cur.execute("DELETE FROM floors")
        cur.execute("DELETE FROM users")
        
        # Reset lại các ID tự tăng về 1
        cur.execute("DELETE FROM sqlite_sequence") 
        print("Đã xóa sạch dữ liệu cũ.")
        # 1. Chèn Users (Password được giả định đã hash)
        users = [
            ('admin', 'password_hash_admin', 'ADMIN'),
            ('staff_floor1', 'password_hash_staff', 'STAFF')
        ]
        cur.executemany("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", users)
        print("Đã tạo tài khoản Admin và Staff.")

        # 2. Chèn Floors
        cur.execute("INSERT INTO floors (floor_name) VALUES ('Tầng 1')")
        f1_id = cur.lastrowid
        cur.execute("INSERT INTO floors (floor_name) VALUES ('Tầng 2')")
        f2_id = cur.lastrowid
        cur.execute("INSERT INTO floors (floor_name) VALUES ('Tầng 3')")
        f3_id = cur.lastrowid
        cur.execute("INSERT INTO floors (floor_name) VALUES ('Tầng 4')")
        f4_id = cur.lastrowid
        cur.execute("INSERT INTO floors (floor_name) VALUES ('Tầng 5')")
        f5_id = cur.lastrowid


        # 3. Chèn Areas 
        areas = [
            (f1_id, 'Sảnh chính', 'Lobby'),
            (f1_id, 'Hành lang dãy phòng lab', 'Corridor'),
            (f2_id, 'Hành lang dãy phòng học tầng 2', 'Corridor'),
            (f3_id, 'Phòng họp', 'Meeting Room'),
            (f4_id, 'Hành lang dãy phòng học tầng 4', 'Corridor'),
            (f5_id, 'Hành lang dãy phòng học tầng 5', 'Corridor')
        ]
        cur.executemany("INSERT INTO areas (floor_id, area_name, area_type) VALUES (?, ?, ?)", areas)
        
        # Lấy ID của các Area để dùng cho các bảng sau
        cur.execute("SELECT area_id, area_name FROM areas")
        area_map = {name: aid for aid, name in cur.fetchall()}
        print(f"Đã tạo {len(area_map)} khu vực trên 5 tầng.")

        # 4. Chèn Devices 
        devices = [
            # Sảnh chính
            (area_map['Sảnh chính'], 'CAMERA', 'Cam_Lobby_01', '192.168.1.50', 'AA:BB:CC:DD:EE:01', 'autolight/f1/lobby/cam', 'online'),
            (area_map['Sảnh chính'], 'RELAY', 'Relay_Lobby_01', '192.168.1.51', 'AA:BB:CC:DD:EE:02', 'autolight/f1/lobby/light', 'online'),
            
            # Hành lang phòng lab
            (area_map['Hành lang dãy phòng lab'], 'CAMERA', 'Cam_Corridor_01', '192.168.1.60', 'AA:BB:CC:DD:EE:03', 'autolight/f1/corridor/cam', 'online'),
            (area_map['Hành lang dãy phòng lab'], 'RELAY', 'Relay_Corridor_01', '192.168.1.61', 'AA:BB:CC:DD:EE:04', 'autolight/f1/corridor/light', 'online'),
            
            #Hành lang phòng học tầng 2
            (area_map['Hành lang dãy phòng học tầng 2'], 'CAMERA', 'Cam_Corridor_02', '192.168.1.70', 'AA:BB:CC:DD:EE:05', 'autolight/f2/corridor/cam', 'online'),
            (area_map['Hành lang dãy phòng học tầng 2'], 'RELAY', 'Relay_Corridor_02', '192.168.1.71', 'AA:BB:CC:DD:EE:06', 'autolight/f2/corridor/light', 'online'),
            
            # Phòng họp
            (area_map['Phòng họp'], 'CAMERA', 'Cam_Meeting_01', '192.168.1.80', 'AA:BB:CC:DD:EE:07', 'autolight/f3/meeting/cam', 'online'),
            (area_map['Phòng họp'], 'RELAY', 'Relay_Meeting_01', '192.168.1.81', 'AA:BB:CC:DD:EE:08', 'autolight/f3/meeting/light', 'online'),
            # Hành lang phòng học tầng 4
            (area_map['Hành lang dãy phòng học tầng 4'], 'CAMERA', 'Cam_Corridor_03', '192.168.1.90', 'AA:BB:CC:DD:EE:09', 'autolight/f4/corridor/cam', 'online'),
            (area_map['Hành lang dãy phòng học tầng 4'], 'RELAY', 'Relay_Corridor_03', '192.168.1.91', 'AA:BB:CC:DD:EE:10', 'autolight/f4/corridor/light', 'online'),

            # Hành lang phòng học tầng 5
            (area_map['Hành lang dãy phòng học tầng 5'], 'CAMERA', 'Cam_Corridor_04', '192.168.1.100', 'AA:BB:CC:DD:EE:11', 'autolight/f5/corridor/cam', 'online'),
            (area_map['Hành lang dãy phòng học tầng 5'], 'RELAY', 'Relay_Corridor_04', '192.168.1.101', 'AA:BB:CC:DD:EE:12', 'autolight/f5/corridor/light', 'online')

        ]
        cur.executemany("""INSERT INTO devices 
            (area_id, device_type, device_name, ip_address, mac_address, mqtt_topic, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?)""", devices)

        # 5. Chèn Config Params 
        configs = [
            (area_map['Sảnh chính'], 2, 100, 60, 300), # Cần 2 người, ngưỡng sáng 100, tắt trễ 5p
            (area_map['Hành lang dãy phòng lab'], 1, 50, 30, 60), # Cần 1 người, tắt trễ 1p
            (area_map['Hành lang dãy phòng học tầng 2'], 1, 150, 120, 900), # Tắt trễ 15p (Phòng học cần trễ lâu)
            (area_map['Phòng họp'], 1, 200, 60, 300),
            (area_map['Hành lang dãy phòng học tầng 4'], 1, 150, 120, 900),
            (area_map['Hành lang dãy phòng học tầng 5'], 1, 150, 120, 900)
        ]
        cur.executemany("INSERT INTO config_param VALUES (?, ?, ?, ?, ?)", configs)

        # 6. Chèn Area Status (Trạng thái ban đầu là AUTO)
        status_entries = [
            (area_map['Sảnh chính'], None, 3, 'AUTO'),
            (area_map['Hành lang dãy phòng lab'], None, 3, 'AUTO'),
            (area_map['Hành lang dãy phòng học tầng 2'], None, 3, 'AUTO'),
            (area_map['Phòng họp'], None, 3, 'AUTO'),
            (area_map['Hành lang dãy phòng học tầng 4'], None, 3, 'AUTO'),
            (area_map['Hành lang dãy phòng học tầng 5'], None, 3, 'AUTO')
        ]
        cur.executemany("INSERT INTO area_status VALUES (?, ?, ?, ?)", status_entries)

        # 7. Chèn Schedules (Ví dụ: Giờ hành chính bật đèn Sảnh)
        # Lấy giờ hiện tại để tạo một lịch đang active giúp bạn test logic khởi động
        now = datetime.now()
        start_v = (now - timedelta(hours=1)).strftime('%H:%M:%S')
        end_v = (now + timedelta(hours=2)).strftime('%H:%M:%S')
        
        schedules = [
            (area_map['Sảnh chính'], start_v, end_v, 'Mon,Tue,Wed,Thu,Fri,Sat,Sun', 'ON', 1),
            (area_map['Hành lang dãy phòng học tầng 5'], '18:00:00', '22:00:00', 'Mon,Tue,Wed,Thu,Fri', 'OFF', 1)

        ]
        cur.executemany("""INSERT INTO schedules 
            (area_id, start_time, end_time, days_of_week, action_state, is_active) 
            VALUES (?, ?, ?, ?, ?, ?)""", schedules)

        conn.commit()
        print("Đã bơm dữ liệu Mock thành công!")

    except sqlite3.Error as e:
        print(f"Lỗi khi bơm dữ liệu: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    seed_data()