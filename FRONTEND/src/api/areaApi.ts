import api from './axios'; // Import instance dùng chung
import type {
    AreaDetail,
    AreaHistoryItem,
    AreaStatus,
    ConfigParam,
    ManualControlPayload
} from '../types/area';

/**
 * API Service cho các nghiệp vụ liên quan đến (Area)
 */
export const areaApi = {

    /**
     * Lấy danh sách toàn bộ khu vực kèm trạng thái thực tế
     */
    getAllAreas: async (): Promise<AreaDetail[]> => {
        try {
            // Sử dụng trực tiếp instance 'api' đã được cấu hình
            const response = await api.get<AreaDetail[]>('/api/areas/status');
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy danh sách khu vực:', error);
            throw error;
        }
    },

    /**
     * Kích hoạt mức ưu tiên P1 (Manual Override)
     */
    toggleManualOverride: async (
        areaId: number,
        minutes: number,
        state: 'ON' | 'OFF'
    ): Promise<AreaStatus> => {
        try {
            const payload: ManualControlPayload = {
                minutes,
                state
            };
            const response = await api.post<AreaStatus>(`/api/areas/${areaId}/manual`, payload);
            return response.data;
        } catch (error) {
            console.error(`Lỗi ghi đè thủ công khu vực ${areaId}:`, error);
            throw error;
        }
    },

    /**
     * Cập nhật các tham số cấu hình AI (min_person, off_delay) cho P3
     */
    updateConfig: async (
        areaId: number,
        configData: Partial<ConfigParam>
    ): Promise<ConfigParam> => {
        try {
            const response = await api.put<ConfigParam>(`/api/areas/${areaId}/config`, configData);
            return response.data;
        } catch (error) {
            console.error(`Lỗi cập nhật cấu hình khu vực ${areaId}:`, error);
            throw error;
        }
    },

    /**
     * Lấy nhật ký hoạt động từ history_log
     */
    getAreaHistory: async (areaId: number): Promise<AreaHistoryItem[]> => {
        try {
            const response = await api.get<AreaHistoryItem[]>(`/api/areas/${areaId}/history`);
            return response.data;
        } catch (error) {
            console.error(`Lỗi lấy lịch sử khu vực ${areaId}:`, error);
            throw error;
        }
    }
};