"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type UserRole = 'admin' | 'cashier' | null;

interface User {
    username: string;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    login: (username: string, role: UserRole) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Check local storage on load
        const storedUser = localStorage.getItem('foodies_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (username: string, role: UserRole) => {
        const newUser = { username, role };
        setUser(newUser);
        localStorage.setItem('foodies_user', JSON.stringify(newUser));

        if (role === 'admin') {
            router.push('/manager/dashboard');
        } else {
            router.push('/');
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('foodies_user');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
