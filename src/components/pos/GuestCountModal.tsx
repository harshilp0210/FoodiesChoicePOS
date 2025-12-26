import { useState } from 'react';
import { Users } from 'lucide-react';

interface GuestCountModalProps {
    onConfirm: (count: number) => void;
    onCancel: () => void;
    tableName: string;
}

export default function GuestCountModal({ onConfirm, onCancel, tableName }: GuestCountModalProps) {
    const [count, setCount] = useState(2);

    const handleConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(count);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="p-6 bg-slate-800 border-b border-slate-700">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        Table {tableName}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">How many guests are dining?</p>
                </div>

                <form onSubmit={handleConfirm} className="p-6 space-y-6">
                    <div className="flex items-center justify-center gap-4">
                        <button
                            type="button"
                            onClick={() => setCount(Math.max(1, count - 1))}
                            className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-2xl font-bold transition-colors"
                        >-</button>

                        <div className="w-24 text-center">
                            <span className="text-4xl font-bold font-mono">{count}</span>
                            <p className="text-xs text-slate-500 uppercase font-bold mt-1">Covers</p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setCount(Math.min(20, count + 1))}
                            className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-2xl font-bold transition-colors"
                        >+</button>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4, 5, 6, 8, 10].map(num => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => setCount(num)}
                                className={`py-2 rounded border text-sm font-bold transition-all ${count === num
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                                    }`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-lg shadow-primary/20"
                        >
                            Open Table
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
