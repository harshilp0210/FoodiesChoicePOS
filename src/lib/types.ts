
export interface Modifier {
    id: string;
    name: string;
    price: number;
}

export interface ModifierGroup {
    id: string;
    name: string;
    minSelection: number; // 0 = optional, 1+ = required
    maxSelection: number; // 1 = single choice, >1 = multiple
    modifiers: Modifier[];
}

export interface MenuItem {
    id: string;
    category: string;
    name: string;
    price: number;
    description: string;
    image?: string;
    available: boolean;
    modifierGroups?: ModifierGroup[]; // [NEW] Supported modifiers for this item
    recipe?: {
        inventoryItemId: string;
        quantity: number;
    }[];
}

export interface CartItem extends MenuItem {
    cartId: string;
    quantity: number;
    notes?: string;
    selectedModifiers?: Modifier[]; // [NEW] Selected extra options
    sentToKitchen?: boolean; // [NEW] Track if item has been sent to kitchen
    seatId?: number; // [NEW] Seat Assignment
}

export interface Order {
    id: string;
    created_at: string;
    status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'voided' | 'refunded';
    total: number;
    tip?: number; // [NEW] Tip amount
    serviceCharge?: number; // [NEW] 18% Auto-Grat or similar
    tax?: number; // [NEW] Explicit Tax Bucket
    foodSales?: number; // [NEW] GL Snapshot
    drinkSales?: number; // [NEW] GL Snapshot
    items: CartItem[];
    payment_method: string;
    tableId?: string;
    customerName?: string; // For online/takeout orders
    customerPhone?: string;
    orderType?: 'dine-in' | 'pickup' | 'delivery';
    guestCount?: number; // [NEW] For dining in
    employeeId?: string; // [NEW] Staff member who created/closed the order
    driverId?: string;
    deliveryProvider?: 'internal' | 'doordash' | 'ubereats';
    deliveryStatus?: 'pending-assignment' | 'out-for-delivery' | 'delivered';
    deliveryAddress?: string;
}

export interface Category {
    name: string;
    items: MenuItem[];
}

export interface InventoryItem {
    id: string;
    name: string;
    quantity: number;
    unit: string; // e.g., 'kg', 'packs', 'liters'
    threshold: number; // Low stock alert level
    costPerUnit?: number; // Cost price per unit
    category: string;
}

export interface Vendor {
    id: string;
    name: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;
}

export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    role: EmployeeRole;
    roles?: EmployeeRole[]; // [NEW] Multiple roles support
    hourlyRate: number;
    pin: string;
}

export type EmployeeRole = 'Manager' | 'Cashier' | 'Chef' | 'Waiter' | 'Driver' | 'Bartender';

export interface PurchaseOrder {
    id: string;
    vendorId: string;
    items: {
        inventoryItemId: string;
        quantity: number;
        cost: number;
    }[];
    totalCost: number;
    status: 'Pending' | 'Ordered' | 'Received';
    synced?: boolean;
    created_at: string;
}

export type TableStatus = 'available' | 'occupied' | 'billed' | 'cleaning';

export interface Table {
    id: string;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    shape: 'rectangle' | 'circle';
    seats: number;
    status: TableStatus;
    currentOrderId?: string;
    seatedAt?: string; // [NEW] ISO Date for timer
    assignedServerId?: string; // [NEW] Server ownership
    guestCount?: number; // [NEW] Number of covers
}

export interface Area {
    id: string;
    name: string;
    tables: Table[];
}

export interface TimeEntry {
    id: string;
    employeeId: string;
    employeeName: string;
    role?: EmployeeRole; // [NEW] Role worked for this shift
    clockIn: string; // ISO Date String
    clockOut?: string; // ISO Date String
    breaks?: Break[]; // [NEW]
    declaredTips?: number; // [NEW]
}

export interface Break {
    id: string;
    startTime: string;
    endTime?: string;
    type: 'paid' | 'unpaid';
}
