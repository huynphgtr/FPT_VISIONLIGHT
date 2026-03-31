import { useCallback, useEffect, useMemo, useState } from 'react';
import { areaApi } from '../api/areaApi';
import type { ConfigParam } from '../types/area';

interface SaveState {
    status: 'idle' | 'saving' | 'success' | 'error';
    message: string | null;
}

const defaultConfig: ConfigParam = {
    area_id: 0,
    min_person: 1,
    lux_threshold: 350,
    override_timeout: 60,
    off_delay: 300
};

const isSameConfig = (left: ConfigParam, right: ConfigParam): boolean => {
    return (
        left.min_person === right.min_person &&
        left.lux_threshold === right.lux_threshold &&
        left.off_delay === right.off_delay
    );
};

export const useAreaConfig = (areaId: number) => {
    const [initialConfig, setInitialConfig] = useState<ConfigParam>(defaultConfig);
    const [config, setConfig] = useState<ConfigParam>(defaultConfig);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saveState, setSaveState] = useState<SaveState>({ status: 'idle', message: null });

    const fetchConfig = useCallback(async () => {
        try {
            const areas = await areaApi.getAllAreas();
            const selectedArea = areas.find((area) => area.area_id === areaId);

            if (!selectedArea) {
                throw new Error('Không tìm thấy khu vực cần cấu hình');
            }

            const normalizedConfig: ConfigParam = {
                ...selectedArea.config,
                override_timeout: 60
            };

            setConfig(normalizedConfig);
            setInitialConfig(normalizedConfig);
            setError(null);
        } catch (fetchError: unknown) {
            const message = fetchError instanceof Error ? fetchError.message : 'Không thể tải cấu hình';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [areaId]);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const updateField = useCallback(<K extends keyof ConfigParam>(key: K, value: ConfigParam[K]) => {
        setConfig((current) => ({ ...current, [key]: value }));
        setSaveState({ status: 'idle', message: null });
    }, []);

    const hasChanges = useMemo(() => !isSameConfig(config, initialConfig), [config, initialConfig]);

    const saveConfig = useCallback(async () => {
        setSaveState({ status: 'saving', message: null });

        try {
            const saved = await areaApi.updateConfig(areaId, {
                min_person: config.min_person,
                lux_threshold: config.lux_threshold,
                override_timeout: 60,
                off_delay: config.off_delay
            });

            const normalizedSaved: ConfigParam = {
                ...saved,
                override_timeout: 60
            };

            setConfig(normalizedSaved);
            setInitialConfig(normalizedSaved);
            setSaveState({ status: 'success', message: 'Đã lưu cấu hình thành công' });
        } catch (saveError: unknown) {
            const message = saveError instanceof Error ? saveError.message : 'Không lưu được, thử lại nhé';
            setSaveState({ status: 'error', message });
        }
    }, [areaId, config]);

    return {
        config,
        loading,
        error,
        saveState,
        hasChanges,
        updateField,
        saveConfig,
        reload: fetchConfig
    };
};
