"use client";

import { useState, useEffect } from 'react';
import { Area, Table } from '@/lib/types';
import { Users, Clock, Utensils, AlertCircle } from 'lucide-react';

interface MissionControlProps {
    layout: Area[];
    onSelectTable: (table: Table) => void;
    activeServerId?: string; // For "My Tables" filter
}

export default function MissionControl({ layout, onSelectTable, activeServerId }: MissionControlProps) {
    const [filterMode, setFilterMode] = useState<'all' | 'mine'>('all');

    // Mock for now, normally would be real time
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const getTableColor = (status: Table['status']) => {
        switch (status) {
            case 'available': return 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/20';
            case 'occupied': return 'bg-amber-500/10 border-amber-500/50 text-amber-500 hover:bg-amber-500/20'; // Yellow for Entrees/Occupied
            case 'billed': return 'bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500/20'; // Red for Check Presented
            case 'cleaning': return 'bg-slate-500/10 border-slate-500/50 text-slate-400 hover:bg-slate-500/20';
            default: return 'bg-slate-800 border-slate-700 text-slate-400';
        }
    };

    const getStatusLabel = (status: Table['status']) => {
        switch (status) {
            case 'available': return 'Available';
            case 'occupied': return 'Occupied';
            case 'billed': return 'Check Sent';
            case 'cleaning': return 'Dirty';
            default: return status;
        }
    };

    const getDuration = (seatedAt?: string) => {
        if (!seatedAt) return null;
        const start = new Date(seatedAt);
        const diff = Math.floor((currentTime.getTime() - start.getTime()) / 60000); // minutes
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        return `${hours > 0 ? `${hours}h ` : ''}${mins}m`;
    };

    return (
        <div className="flex-1 bg-slate-950 flex flex-col overflow-hidden relative">
            {/* Top Bar */}
            <div className="h-20 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-10">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Mission Control</h1>
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Floor Active
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Server Banking / Stats Summary */}
                    <div className="flex items-center gap-6 mr-8 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
                        <div className="text-center">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Open Tables</p>
                            <p className="text-lg font-bold text-white">12</p>
                        </div>
                        <div className="w-px h-8 bg-slate-800"></div>
                        <div className="text-center">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Covers</p>
                            <p className="text-lg font-bold text-white">48</p>
                        </div>
                        <div className="w-px h-8 bg-slate-800"></div>
                        <div className="text-center">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Tips Earned</p>
                            <p className="text-lg font-bold text-emerald-400">£124.50</p>
                        </div>
                    </div>

                    {/* Notification Badge Example */}
                    <button className="relative p-3 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
                        <AlertCircle className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>
                    </button>

                    <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex">
                        <button
                            onClick={() => setFilterMode('all')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${filterMode === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            All Tables
                        </button>
                        <button
                            onClick={() => setFilterMode('mine')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${filterMode === 'mine' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            My Tables
                        </button>
                    </div>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 overflow-auto p-4 md:p-8 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
                <div className="absolute inset-0 bg-[url('/floor-pattern.svg')] opacity-5 pointer-events-none"></div>

                {layout.map(area => (
                    <div key={area.id} className="mb-12 relative w-full h-[600px] border border-slate-800/50 rounded-3xl bg-slate-900/20 backdrop-blur-sm shadow-2xl">
                        <div className="absolute top-4 left-6 px-4 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-slate-400 text-xs font-bold uppercase tracking-widest shadow-sm">
                            {area.name}
                        </div>

                        {area.tables.map(table => {
                            // Mocking assigns for demo if 'assignedServerId' logic is complex
                            const isMine = table.id === '1' || table.id === '3'; // Example logic
                            if (filterMode === 'mine' && !isMine && table.status === 'occupied') return null; // Simple filter logic

                            const duration = getDuration(table.seatedAt);

                            return (
                                <button
                                    key={table.id}
                                    onClick={() => onSelectTable(table)}
                                    style={{
                                        position: 'absolute',
                                        left: `${table.x}px`,
                                        top: `${table.y}px`,
                                        width: `${table.width}px`,
                                        height: `${table.height}px`,
                                    }}
                                    className={`
                                        group flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-300
                                        ${getTableColor(table.status)}
                                        ${table.shape === 'circle' ? 'rounded-full aspect-square' : 'rounded-2xl'}
                                        hover:scale-105 hover:shadow-2xl hover:shadow-black/50 hover:z-20
                                    `}
                                >
                                    {/* Table Number */}
                                    <span className="font-extrabold text-2xl tracking-tighter mix-blend-overlay opacity-90">{table.label}</span>

                                    {/* Status Info (Only show if large enough or on hover) */}
                                    <div className="flex flex-col items-center mt-1 space-y-0.5">
                                        <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider opacity-70">
                                            {table.status === 'occupied' && <Users className="w-3 h-3" />}
                                            {getStatusLabel(table.status)}
                                        </div>

                                        {/* Timer */}
                                        {duration && (
                                            <div className="px-2 py-0.5 bg-black/20 rounded-full text-xs font-mono font-medium flex items-center gap-1 mt-1">
                                                <Clock className="w-3 h-3" />
                                                {duration}
                                            </div>
                                        )}
                                    </div>

                                    {/* Active Order Indicator */}
                                    {table.status === 'occupied' && (
                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 rounded-full border border-slate-700 flex items-center justify-center shadow-lg">
                                            <Utensils className="w-3 h-3 text-slate-400" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
