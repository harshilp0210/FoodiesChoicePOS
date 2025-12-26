
export const mockSalesData = {
    weekly: [
        { day: 'Mon', revenue: 4200, orders: 120 },
        { day: 'Tue', revenue: 4800, orders: 135 },
        { day: 'Wed', revenue: 5100, orders: 142 },
        { day: 'Thu', revenue: 5900, orders: 165 },
        { day: 'Fri', revenue: 8400, orders: 220 },
        { day: 'Sat', revenue: 9500, orders: 255 },
        { day: 'Sun', revenue: 7200, orders: 198 },
    ],
    hourly: Array.from({ length: 14 }, (_, i) => ({
        hour: `${i + 10}:00`,
        sales: Math.floor(Math.random() * 1000) + 200,
        labor: Math.floor(Math.random() * 300) + 100
    })),
    summary: {
        netSales: 45100,
        guestCount: 1235,
        avgTicket: 36.52,
        tablesTurned: 412,
        laborPercentage: 24.5
    }
};

export const mockMenuData = {
    pmix: [
        { name: "Burger Combo", qty: 245, sales: 3675, profit: 1800, category: "Mains" },
        { name: "Caesar Salad", qty: 180, sales: 2160, profit: 1600, category: "Starters" },
        { name: "Pepperoni Pizza", qty: 165, sales: 2970, profit: 2100, category: "Mains" },
        { name: "Coke", qty: 450, sales: 1125, profit: 1050, category: "Drinks" },
        { name: "Tiramisu", qty: 95, sales: 855, profit: 600, category: "Dessert" },
    ],
    modifiers: [
        { name: "Extra Cheese", count: 124 },
        { name: "No Onions", count: 89 },
        { name: "Gluten Free Crust", count: 45 },
    ],
    outOfStock: [
        { item: "Avocado", time: "Friday 7:30 PM", reason: "Supplier issue" },
        { item: "Draft Beer (IPA)", time: "Saturday 9:00 PM", reason: "Keg kicked" },
    ]
};

export const mockLaborData = {
    employees: [
        { name: "Sarah Smith", role: "Server", hours: 38.5, sales: 4200, tips: 650 },
        { name: "Mike Johnson", role: "Bartender", hours: 42.0, sales: 5100, tips: 820 },
        { name: "Emily Davis", role: "Host", hours: 25.0, sales: 0, tips: 120 },
        { name: "Chef Brown", role: "Kitchen", hours: 45.0, sales: 0, tips: 0 },
    ],
    laborCost: 11250,
    sales: 45100,
};

export const mockFinancialData = {
    payouts: [
        { date: "Oct 24", amount: 4850.25, status: "Deposited" },
        { date: "Oct 25", amount: 5210.50, status: "Deposited" },
        { date: "Oct 26", amount: 8100.75, status: "Processing" },
    ],
    cards: [
        { type: "Visa", count: 450, total: 22500 },
        { type: "Mastercard", count: 320, total: 15600 },
        { type: "Amex", count: 85, total: 5200 },
        { type: "Cash", count: 120, total: 1800 },
    ]
};

export const mockAuditData = {
    voids: [
        { server: "Sarah S", item: "Steak", time: "18:45", reason: "Customer changed mind", amount: 35 },
        { server: "Mike J", item: "Beer", time: "21:20", reason: "Spilled", amount: 8 },
    ],
    noSales: [
        { user: "Manager", time: "10:15", reason: "Change for register" },
        { user: "Mike J", time: "23:45", reason: "Closing drawer" },
    ]
};
