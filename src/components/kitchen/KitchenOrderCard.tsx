import { Order, CartItem } from '@/lib/types';
import { Clock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';

interface KitchenOrderCardProps {
    order: Order;
    onComplete: (orderId: string) => void;
}

export default function KitchenOrderCard({ order, onComplete }: KitchenOrderCardProps) {
    const [elapsed, setElapsed] = useState('');

    useEffect(() => {
        const updateTime = () => {
            setElapsed(formatDistanceToNow(new Date(order.created_at), { addSuffix: true }));
        };
        updateTime();
        const interval = setInterval(updateTime, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [order.created_at]);

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-muted/50 p-3 border-b border-border flex justify-between items-center">
                <div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Order</span>
                    <h3 className="text-lg font-bold">#{order.id.slice(0, 4)}</h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5" />
                    {elapsed}
                </div>
            </div>

            <div className="p-4 flex-1">
                <ul className="space-y-3">
                    {order.items.map((item, idx) => (
                        <li key={idx} className="flex gap-3 text-sm">
                            <span className="font-bold text-lg w-6 shrink-0">{item.quantity}x</span>
                            <div>
                                <span className="font-medium">{item.name}</span>
                                {item.notes && (
                                    <p className="text-xs text-muted-foreground italic mt-0.5">Note: {item.notes}</p>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="p-3 bg-muted/30 border-t border-border mt-auto">
                <button
                    onClick={() => onComplete(order.id)}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-bold transition-all active:scale-[0.98]"
                >
                    <CheckCircle className="w-5 h-5" />
                    Complete Order
                </button>
            </div>
        </div>
    );
}
