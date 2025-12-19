"use client";

import { useState } from 'react';
import { Plus, Tag, Trash2 } from 'lucide-react';

interface Deal {
    id: string;
    name: string;
    description: string;
    type: 'BOGO' | 'Percentage' | 'Fixed';
    value: number;
    active: boolean;
}

const MOCK_DEALS: Deal[] = [
    { id: '1', name: 'Lunch Special', description: 'Any Pizza + Drink', type: 'Fixed', value: 15.00, active: true },
    { id: '2', name: 'Happy Hour', description: '50% off Starters', type: 'Percentage', value: 50, active: true },
];

export default function DealsPage() {
    const [deals, setDeals] = useState<Deal[]>(MOCK_DEALS);

    const toggleActive = (id: string) => {
        setDeals(deals.map(d => d.id === id ? { ...d, active: !d.active } : d));
    };

    const deleteDeal = (id: string) => {
        if (confirm('Delete this deal?')) {
            setDeals(deals.filter(d => d.id !== id));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Mix & Match Deals</h2>
                    <p className="text-slate-500">Configure specials and promotions.</p>
                </div>
                <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">
                    <Plus className="w-4 h-4" />
                    New Deal
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deals.map(deal => (
                    <div key={deal.id} className={`bg-white p-6 rounded-xl border ${deal.active ? 'border-primary/50 ring-1 ring-primary/20' : 'border-slate-200'} shadow-sm relative overflow-hidden transition-all`}>
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Tag className="w-24 h-24" />
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{deal.name}</h3>
                            <p className="text-sm text-slate-500 mb-4">{deal.description}</p>

                            <div className="flex items-center gap-3 mb-6">
                                <span className="bg-slate-100 text-slate-700 font-mono text-xs px-2 py-1 rounded">
                                    {deal.type}
                                </span>
                                <span className="font-bold text-primary">
                                    {deal.type === 'Percentage' ? `${deal.value}% OFF` : deal.type === 'Fixed' ? `$${deal.value}` : 'Buy 1 Get 1'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center border-t pt-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={deal.active}
                                        onChange={() => toggleActive(deal.id)}
                                        className="rounded border-slate-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Active</span>
                                </label>
                                <button onClick={() => deleteDeal(deal.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
