"use client";

import { useState, useEffect } from 'react';
import { Category, Area, Table, CartItem } from '@/lib/types';
import CategoryTabs from './CategoryTabs';
import MenuGrid from './MenuGrid';
import CartSidebar from './CartSidebar';
import { saveOrder, getLayout, syncOrders, getOfflineQueue, updateTableStatus } from '@/lib/supabase';
import { processPayment } from '@/lib/actions'; // [NEW]
import { syncTransactionToEposNow } from '@/lib/epos-now';
import { useCart } from '@/context/CartContext';
import PrintRouter, { PrintJob } from '@/components/printing/PrintRouter';
import { Order } from '@/lib/types';
import TableGrid from '@/components/floor-plan/TableGrid';
import GlobalSidebar from '@/components/layout/GlobalSidebar';
import MissionControl from '@/components/floor-plan/MissionControl';
import GuestCountModal from './GuestCountModal';
import { v4 as uuidv4 } from 'uuid';
import { Search, Grid, Wifi, WifiOff, RefreshCw, Clock, CreditCard, Banknote, ChefHat, Printer, Send, Monitor, ArrowLeft } from 'lucide-react';
import ClockInModal from './ClockInModal';
import ServerCheckoutModal from './ServerCheckoutModal';
import OrderHistory from './OrderHistory';
import PaymentModal from './PaymentModal'; // [NEW]

interface POSInterfaceProps {
    categories: Category[];
}

export default function POSInterface({ categories }: POSInterfaceProps) {
    const { cartItems: cart, removeFromCart, updateQuantity, clearCart, total, subtotal, tax, setCartItems } = useCart();
    const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.name || '');
    const [currentDate, setCurrentDate] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [lastOrder, setLastOrder] = useState<Order | null>(null);

    // [NEW] View State for Mission Control
    const [view, setView] = useState<'map' | 'order' | 'search' | 'transfer' | 'clock'>('map');
    const [guestCountModalOpen, setGuestCountModalOpen] = useState(false);
    const [tempTable, setTempTable] = useState<Table | null>(null);

    // Table Management State
    const [isTableModalOpen, setIsTableModalOpen] = useState(false);
    const [layout, setLayout] = useState<Area[]>([]);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    // [NEW] Held Orders State
    const [heldOrders, setHeldOrders] = useState<Record<string, { items: CartItem[], tableId: string, timestamp: Date }>>({});
    const [guestName, setGuestName] = useState(''); // [NEW] CRM
    const [isClockInOpen, setIsClockInOpen] = useState(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false); // [NEW] // [NEW]

    // [NEW] Payment Modal States
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [tipAmount, setTipAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('card'); // default

    // [NEW] Print Queue System
    const [printQueue, setPrintQueue] = useState<PrintJob[]>([]);
    const [currentPrintJob, setCurrentPrintJob] = useState<PrintJob | null>(null);

    // Process Print Queue
    useEffect(() => {
        if (currentPrintJob) return; // Busy printing
        if (printQueue.length === 0) return;

        const nextJob = printQueue[0];
        setCurrentPrintJob(nextJob);
        setPrintQueue(prev => prev.slice(1));

        // Allow render then print
        setTimeout(() => {
            window.print();
            // Wait for print dialog to close (user interaction) - 
            // In browsers, JS execution is often paused during print dialog.
            // But we simulate a delay.
            setTimeout(() => {
                setCurrentPrintJob(null);
            }, 100);
        }, 100);
    }, [printQueue, currentPrintJob]);

    // Offline State
    const [isOnline, setIsOnline] = useState(true);
    const [offlineQueueSize, setOfflineQueueSize] = useState(0);

    useEffect(() => {
        setCurrentDate(new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }));
        setLayout(getLayout());
        setOfflineQueueSize(getOfflineQueue().length);
        setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Poll for queue size updates (simple way)
        const interval = setInterval(() => {
            setOfflineQueueSize(getOfflineQueue().length);
        }, 2000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    const handleSync = async () => {
        const syncedCount = await syncOrders();
        setOfflineQueueSize(0);
        alert(`Synced ${syncedCount} orders to server.`);
    };

    const allItems = categories.flatMap(c => c.items);
    const activeItems = searchQuery
        ? allItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.category.toLowerCase().includes(searchQuery.toLowerCase()))
        : categories.find(c => c.name === activeCategory)?.items || [];

    const handleTableSelect = (table: Table) => {
        if (table.status !== 'available' && table.status !== 'occupied') {
            // Optional: Allow selecting occupied tables to add to order? For now, just allow selecting.
        }
        setSelectedTable(table);
        setSelectedTable(table);

        // [NEW] Restore held order if exists for this table
        if (heldOrders[table.id]) {
            setCartItems(heldOrders[table.id].items);
        } else {
            // [Fix] Clear cart if no held order exists for this table
            clearCart();
        }
        // setIsPrintingBill(false); // Removed
        setGuestName(''); // Reset
        setIsTableModalOpen(false);
    };

    const handleParkOrder = () => {
        if (!selectedTable) {
            alert("Select a table to park the order.");
            return;
        }
        if (cart.length === 0) return;

        setHeldOrders(prev => ({
            ...prev,
            [selectedTable.id]: { items: [...cart], tableId: selectedTable.id, timestamp: new Date() }
        }));
        clearCart();
        setSelectedTable(null);
        // alert("Order Parked/Held");
    };

    // [NEW] Print Pre-Payment Bill (Guest Check)
    const handlePrintBill = () => {
        if (cart.length === 0) return;

        // Create temp order structure for receipt
        const tempOrder: Order = {
            id: `BILL-${Date.now().toString().slice(-4)}`,
            created_at: new Date().toISOString(),
            status: 'pending',
            total: total,
            items: [...cart],
            payment_method: 'PENDING',
            tip: 0,
            tableId: selectedTable?.id
        };

        // Queue Guest Check
        setPrintQueue(prev => [...prev, {
            type: 'GUEST_CHECK',
            order: tempOrder,
            tableLabel: selectedTable?.label || '??'
        }]);

        // Update Table Status to 'billed' (Check Presented)
        if (selectedTable) {
            const newLayout = updateTableStatus('main-hall', selectedTable.id, 'billed');
            setLayout(newLayout);
            setSelectedTable({ ...selectedTable, status: 'billed' });
        }
    };

    // [NEW] Send to Kitchen Logic (With Routing)
    const handleSendToKitchen = async () => {
        if (cart.length === 0) return;
        if (!selectedTable) {
            alert("Please select a table first.");
            return;
        }

        // 1. Filter for New Items only
        const newItems = cart.filter(item => !item.sentToKitchen);

        if (newItems.length === 0) {
            alert("No new items to send to kitchen.");
            return;
        }

        // 2. Route Items (Kitchen vs Bar)
        // Need to know which category is "Drinks". 
        // For now, let's assume if category contains "Drink" or "Beverage" or "Wine" -> Bar.
        // Or inspect item.category.
        const kitchenItems: CartItem[] = [];
        const barItems: CartItem[] = [];

        newItems.forEach(item => {
            const cat = item.category.toLowerCase();
            if (cat.includes('drink') || cat.includes('beverage') || cat.includes('wine') || cat.includes('beer') || cat.includes('cocktail') || cat.includes('bar')) {
                barItems.push(item);
            } else {
                kitchenItems.push(item);
            }
        });

        const jobs: PrintJob[] = [];
        const orderId = `KOT-${Date.now().toString().slice(-4)}`;
        const timestamp = new Date();

        if (kitchenItems.length > 0) {
            jobs.push({
                type: 'KOT',
                items: kitchenItems,
                department: 'KITCHEN',
                orderId,
                timestamp,
                tableLabel: selectedTable.label
            });
        }

        if (barItems.length > 0) {
            jobs.push({
                type: 'KOT',
                items: barItems,
                department: 'BAR',
                orderId,
                timestamp,
                tableLabel: selectedTable.label
            });
        }

        // Add to print queue (reversed so pop works? array shift works naturally)
        setPrintQueue(prev => [...prev, ...jobs]);

        // 3. Save to DB (Status Pending)
        const newItemsTotal = newItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const { order: savedResult } = await saveOrder(newItems, newItemsTotal, 'PENDING', selectedTable.id);

        // 4. Update Table State
        const updatedCart = cart.map(item => ({ ...item, sentToKitchen: true }));
        setHeldOrders(prev => ({
            ...prev,
            [selectedTable.id]: { items: updatedCart, tableId: selectedTable.id, timestamp: new Date() }
        }));

        // 5. Update Status to Occupied (if not already)
        if (selectedTable.status === 'available') {
            const newLayout = updateTableStatus('main-hall', selectedTable.id, 'occupied');
            setLayout(newLayout);
            // Also update selectedTable local state
            setSelectedTable({ ...selectedTable, status: 'occupied' });
        }

        // 6. Clear cart to allow next user
        clearCart();
        setSelectedTable(null);
    };

    const handleCheckout = () => {
        if (cart.length === 0) return;
        setIsPaymentModalOpen(true);
    };

    const confirmPayment = async () => {
        // Prepare Final Order
        const finalOrder: Order = {
            items: [...cart],
            total: total,
            tip: tipAmount,
            status: 'completed',
            payment_method: paymentMethod,
            tableId: selectedTable?.id || undefined,
            id: uuidv4(),
            created_at: new Date().toISOString(),
            employeeId: "1",
            customerName: guestName // [NEW]
        };

        // Save to Backend
        const { order: savedOrder, alerts } = await saveOrder(finalOrder); // Use object signature

        if (savedOrder) {
            if (alerts && alerts.length > 0) alert(`⚠️ ALERTS:\n${alerts.join('\n')}`);
            setLastOrder(savedOrder);

            // Queue Tax Invoice
            setPrintQueue(prev => [...prev, {
                type: 'TAX_INVOICE',
                order: savedOrder,
                tableLabel: selectedTable?.label || '??'
            }]);

            // Sync Epos Now
            if (isOnline) {
                syncTransactionToEposNow({
                    date: savedOrder.created_at,
                    totalAmount: savedOrder.total + (savedOrder.tip || 0),
                    paymentMethod: savedOrder.payment_method,
                    items: cart.map(item => ({
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price,
                        vatRate: 0.10
                    }))
                });
            }

            // Clear Cart and Table
            clearCart();

            // Logic: Is table now dirty/cleaning? Or Available?
            // Usually after payment -> Cleaning.
            if (selectedTable) {
                const newLayout = updateTableStatus('main-hall', selectedTable.id, 'cleaning');
                setLayout(newLayout);
            }
            setSelectedTable(null);
            setIsPaymentModalOpen(false);
            setTipAmount(0);

            // Return to Map
            setView('map');
        } else {
            alert("Payment Failed / Save Failed");
        }
    };


    // [NEW] Handle Table Click from Mission Control
    const handleMapTableSelect = (table: Table) => {
        if (table.status === 'occupied' || table.status === 'billed') {
            // If already occupied, go straight to order
            handleTableSelect(table);
            setView('order');
        } else if (table.status === 'cleaning') {
            // [NEW] The Turn: Busser Logic
            if (confirm(`Mark Table ${table.label} as Clean & Available?`)) {
                const newLayout = updateTableStatus('main-hall', table.id, 'available');
                setLayout(newLayout);
            }
        } else {
            // New table, ask for guest count
            setTempTable(table);
            setGuestCountModalOpen(true);
        }
    };

    const handleGuestCountConfirm = (count: number) => {
        if (tempTable) {
            handleTableSelect(tempTable);
            // In a real app, save guestCount to context/order here
            setView('order');
        }
        setGuestCountModalOpen(false);
    };

    return (
        <div className="flex h-full w-full bg-slate-950 text-slate-50 font-sans">
            {/* [NEW] Persistent Global Sidebar */}
            <GlobalSidebar onNavigate={(v) => setView(v as any)} currentView={view} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">

                {/* VIEW: Mission Control (Map) */}
                {view === 'map' && (
                    <MissionControl
                        layout={layout}
                        onSelectTable={handleMapTableSelect}
                        activeServerId="1" // Mock
                    />
                )}

                {/* VIEW: Order Interface */}
                {view === 'order' && (
                    <div className="flex h-full w-full bg-background">
                        {/* Order Content Area */}
                        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                            {/* Header / Top Bar */}
                            <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center px-6 justify-between shrink-0 sticky top-0 z-20 gap-4">
                                <div className="flex items-center gap-3 shrink-0">
                                    <button
                                        onClick={() => setIsHistoryOpen(true)}
                                        className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                        title="Order History / Voids"
                                    >
                                        <Banknote className="w-6 h-6" />
                                    </button>
                                    <button
                                        className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                        onClick={() => setView('clock')}
                                    ><ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div>
                                        <h1 className="text-lg font-bold text-foreground leading-tight">Foodie&apos;s POS</h1>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setIsCheckoutModalOpen(true)}
                                                className="text-[10px] bg-red-100 hover:bg-red-200 text-red-700 px-2 py-0.5 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                                            >
                                                <Clock className="w-3 h-3" /> End Shift
                                            </button>
                                            {/* [NEW] Park Button */}
                                            <button
                                                onClick={handleParkOrder}
                                                disabled={cart.length === 0 || !selectedTable}
                                                className="text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                                            >
                                                <Clock className="w-3 h-3" /> Park Order
                                            </button>
                                            {Object.keys(heldOrders).length > 0 && (
                                                <button
                                                    onClick={() => setView('map')} // Go to map to see held orders? Or listing?
                                                    className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-200"
                                                >
                                                    {Object.keys(heldOrders).length} Held
                                                </button>
                                            )}

                                            {/* [NEW] Print Bill Button */}
                                            <button
                                                onClick={handlePrintBill}
                                                disabled={cart.length === 0}
                                                className="text-[10px] bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                                            >
                                                <Printer className="w-3 h-3" /> Print Bill
                                            </button>

                                            <div className="h-4 w-px bg-slate-200 mx-2"></div>
                                            {isOnline ? (
                                                <span className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                                    <Wifi className="w-3 h-3" /> Online
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 font-bold">
                                                    <WifiOff className="w-3 h-3" /> Offline
                                                </span>
                                            )}
                                            {offlineQueueSize > 0 && (
                                                <button
                                                    onClick={handleSync}
                                                    className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse hover:bg-amber-100"
                                                >
                                                    <RefreshCw className="w-3 h-3" /> Sync ({offlineQueueSize})
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <h2 className="font-bold text-lg">Current Order</h2>
                                <div className="flex gap-2">
                                    <input
                                        className="bg-slate-800 border-none text-xs text-white px-2 py-1 rounded w-24 placeholder:text-slate-500"
                                        placeholder="Guest Name..."
                                        value={guestName}
                                        onChange={e => setGuestName(e.target.value)}
                                    />
                                    {selectedTable && (
                                        <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold">
                                            Table {selectedTable.label}
                                        </span>
                                    )}
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

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => { setLayout(getLayout()); setView('map'); /* Back to Map */ }}
                                        className={`
                                            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm
                                            ${selectedTable
                                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'
                                                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'}
                                        `}
                                    >
                                        <Grid className="w-4 h-4" />
                                        {selectedTable ? `Table ${selectedTable.label}` : 'Dine In'}
                                    </button>

                                    <div className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/50 shrink-0">
                                        {currentDate}
                                    </div>
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
                        <div className="w-96 shrink-0 h-full border-l border-border">
                            <CartSidebar
                                onCheckout={handleCheckout}
                                onSendToKitchen={handleSendToKitchen}
                                onPrintBill={handlePrintBill}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Print System */}
            <PrintRouter job={currentPrintJob} />

            {/* Table Selection Modal (Keep for manual 'Dine In' button if needed, but Map handles it now) */}
            {isTableModalOpen && view === 'order' && (
                <TableGrid
                    layout={layout}
                    onSelectTable={handleTableSelect}
                    onClose={() => setIsTableModalOpen(false)}
                />
            )}

            {/* Guest Count Modal */}
            {guestCountModalOpen && tempTable && (
                <GuestCountModal
                    tableName={tempTable.label}
                    onCancel={() => setGuestCountModalOpen(false)}
                    onConfirm={handleGuestCountConfirm}
                />
            )}

            {/* Clock In Modal */}
            {(isClockInOpen || view === 'clock') && (
                <ClockInModal onClose={() => { setIsClockInOpen(false); if (view === 'clock') setView('map'); }} />
            )}

            {/* Server Checkout Modal */}
            {isCheckoutModalOpen && (
                <ServerCheckoutModal
                    employeeId="1" // Mocked active user ID
                    onClose={() => setIsCheckoutModalOpen(false)}
                />
            )}

            {isHistoryOpen && (
                <OrderHistory onClose={() => setIsHistoryOpen(false)} />
            )}

            {isPaymentModalOpen && (
                <PaymentModal
                    total={total}
                    cart={cart}
                    onClose={() => setIsPaymentModalOpen(false)}
                    // 1. Full Payment
                    onConfirm={async (method, tip, isSplit) => {
                        setTipAmount(parseFloat(tip));
                        // Standard Flow (Single Payment)
                        const finalOrder: Order = {
                            items: [...cart],
                            total: total,
                            tip: parseFloat(tip),
                            status: 'completed',
                            payment_method: method,
                            tableId: selectedTable?.id || undefined,
                            id: lastOrder?.id || uuidv4(), // Use existing ID if partial
                            created_at: lastOrder?.created_at || new Date().toISOString(),
                            employeeId: "1",
                            customerName: guestName
                        };

                        const { order: result, alerts } = await saveOrder(finalOrder); // Use object signature

                        if (result) {
                            if (alerts && alerts.length > 0) alert(`⚠️ ALERTS:\n${alerts.join('\n')}`);
                            setLastOrder(result);

                            // Sync to Epos Now
                            if (isOnline) {
                                syncTransactionToEposNow({
                                    date: result.created_at,
                                    totalAmount: result.total + (result.tip || 0),
                                    paymentMethod: result.payment_method || 'card',
                                    items: cart.map(item => ({
                                        name: item.name,
                                        quantity: item.quantity,
                                        price: item.price,
                                        vatRate: 0.10
                                    }))
                                });
                            }

                            clearCart();
                            // [Fix] Update Table Status to Cleaning
                            if (selectedTable) {
                                const newLayout = updateTableStatus('main-hall', selectedTable.id, 'cleaning');
                                setLayout(newLayout);
                            }
                            setSelectedTable(null);
                            setIsPaymentModalOpen(false);
                            // Trigger Receipt Print
                            setPrintQueue(prev => [...prev, {
                                type: 'TAX_INVOICE',
                                order: result,
                                tableLabel: selectedTable?.label || '??'
                            }]);
                            setView('map');
                        } else {
                            alert("Payment Failed / Save Failed");
                        }
                    }}
                    // 2. Split Payment (Directly calls Backend)
                    onSplitPayment={async (amount, method, tip) => {
                        // A. Ensure Order Exists first
                        let orderId = lastOrder?.id;
                        if (!orderId) {
                            // Create "Pending" Order first if not saved
                            const initialOrder: Order = {
                                items: [...cart],
                                total: total,
                                status: 'pending',
                                payment_method: 'split',
                                tableId: selectedTable?.id || undefined,
                                id: uuidv4(),
                                created_at: new Date().toISOString(),
                                employeeId: "1",
                                customerName: guestName
                            };
                            const { order } = await saveOrder(initialOrder);
                            if (!order) { alert("Failed to init split order"); return; }
                            orderId = order.id;
                            setLastOrder(order);
                        }

                        // B. Process Partial Payment
                        try {
                            const result = await processPayment(orderId, amount, method, tip);
                            if (result.success) {
                                alert(`Paid £${amount.toFixed(2)} with ${method}. Remaining: £${result.remaining?.toFixed(2) ?? 0}`);
                                if (result.status === 'completed') {
                                    alert("Order Fully Paid!");
                                    // Handle alerts
                                    if (result.alerts && result.alerts.length > 0) alert(`⚠️ ALERTS:\n${result.alerts.join('\n')}`);

                                    clearCart();
                                    // [Fix] Update Table Status to Cleaning
                                    if (selectedTable) {
                                        const newLayout = updateTableStatus('main-hall', selectedTable.id, 'cleaning');
                                        setLayout(newLayout);
                                    }
                                    setSelectedTable(null);
                                    setIsPaymentModalOpen(false);
                                    setView('map');
                                }
                            }
                        } catch (e: any) {
                            alert("Split Payment Failed: " + e.message);
                        }
                    }}
                />
            )}
        </div>
    );
}


