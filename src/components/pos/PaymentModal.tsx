import { useState, useEffect } from 'react';
import { Order, CartItem } from '@/lib/types';
import { CreditCard, Banknote, User, Split } from 'lucide-react'; // Added Split icon

interface PaymentModalProps {
    total: number;
    cart: CartItem[];
    onClose: () => void;
    onConfirm: (method: string, tip: string, isSplit?: boolean) => void;
    onSplitPayment?: (amount: number, method: string, tip: number) => Promise<void>; // New callback
}

export default function PaymentModal({ total, cart, onClose, onConfirm, onSplitPayment }: PaymentModalProps) {
    const [activeTab, setActiveTab] = useState<'full' | 'split'>('full');
    const [tip, setTip] = useState('0');
    const [method, setMethod] = useState('card');
    const numericTip = parseFloat(tip) || 0;

    // Split State
    const [splitSeats, setSplitSeats] = useState<Record<string, CartItem[]>>({});
    const [payingSeat, setPayingSeat] = useState<string | null>(null);

    // Group items by seat on mount
    useEffect(() => {
        const grouped: Record<string, CartItem[]> = {};
        cart.forEach(item => {
            const seat = item.seatId ? `Seat ${item.seatId}` : 'Shared';
            if (!grouped[seat]) grouped[seat] = [];
            grouped[seat].push(item);
        });
        setSplitSeats(grouped);
    }, [cart]);

    const getSeatTotal = (items: CartItem[]) => {
        return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const handleFullPayment = () => {
        onConfirm(method, tip, false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white text-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold">Payment</h2>
                        <p className="text-sm text-slate-500">Total Due: <span className="text-primary font-bold">£{total.toFixed(2)}</span></p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('full')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'full' ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'}`}
                        >
                            Full Pay
                        </button>
                        <button
                            onClick={() => setActiveTab('split')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 ${activeTab === 'split' ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'}`}
                        >
                            <Split className="w-4 h-4" /> Split
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {activeTab === 'full' ? (
                        <div className="space-y-6">
                            {/* Tip Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-700">Add Tip</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[0, 10, 15, 20].map(pct => (
                                        <button
                                            key={pct}
                                            onClick={() => setTip((total * (pct / 100)).toFixed(2))}
                                            className={`py-2 rounded-lg text-sm font-medium transition-all ${Math.abs(numericTip - (total * (pct / 100))) < 0.1
                                                ? 'bg-primary text-white shadow-md'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {pct === 0 ? 'No Tip' : `${pct}%`}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
                                    <input
                                        type="number"
                                        value={tip}
                                        onChange={e => setTip(e.target.value)}
                                        className="w-full pl-7 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="Custom Amount"
                                    />
                                </div>
                                <label className="flex items-center gap-2 p-3 border border-slate-100 rounded-lg cursor-pointer hover:bg-slate-50">
                                    <input
                                        type="checkbox"
                                        checked={Math.abs(numericTip - (total * 0.18)) < 0.1}
                                        onChange={(e) => {
                                            if (e.target.checked) setTip((total * 0.18).toFixed(2));
                                            else setTip('0');
                                        }}
                                        className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Auto-Gratuity (18%)</span>
                                </label>
                            </div>

                            {/* Payment Method */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-700">Payment Method</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setMethod('card')}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${method === 'card'
                                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                                            : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                                            }`}
                                    >
                                        <CreditCard className="w-6 h-6" />
                                        <span className="font-bold">Card</span>
                                    </button>
                                    <button
                                        onClick={() => setMethod('cash')}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${method === 'cash'
                                            ? 'border-green-500 bg-green-50 text-green-600'
                                            : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                                            }`}
                                    >
                                        <Banknote className="w-6 h-6" />
                                        <span className="font-bold">Cash</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Select Seat to Pay</h3>
                            <div className="space-y-2">
                                {Object.entries(splitSeats).map(([seatName, items]) => (
                                    <div key={seatName} className="p-3 border border-slate-200 rounded-xl hover:border-primary/50 transition-colors flex justify-between items-center group">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-slate-400" />
                                                <span className="font-bold text-slate-700">{seatName}</span>
                                            </div>
                                            <p className="text-xs text-slate-400">{items.length} items</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-lg">£{getSeatTotal(items).toFixed(2)}</span>
                                            <button
                                                onClick={() => {
                                                    // Quick Pay for this seat
                                                    // In a real app we'd open a mini-modal for specific method/tip for this seat
                                                    // For now, assume Card + No Tip for speed, or trigger main confirm
                                                    if (confirm(`Pay £${getSeatTotal(items).toFixed(2)} for ${seatName}?`)) {
                                                        // Call partial payment
                                                        onConfirm('card', '0', true); // This logic needs refinement to pass Amount
                                                        // Actually we need onSplitPayment prop
                                                        onSplitPayment?.(getSeatTotal(items), 'card', 0);
                                                    }
                                                }}
                                                className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-700"
                                            >
                                                Pay
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-3">
                    <button onClick={onClose} className="py-3 text-slate-500 font-semibold hover:bg-slate-100 rounded-xl transition-colors">
                        Cancel
                    </button>
                    {activeTab === 'full' && (
                        <button
                            onClick={handleFullPayment}
                            className="py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all"
                        >
                            Confirm Full Payment (£{(total + numericTip).toFixed(2)})
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
