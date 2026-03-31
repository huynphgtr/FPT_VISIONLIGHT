import React from 'react';
import { Clock3 } from 'lucide-react';
import type { AreaHistoryItem } from '../types/area';

const getTimeValue = (item: AreaHistoryItem): number => {
    return new Date(item.timestamp ?? item.created_at ?? 0).getTime();
};

const formatDateGroup = (rawTime: number): string => {
    const date = new Date(rawTime);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;

    if (dateKey === todayKey) {
        return 'Hôm nay';
    }
    if (dateKey === yesterdayKey) {
        return 'Hôm qua';
    }

    return date.toLocaleDateString('vi-VN');
};

const getDescription = (item: AreaHistoryItem): string => {
    if (item.description) {
        return item.description;
    }

    if (item.action === 'ON' || item.state === 'ON') {
        return 'Đèn đã được bật';
    }

    if (item.action === 'OFF' || item.state === 'OFF') {
        return 'Đèn đã được tắt';
    }

    return item.event_type ?? 'Có thay đổi trạng thái';
};

interface ActivityHistoryProps {
    items: AreaHistoryItem[];
}

const ActivityHistory: React.FC<ActivityHistoryProps> = ({ items }) => {
    if (items.length === 0) {
        return (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-base font-bold text-slate-900">Lịch sử hoạt động</h3>
                <p className="mt-3 text-sm text-slate-500">Chưa có bản ghi hoạt động cho khu vực này.</p>
            </section>
        );
    }

    const sorted = [...items].sort((a, b) => getTimeValue(b) - getTimeValue(a));

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Lịch sử hoạt động</h3>
                <span className="text-xs text-slate-500">20 bản ghi gần nhất</span>
            </div>

            <div className="space-y-5">
                {sorted.map((item, index) => {
                    const timeValue = getTimeValue(item);
                    const currentGroup = formatDateGroup(timeValue);
                    const previousGroup = index > 0 ? formatDateGroup(getTimeValue(sorted[index - 1])) : null;
                    const shouldShowGroup = index === 0 || currentGroup !== previousGroup;

                    return (
                        <div key={`${item.history_id ?? index}-${timeValue}`}>
                            {shouldShowGroup && (
                                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{currentGroup}</p>
                            )}
                            <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                                <div className="mt-0.5 rounded-full bg-white p-2 text-slate-500 shadow-sm">
                                    <Clock3 size={14} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">{getDescription(item)}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {new Date(timeValue).toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default ActivityHistory;
