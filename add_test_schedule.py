import sqlite3
import datetime

conn = sqlite3.connect("app.db")

now = datetime.datetime.now()
day_map = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
current_weekday_str = day_map[now.weekday()]

start_time = (now - datetime.timedelta(hours=1)).strftime('%H:%M:%S')
end_time = (now + datetime.timedelta(hours=1)).strftime('%H:%M:%S')

try:
    # Thêm 1 lịch trình bật + tắt đèn cho khu vực 1 (Area 1)
    # conn.execute(f"""
    #     INSERT INTO schedules (area_id, start_time, end_time, days_of_week, action_state, is_active) 
    #     VALUES (1, '{start_time}', '{end_time}', '{current_weekday_str}', 'ON', 1)
    # """)
    conn.execute(f"""
        INSERT INTO schedules (area_id, start_time, end_time, days_of_week, action_state, is_active) 
        VALUES (3, '{start_time}', '{end_time}', '{current_weekday_str}', 'ON', 1)
    """)
    conn.commit()
    print("--------------------------------------------------")
    print(f"Đã thêm thành công một lịch trình TEST vào cơ sở dữ liệu!")
    print(f"Chi tiết: Khu vực 3 (Area 3) sẽ ép bật từ {start_time} đến {end_time}")
    print(f"Backend sẽ tự động phát hiện và thực thi trong vòng tối đa 60 giây tiếp theo.")
    print("--------------------------------------------------")
except Exception as e:
    print(f"Lỗi khi thêm lịch trình: {e}")
finally:
    conn.close()
