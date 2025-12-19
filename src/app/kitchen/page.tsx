"use client";

import { useEffect, useState } from 'react';
import { Order } from '@/lib/types';
import { subscribeToOrders, updateOrderStatus } from '@/lib/supabase';
import KitchenOrderCard from '@/components/kitchen/KitchenOrderCard';
import { ChefHat, ListChecks } from 'lucide-react';

export default function KitchenPage() {
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        const unsubscribe = subscribeToOrders((allOrders) => {
            // Filter only pending/preparing orders
            const active = allOrders.filter(o => o.status === 'pending' || o.status === 'preparing')
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            setOrders(active);
        });

        return () => unsubscribe();
    }, []);

    const handleComplete = async (orderId: string) => {
        await updateOrderStatus(orderId, 'completed');
        // Optimistic update handled by verification/subscription, but we can't fully rely on it being instant in mock mode without the event loop
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <header className="h-16 border-b border-border bg-card flex items-center px-6 justify-between shrink-0 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full text-primary">
                        <ChefHat className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Kitchen Display System</h1>
                        <p className="text-xs text-muted-foreground">Active Orders: {orders.length}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-muted-foreground px-3 py-1 bg-muted rounded-full animate-pulse">
                        ● Live Updates
                    </span>
                </div>
            </header>

            <main className="flex-1 p-6 overflow-y-auto">
                {orders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4 opacity-50">
                        <ListChecks className="w-24 h-24 stroke-1" />
                        <p className="text-xl">All caught up! No active orders.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {orders.map(order => (
                            <KitchenOrderCard
                                key={order.id}
                                order={order}
                                onComplete={handleComplete}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
