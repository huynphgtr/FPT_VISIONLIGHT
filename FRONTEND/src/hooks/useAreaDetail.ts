import { useCallback, useEffect, useMemo, useState } from 'react';
import { areaApi } from '../api/areaApi';
import type { AreaDetail, AreaDetailState, AreaHistoryItem } from '../types/area';
import { isManualOverrideActive } from '../utils/areaStatus';

const HISTORY_LIMIT = 20;

const isInterventionActive = (area: AreaDetail): boolean => {
    return isManualOverrideActive(area.status);
};

const normalizeHistory = (items: AreaHistoryItem[]): AreaHistoryItem[] => {
    return [...items]
        .sort((a, b) => {
            const aTime = new Date(a.timestamp ?? a.created_at ?? 0).getTime();
            const bTime = new Date(b.timestamp ?? b.created_at ?? 0).getTime();
            return bTime - aTime;
        })
        .slice(0, HISTORY_LIMIT);
};

export const useAreaDetail = (areaId: number) => {
    const [state, setState] = useState<AreaDetailState>({ area: null, history: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const fetchArea = useCallback(async () => {
        try {
            const [areas, history] = await Promise.all([
                areaApi.getAllAreas(),
                areaApi.getAreaHistory(areaId)
            ]);

            const selectedArea = areas.find((item) => item.area_id === areaId) ?? null;

            setState({
                area: selectedArea,
                history: normalizeHistory(history)
            });
            setError(null);
        } catch (fetchError: unknown) {
            const message = fetchError instanceof Error ? fetchError.message : 'Không thể tải dữ liệu khu vực';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [areaId]);

    useEffect(() => {
        fetchArea();

        const intervalId = window.setInterval(fetchArea, 10000);
        return () => window.clearInterval(intervalId);
    }, [fetchArea]);

    const quickControl = useCallback(
        async (minutes: number, stateValue: 'ON' | 'OFF') => {
            if (!state.area) {
                return;
            }

            const previousArea = state.area;
            const optimisticArea: AreaDetail = {
                ...previousArea,
                status: {
                    ...previousArea.status,
                    current_mode: stateValue === 'ON' ? 'MANUAL_ON' : 'MANUAL_OFF',
                    last_priority: stateValue === 'ON' ? 1 : 0,
                    is_overridden: true,
                    override_until: new Date(Date.now() + minutes * 60 * 1000).toISOString()
                }
            };

            setActionLoading(true);
            setActionError(null);
            setState((current) => ({ ...current, area: optimisticArea }));

            try {
                await areaApi.toggleManualOverride(areaId, minutes, stateValue);
                await fetchArea();
            } catch (mutationError: unknown) {
                const message = mutationError instanceof Error ? mutationError.message : 'Không gửi được lệnh';
                setActionError(message);
                setState((current) => ({ ...current, area: previousArea }));
            } finally {
                setActionLoading(false);
            }
        },
        [areaId, fetchArea, state.area]
    );

    const isAreaUnderIntervention = useMemo(() => {
        if (!state.area) {
            return false;
        }
        return isInterventionActive(state.area);
    }, [state.area]);

    return {
        area: state.area,
        history: state.history,
        loading,
        error,
        actionLoading,
        actionError,
        isAreaUnderIntervention,
        refresh: fetchArea,
        quickControl
    };
};
