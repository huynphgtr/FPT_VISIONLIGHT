import React, { useState } from 'react';
import { ArrowLeft, AlertTriangle, Loader2, Settings } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AreaStatusHero from '../components/AreaStatusHero';
import ActivityHistory from '../components/ActivityHistory';
import QuickControlPanel from '../components/QuickControlPanel';
import { useAreaDetail } from '../hooks/useAreaDetail';

const AreaDetail: React.FC = () => {
    const params = useParams<{ areaId: string }>();
    const navigate = useNavigate();
    const areaId = Number(params.areaId);
    const [selectedMinutes, setSelectedMinutes] = useState(30);

    const { area, history, loading, error, actionLoading, actionError, quickControl } = useAreaDetail(areaId);

    if (!Number.isFinite(areaId)) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                ID khu vực không hợp lệ.
            </div>
        );
    }

    if (loading && !area) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
                <Loader2 className="animate-spin" size={32} />
                <span className="ml-3 text-sm">Đang tải chi tiết khu vực...</span>
            </div>
        );
    }

    if (error && !area) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                <p className="font-bold">Không tải được dữ liệu</p>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    if (!area) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
                Không tìm thấy khu vực.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
                    >
                        <ArrowLeft size={16} />
                        Quay về Dashboard
                    </button>
                    <h1 className="text-2xl font-extrabold text-slate-900">{area.area_name}</h1>
                    <p className="text-sm text-slate-500">{area.area_type} • Tầng {area.floor_id}</p>
                </div>

                <Link
                    to={`/areas/${area.area_id}/settings`}
                    className="flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                    <Settings size={16} />
                    Chỉnh cài đặt
                </Link>
            </header>

            {actionError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertTriangle size={16} />
                    Không gửi được lệnh, thử lại nhé: {actionError}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_1fr]">
                <div className="space-y-6">
                    <AreaStatusHero area={area} />

                    <QuickControlPanel
                        selectedMinutes={selectedMinutes}
                        loading={actionLoading}
                        onChangeMinutes={setSelectedMinutes}
                        onTurnOn={() => quickControl(selectedMinutes, 'ON')}
                        onTurnOff={() => quickControl(selectedMinutes, 'OFF')}
                    />
                </div>

                <ActivityHistory items={history} />
            </div>
        </div>
    );
};

export default AreaDetail;
