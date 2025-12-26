"use client";

import { useState } from 'react';
import { BarChart3, Receipt, Users, Banknote, ShieldAlert, Calendar, Download } from 'lucide-react';
import dynamic from 'next/dynamic';
// Tabs logic will be standard divs as before
// Let's stick to the existing tab logic but dynamic import the content components.

// Lazy load heavy chart components
const SalesReports = dynamic(() => import('@/components/reports/SalesReports'), {
    loading: () => <div className="h-96 w-full animate-pulse bg-slate-100 rounded-xl" />,
    ssr: false // Charts often needed client-side only anyway
});
const MenuReports = dynamic(() => import('@/components/reports/MenuReports'), {
    loading: () => <div className="h-96 w-full animate-pulse bg-slate-100 rounded-xl" />,
    ssr: false
});
const LaborReports = dynamic(() => import('@/components/reports/LaborReports'), {
    loading: () => <div className="h-96 w-full animate-pulse bg-slate-100 rounded-xl" />,
    ssr: false
});
const FinancialReports = dynamic(() => import('@/components/reports/FinancialReports'), {
    loading: () => <div className="h-96 w-full animate-pulse bg-slate-100 rounded-xl" />,
    ssr: false
});
const AuditReports = dynamic(() => import('@/components/reports/AuditReports'), {
    loading: () => <div className="h-96 w-full animate-pulse bg-slate-100 rounded-xl" />,
    ssr: false
});
const ZReportView = dynamic(() => import('@/components/reports/ZReportView'), {
    loading: () => <div className="h-96 w-full animate-pulse bg-slate-100 rounded-xl" />,
    ssr: false
});

type ReportTab = 'sales' | 'menu' | 'labor' | 'financial' | 'audit' | 'zreport';

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState<ReportTab>('sales');
    const [dateRange, setDateRange] = useState("This Week");

    const tabs = [
        { id: 'sales', label: 'Sales Reports', icon: BarChart3 },
        { id: 'menu', label: 'Menu Analysis', icon: Receipt },
        { id: 'labor', label: 'Labor & Staff', icon: Users },
        { id: 'financial', label: 'Financials', icon: Banknote },
        { id: 'audit', label: 'Audit & Theft', icon: ShieldAlert },
        { id: 'zreport', label: 'End of Day (Z)', icon: Receipt },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Reports & Analytics</h2>
                    <p className="text-slate-500 text-sm">Real-time insights into your business performance.</p>
                </div>

                <div className="flex gap-3">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option>Today</option>
                        <option>Yesterday</option>
                        <option>This Week</option>
                        <option>Last Week</option>
                        <option>This Month</option>
                    </select>

                    <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-slate-200 flex overflow-x-auto scrollbar-none gap-6">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as ReportTab)}
                            className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors whitespace-nowrap font-medium text-sm ${isActive
                                ? 'border-primary text-primary'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
                {activeTab === 'sales' && <SalesReports />}
                {activeTab === 'menu' && <MenuReports />}
                {activeTab === 'labor' && <LaborReports />}
                {activeTab === 'financial' && <FinancialReports />}
                {activeTab === 'audit' && <AuditReports />}
                {activeTab === 'zreport' && <ZReportView />}
            </div>
        </div>
    );
}

