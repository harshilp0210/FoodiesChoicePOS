"use client";

import { mockLaborData } from '@/lib/mock-reports-data';
import { User, DollarSign } from 'lucide-react';

export default function LaborReports() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Labor Cost</p>
                            <h3 className="text-2xl font-bold text-slate-900">${mockLaborData.laborCost.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Labor vs Sales %</p>
                            <h3 className="text-2xl font-bold text-slate-900">{((mockLaborData.laborCost / mockLaborData.sales) * 100).toFixed(1)}%</h3>
                        </div>
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <User className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Employee Breakdown */}
            <div className="bg-white p-6 rounded-xl border shadow-sm overflow-hidden">
                <h3 className="text-lg font-bold mb-4">Labor Summary & Tips</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-slate-50 text-slate-500">
                                <th className="text-left py-3 px-4">Employee</th>
                                <th className="text-left py-3 px-4">Role</th>
                                <th className="text-right py-3 px-4">Hours Worked</th>
                                <th className="text-right py-3 px-4">Total Sales</th>
                                <th className="text-right py-3 px-4">Tips Earned</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockLaborData.employees.map((emp, i) => (
                                <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                                    <td className="py-3 px-4 font-medium text-slate-800">{emp.name}</td>
                                    <td className="py-3 px-4 text-slate-600">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.role === 'Manager' ? 'bg-purple-100 text-purple-700' :
                                                emp.role === 'Kitchen' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-slate-100 text-slate-700'
                                            }`}>
                                            {emp.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono">{emp.hours.toFixed(1)}h</td>
                                    <td className="py-3 px-4 text-right">${emp.sales.toLocaleString()}</td>
                                    <td className="py-3 px-4 text-right text-green-600 font-bold">${emp.tips.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
