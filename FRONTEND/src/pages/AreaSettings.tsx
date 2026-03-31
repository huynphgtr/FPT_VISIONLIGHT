import React from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import AreaSettingsForm from '../components/AreaSettingsForm';
import { useAreaConfig } from '../hooks/useAreaConfig';

const AreaSettings: React.FC = () => {
    const params = useParams<{ areaId: string }>();
    const areaId = Number(params.areaId);

    const { config, loading, error, saveState, hasChanges, updateField, saveConfig } = useAreaConfig(areaId);

    if (!Number.isFinite(areaId)) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                ID khu vực không hợp lệ.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
                <Loader2 className="animate-spin" size={32} />
                <span className="ml-3 text-sm">Đang tải cài đặt khu vực...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                <p className="font-bold">Không tải được cài đặt</p>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <header>
                <Link
                    to={`/areas/${areaId}`}
                    className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
                >
                    <ArrowLeft size={16} />
                    Quay về chi tiết khu vực
                </Link>
                <h1 className="text-2xl font-extrabold text-slate-900">Cài đặt khu vực</h1>
                <p className="text-sm text-slate-500">Tinh chỉnh hành vi tự động theo nhu cầu sử dụng thực tế.</p>
            </header>

            <AreaSettingsForm
                config={config}
                hasChanges={hasChanges}
                saveStatus={saveState.status}
                saveMessage={saveState.message}
                onChange={updateField}
                onSave={saveConfig}
            />
        </div>
    );
};

export default AreaSettings;
