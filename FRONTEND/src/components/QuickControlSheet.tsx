import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import QuickControlPanel from './QuickControlPanel';

interface QuickControlSheetProps {
    open: boolean;
    areaName: string;
    statusText: string;
    selectedMinutes: number;
    loading?: boolean;
    onClose: () => void;
    onChangeMinutes: (minutes: number) => void;
    onTurnOn: () => void;
    onTurnOff: () => void;
}

const QuickControlSheet: React.FC<QuickControlSheetProps> = ({
    open,
    areaName,
    statusText,
    selectedMinutes,
    loading = false,
    onClose,
    onChangeMinutes,
    onTurnOn,
    onTurnOff
}) => {
    useEffect(() => {
        if (!open) {
            return;
        }

        const onEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', onEsc);
        return () => window.removeEventListener('keydown', onEsc);
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-3 sm:items-center" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-xl rounded-3xl bg-slate-50 p-4 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="mb-3 flex items-start justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-900">{areaName}</p>
                        <p className="text-xs text-slate-500">{statusText}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200"
                    >
                        <X size={18} />
                    </button>
                </div>

                <QuickControlPanel
                    selectedMinutes={selectedMinutes}
                    loading={loading}
                    onChangeMinutes={onChangeMinutes}
                    onTurnOn={onTurnOn}
                    onTurnOff={onTurnOff}
                />
            </div>
        </div>
    );
};

export default QuickControlSheet;
