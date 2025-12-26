"use server";

import prisma from './prisma';
import { Order, CartItem, InventoryItem, Vendor, Employee, TimeEntry, Area } from './types';
import { revalidatePath } from 'next/cache';

// --- Orders ---

// --- Orders ---

// --- Security ---
export async function verifyManagerPin(pin: string): Promise<boolean> {
    const employee = await prisma.employee.findUnique({
        where: { pin }
    });
    // Check if exists AND has elevated role
    if (employee && (employee.role.toLowerCase() === 'manager' || employee.role.toLowerCase() === 'admin' || employee.role.toLowerCase() === 'owner')) {
        return true;
    }
    return false;
}

export async function getOrdersServer(): Promise<Order[]> {
    try {
        const orders = await prisma.order.findMany({
            take: 100, // [PERF] Limit to last 100 orders
            include: {
                items: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return orders.map((o: any) => ({
            id: o.id,
            created_at: o.createdAt.toISOString(),
            status: o.status,
            total: o.total,
            tip: o.tip,
            payment_method: o.paymentMethod,
            tableId: o.tableId,
            guestCount: o.guestCount,
            employeeId: o.employeeId,
            items: o.items.map((i: any) => ({
                id: i.menuItemId,
                name: i.name || "Unknown Item",
                price: i.price,
                quantity: i.quantity,
                notes: i.notes,
                selectedModifiers: i.selectedModifiers ? JSON.parse(JSON.stringify(i.selectedModifiers)) : undefined,
                category: i.category || 'Uncategorized'
            }))
        })) as Order[];
    } catch (e) {
        console.error("Prisma Error", e);
        return [];
    }
}

export async function saveOrderServer(order: Order) {
    try {
        // [NEW] Revenue Shredding Logic
        // Calculate splits if not provided
        let foodSales = 0;
        let drinkSales = 0;
        let tax = order.tax || 0;

        order.items.forEach(i => {
            const cat = (i.category || '').toLowerCase();
            const amount = i.price * i.quantity;
            if (cat.includes('drink') || cat.includes('beverage') || cat.includes('bar') || cat.includes('wine') || cat.includes('cocktail')) {
                drinkSales += amount;
            } else {
                foodSales += amount;
            }
        });

        // 10% Tax assumption if not set
        if (!tax) {
            tax = (foodSales + drinkSales) * 0.10;
        }

        const result = await prisma.order.upsert({
            where: { id: order.id },
            update: {
                status: order.status,
                total: order.total,
                tip: order.tip,
                serviceCharge: order.serviceCharge,
                tax: tax,
                foodSales: foodSales,
                drinkSales: drinkSales,
                paymentMethod: order.payment_method,
                employeeId: order.employeeId
            },
            create: {
                id: order.id,
                createdAt: new Date(order.created_at),
                status: order.status,
                total: order.total,
                tip: order.tip,
                serviceCharge: order.serviceCharge || 0,
                tax: tax,
                foodSales: foodSales,
                drinkSales: drinkSales,
                paymentMethod: order.payment_method,
                tableId: order.tableId,
                guestCount: order.guestCount,
                employeeId: order.employeeId,
                items: {
                    create: order.items.map(item => ({
                        menuItemId: item.id,
                        name: item.name,
                        category: item.category,
                        quantity: item.quantity,
                        price: item.price,
                        notes: item.notes,
                        selectedModifiers: item.selectedModifiers ? JSON.parse(JSON.stringify(item.selectedModifiers)) : undefined
                    }))
                }
            }
        });

        // Trigger Inventory Depletion if Completed
        let alerts: string[] = [];
        if (order.status === 'completed') {
            // [PERF] Fire and forget inventory depletion so UI does not wait?
            // Next.js might kill it. Better to await but optimize.
            alerts = await processInventoryDepletion(order);
        }

        revalidatePath('/');
        return { success: true, order: result, alerts };
    } catch (e) {
        console.error("Prisma Save Error", e);
        return { success: false, error: e };
    }
}

// --- Inventory & 86 Logic ---

async function processInventoryDepletion(order: Order): Promise<string[]> {
    const alerts: string[] = [];
    // [PERF] Parallelize checks and updates
    // Fetch recipes for all items (optimized: fetch unique menu items once)
    const uniqueItemIds = Array.from(new Set(order.items.map(i => i.id)));
    const menuItems = await prisma.menuItem.findMany({
        where: { id: { in: uniqueItemIds } },
        select: { id: true, name: true, recipe: true }
    });

    const menuItemMap = new Map(menuItems.map((m: any) => [m.id, m]));

    await Promise.all(order.items.map(async (item) => {
        const menuItem = menuItemMap.get(item.id);
        const qty = item.quantity;

        let depleted = false;

        // 1. Recipe Logic
        if (menuItem?.recipe && Array.isArray(menuItem.recipe)) {
            const recipe = menuItem.recipe as { inventoryItemId: string, quantity: number }[];
            for (const ing of recipe) {
                const invItem = await prisma.inventoryItem.findUnique({ where: { id: ing.inventoryItemId } });
                if (invItem) {
                    const newQty = invItem.quantity - (ing.quantity * qty);
                    await prisma.inventoryItem.update({
                        where: { id: ing.inventoryItemId },
                        data: { quantity: newQty }
                    });
                    if (newQty <= invItem.threshold) {
                        alerts.push(`LOW STOCK: ${invItem.name} (${newQty.toFixed(1)} ${invItem.unit} left)`);
                    }
                    if (newQty <= 0) {
                        alerts.push(`86'd: ${invItem.name}`);
                        // Could auto-disable parent menu item here
                    }
                }
            }
            depleted = true;
        }

        // 2. Fallback: Name Match Logic (if no recipe)
        if (!depleted) {
            const invItem = await prisma.inventoryItem.findFirst({
                where: { name: { contains: item.name, mode: 'insensitive' } }
            });

            if (invItem) {
                const newQty = invItem.quantity - qty;
                await prisma.inventoryItem.update({
                    where: { id: invItem.id },
                    data: { quantity: newQty }
                });

                if (newQty <= invItem.threshold) {
                    alerts.push(`LOW STOCK: ${invItem.name} (${newQty.toFixed(1)} ${invItem.unit} left)`);
                }
            }
        }
    }));
    return alerts;
    return alerts;
}

// --- Split Payments ---
export async function processPayment(orderId: string, amount: number, method: string, tip: number) {
    // 1. Create Payment Record
    await prisma.payment.create({
        data: {
            orderId,
            amount,
            method,
            tip
        }
    });

    // 2. Check totals
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { payments: true }
    });

    if (!order) throw new Error("Order not found");

    const totalPaid = order.payments.reduce((sum: number, p: any) => sum + p.amount, 0);

    // 3. Close if fully paid (tolerance 0.01)
    if (totalPaid >= order.total - 0.01) {
        await prisma.order.update({
            where: { id: orderId },
            data: { status: 'completed' }
        });

        // Trigger Inventory Depletion (only once on full completion)
        const alerts = await processInventoryDepletion(order as any);
        revalidatePath('/');
        return { success: true, status: 'completed', alerts };
    }

    revalidatePath('/');
    return { success: true, status: 'pending', remaining: order.total - totalPaid };
}

// --- Refunds ---
export async function refundOrder(orderId: string, managerPin: string) {
    // 1. Verify PIN
    const isValid = await verifyManagerPin(managerPin);
    if (!isValid) throw new Error("Invalid Manager PIN");

    // 2. Fetch Order to reverse inventory
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
    });
    if (!order) throw new Error("Order not found");

    // 3. Update Status
    await prisma.order.update({
        where: { id: orderId },
        data: { status: 'refunded' }
    });

    // 4. Reverse Inventory
    await reverseInventoryDepletion(order.items as any);

    revalidatePath('/');
    return { success: true };
}

// --- Server Checkout (Blind Drop) ---

export interface ShiftStats {
    employeeId: string;
    employeeName: string;
    totalSales: number;     // Gross Sales
    foodSales: number;     // [NEW]
    beverageSales: number; // [NEW]
    totalTips: number;      // Credit Ops Tips + Declared Cash Tips (start with credit)
    cashSales: number;      // Cash payments collected
    creditSales: number;    // Card payments
    tipOuts: {
        busser: number;     // 3% of Sales? Or Tips? User said "percentage of sales". 3% of Sales seems high for busser tipout (usually % of tips or 1-2% sales). 
        // Prompt: "percentage of sales... Busboys (3%), Bartenders (1%), Runners (2%)" -> Total 6% of Sales.
        bar: number;
        runner: number;
        total: number;
    };
    netTips: number;        // Tips - TipOuts
    expectedCash: number;   // Cash Sales - Net Tips (if tips paid out nightly) OR Cash Sales (if tips on paycheck)
    // "Blind Drop" usually matches "Cash Owing". 
    // If tips are paid out same day, Server keeps Cash Tips + Credit Tips from Cash Owed.
    // Cash Due = Cash Sales - Credit Tips - TipOuts.
    // Let's implement: Cash Due = Cash Sales. (Server keeps their tips separate? Or turns in everything?)
    // "Server counts their cash and enters it... system highlights Overage/Shortage"
    // Usually implies Cash Due = Cash Sales (and maybe minus Credit Tips if paid in cash).
    // Let's assume Cash Due = Cash Sales.
}

export async function getServerShiftStats(employeeId: string, shiftStart: Date): Promise<ShiftStats> {
    // 1. Fetch Orders closed by this employee since shiftStart
    const orders = await prisma.order.findMany({
        where: {
            employeeId: employeeId,
            status: 'completed',
            createdAt: { gte: shiftStart }
        },
        include: { items: true }
    });

    let totalSales = 0;
    let foodSales = 0;
    let beverageSales = 0;
    let cashSales = 0;
    let creditSales = 0;
    let totalTips = 0;

    orders.forEach(o => {
        totalSales += o.total; // Total includes tax usually. Tip outs on Net or Gross? Let's use Gross for simplicity.

        // Split Food/Bev
        // We need to iterate items to split the TOTAL accurately? 
        // Order.total is sum of items. 
        // We'll iterate items.
        let orderFood = 0;
        let orderBev = 0;

        o.items.forEach((i: any) => {
            const cat = (i.category || '').toLowerCase();
            const amount = i.price * i.quantity;
            if (cat.includes('drink') || cat.includes('beverage') || cat.includes('bar') || cat.includes('wine') || cat.includes('cocktail')) {
                orderBev += amount;
            } else {
                orderFood += amount;
            }
        });

        foodSales += orderFood;
        beverageSales += orderBev;

        if (o.paymentMethod === 'cash') {
            cashSales += o.total;
        } else {
            creditSales += o.total;
        }
        totalTips += (o.tip || 0);
    });

    // Tip Out Calculations (User Rules: 3% Bus, 1% Bar, 2% Runner = 6% of SALES)
    const busserTipOut = totalSales * 0.03;
    const barTipOut = totalSales * 0.01;
    const runnerTipOut = totalSales * 0.02;
    const totalTipOut = busserTipOut + barTipOut + runnerTipOut;

    // Expected Cash (Blind Drop Target)
    // If server keeps their tips from the cash drawer:
    // Cash Due = Cash Sales - (Credit Tips Paid Out - Tip Outs?)
    // This gets complex. Standard "Blind Drop": Server drops ALL Cash Sales. Tips processed later.
    // Or Server drops "Cash Sales - Credit Tips". 
    // Let's go with: Expected Cash = Cash Sales.
    const expectedCash = cashSales;

    // Get Name
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });

    return {
        employeeId,
        employeeName: emp?.firstName || 'Staff',
        totalSales,
        foodSales,
        beverageSales,
        totalTips,
        cashSales,
        creditSales,
        tipOuts: {
            busser: busserTipOut,
            bar: barTipOut,
            runner: runnerTipOut,
            total: totalTipOut
        },
        netTips: totalTips - totalTipOut,
        expectedCash
    };
}

export async function closeServerShift(employeeId: string, cashDrop: number, declaredTips: number) {
    // 1. Find active shift
    const shift = await prisma.timesheet.findFirst({
        where: { employeeId, clockOut: null }
    });

    if (!shift) throw new Error("No active shift found.");

    // 2. Close it
    await prisma.timesheet.update({
        where: { id: shift.id },
        data: {
            clockOut: new Date(),
            declaredTips: declaredTips,
            // Could store cashDrop in a separate implementation or JSON field
        }
    });

    // 3. Return report?
    return { success: true };
}

// --- Void Logic ---

export async function voidOrder(orderId: string, managerPin: string) {
    // 1. Verify Manager PIN
    // Mock check. Real app would lookup employee by PIN and check Role === 'Manager'
    if (managerPin !== '1234') {
        throw new Error("Invalid Manager PIN");
    }

    // 2. Fetch Order
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
    });

    if (!order) throw new Error("Order not found");
    if (order.status === 'cancelled') throw new Error("Already cancelled");

    // 3. Mark Cancelled
    await prisma.order.update({
        where: { id: orderId },
        data: { status: 'cancelled' }
    });

    // 4. Reverse Inventory (Re-Stock)
    await reverseInventoryDepletion(order as any);

    revalidatePath('/');
    return { success: true };
}

async function reverseInventoryDepletion(order: Order) {
    for (const item of order.items) {
        const invItem = await prisma.inventoryItem.findFirst({
            where: { name: { contains: item.name, mode: 'insensitive' } }
        });
        if (invItem) {
            await prisma.inventoryItem.update({
                where: { id: invItem.id },
                data: { quantity: { increment: item.quantity } }
            });
        }
    }
}
