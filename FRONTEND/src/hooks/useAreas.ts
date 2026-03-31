import { useState, useEffect, useCallback } from 'react';
import type { AreaDetail } from '../types/area';
import { areaApi } from '../api/areaApi';

export const useAreas = () => {
    const [areas, setAreas] = useState<AreaDetail[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [lastActionError, setLastActionError] = useState<string | null>(null);
    const [pendingAreaIds, setPendingAreaIds] = useState<number[]>([]);

    // 1. Fetching Logic: Lấy dữ liệu từ Backend
    const fetchAreas = useCallback(async () => {
        try {
            // Chỉ set loading true ở lần đầu tiên để tránh nháy màn hình khi auto-refresh
            const data = await areaApi.getAllAreas();
            setAreas(data);
            setError(null);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Không thể kết nối đến máy chủ';
            setError(message);
            console.error('Fetch Areas Error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // 2. Auto-refresh: Cập nhật dữ liệu AI thời gian thực mỗi 10 giây
    useEffect(() => {
        fetchAreas(); 
        
        const intervalId = setInterval(() => {
            fetchAreas();
        }, 10000); // 10 giây

        // Cleanup function: Xóa interval khi component bị unmount
        return () => clearInterval(intervalId);
    }, [fetchAreas]);

    // 3. Actions: Xử lý ghi đè thủ công (P1)
    const handleToggle = async (areaId: number, minutes: number, state: 'ON' | 'OFF') => {
        const now = Date.now();
        const snapshot = areas;

        setPendingAreaIds((prev) => (prev.includes(areaId) ? prev : [...prev, areaId]));
        setLastActionError(null);

        setAreas((currentAreas) =>
            currentAreas.map((area) => {
                if (area.area_id !== areaId) {
                    return area;
                }

                const nextOverrideUntil = state === 'ON'
                    ? new Date(now + minutes * 60 * 1000).toISOString()
                    : null;

                return {
                    ...area,
                    status: {
                        ...area.status,
                        current_mode: state === 'ON' ? 'MANUAL_ON' : 'MANUAL_OFF',
                        last_priority: state === 'ON' ? 1 : 0,
                        is_overridden: true,
                        override_until: nextOverrideUntil
                    }
                };
            })
        );

        try {
            await areaApi.toggleManualOverride(areaId, minutes, state);
            await fetchAreas();
        } catch (err: unknown) {
            setAreas(snapshot);
            const message = err instanceof Error ? err.message : 'Vui lòng thử lại';
            setLastActionError(`Lỗi khi thực hiện ghi đè: ${message}`);
            throw err;
        } finally {
            setPendingAreaIds((prev) => prev.filter((id) => id !== areaId));
        }
    };

    return {
        areas,
        loading,
        error,
        lastActionError,
        pendingAreaIds,
        refresh: fetchAreas,
        handleToggle
    };
};