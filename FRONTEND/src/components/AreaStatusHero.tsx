import React from 'react';
import { Lightbulb, Moon, Timer } from 'lucide-react';
import type { AreaDetail } from '../types/area';
import { getAreaControlState, isAreaLightOn } from '../utils/areaStatus';

const getHeroContent = (area: AreaDetail) => {
    const controlState = getAreaControlState(area);
    const lightOn = isAreaLightOn(area);

    if (controlState === 'MANUAL_ON') {
        return {
            title: 'Đang bật thủ công',
            description: 'Bạn đang can thiệp thủ công. Hệ thống sẽ tự trả về chế độ tự động khi hết thời gian.',
            icon: Lightbulb,
            className: 'border-amber-200 bg-amber-50 text-amber-700'
        };
    }

    if (controlState === 'MANUAL_OFF') {
        return {
            title: 'Đang tắt thủ công',
            description: 'Đèn đang ở trạng thái tắt theo lệnh thủ công.',
            icon: Moon,
            className: 'border-slate-200 bg-slate-100 text-slate-700'
        };
    }

    if (lightOn) {
        return {
            title: 'Đèn đang bật tự động',
            description: 'Hệ thống đang bật đèn theo điều kiện môi trường và hiện diện.',
            icon: Lightbulb,
            className: 'border-blue-200 bg-blue-50 text-blue-700'
        };
    }

    return {
        title: 'Đèn đang tắt',
        description: 'Hệ thống đang giữ đèn tắt vì chưa cần chiếu sáng.',
        icon: Timer,
        className: 'border-slate-200 bg-white text-slate-700'
    };
};

interface AreaStatusHeroProps {
    area: AreaDetail;
}

const AreaStatusHero: React.FC<AreaStatusHeroProps> = ({ area }) => {
    const content = getHeroContent(area);
    const Icon = content.icon;

    return (
        <section className={`rounded-3xl border p-6 ${content.className}`}>
            <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80">
                    <Icon size={34} />
                </div>
                <div>
                    <h2 className="text-xl font-extrabold">{content.title}</h2>
                    <p className="mt-1 text-sm opacity-90">{content.description}</p>
                </div>
            </div>
            {area.status.override_until && (
                <p className="mt-4 text-sm font-semibold">
                    Ghi đè đến: {new Date(area.status.override_until).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                </p>
            )}
        </section>
    );
};

export default AreaStatusHero;
