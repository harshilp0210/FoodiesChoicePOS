"use client";

import { useEffect, useState } from 'react';
import { ShoppingBag, CreditCard, Receipt } from 'lucide-react';
import { CartItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface CartState {
    cartItems: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
}

export default function CustomerDisplayPage() {
    const [cartState, setCartState] = useState<CartState>({
        cartItems: [],
        subtotal: 0,
        tax: 0,
        total: 0
    });
    const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
    const [isIdle, setIsIdle] = useState(true);

    useEffect(() => {
        const channel = new BroadcastChannel('customer-display');

        channel.onmessage = (event) => {
            if (event.data.type === 'CART_UPDATE') {
                setCartState(event.data.payload);
                setLastUpdated(Date.now());
                setIsIdle(event.data.payload.cartItems.length === 0);
            }
        };

        return () => {
            channel.close();
        };
    }, []);

    // If idle for too long, we show a screensaver/promo
    // For now, simpler logic: if cart is empty, show Promo.

    if (isIdle) {
        return (
            <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-40">
                    <Image
                        src="https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?q=80&w=2080&auto=format&fit=crop"
                        alt="Background"
                        fill
                        className="object-cover"
                    />
                </div>
                <div className="z-10 text-center space-y-6 animate-fade-in">
                    <div className="w-32 h-32 rounded-full bg-primary/20 backdrop-blur-md flex items-center justify-center mx-auto mb-8 border-2 border-primary/50">
                        <span className="text-4xl font-bold">FC</span>
                    </div>
                    <h1 className="text-6xl font-bold tracking-tight">Welcome to Foodie's Choice</h1>
                    <p className="text-xl text-white/80">Experience the taste of perfection</p>
                </div>

                <div className="absolute bottom-12 z-10 flex gap-8">
                    <div className="flex flex-col items-center gap-2">
                        <CreditCard className="w-8 h-8 text-primary" />
                        <span className="text-sm font-medium">Card Accepted</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <ShoppingBag className="w-8 h-8 text-primary" />
                        <span className="text-sm font-medium">Takeaway Available</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-slate-50 flex">
            {/* Left: Item List */}
            <div className="flex-1 p-8 flex flex-col h-full overflow-hidden">
                <header className="mb-8 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg">
                        FC
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800">Your Order</h1>
                </header>

                <div className="flex-1 overflow-y-auto space-y-4 pr-4">
                    {cartState.cartItems.map((item) => (
                        <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between animate-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold text-lg">
                                    {item.quantity}x
                                </div>
                                <div>
                                    <h3 className="text-2xl font-semibold text-slate-800">{item.name}</h3>
                                    {/* <p className="text-slate-500">Delicious choice</p> */}
                                </div>
                            </div>
                            <div className="text-2xl font-medium text-slate-900">
                                ${(item.price * item.quantity).toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Totals */}
            <div className="w-[450px] bg-white border-l border-slate-200 p-8 flex flex-col justify-center shadow-2xl relative z-10">
                <div className="space-y-6">
                    <div className="flex justify-between items-center text-xl text-slate-600">
                        <span>Subtotal</span>
                        <span>${cartState.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xl text-slate-600">
                        <span>Tax (10%)</span>
                        <span>${cartState.tax.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-slate-200 my-4" />
                    <div className="flex justify-between items-center">
                        <span className="text-3xl font-bold text-slate-800">Total</span>
                        <div className="text-right">
                            <span className="block text-5xl font-extrabold text-primary">${cartState.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-12 bg-slate-50 rounded-xl p-6 text-center border border-dashed border-slate-300">
                    <p className="text-slate-500 mb-2">Please verify your order</p>
                    <div className="inline-flex items-center gap-2 text-primary font-medium">
                        <ShoppingBag className="w-5 h-5" />
                        <span>Ready for preparation</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
