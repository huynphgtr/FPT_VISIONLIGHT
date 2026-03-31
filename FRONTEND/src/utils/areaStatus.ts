import type { AreaDetail, AreaMode, AreaStatus } from '../types/area';

export type AreaControlState = 'AUTO' | 'MANUAL_ON' | 'MANUAL_OFF';

const isManualMode = (mode: AreaMode): boolean => {
    return mode === 'MANUAL_ON' || mode === 'MANUAL_OFF' || mode === 'MANUAL';
};

const isManualOn = (status: AreaStatus): boolean => {
    if (status.current_mode === 'MANUAL_ON') {
        return true;
    }

    if (status.current_mode === 'MANUAL_OFF') {
        return false;
    }

    return status.current_mode === 'MANUAL' && status.last_priority > 0;
};

export const isManualOverrideActive = (status: AreaStatus): boolean => {
    if (status.is_overridden === true) {
        return true;
    }

    if (!isManualMode(status.current_mode) || !status.override_until) {
        return false;
    }

    return new Date(status.override_until).getTime() > Date.now();
};

export const getAreaControlState = (area: AreaDetail): AreaControlState => {
    if (isManualOverrideActive(area.status) || isManualMode(area.status.current_mode)) {
        return isManualOn(area.status) ? 'MANUAL_ON' : 'MANUAL_OFF';
    }

    return 'AUTO';
};

export const isAreaLightOn = (area: AreaDetail): boolean => {
    const controlState = getAreaControlState(area);

    if (controlState === 'MANUAL_ON') {
        return true;
    }

    if (controlState === 'MANUAL_OFF') {
        return false;
    }

    if (area.active_schedule?.action_state === 'ON') {
        return true;
    }

    return area.status.last_priority > 0;
};

export const getAreaControlStateLabel = (state: AreaControlState): string => {
    if (state === 'MANUAL_ON') {
        return 'MANUAL_ON';
    }

    if (state === 'MANUAL_OFF') {
        return 'MANUAL_OFF';
    }

    return 'AUTO';
};
