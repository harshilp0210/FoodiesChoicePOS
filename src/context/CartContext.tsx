"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem, CartItem } from '@/lib/types';

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (item: MenuItem, quantity?: number, modifiers?: any[], notes?: string) => void;
    removeFromCart: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    updateItem: (itemId: string, updates: Partial<CartItem>) => void; // [NEW]
    clearCart: () => void;
    subtotal: number;
    tax: number;
    total: number;
    setCartItems: (items: CartItem[]) => void; // [NEW] Exposed for restoring held orders
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    const addToCart = (item: MenuItem, quantity: number = 1, modifiers: any[] = [], notes: string = "") => {
        setCartItems((prev) => {
            // Create a unique signature for this exact variation
            // We can check if an item with same ID AND same modifiers AND same notes exists
            const modSignature = JSON.stringify(modifiers.map(m => m.id).sort());

            const existing = prev.find((i) =>
                i.id === item.id &&
                JSON.stringify((i.selectedModifiers || []).map(m => m.id).sort()) === modSignature &&
                (i.notes || "") === notes
            );

            if (existing) {
                return prev.map((i) =>
                    i.cartId === existing.cartId ? { ...i, quantity: i.quantity + quantity } : i
                );
            }

            // Calculate base price override if item has mods price accumulation
            // But usually price is base + mods. 
            // The item.price is base. Modifier prices are separate.
            // When calculating total line item price, we sum them.

            return [...prev, {
                ...item,
                quantity,
                cartId: self.crypto.randomUUID(),
                selectedModifiers: modifiers,
                notes
            }];
        });
    };

    const removeFromCart = (itemId: string) => {
        setCartItems((prev) => prev.filter((i) => i.id !== itemId));
    };

    const updateQuantity = (itemId: string, quantity: number) => {
        if (quantity < 1) {
            removeFromCart(itemId);
            return;
        }
        setCartItems((prev) =>
            prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
        );
    };

    const updateItem = (itemId: string, updates: Partial<CartItem>) => {
        setCartItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));
    };

    const clearCart = () => setCartItems([]);

    const subtotal = cartItems.reduce(
        (acc, item) => {
            const modsTotal = (item.selectedModifiers || []).reduce((sum, m) => sum + m.price, 0);
            return acc + (item.price + modsTotal) * item.quantity;
        },
        0
    );

    // Assuming 10% tax for now, configurable later
    const tax = subtotal * 0.10;
    const total = subtotal + tax;

    // Broadcast cart text updates to other tabs (Customer Display)
    useEffect(() => {
        const channel = new BroadcastChannel('customer-display');
        channel.postMessage({
            type: 'CART_UPDATE',
            payload: {
                cartItems,
                subtotal,
                tax,
                total
            }
        });

        // Cleanup
        return () => {
            channel.close();
        };
    }, [cartItems, subtotal, tax, total]);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                updateItem,
                clearCart,
                subtotal,
                tax,
                total,
                setCartItems, // [NEW]
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
