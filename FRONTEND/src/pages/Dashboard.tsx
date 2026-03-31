import React, { useMemo, useState } from 'react';
import { useAreas } from '../hooks/useAreas';
import AreaControlCard from '../components/AreaControlCard';
import QuickControlSheet from '../components/QuickControlSheet';
import { AlertTriangle, Bell, Loader2, Search } from 'lucide-react';
import type { AreaDetail } from '../types/area';
import { getAreaControlState, isAreaLightOn, isManualOverrideActive } from '../utils/areaStatus';

type FilterTab = 'ALL' | 'ON' | 'OFF' | 'INTERVENTION';

const isInterventionActive = (area: AreaDetail): boolean => {
    return isManualOverrideActive(area.status);
};

const isAreaOn = (area: AreaDetail): boolean => {
    return isAreaLightOn(area);
};

const Dashboard: React.FC = () => {
    const { areas, loading, error, lastActionError, pendingAreaIds, handleToggle } = useAreas();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTab, setSelectedTab] = useState<FilterTab>('ALL');
    const [selectedMinutes, setSelectedMinutes] = useState(30);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedArea, setSelectedArea] = useState<AreaDetail | null>(null);

    const hasIntervention = useMemo(() => areas.some(isInterventionActive), [areas]);

    const stats = useMemo(() => {
        const onCount = areas.filter((area) => isAreaOn(area)).length;
        const offCount = Math.max(areas.length - onCount, 0);
        const interventionCount = areas.filter(isInterventionActive).length;
        return { onCount, offCount, interventionCount };
    }, [areas]);

    const filteredAreas = useMemo(() => {
        return areas.filter(area => {
            const matchesSearch = area.area_name.toLowerCase().includes(searchTerm.toLowerCase());
            const areaOn = isAreaOn(area);

            if (!matchesSearch) {
                return false;
            }

            if (selectedTab === 'ON') {
                return areaOn;
            }

            if (selectedTab === 'OFF') {
                return !areaOn;
            }

            if (selectedTab === 'INTERVENTION') {
                return isInterventionActive(area);
            }

            return true;
        });
    }, [areas, searchTerm, selectedTab]);

    const openQuickControl = (area: AreaDetail) => {
        setSelectedArea(area);
        setSelectedMinutes(30);
        setIsSheetOpen(true);
    };

    const submitQuickControl = async (state: 'ON' | 'OFF') => {
        if (!selectedArea) {
            return;
        }

        try {
            await handleToggle(selectedArea.area_id, selectedMinutes, state);
            setIsSheetOpen(false);
        } catch {
            // Rollback và lỗi đã được xử lý trong hook.
        }
    };

    if (loading && areas.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-gray-500">
                <Loader2 className="animate-spin mb-4" size={40} />
                <p className="animate-pulse">Đang tải dữ liệu từ hệ thống AI...</p>
            </div>
        );
    }

    if (error && areas.length === 0) {
        return (
            <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl m-4 border border-red-100">
                <p className="font-bold">Lỗi kết nối Backend</p>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Xin chào, hôm nay khu vực đang như sau</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                </div>

                <button type="button" className="relative rounded-xl border border-slate-200 bg-white p-3 text-slate-600">
                    <Bell size={18} />
                    {stats.interventionCount > 0 && (
                        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                            {stats.interventionCount}
                        </span>
                    )}
                </button>
            </header>

            {error && areas.length > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    <AlertTriangle size={16} />
                    Mất kết nối, dữ liệu có thể chưa cập nhật: {error}
                </div>
            )}

            {lastActionError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertTriangle size={16} />
                    {lastActionError}
                </div>
            )}

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Khu vực đèn đang bật</p>
                    <p className="mt-2 text-3xl font-extrabold text-amber-700">{stats.onCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-100 px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Khu vực đèn đang tắt</p>
                    <p className="mt-2 text-3xl font-extrabold text-slate-700">{stats.offCount}</p>
                </div>
            </section>

            <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex w-full gap-2 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setSelectedTab('ALL')}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${selectedTab === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Tất cả
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedTab('ON')}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${selectedTab === 'ON' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Đang bật
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedTab('OFF')}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${selectedTab === 'OFF' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Đang tắt
                    </button>
                    {hasIntervention && (
                        <button
                            type="button"
                            onClick={() => setSelectedTab('INTERVENTION')}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${selectedTab === 'INTERVENTION' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            Đang can thiệp
                        </button>
                    )}
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm khu vực..."
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm transition-all focus:ring-2 focus:ring-blue-100"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </section>

            <main>
                {filteredAreas.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {filteredAreas.map(area => (
                            <AreaControlCard
                                key={area.area_id}
                                area={area}
                                isPending={pendingAreaIds.includes(area.area_id)}
                                onQuickControl={openQuickControl}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                        <p className="text-gray-400">Không tìm thấy khu vực nào khớp với yêu cầu</p>
                    </div>
                )}
            </main>

            <QuickControlSheet
                open={isSheetOpen && Boolean(selectedArea)}
                areaName={selectedArea?.area_name ?? ''}
                statusText={
                    selectedArea
                        ? getAreaControlState(selectedArea) === 'MANUAL_ON'
                            ? 'Đang bật thủ công'
                            : getAreaControlState(selectedArea) === 'MANUAL_OFF'
                                ? 'Đang tắt thủ công'
                                : isAreaOn(selectedArea)
                                    ? 'Đang bật tự động'
                                    : 'Đang tắt tự động'
                        : 'Đang tải trạng thái'
                }
                selectedMinutes={selectedMinutes}
                loading={selectedArea ? pendingAreaIds.includes(selectedArea.area_id) : false}
                onClose={() => setIsSheetOpen(false)}
                onChangeMinutes={setSelectedMinutes}
                onTurnOn={() => submitQuickControl('ON')}
                onTurnOff={() => submitQuickControl('OFF')}
            />
        </div>
    );
};

export default Dashboard;