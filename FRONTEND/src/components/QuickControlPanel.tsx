import React from 'react';
import { Lightbulb, Moon, Loader2 } from 'lucide-react';

const durationOptions = [
    { label: '30 phút', value: 30 },
    { label: '1 tiếng', value: 60 },
    { label: '2 tiếng', value: 120 }
];

interface QuickControlPanelProps {
    selectedMinutes: number;
    disabled?: boolean;
    loading?: boolean;
    onChangeMinutes: (minutes: number) => void;
    onTurnOn: () => void;
    onTurnOff: () => void;
}

const QuickControlPanel: React.FC<QuickControlPanelProps> = ({
    selectedMinutes,
    disabled = false,
    loading = false,
    onChangeMinutes,
    onTurnOn,
    onTurnOff
}) => {
    const usingCustomValue = !durationOptions.some((option) => option.value === selectedMinutes);

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-base font-bold text-slate-900">Điều khiển thủ công trong bao lâu?</h3>
            <p className="mt-1 text-sm text-slate-500">Chọn nhanh hoặc nhập số phút để hệ thống tự trở về chế độ tự động.</p>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {durationOptions.map((option) => {
                    const isActive = option.value === selectedMinutes;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onChangeMinutes(option.value)}
                            disabled={disabled || loading}
                            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                                isActive
                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>

            <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nhập thời gian tùy chỉnh</p>
                <div className="mt-2 flex items-center gap-3">
                    <input
                        type="number"
                        min={1}
                        max={1440}
                        value={selectedMinutes}
                        onChange={(event) => {
                            const nextValue = Number(event.target.value);
                            if (Number.isFinite(nextValue) && nextValue > 0) {
                                onChangeMinutes(nextValue);
                            }
                        }}
                        disabled={disabled || loading}
                        className="h-11 w-28 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                    <span className="text-sm text-slate-600">phút</span>
                    {usingCustomValue && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                            Đang dùng giá trị nhập tay
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                    type="button"
                    onClick={onTurnOn}
                    disabled={disabled || loading}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 text-sm font-bold text-slate-900 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Lightbulb size={18} />}
                    Bật đèn
                </button>
                <button
                    type="button"
                    onClick={onTurnOff}
                    disabled={disabled || loading}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Moon size={18} />}
                    Tắt đèn ngay
                </button>
            </div>
        </section>
    );
};

export default QuickControlPanel;
