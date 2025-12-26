"use strict";

import { Home, Search, Users, RefreshCw, LogOut, Coffee, ArrowRightLeft } from 'lucide-react';

interface GlobalSidebarProps {
    onNavigate: (view: string) => void;
    currentView: string;
}

export default function GlobalSidebar({ onNavigate, currentView }: GlobalSidebarProps) {
    return (
        <div className="w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-6 gap-6 h-full shrink-0 z-50 shadow-2xl">
            {/* Quick Order / Bar */}
            <SidebarButton
                icon={Coffee}
                label="Quick Bar"
                onClick={() => onNavigate('quick-order')}
                active={currentView === 'quick-order'}
            />

            {/* Mission Control / Map */}
            <SidebarButton
                icon={Home}
                label="Floor Plan"
                onClick={() => onNavigate('map')}
                active={currentView === 'map'}
            />

            {/* Find Check */}
            <SidebarButton
                icon={Search}
                label="Find Check"
                onClick={() => onNavigate('search')}
                active={currentView === 'search'}
            />

            {/* Transfer */}
            <SidebarButton
                icon={ArrowRightLeft}
                label="Transfer"
                onClick={() => onNavigate('transfer')}
                active={currentView === 'transfer'}
            />

            <div className="mt-auto flex flex-col gap-6">
                {/* Clock In/Out */}
                <SidebarButton
                    icon={Users}
                    label="Clock In"
                    onClick={() => onNavigate('clock')}
                    active={currentView === 'clock'}
                />
            </div>
        </div>
    );
}

function SidebarButton({ icon: Icon, label, onClick, active }: { icon: any, label: string, onClick: () => void, active?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`
                group relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200
                ${active
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'}
            `}
        >
            <Icon className={`w-6 h-6 mb-1 ${active ? 'stroke-2' : 'stroke-1.5'}`} />
            <span className="text-[10px] font-medium tracking-wide">{label}</span>

            {/* Tooltip on hover if sidebar is collapsed (which it is) */}
        </button>
    );
}
