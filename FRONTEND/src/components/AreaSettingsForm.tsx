import React from 'react';
import { Loader2, Save } from 'lucide-react';
import type { ConfigParam } from '../types/area';

interface AreaSettingsFormProps {
    config: ConfigParam;
    hasChanges: boolean;
    saveStatus: 'idle' | 'saving' | 'success' | 'error';
    saveMessage: string | null;
    onChange: <K extends keyof ConfigParam>(key: K, value: ConfigParam[K]) => void;
    onSave: () => void;
}

const luxOptions: Array<{ value: number; label: string }> = [
    { value: 500, label: 'Chập tối' },
    { value: 350, label: 'Khá tối' },
    { value: 200, label: 'Tối' },
    { value: 100, label: 'Tối hẳn' }
];

const minPersonOptions = [1, 2, 3];

const offDelayOptions = [
    { value: 0, label: 'Tắt ngay' },
    { value: 300, label: '5 phút' },
    { value: 600, label: '10 phút' },
    { value: 1800, label: '30 phút' }
];

const toSliderIndex = (luxThreshold: number): number => {
    const index = luxOptions.findIndex((item) => item.value === luxThreshold);
    return index === -1 ? 1 : index;
};

const AreaSettingsForm: React.FC<AreaSettingsFormProps> = ({
    config,
    hasChanges,
    saveStatus,
    saveMessage,
    onChange,
    onSave
}) => {
    const sliderIndex = toSliderIndex(config.lux_threshold);
    const activeLux = luxOptions[sliderIndex];
    const minPersonIsCustom = !minPersonOptions.includes(config.min_person);
    const luxIsCustom = !luxOptions.some((item) => item.value === config.lux_threshold);
    const offDelayIsCustom = !offDelayOptions.some((item) => item.value === config.off_delay);

    return (
        <div className="mx-auto w-full max-w-2xl space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-base font-bold text-slate-900">1. Cần bao nhiêu người để bật đèn?</h3>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {minPersonOptions.map((value) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => onChange('min_person', value)}
                            className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                                config.min_person === value
                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                        >
                            {value === 1 ? '1 người' : `${value} người`}
                        </button>
                    ))}
                </div>

                <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nhập số người tùy chỉnh</p>
                    <div className="mt-2 flex items-center gap-3">
                        <input
                            type="number"
                            min={1}
                            max={200}
                            value={config.min_person}
                            onChange={(event) => {
                                const value = Number(event.target.value);
                                if (Number.isFinite(value) && value >= 1) {
                                    onChange('min_person', Math.floor(value));
                                }
                            }}
                            className="h-11 w-28 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <span className="text-sm text-slate-600">người</span>
                        {minPersonIsCustom && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Giá trị nhập tay</span>
                        )}
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-base font-bold text-slate-900">2. Mức ánh sáng để bật đèn</h3>
                <p className="mt-1 text-sm text-slate-500">
                    Mức hiện tại: {luxIsCustom ? 'Nhập tay' : activeLux.label} ({config.lux_threshold} lux)
                </p>
                <input
                    type="range"
                    min={0}
                    max={luxOptions.length - 1}
                    step={1}
                    value={sliderIndex}
                    onChange={(event) => onChange('lux_threshold', luxOptions[Number(event.target.value)].value)}
                    className="mt-4 w-full"
                />
                <div className="mt-2 flex justify-between text-xs text-slate-400">
                    {luxOptions.map((option) => (
                        <span key={option.value}>{option.label}</span>
                    ))}
                </div>

                <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nhập lux tùy chỉnh</p>
                    <div className="mt-2 flex items-center gap-3">
                        <input
                            type="number"
                            min={1}
                            max={5000}
                            value={config.lux_threshold}
                            onChange={(event) => {
                                const value = Number(event.target.value);
                                if (Number.isFinite(value) && value >= 1) {
                                    onChange('lux_threshold', Math.floor(value));
                                }
                            }}
                            className="h-11 w-32 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <span className="text-sm text-slate-600">lux</span>
                        {luxIsCustom && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Giá trị nhập tay</span>
                        )}
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-base font-bold text-slate-900">4. Trễ tắt đèn khi không còn người</h3>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {offDelayOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onChange('off_delay', option.value)}
                            className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                                config.off_delay === option.value
                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nhập thời gian trễ tùy chỉnh</p>
                    <div className="mt-2 flex items-center gap-3">
                        <input
                            type="number"
                            min={0}
                            max={7200}
                            value={config.off_delay}
                            onChange={(event) => {
                                const value = Number(event.target.value);
                                if (Number.isFinite(value) && value >= 0) {
                                    onChange('off_delay', Math.floor(value));
                                }
                            }}
                            className="h-11 w-32 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <span className="text-sm text-slate-600">giây</span>
                        {offDelayIsCustom && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Giá trị nhập tay</span>
                        )}
                    </div>
                </div>
            </section>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                {saveStatus === 'error' && saveMessage && (
                    <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{saveMessage}</p>
                )}
                {saveStatus === 'success' && saveMessage && (
                    <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{saveMessage}</p>
                )}

                <button
                    type="button"
                    onClick={onSave}
                    disabled={saveStatus === 'saving' || !hasChanges}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    {saveStatus === 'saving' ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saveStatus === 'saving' ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
            </div>
        </div>
    );
};

export default AreaSettingsForm;
