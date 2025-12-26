"use client";

import { useEffect, useState } from 'react';
import { getOrders, updateOrder } from '@/lib/supabase';
import { Order, Employee } from '@/lib/types';
import { getEmployees } from '@/lib/supabase';
import { Truck, MapPin, Search, CheckCircle, ExternalLink } from 'lucide-react';

export default function DeliveryPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [drivers, setDrivers] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshData = async () => {
        try {
            const allOrders = await getOrders();
            // Filter for active delivery orders
            const deliveryOrders = allOrders.filter(o =>
                o.orderType === 'delivery' &&
                o.status !== 'completed' &&
                o.status !== 'cancelled'
            );
            setOrders(deliveryOrders);

            // Fetch drivers
            const allEmployees = await getEmployees();
            setDrivers(allEmployees.filter(e => e.role === 'Driver'));
        } catch (error) {
            console.error("Error fetching delivery data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const assignDriver = (orderId: string, driverId: string, provider: 'internal' | 'doordash' = 'internal') => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const updatedOrder: Order = {
            ...order,
            driverId,
            deliveryProvider: provider,
            deliveryStatus: 'out-for-delivery'
        };

        updateOrder(updatedOrder);
        refreshData();
    };

    if (isLoading) return <div className="p-8">Loading dispatch...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Delivery Dispatch</h2>
                    <p className="text-slate-500">Manage active deliveries and driver assignments</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-white px-4 py-2 rounded-lg border shadow-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="font-bold">{orders.length} Active</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {orders.map(order => (
                    <div key={order.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                            <div>
                                <div className="font-bold text-lg">#{order.id.slice(0, 6)}</div>
                                <div className="text-sm text-slate-500">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${order.deliveryStatus === 'out-for-delivery'
                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                }`}>
                                {order.deliveryStatus === 'out-for-delivery' ? 'ON THE WAY' : 'NEEDS DRIVER'}
                            </span>
                        </div>

                        <div className="p-4 flex-1 space-y-4">
                            <div>
                                <div className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-1">
                                    <MapPin className="w-4 h-4" /> Route
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg text-sm border border-slate-100">
                                    <p className="font-bold text-slate-900">{order.customerName}</p>
                                    <p className="text-slate-600 truncate">{order.deliveryAddress}</p>
                                    <p className="text-slate-400 text-xs mt-1">{order.customerPhone}</p>
                                </div>
                            </div>

                            <div>
                                <div className="text-sm font-bold text-slate-700 mb-2">Order Summary</div>
                                <div className="text-sm text-slate-600">
                                    {order.items.map(item => (
                                        <div key={item.cartId} className="flex justify-between">
                                            <span>{item.quantity}x {item.name}</span>
                                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-slate-100 mt-2 pt-2 flex justify-between font-bold text-slate-900">
                                        <span>Total</span>
                                        <span>${order.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100">
                            {order.deliveryStatus === 'pending-assignment' || !order.deliveryStatus ? (
                                <div className="space-y-2">
                                    <select
                                        className="w-full p-2 rounded-lg border border-slate-300 text-sm bg-white"
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                if (e.target.value === 'doordash') {
                                                    assignDriver(order.id, 'doordash-req', 'doordash');
                                                } else {
                                                    assignDriver(order.id, e.target.value, 'internal');
                                                }
                                            }
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Select Driver...</option>
                                        <optgroup label="3rd Party">
                                            <option value="doordash">Request DoorDash ($5.99)</option>
                                        </optgroup>
                                        <optgroup label="Internal Drivers">
                                            {drivers.map(d => (
                                                <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                        <Truck className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">
                                            {order.deliveryProvider === 'doordash' ? 'DoorDash' : 'Internal Driver'}
                                        </div>
                                        <div className="text-slate-500 text-xs">Assigned</div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const updated = { ...order, status: 'completed' as const, deliveryStatus: 'delivered' as const };
                                            updateOrder(updated);
                                            refreshData();
                                        }}
                                        className="ml-auto text-xs bg-white border border-slate-200 hover:bg-slate-50 px-2 py-1 rounded shadow-sm"
                                    >
                                        Mark Delivered
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {orders.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No active delivery orders</p>
                    </div>
                )}
            </div>
        </div>
    );
}
