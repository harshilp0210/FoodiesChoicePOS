"use client";

import { useCart } from '@/context/CartContext';
import { Minus, Plus, Trash2, ShoppingBag, Send, Printer, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CartSidebarProps {
    onCheckout: () => void;
    onSendToKitchen: () => void;
    onPrintBill: () => void;
}

export default function CartSidebar({ onCheckout, onSendToKitchen, onPrintBill }: CartSidebarProps) {
    const { cartItems, updateQuantity, removeFromCart, updateItem, total, subtotal, tax } = useCart();

    return (
        <div className="flex flex-col h-full bg-card border-l border-border shadow-2xl">
            <div className="p-5 border-b border-border bg-card/50 backdrop-blur-sm z-10">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-primary" />
                        Current Order
                    </h2>
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">#001</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 gap-4">
                        <ShoppingBag className="w-16 h-16" />
                        <p>Cart is empty</p>
                    </div>
                ) : (
                    cartItems.map((item) => (
                        <div key={item.id} className="relative group flex gap-3 bg-muted/30 hover:bg-muted/50 transition-colors p-3 rounded-xl border border-border/50">
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-medium text-sm text-foreground line-clamp-1">{item.name}</h4>
                                    <select
                                        className="text-[10px] bg-slate-800 text-slate-300 rounded border border-slate-700 py-0.5 px-1 focus:outline-none"
                                        value={item.seatId || ''}
                                        onChange={(e) => updateItem(item.id, { seatId: e.target.value ? Number(e.target.value) : undefined })}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <option value="">Share</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                            <option key={num} value={num}>S{num}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                    <span>£{item.price.toFixed(2)}</span>
                                    {item.sentToKitchen && (
                                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-green-200">
                                            <CheckCircle2 className="w-3 h-3" /> Sent
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-end justify-between gap-2">
                                <div className="font-bold text-sm text-foreground">
                                    £{(item.price * item.quantity).toFixed(2)}
                                </div>

                                <div className="flex items-center gap-3 bg-background rounded-lg px-2 py-1 border border-border">
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        className="hover:text-red-500 transition-colors"
                                    >
                                        <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="text-sm font-medium w-4 text-center tabular-nums">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="hover:text-green-500 transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-5 bg-card border-t border-border mt-auto shadow-[0_-5px_20px_rgba(0,0,0,0.2)]">
                <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">£{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax (10%)</span>
                        <span className="font-medium">£{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-bold pt-4 border-t border-dashed border-border text-foreground">
                        <span>Total</span>
                        <span className="text-primary">£{total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <button
                        disabled={cartItems.length === 0}
                        onClick={onPrintBill}
                        className="py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                        <Printer className="w-4 h-4" /> Print Bill
                    </button>
                    <button
                        disabled={cartItems.length === 0}
                        onClick={onSendToKitchen}
                        className="py-3 bg-orange-100 hover:bg-orange-200 text-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                        <Send className="w-4 h-4" /> Send
                    </button>
                </div>

                <button
                    disabled={cartItems.length === 0}
                    onClick={onCheckout}
                    className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground rounded-xl font-bold text-lg shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
                >
                    Checkout
                </button>
            </div>
        </div>
    );
}
