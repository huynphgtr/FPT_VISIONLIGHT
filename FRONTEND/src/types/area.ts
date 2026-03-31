export type DeviceType = 'CAMERA' | 'RELAY' | 'SENSOR';
export type DeviceStatus = 'online' | 'offline' | 'unknown';
export type ActionState = 'ON' | 'OFF';
export type AreaMode = 'AUTO' | 'MANUAL_ON' | 'MANUAL_OFF' | 'MANUAL' | 'SCHEDULE';

export interface Device {
    device_id: number;
    area_id: number;
    device_type: DeviceType;
    device_name: string;
    ip_address: string;
    mac_address: string;
    mqtt_topic: string;
    status: DeviceStatus;
}

export interface ConfigParam {
    area_id: number;
    min_person: number;
    lux_threshold: number;
    override_timeout: number; // Thời gian mặc định cho P1 (phút)
    off_delay: number;        // Thời gian trễ tắt đèn (giây)
}

export interface AreaStatus {
    area_id: number;
    override_until: string | null; // ISO Date string hoặc null
    last_priority: number;         // 1, 2, hoặc 3
    current_mode: AreaMode;
    is_overridden?: boolean;
}

export interface ManualControlPayload {
    minutes: number;
    state: ActionState;
}

export interface AreaHistoryItem {
    history_id?: number;
    area_id?: number;
    timestamp?: string;
    created_at?: string;
    event_type?: string;
    action?: string;
    state?: ActionState;
    source?: string;
    description?: string;
}

export interface Schedule {
    schedule_id: number;
    area_id: number;
    start_time: string; // Định dạng HH:mm:ss
    end_time: string;   // Định dạng HH:mm:ss
    days_of_week: string; // VD: "Mon,Tue,Wed"
    action_state: ActionState;
    is_active: boolean;
}

export interface AreaDetail {
    area_id: number;
    floor_id: number;
    area_name: string;
    area_type: string;
    status: AreaStatus;
    config: ConfigParam;
    devices: Device[];
    active_schedule?: Schedule | null;
    // Dữ liệu thời gian thực từ cảm biến (Real-time data)
    current_person_count?: number;
    current_lux?: number;
}

export interface AreaDetailState {
    area: AreaDetail | null;
    history: AreaHistoryItem[];
}