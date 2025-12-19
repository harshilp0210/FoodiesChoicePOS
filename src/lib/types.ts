
export interface MenuItem {
    id: string;
    category: string;
    name: string;
    price: number;
    description: string;
    image?: string;
}

export interface CartItem extends MenuItem {
    cartId: string;
    quantity: number;
    notes?: string;
}

export interface Order {
    id: string;
    created_at: string;
    status: 'pending' | 'preparing' | 'ready' | 'completed';
    total: number;
    items: CartItem[];
    payment_method: string;
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
    role: 'Manager' | 'Cashier' | 'Chef' | 'Waiter';
    hourlyRate: number;
    pin: string;
}

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
    created_at: string;
}
