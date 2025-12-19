"use client";

import { useState, useEffect } from 'react';
import { Category } from '@/lib/types';
import CategoryTabs from './CategoryTabs';
import MenuGrid from './MenuGrid';
import CartSidebar from './CartSidebar';
import { saveOrder } from '@/lib/supabase';
import { syncTransactionToEposNow } from '@/lib/epos-now';
import { useCart } from '@/context/CartContext';
import Receipt from '@/components/pos/Receipt';
import { Order } from '@/lib/types';

interface POSInterfaceProps {
    categories: Category[];
}

export default function POSInterface({ categories }: POSInterfaceProps) {
    const { cartItems: cart, removeFromCart, updateQuantity, clearCart, total, subtotal, tax } = useCart();
    const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.name || '');
    const [currentDate, setCurrentDate] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [lastOrder, setLastOrder] = useState<Order | null>(null);

    useEffect(() => {
        setCurrentDate(new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }));
    }, []);

    const allItems = categories.flatMap(c => c.items);
    const activeItems = searchQuery
        ? allItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.category.toLowerCase().includes(searchQuery.toLowerCase()))
        : categories.find(c => c.name === activeCategory)?.items || [];

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        // Save order to Mock Backend
        const order = await saveOrder(cart, total, 'cash'); // Defaulting to cash for now

        if (order) {
            setLastOrder(order);

            // Sync to Epos Now (Fire and Forget or Await based on preference)
            // We await here to show the user it's processing, but in real-life might be background.
            console.log("Syncing to Epos Now...");
            const eposResult = await syncTransactionToEposNow({
                date: order.created_at,
                totalAmount: order.total,
                paymentMethod: order.payment_method,
                items: cart.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    vatRate: 0.10 // Hardcoded for now matches tax calc
                }))
            });
            console.log("Epos Now Result:", eposResult);

            // Wait for state update then print
            setTimeout(() => {
                window.print();
                clearCart();
            }, 100);
        } else {
            alert('Failed to save order');
        }
    };

    return (
        <div className="flex h-full w-full bg-background">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header / Top Bar */}
                <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center px-6 justify-between shrink-0 sticky top-0 z-20 gap-4">
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-orange-500/20">
                            FC
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-foreground leading-tight">Foodie&apos;s POS</h1>
                            <div className="flex items-center gap-2">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Terminal 01</p>
                                <button
                                    onClick={() => window.open('/customer-display', 'CustomerDisplay', 'width=1024,height=768')}
                                    className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                                >
                                    Open Display
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 max-w-md relative group">
                        <input
                            type="text"
                            placeholder="Search menu..."
                            className="w-full bg-muted/50 border border-border rounded-full px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </div>

                    <div className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/50 shrink-0">
                        {currentDate}
                    </div>
                </header>

                {/* Categories (Hide when searching) */}
                {!searchQuery && (
                    <div className="p-4 pb-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <CategoryTabs
                            categories={categories.map(c => c.name)}
                            activeCategory={activeCategory}
                            onSelect={setActiveCategory}
                        />
                    </div>
                )}

                {/* Menu Grid */}
                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-muted">
                    <MenuGrid items={activeItems} />
                </div>
            </div>

            {/* Right Sidebar - Cart */}
            <div className="w-96 shrink-0 h-full">
                <CartSidebar onCheckout={handleCheckout} />
            </div>

            <Receipt order={lastOrder} />
        </div>
    );
}
