"use client";

import { mockMenuData } from '@/lib/mock-reports-data';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function MenuReports() {
    const COLORS = ['#ef7e34', '#3b82f6', '#22c55e', '#a855f7', '#f43f5e'];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* PMIX Table */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border shadow-sm overflow-hidden">
                    <h3 className="text-lg font-bold mb-4">Product Mix (PMIX)</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-slate-50 text-slate-500">
                                    <th className="text-left py-3 px-4">Item Name</th>
                                    <th className="text-left py-3 px-4">Category</th>
                                    <th className="text-right py-3 px-4">Qty</th>
                                    <th className="text-right py-3 px-4">Sales</th>
                                    <th className="text-right py-3 px-4">Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockMenuData.pmix.map((item, i) => (
                                    <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                                        <td className="py-3 px-4 font-medium text-slate-800">{item.name}</td>
                                        <td className="py-3 px-4 text-slate-600">{item.category}</td>
                                        <td className="py-3 px-4 text-right">{item.qty}</td>
                                        <td className="py-3 px-4 text-right">${item.sales.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right font-medium text-green-600">${item.profit.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Category Breakdown Pie */}
                <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold mb-4">Sales by Category</h3>
                    <div className="flex-1 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={mockMenuData.pmix}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="sales"
                                >
                                    {mockMenuData.pmix.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `$${value}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Modifier Analysis */}
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="text-lg font-bold mb-4">Top Modifiers</h3>
                    <div className="space-y-4">
                        {mockMenuData.modifiers.map((mod, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="font-medium text-slate-700">{mod.name}</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(mod.count / 150) * 100}%` }} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-500 w-8">{mod.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 86 List */}
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="text-lg font-bold mb-4 text-red-600">86 Report (Out of Stock)</h3>
                    <div className="space-y-3">
                        {mockMenuData.outOfStock.map((item, i) => (
                            <div key={i} className="p-3 bg-red-50 rounded-lg border border-red-100">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-red-800">{item.item}</span>
                                    <span className="text-xs text-red-600">{item.time}</span>
                                </div>
                                <p className="text-sm text-red-700">Reason: {item.reason}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
