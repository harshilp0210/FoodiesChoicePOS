import { useState, useEffect } from 'react';
import { getOrdersServer, voidOrder, refundOrder } from '@/lib/actions';
import { Order } from '@/lib/types';
import { format } from 'date-fns';
import { Loader2, AlertCircle, Ban, RotateCcw } from 'lucide-react';

interface OrderHistoryProps {
    onClose: () => void;
}

export default function OrderHistory({ onClose }: OrderHistoryProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);
    const [actionType, setActionType] = useState<'void' | 'refund'>('void');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const data = await getOrdersServer();
            setOrders(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!actionId) return;

        try {
            if (actionType === 'void') {
                await voidOrder(actionId, pin);
                alert("Order Voided & Inventory Reversed.");
            } else {
                await refundOrder(actionId, pin);
                alert("Order Refunded & Inventory Reversed.");
            }
            setPin('');
            setActionId(null);
            loadOrders(); // Refresh
        } catch (err: any) {
            setError(err.message || "Failed to execute");
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 text-slate-50 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]">

                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Order History</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : (
                        <div className="space-y-4">
                            {orders.map(order => (
                                <div key={order.id} className={`p-4 rounded-lg border flex justify-between items-center ${order.status === 'cancelled' ? 'bg-red-950/20 border-red-900 opacity-75' : 'bg-slate-800 border-slate-700'
                                    }`}>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg">#{order.id.slice(0, 6)}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-bold ${order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                                order.status === 'cancelled' ? 'bg-red-500/20 text-red-500 line-through' :
                                                    'bg-yellow-500/20 text-yellow-500'
                                                }`}>
                                                {order.status}
                                            </span>
                                            {order.status !== 'cancelled' && (
                                                <span className="text-slate-400 text-sm">| ${order.total.toFixed(2)}</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {format(new Date(order.created_at), 'MMM d, h:mm a')} • {order.payment_method} • Table {order.tableId || 'N/A'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {order.items.length} Items: {order.items.map(i => i.name).join(', ')}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        {/* Void Button (Only if NOT cancelled/refunded) */}
                                        {order.status !== 'cancelled' && order.status !== 'voided' && order.status !== 'refunded' && (
                                            <button
                                                onClick={() => { setActionId(order.id); setActionType('void'); }}
                                                className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded border border-red-500/50 text-sm font-bold flex items-center gap-1 transition-colors"
                                            >
                                                <Ban className="w-4 h-4" /> VOID
                                            </button>
                                        )}
                                        {/* Refund Button (Only if Completed) */}
                                        {order.status === 'completed' && (
                                            <button
                                                onClick={() => { setActionId(order.id); setActionType('refund'); }}
                                                className="px-3 py-1.5 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 rounded border border-orange-500/50 text-sm font-bold flex items-center gap-1 transition-colors"
                                            >
                                                <RotateCcw className="w-4 h-4" /> REFUND
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* PIN Action Modal */}
            {actionId && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60">
                    <form onSubmit={handleAction} className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-2xl w-80">
                        <h3 className="font-bold text-lg mb-2 text-red-500 flex items-center gap-2 uppercase">
                            <AlertCircle className="w-5 h-5" /> Confirm {actionType}
                        </h3>
                        <p className="text-sm text-slate-400 mb-4">Enter Manager PIN to authorize {actionType}.</p>

                        <input
                            autoFocus
                            type="password"
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 mb-4 text-center text-xl tracking-widest text-white"
                            value={pin}
                            onChange={e => setPin(e.target.value)}
                            placeholder="PIN"
                        />

                        {error && <p className="text-red-500 text-xs mb-2">{error}</p>}

                        <div className="flex gap-2">
                            <button type="button" onClick={() => { setActionId(null); setError(''); setPin(''); }} className="flex-1 py-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-300">Cancel</button>
                            <button type="submit" className="flex-1 py-2 bg-red-600 rounded hover:bg-red-700 font-bold text-white">CONFIRM</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
