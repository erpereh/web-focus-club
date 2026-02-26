'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  User,
  Mail,
  Phone,
  Lock,
  LogIn,
  UserPlus,
  LogOut,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Dumbbell,
  Activity,
  Heart,
  Apple,
  Trophy,
  Plus,
  X,
  MessageSquare,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { PremiumButton } from '@/components/ui/premium-button';
import { useAuth } from '@/contexts/AuthContext';
import type { TimeSlot, Appointment } from '@/types';
import { addAppointment as addAppointmentFS, getAppointmentsByUser } from '@/lib/firestore';
import { cn } from '@/lib/utils';

// ============================================
// TIPOS
// ============================================

type AuthMode = 'login' | 'register';
type PortalView = 'dashboard' | 'new-appointment' | 'appointment-detail';

interface FormData {
  serviceType: string;
  duration: '30' | '60' | '90';
  preferredSlots: TimeSlot[];
  reason: string;
}

// ============================================
// CONFIGURACIÓN DE ESTADOS
// ============================================

const statusConfig = {
  pending: {
    label: 'Pendiente',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: Clock,
    description: 'Tu solicitud está siendo revisada',
  },
  approved: {
    label: 'Aprobada',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: CheckCircle,
    description: '¡Tu cita ha sido confirmada!',
  },
  rejected: {
    label: 'Rechazada',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: XCircle,
    description: 'La solicitud no pudo ser atendida',
  },
  alternative: {
    label: 'Alternativa',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: RefreshCw,
    description: 'Se ha propuesto una alternativa',
  },
};

const serviceTypes = [
  { id: 'training', title: 'Entrenamiento Personal', icon: Dumbbell },
  { id: 'competition', title: 'Preparación para Competición', icon: Trophy },
  { id: 'nutrition', title: 'Nutrición y Recomposición', icon: Apple },
  { id: 'assessment', title: 'Valoración Inicial', icon: Activity },
];

const serviceLabels: Record<string, string> = {
  training: 'Entrenamiento Personal',
  competition: 'Preparación para Competición',
  nutrition: 'Nutrición y Recomposición',
  assessment: 'Valoración Inicial',
};

const durations = [
  { value: '30', label: '30 minutos', desc: 'Consulta rápida' },
  { value: '60', label: '60 minutos', desc: 'Sesión estándar' },
  { value: '90', label: '90 minutos', desc: 'Sesión extendida' },
] as const;

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '16:00', '17:00', '18:00', '19:00', '20:00',
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function PortalPage() {
  const { user, userProfile, loading: authContextLoading, login, register, logout } = useAuth();
  const isAuthenticated = !!user;

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [portalView, setPortalView] = useState<PortalView>('dashboard');
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);

  // Estado del formulario de auth
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Estado del formulario de citas
  const [formData, setFormData] = useState<FormData>({
    serviceType: '',
    duration: '60',
    preferredSlots: [],
    reason: '',
  });
  const [newSlot, setNewSlot] = useState<TimeSlot>({ date: '', time: '' });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Obtener citas del usuario desde Firestore
  const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (user) {
      getAppointmentsByUser(user.uid).then(setUserAppointments).catch(console.error);
    }
  }, [user]);

  // ============================================
  // MANEJADORES DE AUTENTICACIÓN
  // ============================================

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    const result = await login(authForm.email, authForm.password);

    if (!result.success) {
      setAuthError(result.message);
    }

    setAuthLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    if (authForm.password !== authForm.confirmPassword) {
      setAuthError('Las contraseñas no coinciden');
      setAuthLoading(false);
      return;
    }

    if (authForm.password.length < 6) {
      setAuthError('La contraseña debe tener al menos 6 caracteres');
      setAuthLoading(false);
      return;
    }

    const result = await register(authForm.email, authForm.password, authForm.name, authForm.phone);

    if (!result.success) {
      setAuthError(result.message);
    }

    setAuthLoading(false);
  };

  // ============================================
  // APPOINTMENT HANDLERS
  // ============================================

  const handleAddSlot = () => {
    if (newSlot.date && newSlot.time && formData.preferredSlots.length < 3) {
      setFormData(prev => ({
        ...prev,
        preferredSlots: [...prev.preferredSlots, { ...newSlot }],
      }));
      setNewSlot({ date: '', time: '' });
    }
  };

  const handleRemoveSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      preferredSlots: prev.preferredSlots.filter((_, i) => i !== index),
    }));
  };

  const handleSubmitAppointment = async () => {
    if (!user || !userProfile || !formData.serviceType || formData.preferredSlots.length === 0) return;

    try {
      await addAppointmentFS({
        userId: user.uid,
        name: userProfile.name,
        email: userProfile.email,
        phone: userProfile.phone,
        serviceType: formData.serviceType,
        duration: formData.duration,
        preferredSlots: formData.preferredSlots,
        reason: formData.reason,
      });

      // Refrescar citas
      const updated = await getAppointmentsByUser(user.uid);
      setUserAppointments(updated);

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setFormData({
          serviceType: '',
          duration: '60',
          preferredSlots: [],
          reason: '',
        });
        setPortalView('dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error al crear cita:', error);
    }
  };

  // ============================================
  // RENDER - AUTH SCREEN
  // ============================================

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          className="max-w-md w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald to-accent mx-auto mb-4 flex items-center justify-center">
                <User className="w-8 h-8 text-obsidian" />
              </div>
              <h1 className="text-2xl font-bold text-ivory mb-2">
                Portal del Cliente
              </h1>
              <p className="text-muted-foreground text-sm">
                Focus Club Vallecas
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-forest-deep/30 rounded-xl p-1 mb-6">
              <button
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                  authMode === 'login'
                    ? 'bg-emerald text-ivory'
                    : 'text-muted-foreground hover:text-ivory'
                )}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => { setAuthMode('register'); setAuthError(''); }}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                  authMode === 'register'
                    ? 'bg-emerald text-ivory'
                    : 'text-muted-foreground hover:text-ivory'
                )}
              >
                Registrarse
              </button>
            </div>

            {/* Forms */}
            <AnimatePresence mode="wait">
              {authMode === 'login' ? (
                <motion.form
                  key="login"
                  onSubmit={handleLogin}
                  className="space-y-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory placeholder:text-muted-foreground focus:outline-none focus:border-emerald-light"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Lock className="w-4 h-4" />
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={authForm.password}
                        onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory placeholder:text-muted-foreground focus:outline-none focus:border-emerald-light pr-12"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ivory"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {authError && (
                    <p className="text-destructive text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {authError}
                    </p>
                  )}

                  <PremiumButton
                    type="submit"
                    variant="cta"
                    className="w-full"
                    loading={authLoading}
                    icon={<LogIn className="w-4 h-4" />}
                  >
                    Entrar
                  </PremiumButton>
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  onSubmit={handleRegister}
                  className="space-y-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <User className="w-4 h-4" />
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory placeholder:text-muted-foreground focus:outline-none focus:border-emerald-light"
                      placeholder="Tu nombre"
                      required
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory placeholder:text-muted-foreground focus:outline-none focus:border-emerald-light"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Phone className="w-4 h-4" />
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={authForm.phone}
                      onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory placeholder:text-muted-foreground focus:outline-none focus:border-emerald-light"
                      placeholder="+34 600 000 000"
                      required
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Lock className="w-4 h-4" />
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={authForm.password}
                      onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory placeholder:text-muted-foreground focus:outline-none focus:border-emerald-light"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Lock className="w-4 h-4" />
                      Confirmar contraseña
                    </label>
                    <input
                      type="password"
                      value={authForm.confirmPassword}
                      onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory placeholder:text-muted-foreground focus:outline-none focus:border-emerald-light"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  {authError && (
                    <p className="text-destructive text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {authError}
                    </p>
                  )}

                  <PremiumButton
                    type="submit"
                    variant="cta"
                    className="w-full"
                    loading={authLoading}
                    icon={<UserPlus className="w-4 h-4" />}
                  >
                    Crear Cuenta
                  </PremiumButton>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Back link */}
            <Link href="/" className="block text-center mt-6">
              <PremiumButton variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                Volver al inicio
              </PremiumButton>
            </Link>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  // ============================================
  // RENDER - AUTHENTICATED PORTAL
  // ============================================

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-dark border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald to-accent flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-obsidian" />
                </div>
                <span className="font-bold text-ivory hidden sm:block">Mi Cuenta</span>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-ivory">{userProfile?.name}</p>
                <p className="text-xs text-muted-foreground">{userProfile?.email}</p>
              </div>
              <PremiumButton
                variant="ghost"
                size="sm"
                onClick={logout}
                icon={<LogOut className="w-4 h-4" />}
              >
                <span className="hidden sm:inline">Salir</span>
              </PremiumButton>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* ============================================
              DASHBOARD VIEW
              ============================================ */}
          {portalView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Welcome Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-ivory mb-2">
                  ¡Hola, {userProfile?.name?.split(' ')[0]}! 👋
                </h1>
                <p className="text-muted-foreground">
                  Gestiona tus citas y solicita nuevas sesiones desde tu portal personal.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <GlassCard className="p-6 cursor-pointer hover:border-emerald-light/30" onClick={() => setPortalView('new-appointment')}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald/20 flex items-center justify-center">
                      <Plus className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ivory">Nueva Cita</h3>
                      <p className="text-xs text-muted-foreground">Solicitar sesión</p>
                    </div>
                  </div>
                </GlassCard>

                {[
                  { label: 'Pendientes', value: userAppointments.filter(a => a.status === 'pending').length, color: 'text-yellow-400' },
                  { label: 'Aprobadas', value: userAppointments.filter(a => a.status === 'approved').length, color: 'text-emerald-400' },
                  { label: 'Total', value: userAppointments.length, color: 'text-accent' },
                ].map((stat, i) => (
                  <GlassCard key={i} className="p-6">
                    <div className="text-center">
                      <div className={cn('text-3xl font-bold', stat.color)}>{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  </GlassCard>
                ))}
              </div>

              {/* Appointments List */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-ivory">Mis Citas</h2>
                <PremiumButton
                  variant="cta"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => setPortalView('new-appointment')}
                >
                  Nueva Solicitud
                </PremiumButton>
              </div>

              {userAppointments.length === 0 ? (
                <GlassCard className="p-12 text-center">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold text-ivory mb-2">No tienes citas aún</h3>
                  <p className="text-muted-foreground mb-6">
                    Solicita tu primera cita para comenzar tu transformación
                  </p>
                  <PremiumButton
                    variant="cta"
                    icon={<ArrowRight className="w-4 h-4" />}
                    iconPosition="right"
                    onClick={() => setPortalView('new-appointment')}
                  >
                    Solicitar Cita
                  </PremiumButton>
                </GlassCard>
              ) : (
                <div className="space-y-4">
                  {userAppointments.map((appointment) => {
                    const status = statusConfig[appointment.status];
                    const StatusIcon = status.icon;

                    return (
                      <motion.div
                        key={appointment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <GlassCard className="p-6 cursor-pointer hover:border-emerald-light/30" onClick={() => {
                          setSelectedAppointment(appointment.id);
                          setPortalView('appointment-detail');
                        }}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-emerald/20 flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-accent" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-ivory">
                                  {serviceLabels[appointment.serviceType] || appointment.serviceType}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {appointment.preferredSlots[0] && (
                                    <>
                                      {new Date(appointment.preferredSlots[0].date).toLocaleDateString('es-ES', {
                                        day: 'numeric',
                                        month: 'short',
                                      })} - {appointment.preferredSlots[0].time}
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                            <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border', status.color)}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {status.label}
                            </span>
                          </div>
                        </GlassCard>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ============================================
              NEW APPOINTMENT VIEW
              ============================================ */}
          {portalView === 'new-appointment' && (
            <motion.div
              key="new-appointment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {submitSuccess ? (
                <GlassCard className="p-12 text-center max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-emerald/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald" />
                  </div>
                  <h2 className="text-xl font-bold text-ivory mb-2">¡Solicitud Enviada!</h2>
                  <p className="text-muted-foreground">
                    Te contactaremos pronto para confirmar tu cita.
                  </p>
                </GlassCard>
              ) : (
                <>
                  <button
                    onClick={() => setPortalView('dashboard')}
                    className="flex items-center gap-2 text-muted-foreground hover:text-ivory mb-6 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al dashboard
                  </button>

                  <h1 className="text-2xl font-bold text-ivory mb-2">Solicitar Nueva Cita</h1>
                  <p className="text-muted-foreground mb-8">
                    Completa el formulario para solicitar tu cita. Recuerda que el horario final será confirmado por Sandra.
                  </p>

                  <div className="max-w-2xl space-y-6">
                    {/* Service Type */}
                    <GlassCard className="p-6">
                      <h3 className="font-semibold text-ivory mb-4">1. Tipo de Servicio</h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {serviceTypes.map((service) => (
                          <button
                            key={service.id}
                            onClick={() => setFormData({ ...formData, serviceType: service.id })}
                            className={cn(
                              'p-4 rounded-xl border transition-all text-left',
                              formData.serviceType === service.id
                                ? 'bg-emerald/20 border-accent'
                                : 'bg-muted/30 border-border hover:border-emerald/50'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <service.icon className={cn(
                                'w-5 h-5',
                                formData.serviceType === service.id ? 'text-accent' : 'text-muted-foreground'
                              )} />
                              <span className={cn(
                                'font-medium',
                                formData.serviceType === service.id ? 'text-ivory' : 'text-muted-foreground'
                              )}>
                                {service.title}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </GlassCard>

                    {/* Duration */}
                    <GlassCard className="p-6">
                      <h3 className="font-semibold text-ivory mb-4">2. Duración</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {durations.map((dur) => (
                          <button
                            key={dur.value}
                            onClick={() => setFormData({ ...formData, duration: dur.value })}
                            className={cn(
                              'p-4 rounded-xl border transition-all text-center',
                              formData.duration === dur.value
                                ? 'bg-emerald/20 border-accent'
                                : 'bg-muted/30 border-border hover:border-emerald/50'
                            )}
                          >
                            <Clock className={cn(
                              'w-5 h-5 mx-auto mb-2',
                              formData.duration === dur.value ? 'text-accent' : 'text-muted-foreground'
                            )} />
                            <div className="font-medium text-ivory">{dur.label}</div>
                            <div className="text-xs text-muted-foreground">{dur.desc}</div>
                          </button>
                        ))}
                      </div>
                    </GlassCard>

                    {/* Time Slots */}
                    <GlassCard className="p-6">
                      <h3 className="font-semibold text-ivory mb-4">3. Franjas Horarias Preferidas</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Propón hasta 3 franjas horarias. Sandra confirmará la que mejor se adapte.
                      </p>

                      {formData.preferredSlots.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {formData.preferredSlots.map((slot, index) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-emerald/10 border border-emerald/20">
                              <span className="text-ivory">
                                {new Date(slot.date).toLocaleDateString('es-ES', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                })} - {slot.time}
                              </span>
                              <button onClick={() => handleRemoveSlot(index)} className="text-muted-foreground hover:text-destructive">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {formData.preferredSlots.length < 3 && (
                        <div className="grid sm:grid-cols-3 gap-3">
                          <input
                            type="date"
                            value={newSlot.date}
                            onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                            className="px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                          <select
                            value={newSlot.time}
                            onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })}
                            className="px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          >
                            <option value="">Hora</option>
                            {timeSlots.map((time) => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                          <PremiumButton
                            variant="outline"
                            onClick={handleAddSlot}
                            disabled={!newSlot.date || !newSlot.time}
                            icon={<Plus className="w-4 h-4" />}
                          >
                            Añadir
                          </PremiumButton>
                        </div>
                      )}
                    </GlassCard>

                    {/* Reason */}
                    <GlassCard className="p-6">
                      <h3 className="font-semibold text-ivory mb-4">4. Comentario (opcional)</h3>
                      <textarea
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory placeholder:text-muted-foreground focus:outline-none focus:border-emerald-light resize-none"
                        placeholder="Cuéntanos sobre tus objetivos o cualquier lesión que tengas..."
                      />
                    </GlassCard>

                    {/* Submit */}
                    <div className="flex gap-4">
                      <PremiumButton
                        variant="ghost"
                        onClick={() => setPortalView('dashboard')}
                        className="flex-1"
                      >
                        Cancelar
                      </PremiumButton>
                      <PremiumButton
                        variant="cta"
                        onClick={handleSubmitAppointment}
                        disabled={!formData.serviceType || formData.preferredSlots.length === 0}
                        icon={<CheckCircle className="w-4 h-4" />}
                        className="flex-1"
                      >
                        Enviar Solicitud
                      </PremiumButton>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ============================================
              APPOINTMENT DETAIL VIEW
              ============================================ */}
          {portalView === 'appointment-detail' && selectedAppointment && (
            <motion.div
              key="appointment-detail"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {(() => {
                const appointment = userAppointments.find(a => a.id === selectedAppointment);
                if (!appointment) return null;

                const status = statusConfig[appointment.status];
                const StatusIcon = status.icon;

                return (
                  <>
                    <button
                      onClick={() => { setPortalView('dashboard'); setSelectedAppointment(null); }}
                      className="flex items-center gap-2 text-muted-foreground hover:text-ivory mb-6 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Volver a mis citas
                    </button>

                    <GlassCard className="p-6 max-w-2xl">
                      <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-ivory">Detalle de la Cita</h1>
                        <span className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border', status.color)}>
                          <StatusIcon className="w-4 h-4" />
                          {status.label}
                        </span>
                      </div>

                      <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-emerald/10 border border-emerald/20">
                          <p className="text-sm text-muted-foreground mb-1">Estado</p>
                          <p className="text-ivory">{status.description}</p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Servicio</p>
                            <p className="text-ivory font-medium">{serviceLabels[appointment.serviceType]}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Duración</p>
                            <p className="text-ivory font-medium">{durations.find(d => d.value === appointment.duration)?.label}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Franjas propuestas</p>
                          <div className="space-y-2">
                            {appointment.preferredSlots.map((slot, index) => (
                              <div key={index} className="p-3 rounded-lg bg-muted/30">
                                <p className="text-ivory">
                                  {new Date(slot.date).toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                  })} a las {slot.time}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {appointment.alternativeSlot && (
                          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <p className="text-sm text-blue-400 mb-1">Alternativa propuesta por Sandra</p>
                            <p className="text-ivory">
                              {new Date(appointment.alternativeSlot.date).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                              })} a las {appointment.alternativeSlot.time}
                            </p>
                          </div>
                        )}

                        {appointment.reason && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Tu comentario</p>
                            <p className="text-ivory">{appointment.reason}</p>
                          </div>
                        )}

                        <div className="pt-4 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            Solicitud enviada el {new Date(appointment.createdAt).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </GlassCard>
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
