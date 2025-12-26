import { useState, useEffect } from 'react';
import { getServerShiftStats, closeServerShift, ShiftStats } from '@/lib/actions';
import { format } from 'date-fns';
import { Loader2, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';

interface ServerCheckoutModalProps {
    employeeId: string;
    onClose: () => void;
}

export default function ServerCheckoutModal({ employeeId, onClose }: ServerCheckoutModalProps) {
    const [step, setStep] = useState<'blind' | 'report'>('blind');
    const [cashDrop, setCashDrop] = useState('');
    const [declaredTips, setDeclaredTips] = useState('');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<ShiftStats | null>(null);
    const [error, setError] = useState('');

    const handleGenerateReport = async () => {
        setLoading(true);
        setError('');
        try {
            // Assume shift started today 00:00 for simplicity or fetch actual clock-in time
            // Ideally we pass clock-in time.
            const stats = await getServerShiftStats(employeeId, new Date(new Date().setHours(0, 0, 0, 0)));
            setStats(stats);
            setStep('report');
        } catch (err) {
            console.error(err);
            setError("Failed to generate report. Checks logs.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmClose = async () => {
        setLoading(true);
        try {
            await closeServerShift(employeeId, parseFloat(cashDrop) || 0, parseFloat(declaredTips) || 0);
            alert("Shift Closed Successfully. Z-Report generated.");
            onClose();
        } catch (err) {
            alert("Error closing shift");
        } finally {
            setLoading(false);
        }
    };

    const cashDropNum = parseFloat(cashDrop) || 0;
    const difference = stats ? cashDropNum - stats.expectedCash : 0;
    const isShort = difference < 0;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 text-slate-50 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">Server Checkout</h2>
                        <p className="text-xs text-slate-400">Blind Drop & Reconciliation</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {step === 'blind' && (
                        <div className="space-y-6">
                            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                <p className="text-sm text-slate-300 mb-2 font-medium">Step 1: Count your Cash</p>
                                <p className="text-xs text-slate-500 mb-4">Enter the total cash in your drawer (excluding starting bank).</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Cash Drop ($)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="number"
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-10 text-lg font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                                placeholder="0.00"
                                                value={cashDrop}
                                                onChange={e => setCashDrop(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Declared Cash Tips ($)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="number"
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-10 text-lg font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                                placeholder="0.00"
                                                value={declaredTips}
                                                onChange={e => setDeclaredTips(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleGenerateReport}
                                disabled={loading || !cashDrop}
                                className="w-full py-4 bg-primary hover:bg-primary/90 rounded-xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "Verify & Generate Report"}
                            </button>
                        </div>
                    )}

                    {step === 'report' && stats && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            {/* Overage/Shortage Alert */}
                            <div className={`p-4 rounded-lg border flex items-start gap-3 ${difference === 0 ? 'bg-green-500/10 border-green-500/50 text-green-400' :
                                isShort ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400'
                                }`}>
                                {difference === 0 ? <CheckCircle className="shrink-0" /> : <AlertTriangle className="shrink-0" />}
                                <div>
                                    <h3 className="font-bold text-lg">
                                        {difference === 0 ? 'Perfect Balance' : isShort ? 'Shortage Detected' : 'Overage Detected'}
                                    </h3>
                                    <p className="text-xl font-mono font-bold mt-1">
                                        {difference > 0 ? '+' : ''}{difference.toFixed(2)}
                                    </p>
                                    <p className="text-xs opacity-70 mt-1">
                                        Expected: ${stats.expectedCash.toFixed(2)} | Counted: ${cashDropNum.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            {/* Revenue Breakdown */}
                            <div className="space-y-2 text-sm">
                                <h4 className="text-xs uppercase text-slate-500 font-bold border-b border-slate-700 pb-1">Revenue Summary</h4>
                                <div className="flex justify-between"><span>Total Sales</span> <span>${stats.totalSales.toFixed(2)}</span></div>
                                <div className="flex justify-between pl-4 text-slate-400"><span>Food</span> <span>${stats.foodSales?.toFixed(2) || '0.00'}</span></div>
                                <div className="flex justify-between pl-4 text-slate-400"><span>Beverage</span> <span>${stats.beverageSales?.toFixed(2) || '0.00'}</span></div>
                                <div className="flex justify-between text-slate-400"><span>(Cash: ${stats.cashSales.toFixed(2)} | Card: ${stats.creditSales.toFixed(2)})</span></div>
                            </div>

                            {/* Tip Pool */}
                            <div className="space-y-2 text-sm bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                <h4 className="text-xs uppercase text-slate-500 font-bold border-b border-slate-700 pb-1 mb-2">Tip Distribution</h4>
                                <div className="flex justify-between"><span>Total Collect Tips</span> <span>${stats.totalTips.toFixed(2)}</span></div>
                                <div className="flex justify-between text-red-400"><span>- Busser Pool (3%)</span> <span>-${stats.tipOuts.busser.toFixed(2)}</span></div>
                                <div className="flex justify-between text-red-400"><span>- Bar Pool (1%)</span> <span>-${stats.tipOuts.bar.toFixed(2)}</span></div>
                                <div className="flex justify-between text-red-400"><span>- Runner Pool (2%)</span> <span>-${stats.tipOuts.runner.toFixed(2)}</span></div>
                                <div className="border-t border-slate-600 pt-2 mt-2 flex justify-between font-bold text-lg text-primary">
                                    <span>Net Tips to You</span>
                                    <span>${stats.netTips.toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleConfirmClose}
                                disabled={loading}
                                className="w-full py-4 bg-green-600 hover:bg-green-700 rounded-xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "Confirm & Clock Out"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
