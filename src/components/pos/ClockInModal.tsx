"use client";

import { useState, useEffect } from 'react';
import { clockIn, clockOut, startBreak, endBreak, getTimesheets } from '@/lib/supabase';
import { TimeEntry, EmployeeRole } from '@/lib/types'; // Updated import
import { X, Clock, UserCheck, UserX, AlertCircle, Coffee, DollarSign } from 'lucide-react';

interface ClockInModalProps {
    onClose: () => void;
}

export default function ClockInModal({ onClose }: ClockInModalProps) {
    // Stage 1: PIN Entry
    // Stage 2: Dashboard (Clock In, Out, Break)
    // Stage 3: Role Selection (for Clock In)
    // Stage 4: Tip Declaration (for Clock Out)

    const [stage, setStage] = useState<'pin' | 'dashboard' | 'role-select' | 'tips'>('pin');
    const [pin, setPin] = useState('');
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('Waiter'); // Default
    const [tips, setTips] = useState('');

    // Roles for selection
    const availableRoles: EmployeeRole[] = ['Waiter', 'Bartender', 'Manager', 'Chef', 'Cashier', 'Driver'];

    const handlePinSubmit = async () => {
        if (!pin) return;

        // Mock Auth: Retrieve active shift for this "user"
        // In real app, we'd fetch user by PIN first.
        try {
            const allSheets = await getTimesheets();
            // We simulate user ID being the PIN for this mock
            const entry = allSheets.find(e => e.employeeId === pin && !e.clockOut);

            if (entry) {
                setActiveEntry(entry);
            } else {
                setActiveEntry(null);
            }
            setStage('dashboard');
            setMessage(`Hello, Staff ${pin}`);
            setStatus('idle');
        } catch (e: any) {
            setStatus('error');
            setMessage("Invalid PIN");
        }
    };

    const handleClockInFlow = async () => {
        // Go to role select
        setStage('role-select');
    };

    const confirmClockIn = async () => {
        try {
            await clockIn(pin, `Staff ${pin}`, selectedRole);
            setStatus('success');
            setMessage("Clocked In Successfully");
            setTimeout(onClose, 1500);
        } catch (e: any) {
            setStatus('error');
            setMessage(e.message);
        }
    };

    const handleClockOutFlow = async () => {
        // Go to tips
        setStage('tips');
    };

    const confirmClockOut = async () => {
        try {
            const tipVal = parseFloat(tips) || 0;
            await clockOut(pin, tipVal);
            setStatus('success');
            setMessage("Shift Ended. Good job!");
            setTimeout(onClose, 1500);
        } catch (e: any) {
            setStatus('error');
            setMessage(e.message);
            // If error is "open checks", show it clearly
        }
    };

    const handleBreak = async (type: 'start' | 'end') => {
        try {
            if (type === 'start') {
                await startBreak(pin, 'unpaid'); // default unpaid
                setMessage("Break Started");
            } else {
                await endBreak(pin);
                setMessage("Welcome Back");
            }
            setStatus('success');

            // Refresh Active Entry to showing correct break status
            const allSheets = await getTimesheets();
            const entry = allSheets.find(e => e.employeeId === pin && !e.clockOut);
            setActiveEntry(entry || null);

        } catch (e: any) {
            setStatus('error');
            setMessage(e.message);
        }
    };

    const isOnBreak = activeEntry?.breaks?.some(b => !b.endTime);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors z-10">
                    <X className="w-5 h-5 text-slate-500" />
                </button>

                <div className="p-8 flex flex-col items-center text-center">

                    {/* Header Icon */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 
                        ${status === 'success' ? 'bg-green-100 text-green-600' :
                            status === 'error' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                        {status === 'success' ? <UserCheck className="w-8 h-8" /> :
                            status === 'error' ? <AlertCircle className="w-8 h-8" /> :
                                <Clock className="w-8 h-8" />}
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        {stage === 'pin' ? 'Time Clock' :
                            stage === 'role-select' ? 'Select Role' :
                                stage === 'tips' ? 'Close Shift' : `Staff ${pin}`}
                    </h2>

                    {message && (
                        <p className={`text-sm font-medium mb-6 px-3 py-1 rounded-full ${status === 'error' ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-50'}`}>
                            {message}
                        </p>
                    )}

                    {/* STAGE 1: PIN ENTRY */}
                    {stage === 'pin' && (
                        <div className="w-full">
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                placeholder="Enter PIN"
                                maxLength={4}
                                className="w-full text-center text-4xl tracking-[1em] font-bold border-2 border-slate-200 rounded-xl p-4 mb-6 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-mono text-slate-900 placeholder:text-slate-300 placeholder:tracking-normal"
                                autoFocus
                            />
                            <button
                                onClick={handlePinSubmit}
                                disabled={!pin}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {/* STAGE 2: DASHBOARD */}
                    {stage === 'dashboard' && (
                        <div className="w-full grid grid-cols-2 gap-4">
                            {!activeEntry ? (
                                <button
                                    onClick={handleClockInFlow}
                                    className="col-span-2 bg-green-600 hover:bg-green-700 text-white py-6 rounded-2xl font-bold text-xl shadow-lg shadow-green-600/20 active:scale-[0.98] transition-all flex flex-col items-center gap-2"
                                >
                                    <Clock className="w-8 h-8" />
                                    Clock In
                                </button>
                            ) : (
                                <>
                                    {isOnBreak ? (
                                        <button
                                            onClick={() => handleBreak('end')}
                                            className="col-span-2 bg-amber-500 hover:bg-amber-600 text-white py-6 rounded-2xl font-bold text-xl shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex flex-col items-center gap-2"
                                        >
                                            <Coffee className="w-8 h-8" />
                                            End Break
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleBreak('start')}
                                                className="bg-blue-100 hover:bg-blue-200 text-blue-700 py-6 rounded-2xl font-bold text-lg active:scale-[0.98] transition-all flex flex-col items-center gap-2"
                                            >
                                                <Coffee className="w-6 h-6" />
                                                Start Break
                                            </button>
                                            <button
                                                onClick={handleClockOutFlow}
                                                className="bg-red-100 hover:bg-red-200 text-red-700 py-6 rounded-2xl font-bold text-lg active:scale-[0.98] transition-all flex flex-col items-center gap-2"
                                            >
                                                <UserX className="w-6 h-6" />
                                                Clock Out
                                            </button>
                                        </>
                                    )}
                                    <div className="col-span-2 mt-2 text-xs text-slate-400">
                                        Shift started at {new Date(activeEntry.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {activeEntry.role || 'Staff'}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* STAGE 3: ROLE SELECT */}
                    {stage === 'role-select' && (
                        <div className="w-full space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                {availableRoles.map(role => (
                                    <button
                                        key={role}
                                        onClick={() => setSelectedRole(role)}
                                        className={`p-4 rounded-xl font-bold text-sm transition-all border-2 ${selectedRole === role ? 'border-primary bg-primary/10 text-primary' : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'}`}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={confirmClockIn}
                                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all"
                            >
                                Confirm Clock In
                            </button>
                        </div>
                    )}

                    {/* STAGE 4: TIPS */}
                    {stage === 'tips' && (
                        <div className="w-full space-y-6">
                            <p className="text-slate-600">Please declare your cash tips for this shift.</p>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
                                <input
                                    type="number"
                                    value={tips}
                                    onChange={(e) => setTips(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-12 pr-4 py-4 text-2xl font-bold border-2 border-slate-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all font-mono text-slate-900"
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={confirmClockOut}
                                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all"
                            >
                                Confirm & Clock Out
                            </button>
                            <button
                                onClick={() => setStage('dashboard')}
                                className="text-sm text-slate-400 hover:text-slate-600"
                            >
                                Back
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
