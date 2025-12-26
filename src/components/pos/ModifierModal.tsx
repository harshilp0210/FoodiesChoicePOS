"use client";

import { useState } from 'react';
import { MenuItem, Modifier, ModifierGroup } from '@/lib/types';
import { Plus, Minus, X, Check } from 'lucide-react';

interface ModifierModalProps {
    item: MenuItem;
    onClose: () => void;
    onAddToOrder: (item: MenuItem, quantity: number, modifiers: Modifier[], notes: string) => void;
}

export default function ModifierModal({ item, onClose, onAddToOrder }: ModifierModalProps) {
    const [quantity, setQuantity] = useState(1);
    const [selectedModifiers, setSelectedModifiers] = useState<Record<string, Modifier[]>>({});
    const [notes, setNotes] = useState("");

    // Initialize groups if not present
    const groups = item.modifierGroups || [];

    const handleModifierToggle = (group: ModifierGroup, mod: Modifier) => {
        setSelectedModifiers(prev => {
            const current = prev[group.id] || [];
            const isSelected = current.find(m => m.id === mod.id);

            // If single selection (radio behavior)
            if (group.maxSelection === 1) {
                // If required (min 1) and already selected, don't allow deselecting by clicking (unless replacing)
                // Actually radio buttons usually just switch.
                return { ...prev, [group.id]: [mod] };
            }

            // Multi selection (checkbox behavior)
            if (isSelected) {
                return { ...prev, [group.id]: current.filter(m => m.id !== mod.id) };
            } else {
                if (current.length >= group.maxSelection) return prev; // Max check
                return { ...prev, [group.id]: [...current, mod] };
            }
        });
    };

    const validate = () => {
        for (const group of groups) {
            const current = selectedModifiers[group.id] || [];
            if (current.length < group.minSelection) {
                return false;
            }
        }
        return true;
    };

    const isValid = validate();

    const flattenModifiers = () => {
        return Object.values(selectedModifiers).flat();
    };

    const calculateTotal = () => {
        const modTotal = flattenModifiers().reduce((acc, m) => acc + m.price, 0);
        return (item.price + modTotal) * quantity;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">{item.name}</h2>
                        <p className="text-slate-500 font-medium">${item.price.toFixed(2)}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {groups.map(group => (
                        <div key={group.id} className="space-y-3">
                            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                                <div>
                                    <h3 className="font-bold text-slate-800">{group.name}</h3>
                                    <p className="text-xs text-slate-500">
                                        {group.minSelection > 0
                                            ? `Required • Select ${group.minSelection === 1 && group.maxSelection === 1 ? '1' : `at least ${group.minSelection}`}`
                                            : `Optional • Max ${group.maxSelection}`}
                                    </p>
                                </div>
                                {(selectedModifiers[group.id]?.length || 0) >= group.minSelection && group.minSelection > 0 && (
                                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Completed
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {group.modifiers.map(mod => {
                                    const isSelected = (selectedModifiers[group.id] || []).some(m => m.id === mod.id);
                                    return (
                                        <button
                                            key={mod.id}
                                            onClick={() => handleModifierToggle(group, mod)}
                                            className={`flex justify-between items-center p-4 rounded-xl border-2 transition-all ${isSelected
                                                    ? 'border-primary bg-primary/5 text-primary'
                                                    : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50 text-slate-700'
                                                }`}
                                        >
                                            <span className="font-medium text-left">{mod.name}</span>
                                            {mod.price > 0 && (
                                                <span className="text-sm font-bold opacity-80">+${mod.price.toFixed(2)}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    <div className="space-y-3 pt-4 border-t border-slate-100">
                        <label className="font-bold text-slate-800">Special Instructions</label>
                        <textarea
                            className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-700 placeholder:text-slate-400"
                            placeholder="Add notes for the kitchen (e.g. allergy info)..."
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
                    <div className="flex items-center gap-6">
                        {/* Quantity */}
                        <div className="flex items-center gap-3 bg-white p-1.5 rounded-full border border-slate-200 shadow-sm">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 font-bold text-lg"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-lg font-bold w-6 text-center text-slate-900">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 font-bold text-lg"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Add Button */}
                        <button
                            disabled={!isValid}
                            onClick={() => onAddToOrder(item, quantity, flattenModifiers(), notes)}
                            className="flex-1 bg-primary text-white h-14 rounded-xl font-bold text-lg shadow-lg hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:shadow-none flex items-center justify-between px-6"
                        >
                            <span>Add to Order</span>
                            <span>${calculateTotal().toFixed(2)}</span>
                        </button>
                    </div>
                    {!isValid && (
                        <p className="text-center text-red-500 text-xs font-bold mt-2 animate-pulse">
                            Select required options using the options above to continue
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
