import React from 'react';
import {
    Lightbulb,
    Users,
    Sun,
    Eye,
    Settings,
    Clock,
    Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AreaDetail } from '../types/area';
import { getAreaControlState, getAreaControlStateLabel, isAreaLightOn } from '../utils/areaStatus';

interface AreaControlCardProps {
    area: AreaDetail;
    isPending?: boolean;
    onQuickControl: (area: AreaDetail) => void;
}

const AreaControlCard: React.FC<AreaControlCardProps> = ({ area, isPending = false, onQuickControl }) => {
    const controlState = getAreaControlState(area);
    const isLightOn = isAreaLightOn(area);
    const isManualOn = controlState === 'MANUAL_ON';
    const isAuto = controlState === 'AUTO';
    // Hàm helper để render Badge chế độ (Priority Logic)
    const renderModeBadge = (mode: string) => {
        const styles = {
            AUTO: 'bg-blue-100 text-blue-700 border-blue-200',
            MANUAL_ON: 'bg-amber-100 text-amber-700 border-amber-200',
            MANUAL_OFF: 'bg-slate-200 text-slate-700 border-slate-300',
            SCHEDULE: 'bg-purple-100 text-purple-700 border-purple-200',
            MANUAL: 'bg-amber-100 text-amber-700 border-amber-200',
        };
        return (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles[mode as keyof typeof styles]}`}>
                {mode}
            </span>
        );
    };

    return (
        <div className={`relative group p-5 rounded-2xl transition-all duration-300 border-2 
            ${isManualOn
                                ? 'bg-white border-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.22)]'
                                : isAuto
                                    ? 'bg-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                    : 'bg-gray-50 border-white hover:border-slate-100'
            }`}>

            {/* Header: Name & Config Icon */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{area.area_name}</h3>
                    <div className="flex gap-2 mt-1">
                        {renderModeBadge(getAreaControlStateLabel(controlState))}
                    </div>
                </div>
                <Link
                    to={`/areas/${area.area_id}/settings`}
                    className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                    <Settings size={18} />
                </Link>
            </div>

            {/* Sensor Data (P3 AI Info) */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-100">
                    <Users size={16} className="text-blue-500" />
                    <span className="text-sm font-medium text-gray-600">
                        {area.current_person_count ?? 0} <span className="text-[10px] text-gray-400">người</span>
                    </span>
                </div>
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-100">
                    <Sun size={16} className="text-orange-400" />
                    <span className="text-sm font-medium text-gray-600">
                        {area.current_lux ?? 0} <span className="text-[10px] text-gray-400">lux</span>
                    </span>
                </div>
            </div>

            {/* Priority Info (P1/P2 Details) */}
            {(controlState === 'MANUAL_ON' || controlState === 'MANUAL_OFF') && area.status.override_until && (
                <div className="flex items-center gap-2 mb-4 text-xs text-red-500 font-medium italic">
                    <Clock size={12} />
                    Ghi đè đến: {new Date(area.status.override_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            )}

            {/* Main Action (P1 Control) */}
            {/* <div className="flex gap-2">
                <button
                    onClick={() => onToggle(area.area_id, 30, isLightOn ? 'OFF' : 'ON')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition-all
            ${isLightOn
                            ? 'bg-yellow-400 text-white hover:bg-yellow-500'
                            : 'bg-gray-800 text-white hover:bg-black'
                        }`}
                >
                    {isLightOn ? <ZapOff size={18} /> : <Zap size={18} />}
                    {isLightOn ? 'Tắt' : 'Bật'}
                </button>
            </div>
 */}
            <div className="flex gap-2">
                <Link
                    to={`/areas/${area.area_id}`}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100"
                >
                    <Eye size={16} />
                    Chi tiết
                </Link>
                <button
                    type="button"
                    onClick={() => onQuickControl(area)}
                    disabled={isPending}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-bold transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-60
                        ${isLightOn
                            ? 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-gray-900 text-white hover:bg-black'
                        }`}
                >
                    <Zap size={18} />
                    <span>{isLightOn ? 'Điều khiển' : 'Bật/Tắt'}</span>
                </button>
            </div>

            {/* Indicator Lightbulb - Thêm hiệu ứng phát sáng khi On */}
            <div className="absolute bottom-4 right-4 opacity-10">
                <Lightbulb
                    size={60}
                    className={`${isLightOn ? 'text-yellow-500 fill-yellow-500 blur-[2px]' : 'text-gray-300'}`}
                />
            </div>

            {/* Visual Indicator Background */}
            {/* <div className="absolute bottom-4 right-4 opacity-10">
                <Lightbulb size={60} className={isLightOn ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
             </div> */}
        </div>
    );
};

export default AreaControlCard;