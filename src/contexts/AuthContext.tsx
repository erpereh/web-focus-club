'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile, createUserProfile } from '@/lib/firestore';
import type { UserProfile } from '@/types';

interface AuthContextType {
    user: FirebaseUser | null;
    userProfile: UserProfile | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
    register: (email: string, password: string, name: string, phone: string) => Promise<{ success: boolean; message: string }>;
    logout: () => Promise<void>;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Listener de autenticación
    useEffect(() => {
        // Timeout de seguridad: si tras 5s sigue loading, forzar false
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 5000);

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            clearTimeout(timeout);
            setUser(firebaseUser);

            if (firebaseUser) {
                try {
                    const profile = await getUserProfile(firebaseUser.uid);
                    setUserProfile(profile);
                } catch {
                    setUserProfile(null);
                }
            } else {
                setUserProfile(null);
            }

            setLoading(false);
        });

        return () => {
            clearTimeout(timeout);
            unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            const profile = await getUserProfile(cred.user.uid);
            setUserProfile(profile);
            return { success: true, message: 'Login exitoso' };
        } catch (error: unknown) {
            const code = (error as { code?: string })?.code;
            const messages: Record<string, string> = {
                'auth/user-not-found': 'No existe una cuenta con este email',
                'auth/wrong-password': 'Contraseña incorrecta',
                'auth/invalid-email': 'Email no válido',
                'auth/invalid-credential': 'Email o contraseña incorrectos',
                'auth/too-many-requests': 'Demasiados intentos. Espera un momento',
            };
            return { success: false, message: messages[code ?? ''] || 'Error al iniciar sesión' };
        }
    };

    const register = async (email: string, password: string, name: string, phone: string) => {
        try {
            // 1. Crear cuenta en Firebase Auth
            const cred = await createUserWithEmailAndPassword(auth, email, password);

            // 2. Crear perfil en Firestore con role: "user" por defecto
            const profile: UserProfile = {
                uid: cred.user.uid,
                email,
                name,
                phone,
                role: 'user',
                createdAt: new Date().toISOString(),
            };
            await createUserProfile(profile);
            setUserProfile(profile);

            return { success: true, message: 'Cuenta creada correctamente' };
        } catch (error: unknown) {
            const code = (error as { code?: string })?.code;
            const messages: Record<string, string> = {
                'auth/email-already-in-use': 'Este email ya está registrado',
                'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
                'auth/invalid-email': 'Email no válido',
            };
            return { success: false, message: messages[code ?? ''] || 'Error al registrarse' };
        }
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setUserProfile(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                userProfile,
                loading,
                login,
                register,
                logout,
                isAdmin: userProfile?.role === 'admin',
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
}
