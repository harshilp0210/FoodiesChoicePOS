"use client";

import { mockFinancialData } from '@/lib/mock-reports-data';
import { CreditCard, Banknote, Calendar } from 'lucide-react';

export default function FinancialReports() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payout Overview */}
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-green-600" />
                        Payout Overview (Deposits)
                    </h3>
                    <div className="space-y-3">
                        {mockFinancialData.payouts.map((p, i) => (
                            <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-md">
                                        <Calendar className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{p.date}</p>
                                        <p className={`text-xs font-medium ${p.status === 'Deposited' ? 'text-green-600' : 'text-amber-600'}`}>
                                            {p.status}
                                        </p>
                                    </div>
                                </div>
                                <span className="font-mono font-bold text-lg">${p.amount.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Daily Card Activity */}
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        Payment Methods
                    </h3>
                    <div className="space-y-4">
                        {mockFinancialData.cards.map((card, i) => (
                            <div key={i} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-slate-600">{card.type}</span>
                                    <span className="font-bold text-slate-900">${card.total.toLocaleString()}</span>
                                </div>
                                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`absolute top-0 left-0 h-full rounded-full ${card.type === 'Visa' ? 'bg-blue-500' :
                                                card.type === 'Mastercard' ? 'bg-orange-500' :
                                                    card.type === 'Amex' ? 'bg-blue-700' : 'bg-green-500'
                                            }`}
                                        style={{ width: `${(card.total / 45100) * 100}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 text-right">{card.count} txns</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Z-Report Summary (Mock) */}
            <div className="bg-white p-6 rounded-xl border shadow-sm">
                <h3 className="text-lg font-bold mb-4">Daily Z-Report Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Total Cash</p>
                        <p className="text-xl font-mono font-bold text-slate-900">$1,800.00</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Total Credit</p>
                        <p className="text-xl font-mono font-bold text-slate-900">$43,300.00</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Tips Paid Used</p>
                        <p className="text-xl font-mono font-bold text-red-600">-$450.00</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Expected Deposit</p>
                        <p className="text-xl font-mono font-bold text-green-600">$44,650.00</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
