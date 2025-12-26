"use client";

import { useState, useEffect } from 'react';
import { getZReportStats, getOrdersLocal } from '@/lib/supabase';
import { Calendar, Printer, DollarSign, CreditCard, Banknote, ListChecks } from 'lucide-react';
import { Order } from '@/lib/types';

export default function ZReportView() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        // Fetch stats when date changes
        const dateObj = new Date(selectedDate);
        const data = getZReportStats(dateObj);
        setStats(data);
    }, [selectedDate]);

    const handlePrint = () => {
        window.print();
    };

    if (!stats) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm print:shadow-none print:border-none">
                <div className="flex justify-between items-center mb-6 print:hidden">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-bold text-muted-foreground">Select Date:</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors"
                    >
                        <Printer className="w-4 h-4" /> Print Z-Report
                    </button>
                </div>

                {/* Printable Area */}
                <div className="max-w-md mx-auto print:max-w-none print:w-full bg-white print:p-0">
                    <div className="text-center border-b border-slate-200 pb-4 mb-4">
                        <h1 className="text-2xl font-black uppercase tracking-widest text-slate-900">Z-REPORT</h1>
                        <p className="text-slate-500 font-mono text-sm">{stats.date}</p>
                        <p className="text-xs text-slate-400 mt-1">Generated: {new Date().toLocaleTimeString()}</p>
                    </div>

                    <div className="space-y-4 font-mono text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                            <span className="font-bold text-slate-700">Total Sales (Gross)</span>
                            <span className="font-bold text-slate-900 text-lg">£{stats.totalSales.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between items-center py-1">
                            <span className="text-slate-600">Total Tips</span>
                            <span className="font-medium text-slate-800">£{stats.totalTips.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between items-center py-1">
                            <span className="text-slate-600">Total Orders</span>
                            <span className="font-medium text-slate-800">{stats.totalOrders}</span>
                        </div>

                        <div className="pt-4 pb-2">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Payment Breakdown</p>
                            {Object.entries(stats.paymentMethods).map(([method, amount]: [string, any]) => (
                                <div key={method} className="flex justify-between items-center py-1">
                                    <span className="capitalize text-slate-600">{method}</span>
                                    <span className="font-medium">£{Number(amount).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Net Breakdown</p>
                            <div className="flex justify-between items-center py-1 text-slate-500 text-xs">
                                <span>Net Sales (Ex Tax)</span>
                                <span>£{(stats.totalSales / 1.1).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 text-slate-500 text-xs">
                                <span>Tax (10%)</span>
                                <span>£{(stats.totalSales - (stats.totalSales / 1.1)).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t-2 border-slate-900 text-center">
                        <p className="text-xs font-bold uppercase">End of Report</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
