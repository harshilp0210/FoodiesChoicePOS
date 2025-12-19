"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ChefHat, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));

        if (username === 'admin' && password === 'admin123') {
            login(username, 'admin');
        } else if (username === 'cashier' && password === '1234') {
            login(username, 'cashier');
        } else {
            setError('Invalid credentials');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left: Branding */}
            <div className="hidden lg:flex flex-col justify-center items-center bg-zinc-900 text-white p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black z-0" />
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />

                <div className="relative z-10 text-center space-y-6">
                    <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-4xl shadow-2xl mx-auto mb-6">
                        FC
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">Foodie's POS System</h1>
                    <p className="text-zinc-400 max-w-sm mx-auto">
                        Professional restaurant management aimed at efficiency and growth.
                    </p>
                </div>
            </div>

            {/* Right: Login Form */}
            <div className="flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold">Welcome back</h2>
                        <p className="text-muted-foreground mt-2">Enter your credentials to access the system</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="username">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="e.g. admin"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type="password"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <Lock className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md font-medium animate-in fade-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={cn(
                                "w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4",
                                isLoading && "opacity-70 cursor-not-allowed"
                            )}
                        >
                            {isLoading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    <div className="p-4 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
                        <p className="font-semibold">Demo Credentials:</p>
                        <div className="flex justify-between">
                            <span>Manager:</span>
                            <span className="font-mono">admin / admin123</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Cashier:</span>
                            <span className="font-mono">cashier / 1234</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
