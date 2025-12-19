"use client";

import { useState, useEffect } from 'react';
import { getEmployees, saveEmployee, deleteEmployee } from '@/lib/supabase';
import { Employee } from '@/lib/types';
import { Plus, Trash2, Edit2, User, Key } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
    const [formData, setFormData] = useState<Partial<Employee>>({});

    useEffect(() => {
        setEmployees(getEmployees());
    }, []);

    const handleOpenForm = (emp?: Employee) => {
        if (emp) {
            setEditingEmp(emp);
            setFormData(emp);
        } else {
            setEditingEmp(null);
            setFormData({ role: 'Cashier' });
        }
        setIsFormOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete this employee?')) {
            setEmployees(deleteEmployee(id));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newEmp: Employee = {
            id: editingEmp ? editingEmp.id : uuidv4(),
            firstName: formData.firstName || '',
            lastName: formData.lastName || '',
            role: formData.role || 'Cashier',
            hourlyRate: Number(formData.hourlyRate) || 0,
            pin: formData.pin || '0000',
        };
        setEmployees(saveEmployee(newEmp));
        setIsFormOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Employees</h2>
                <button
                    onClick={() => handleOpenForm()}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
                >
                    <Plus className="w-4 h-4" />
                    Add Employee
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employees.map((emp) => (
                    <div key={emp.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</h3>
                                <div className="text-sm text-slate-500 mb-1">{emp.role}</div>
                                <div className="flex items-center gap-1 text-xs text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded inline-block">
                                    <Key className="w-3 h-3" />
                                    PIN: ••••
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button onClick={() => handleOpenForm(emp)} className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600">
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(emp.id)} className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-red-600">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 text-black">
                        <h3 className="font-bold text-lg mb-4">{editingEmp ? 'Edit Employee' : 'New Employee'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    placeholder="First Name"
                                    className="border rounded-lg px-3 py-2 w-full text-black placeholder:text-gray-500"
                                    value={formData.firstName || ''}
                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                />
                                <input
                                    placeholder="Last Name"
                                    className="border rounded-lg px-3 py-2 w-full text-black placeholder:text-gray-500"
                                    value={formData.lastName || ''}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <select
                                    className="border rounded-lg px-3 py-2 w-full text-black"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                                >
                                    <option>Manager</option>
                                    <option>Cashier</option>
                                    <option>Chef</option>
                                    <option>Waiter</option>
                                </select>
                                <input
                                    type="number"
                                    placeholder="Hourly Rate ($)"
                                    className="border rounded-lg px-3 py-2 w-full text-black placeholder:text-gray-500"
                                    value={formData.hourlyRate || ''}
                                    onChange={e => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Login PIN (4 digits)"
                                maxLength={4}
                                className="border rounded-lg px-3 py-2 w-full font-mono tracking-widest"
                                value={formData.pin || ''}
                                onChange={e => setFormData({ ...formData, pin: e.target.value })}
                                required
                            />

                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 hover:bg-slate-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
