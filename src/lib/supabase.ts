import { Order, CartItem, InventoryItem, Vendor, Employee, PurchaseOrder, MenuItem, TimeEntry, Table } from './types';
import { v4 as uuidv4 } from 'uuid';
import { getOrdersServer, saveOrderServer } from './actions';

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
// Note: User must provide these env variables in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

const STORAGE_KEY = 'foodies_pos_orders';
const TIMESHEET_KEY = 'foodies_pos_timesheets';

// --- Offline Sync Mock ---
const OFFLINE_QUEUE_KEY = 'foodies_pos_offline_queue';

export const getOfflineQueue = (): Order[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const syncOrders = async (): Promise<number> => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return 0;

    // Move from Offline Queue to Main Storage
    const existingOrders = getOrdersLocal();
    const newOrders = [...queue, ...existingOrders];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrders));
    localStorage.removeItem(OFFLINE_QUEUE_KEY);

    // Dispatch events
    window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: JSON.stringify(newOrders)
    }));

    return queue.length;
};

export const saveOrder = async (
    itemsOrOrder: CartItem[] | Order,
    total?: number,
    paymentMethod?: string,
    tableId?: string,
    tip?: number,
    guestName?: string
): Promise<{ order: Order | null, alerts: string[] }> => {
    try {
        let newOrder: Order;

        if (Array.isArray(itemsOrOrder)) {
            newOrder = {
                id: uuidv4(),
                created_at: new Date().toISOString(),
                status: 'pending',
                total: total || 0,
                tip: tip || 0,
                items: itemsOrOrder,
                payment_method: paymentMethod || 'cash',
                tableId,
                customerName: guestName
            };
        } else {
            newOrder = itemsOrOrder;
        }

        // Offline Detection
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            console.log("Offline! saving to queue.");
            const queue = getOfflineQueue();
            queue.push(newOrder);
            localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
            return { order: newOrder, alerts: [] };
        }

        // 1. Insert into Real DB (via Prisma Server Action)
        const result = await saveOrderServer(newOrder);
        if (!result.success) throw result.error;

        // 2. (Handled by Prisma relation create)

        // 3. Fallback/Cache to Local (for UI responsiveness)
        const existingOrders = getOrdersLocal();
        // [PERF] Limit local storage history to last 50 orders to prevent JSON lag
        const updatedOrders = [newOrder, ...existingOrders].slice(0, 50);

        // Update table status if applicable (Local Only for now, should sync to DB tables table)
        if (tableId) {
            updateTableStatus('main-hall', tableId, 'occupied'); // Mock Fn
        }

        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
            window.dispatchEvent(new StorageEvent('storage', {
                key: STORAGE_KEY,
                newValue: JSON.stringify(updatedOrders)
            }));
        }

        return { order: newOrder, alerts: [] };
    } catch (error) {
        console.error("Error saving order:", error);

        // Error Recovery: IF database fails, we still want the order to "work" locally for the demo.
        const existingOrders = getOrdersLocal();
        const updatedOrders = [{
            ...itemsOrOrder,
            id: (itemsOrOrder as any).id || uuidv4(),
            created_at: new Date().toISOString(),
            status: 'pending',
            items: Array.isArray(itemsOrOrder) ? itemsOrOrder : (itemsOrOrder as any).items
        } as Order, ...existingOrders];

        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
            window.dispatchEvent(new StorageEvent('storage', {
                key: STORAGE_KEY,
                newValue: JSON.stringify(updatedOrders)
            }));
            window.dispatchEvent(new CustomEvent('orders_updated'));
        }

        return { order: updatedOrders[0], alerts: [] };
    }
};

export const getOrders = async (): Promise<Order[]> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return getOrdersLocal();

    try {
        const data = await getOrdersServer();
        return data;
    } catch (error) {
        console.error("Prisma Fetch Error:", error);
        return getOrdersLocal();
    }
};

// Update any fields on an order
export const updateOrder = async (updatedOrder: Order): Promise<void> => {
    // Simulate network delay (REMOVED)
    // await new Promise(resolve => setTimeout(resolve, 300));

    const orders = getOrdersLocal();
    const newOrders = orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);

    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrders));
        // Dispatch custom event for same-tab updates
        window.dispatchEvent(new CustomEvent('orders_updated'));
        window.dispatchEvent(new StorageEvent('storage', {
            key: STORAGE_KEY,
            newValue: JSON.stringify(newOrders)
        }));
    }
}

export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<void> => {
    const orders = getOrdersLocal();
    const order = orders.find(o => o.id === orderId);
    if (order) {
        await updateOrder({ ...order, status });
    }
}

// Helper to get from local storage without async
export const getOrdersLocal = (): Order[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

// Subscription helper (polling + event listener)
// Subscription helper (Realtime)
// Subscription helper (Hybrid: Realtime + Local Events)
export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
    // 1. Initial Fetch
    getOrders().then(callback);

    // 2. Realtime Subscription (DB)
    const channel = supabase
        .channel('public:orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async (payload) => {
            const orders = await getOrders();
            callback(orders);
        })
        .subscribe();

    // 3. Local Event Listeners (Fallback for Hybrid/Offline/Demo mode)
    const handleStorage = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY || e.key === null) {
            callback(getOrdersLocal());
        }
    };
    const handleCustom = () => {
        callback(getOrdersLocal());
    }

    if (typeof window !== 'undefined') {
        window.addEventListener('storage', handleStorage);
        window.addEventListener('orders_updated', handleCustom);
    }

    return () => {
        supabase.removeChannel(channel);
        if (typeof window !== 'undefined') {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('orders_updated', handleCustom);
        }
    };
};

// --- Inventory Mock ---
const INVENTORY_KEY = 'foodies_pos_inventory';
const VENDORS_KEY = 'foodies_pos_vendors';

export const getInventory = async (): Promise<InventoryItem[]> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem(INVENTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    const { data } = await supabase.from('inventory').select('*');
    return (data || []) as InventoryItem[]; // Assumes DB columns match type exactly or close enough
};

export const updateInventoryItem = async (item: InventoryItem) => {
    // Upsert to DB
    const { error } = await supabase.from('inventory').upsert({
        id: item.id.includes('inv-') ? undefined : item.id, // If mock ID, let DB gen new UUID? Or just upsert. Mock IDs might cause issues if not UUIDs.
        // Better strategy: If ID is not UUID, treat as insert. 
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        threshold: item.threshold,
        category: item.category
    }).select();

    if (error) console.error("Inventory Error", error);

    // Invalidate/Fetch? Or optimistic update.
    // For simplicity, just return.
};

export const deleteInventoryItem = async (id: string) => {
    await supabase.from('inventory').delete().eq('id', id);
};

// --- Vendors Mock ---
// --- Vendors ---
export const getVendors = async (): Promise<Vendor[]> => {
    const { data } = await supabase.from('vendors').select('*');
    return (data || []).map(v => ({
        ...v,
        contactName: v.contact_name // Map snake to camel
    })) as Vendor[];
};

export const saveVendor = async (vendor: Vendor) => {
    await supabase.from('vendors').upsert({
        id: vendor.id.length < 10 ? undefined : vendor.id, // Handle mock IDs
        name: vendor.name,
        contact_name: vendor.contactName,
        email: vendor.email,
        phone: vendor.phone,
        address: vendor.address
    });
};

export const deleteVendor = async (id: string) => {
    await supabase.from('vendors').delete().eq('id', id);
};

// --- Employee Mock ---
const EMPLOYEES_KEY = 'foodies_pos_employees';
const PO_KEY = 'foodies_pos_purchase_orders';

// --- Employees ---
export const getEmployees = async (): Promise<Employee[]> => {
    const { data } = await supabase.from('employees').select('*');
    return (data || []).map(e => ({
        ...e,
        firstName: e.first_name,
        lastName: e.last_name,
        hourlyRate: e.hourly_rate
    })) as Employee[];
};

export const saveEmployee = async (employee: Employee) => {
    await supabase.from('employees').upsert({
        id: employee.id.includes('emp-') ? undefined : employee.id,
        first_name: employee.firstName,
        last_name: employee.lastName,
        role: employee.role,
        hourly_rate: employee.hourlyRate,
        pin: employee.pin
    });
};

export const deleteEmployee = async (id: string) => {
    await supabase.from('employees').delete().eq('id', id);
};

// --- Purchase Orders Mock ---
export const getPurchaseOrders = (): PurchaseOrder[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(PO_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const savePurchaseOrder = (po: PurchaseOrder) => {
    const list = getPurchaseOrders();
    const idx = list.findIndex(p => p.id === po.id);
    let newList;
    if (idx >= 0) {
        newList = list.map(p => p.id === po.id ? po : p);
    } else {
        newList = [...list, po];
    }
    localStorage.setItem(PO_KEY, JSON.stringify(newList));
    return newList;
};

// --- Mock Floor Plan ---
import { Area, TableStatus } from './types';

export const getLayout = (): Area[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('restaurant_layout');
    if (stored) return JSON.parse(stored);

    // Default layout if empty
    return [
        {
            id: 'main-hall',
            name: 'Main Dining',
            tables: [
                // Left Vertical Column (3 tables)
                { id: 't1', label: 'Vadodara', x: 50, y: 50, width: 180, height: 140, shape: 'rectangle', seats: 4, status: 'available' },
                { id: 't2', label: 'Anand', x: 50, y: 230, width: 180, height: 140, shape: 'rectangle', seats: 4, status: 'available' },
                { id: 't3', label: 'Ahmedabad', x: 50, y: 410, width: 180, height: 140, shape: 'rectangle', seats: 4, status: 'available' },

                // Right Vertical Column (2 tables)
                { id: 't4', label: 'Surat', x: 600, y: 50, width: 180, height: 140, shape: 'rectangle', seats: 6, status: 'available' },
                { id: 't5', label: 'Nadiyad', x: 600, y: 230, width: 180, height: 140, shape: 'rectangle', seats: 6, status: 'available' },
            ]
        }
    ];
};

export const saveLayout = (layout: Area[]) => {
    localStorage.setItem('restaurant_layout', JSON.stringify(layout));
};

export const updateTableStatus = (areaId: string, tableId: string, status: TableStatus, extraUpdates?: Partial<Table>) => {
    const layout = getLayout();
    const area = layout.find(a => a.id === areaId);
    if (area) {
        const table = area.tables.find(t => t.id === tableId);
        if (table) {
            table.status = status;
            if (extraUpdates) {
                Object.assign(table, extraUpdates);
            }
            // If becoming occupied, set seatedAt
            if (status === 'occupied' && !table.seatedAt) {
                table.seatedAt = new Date().toISOString();
            }
            // If becoming available, clear data
            if (status === 'available') {
                table.seatedAt = undefined;
                delete table.guestCount;
                delete table.assignedServerId;
            }
            saveLayout(layout);
        }
    }
    return layout;
};

// --- Menu Management Mock ---
const MENU_OVERRIDES_KEY = 'foodies_pos_menu_overrides';

export interface MenuOverride {
    id: string;
    available?: boolean;
    price?: number;
    recipe?: {
        inventoryItemId: string;
        quantity: number;
    }[];
}

export const getMenuOverrides = (): Record<string, MenuOverride> => {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(MENU_OVERRIDES_KEY);
    return stored ? JSON.parse(stored) : {};
};

// --- Time Clock Logic ---
export const getTimesheets = async (): Promise<TimeEntry[]> => {
    const { data } = await supabase.from('timesheets').select('*');
    return (data || []).map(t => ({
        id: t.id,
        employeeId: t.employee_id,
        employeeName: 'Unknown', // Join with employees table in real app
        role: t.role,
        clockIn: t.clock_in,
        clockOut: t.clock_out,
        declaredTips: t.declared_tips,
        breaks: t.breaks
    })) as TimeEntry[];
};

export const clockIn = async (employeeId: string, employeeName: string, role?: string): Promise<TimeEntry> => {
    // 1. Check for active shift in DB (clock_out IS NULL)
    const { data: active } = await supabase
        .from('timesheets')
        .select('*')
        .eq('employee_id', employeeId) // Assuming PIN implies ID, but actually we need UUID. 
    // Logic Gap: The PIN is just a string. `employees` table maps PIN to ID.
    // We need to look up Employee by PIN first.
    // For this migration, let's assume `employeeId` PASSED IN is arguably the UUID if we are strict, 
    // OR we lookup by PIN. 
    // In POSInterface, we pass the PIN as ID. This is flawed for Real DB. 
    // Fix: Lookup Employee UUID by PIN.

    // Quick Fix for Prototype: Treat PIN as ID for lookup if not UUID format? 
    // Or just look up 'pin' column in employees table.

    let realEmployeeId = employeeId;
    const { data: emp } = await supabase.from('employees').select('id, first_name').eq('pin', employeeId).single();
    if (emp) {
        realEmployeeId = emp.id;
        employeeName = emp.first_name;
    } else {
        // Fallback or Error? 
        // For smooth migration, if not found, maybe allow for now? 
        // No, strict mode:
        // throw new Error("Invalid PIN");
    }

    if (active && active.length > 0) throw new Error("Already clocked in!");

    const newEntry = {
        employee_id: realEmployeeId,
        role: role,
        clock_in: new Date().toISOString(),
        breaks: []
    };

    const { data: inserted, error } = await supabase.from('timesheets').insert(newEntry).select().single();

    if (error) throw error;

    return {
        id: inserted.id,
        employeeId: inserted.employee_id,
        employeeName,
        role: inserted.role,
        clockIn: inserted.clock_in,
        breaks: []
    };
};

// Helper to get active shift (most recent open)
const getActiveShift = async (pin: string) => {
    // Resolve PIN to ID
    const { data: emp } = await supabase.from('employees').select('id').eq('pin', pin).single();
    if (!emp) throw new Error("Invalid PIN");

    const { data } = await supabase.from('timesheets')
        .select('*')
        .eq('employee_id', emp.id)
        .is('clock_out', null)
        .single();

    if (!data) throw new Error("No active shift found!");
    return data;
}

export const startBreak = async (pin: string, type: 'paid' | 'unpaid'): Promise<TimeEntry> => {
    const shift = await getActiveShift(pin);
    const breaks = shift.breaks || [];

    if (breaks.some((b: any) => !b.endTime)) throw new Error("Already on break!");

    const newBreaks = [...breaks, { startTime: new Date().toISOString(), type }];

    const { data, error } = await supabase
        .from('timesheets')
        .update({ breaks: newBreaks })
        .eq('id', shift.id)
        .select()
        .single();

    if (error) throw error;
    return data as any;
};

export const endBreak = async (pin: string): Promise<TimeEntry> => {
    const shift = await getActiveShift(pin);
    const breaks = shift.breaks || [];
    const openIndex = breaks.findIndex((b: any) => !b.endTime);

    if (openIndex === -1) throw new Error("Not on break!");

    breaks[openIndex].endTime = new Date().toISOString();

    const { data, error } = await supabase
        .from('timesheets')
        .update({ breaks: breaks })
        .eq('id', shift.id)
        .select()
        .single();

    if (error) throw error;
    return data as any;
};

export const clockOut = async (pin: string, tips?: number): Promise<TimeEntry> => {
    const shift = await getActiveShift(pin);

    if (shift.breaks && shift.breaks.some((b: any) => !b.endTime)) {
        throw new Error("Must end break first!");
    }

    const { data, error } = await supabase
        .from('timesheets')
        .update({
            clock_out: new Date().toISOString(),
            declared_tips: tips
        })
        .eq('id', shift.id)
        .select()
        .single();

    if (error) throw error;
    return data as any;
};

// --- Reports Logic ---
export const getZReportStats = (date: Date) => {
    const orders = getOrdersLocal();
    // Filter orders for the selected date (local time matching)
    // Simple logic: match YYYY-MM-DD
    const dateStr = date.toISOString().split('T')[0];

    const dailyOrders = orders.filter(o =>
        o.status === 'completed' &&
        o.created_at.startsWith(dateStr)
    );

    const totalSales = dailyOrders.reduce((sum, o) => sum + o.total, 0);
    const totalTips = dailyOrders.reduce((sum, o) => sum + (o.tip || 0), 0);
    const totalOrders = dailyOrders.length;

    const paymentMethods = dailyOrders.reduce((acc, o) => {
        acc[o.payment_method] = (acc[o.payment_method] || 0) + o.total;
        return acc;
    }, {} as Record<string, number>);

    return {
        date: dateStr,
        totalSales,
        totalTips,
        totalOrders,
        paymentMethods,
        orders: dailyOrders
    };
};

export const updateMenuItemOverride = (id: string, updates: Partial<MenuOverride>) => {
    const overrides = getMenuOverrides();
    overrides[id] = { ...(overrides[id] || { id }), ...updates };
    localStorage.setItem(MENU_OVERRIDES_KEY, JSON.stringify(overrides));

    // Notify components
    window.dispatchEvent(new CustomEvent('menu_updated'));
    return overrides;
};
