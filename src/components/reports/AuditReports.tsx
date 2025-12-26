"use client";

import { mockAuditData } from '@/lib/mock-reports-data';
import { AlertTriangle, Trash2, Search } from 'lucide-react';

export default function AuditReports() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-bold text-amber-900">Suspicious Activity Alert</h4>
                    <p className="text-sm text-amber-800">
                        High void volume detected for server "Mike J" between 21:00 and 22:00. <br />
                        3 voids for same item type ("Beer").
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Void Report */}
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-red-500" />
                        Void & Discount Log
                    </h3>
                    <div className="space-y-0">
                        {mockAuditData.voids.map((v, i) => (
                            <div key={i} className="py-3 border-b last:border-0 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800">{v.server}</span>
                                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">{v.time}</span>
                                    </div>
                                    <p className="text-sm text-slate-600">Voided: <span className="font-medium text-slate-900">{v.item}</span></p>
                                    <p className="text-xs text-slate-400 italic">"{v.reason}"</p>
                                </div>
                                <span className="font-bold text-red-600">-${v.amount.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* No Sale / Drawer Open Report */}
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Search className="w-5 h-5 text-purple-500" />
                        No Sale / Drawer Audit
                    </h3>
                    <div className="space-y-0">
                        {mockAuditData.noSales.map((item, i) => (
                            <div key={i} className="py-3 border-b last:border-0">
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-slate-800">{item.user}</span>
                                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">{item.time}</span>
                                </div>
                                <p className="text-sm text-slate-600">Drawer manually opened.</p>
                                <p className="text-xs text-slate-400 italic">Reason: {item.reason}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
