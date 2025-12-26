"use client";

import { useCart } from '@/context/CartContext';
import { saveOrder } from '@/lib/supabase';
import { Order } from '@/lib/types';
import { Trash2, ArrowRight, Clock, MapPin, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';

export default function CartPage() {
    const { cartItems, removeFromCart, updateQuantity, subtotal, tax, total, clearCart } = useCart();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showUpsell, setShowUpsell] = useState(true); // [NEW] Upsell visibility

    // Guest Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        time: 'ASAP',
        orderType: 'pickup' as 'pickup' | 'delivery',
        address: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const newOrder: Order = {
            id: uuidv4(),
            created_at: new Date().toISOString(),
            status: 'pending',
            items: cartItems,
            total: total,
            payment_method: 'online-card', // Simulated
            tableId: 'online', // Critical marker for KDS
            customerName: formData.name,
            customerPhone: formData.phone,
            orderType: formData.orderType,
            deliveryAddress: formData.orderType === 'delivery' ? formData.address : undefined,
            deliveryStatus: formData.orderType === 'delivery' ? 'pending-assignment' : undefined
        };

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        saveOrder(newOrder);
        clearCart();
        setIsSuccess(true);
        setIsSubmitting(false);
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Order Confirmed!</h2>
                <p className="text-slate-500 mb-8 max-w-md">
                    Thanks {formData.name}! Your order has been sent to the kitchen.
                    <br />Estimated pickup time: <span className="font-bold text-slate-900">{formData.time === 'ASAP' ? '15 mins' : formData.time}</span>.
                </p>
                <Link href="/order" className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors">
                    Order Something Else
                </Link>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="text-center py-20 px-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBagIcon className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
                <p className="text-slate-500 mb-8">Looks like you haven't added anything yet.</p>
                <Link href="/order" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
                    Browse Menu <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                    Review Order
                </h2>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    {cartItems.map((item) => (
                        <div key={item.cartId} className="p-4 border-b border-slate-100 last:border-0 flex gap-4">
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-slate-900">{item.name}</h3>
                                    <span className="font-medium text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                                <p className="text-sm text-slate-500 mb-3">{item.description}</p>
                                {item.notes && (
                                    <p className="text-xs bg-yellow-50 text-yellow-800 p-2 rounded mb-3">"{item.notes}"</p>
                                )}
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 text-slate-500"
                                        >-</button>
                                        <span className="w-8 text-center text-sm font-medium text-slate-900">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 text-slate-500"
                                        >+</button>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-xs font-medium text-red-500 hover:text-red-700 flex items-center gap-1"
                                    >
                                        <Trash2 className="w-3 h-3" /> Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Checkout Form */}
            <div className="lg:col-span-1 space-y-4 sticky top-24">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                    Checkout
                </h2>

                {/* [NEW] Dessert Upsell */}
                {showUpsell && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-orange-900">Sweeten the deal? 🍰</h3>
                            <button onClick={() => setShowUpsell(false)} className="text-orange-400 hover:text-orange-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <p className="text-sm text-orange-800 mb-3">Add a dessert before you checkout!</p>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {/* Mock Upsell Items - In real app, fetch from category 'Dessert' */}
                            <div className="min-w-[120px] bg-white rounded-lg p-2 border border-orange-100 shadow-sm">
                                <div className="h-20 bg-slate-100 rounded-md mb-2 relative overflow-hidden">
                                    <img src="/images/dessert.png" className="object-cover w-full h-full" alt="Gulab Jamun" />
                                </div>
                                <p className="font-bold text-xs truncate">Gulab Jamun</p>
                                <p className="text-xs text-slate-500">$5.00</p>
                            </div>
                            <div className="min-w-[120px] bg-white rounded-lg p-2 border border-orange-100 shadow-sm">
                                <div className="h-20 bg-slate-100 rounded-md mb-2 relative overflow-hidden">
                                    <img src="/images/dessert.png" className="object-cover w-full h-full" alt="Ice Cream" />
                                </div>
                                <p className="font-bold text-xs truncate">Mango Lassi</p>
                                <p className="text-xs text-slate-500">$4.50</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Pickup Info</label>
                            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
                                <MapPin className="w-4 h-4 text-primary" />
                                123 Foodie Lane, San Francisco
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <Clock className="w-4 h-4 text-primary" />
                                Ready in ~15 mins
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
                            <input
                                required
                                type="text"
                                placeholder="J. Doe"
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/50 outline-none text-slate-900 placeholder:text-slate-400"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        {/* [NEW] Phone Number Input */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                            <input
                                required
                                type="tel"
                                placeholder="(555) 123-4567"
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/50 outline-none text-slate-900 placeholder:text-slate-400"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div className="flex gap-4 mb-4">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, orderType: 'pickup' })}
                                className={`flex-1 py-3 rounded-xl border font-bold transition-all ${formData.orderType === 'pickup' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                            >
                                Pickup
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, orderType: 'delivery' })}
                                className={`flex-1 py-3 rounded-xl border font-bold transition-all ${formData.orderType === 'delivery' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                            >
                                Delivery
                            </button>
                        </div>

                        {formData.orderType === 'delivery' && (
                            <div className="animate-in slide-in-from-top-2 duration-200">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Address</label>
                                <textarea
                                    required
                                    placeholder="123 Main St, Apt 4B..."
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/50 outline-none text-slate-900 placeholder:text-slate-400 min-h-[80px]"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex justify-between text-slate-500 text-sm">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-500 text-sm">
                                <span>Service Charge (10%)</span>
                                <span>${tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-slate-900 pt-2">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-70 disabled:scale-100"
                        >
                            {isSubmitting ? 'Placing Order...' : `Place Order • $${total.toFixed(2)}`}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function ShoppingBagIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
    )
}
