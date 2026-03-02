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
  Apple,
  Trophy,
  AlertCircle,
  Eye,
  EyeOff,
  CalendarPlus,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { PremiumButton } from '@/components/ui/premium-button';
import { InteractiveCalendar } from '@/components/ui/interactive-calendar';
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
  preferredSlot: TimeSlot | null;
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
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  // Estado del formulario de citas
  const [formData, setFormData] = useState<FormData>({
    serviceType: '',
    duration: '60',
    preferredSlot: null,
    reason: '',
  });
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

    if (!acceptedPrivacy) {
      setAuthError('Debes aceptar la Política de Privacidad para registrarte');
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

  const handleSelectSlot = (slot: TimeSlot) => {
    setFormData(prev => ({ ...prev, preferredSlot: slot }));
  };

  const handleClearSlot = () => {
    setFormData(prev => ({ ...prev, preferredSlot: null }));
  };

  const handleSubmitAppointment = async () => {
    if (!user || !userProfile || !formData.serviceType || !formData.preferredSlot) return;

    try {
      await addAppointmentFS({
        userId: user.uid,
        name: userProfile.name,
        email: userProfile.email,
        phone: userProfile.phone,
        serviceType: formData.serviceType,
        duration: formData.duration,
        preferredSlots: [formData.preferredSlot],
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
          preferredSlot: null,
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

                  {/* RGPD Checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acceptedPrivacy}
                      onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                      required
                      className="mt-1 w-4 h-4 rounded border-border accent-accent flex-shrink-0"
                    />
                    <span className="text-xs text-muted-foreground leading-relaxed group-hover:text-ivory/70 transition-colors">
                      He leído y acepto la{' '}
                      <Link href="/politica-de-privacidad" className="text-accent hover:underline" target="_blank">
                        Política de Privacidad
                      </Link>{' '}
                      y el tratamiento de mis datos personales.
                    </span>
                  </label>

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
    <div className="min-h-screen -mt-20">
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

      <div className="max-w-6xl mx-auto px-4 py-8">
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
                  ¡Hola, {userProfile?.name?.split(' ')[0]}!
                </h1>
                <p className="text-muted-foreground text-lg">
                  Gestiona tus citas y solicita nuevas sesiones desde tu portal personal.
                </p>
              </div>

              <div className="space-y-8">
                {/* Botón principal: Pedir Cita */}
                <PremiumButton
                  variant="cta"
                  icon={<CalendarPlus className="w-5 h-5" />}
                  iconPosition="right"
                  onClick={() => setPortalView('new-appointment')}
                  className="w-full sm:w-auto text-lg py-5 px-8"
                >
                  Pedir Cita
                </PremiumButton>

                {/* Appointments List */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-ivory">Mis Citas</h2>
                  </div>

                  {userAppointments.length === 0 ? (
                    <GlassCard className="p-12 text-center rounded-2xl border-dashed border-accent/30 bg-muted/5">
                      <div className="w-20 h-20 rounded-full bg-emerald/10 flex items-center justify-center mx-auto mb-6 shadow-emerald-glow">
                        <Calendar className="w-10 h-10 text-accent opacity-90" />
                      </div>
                      <h3 className="text-2xl font-semibold text-ivory mb-3">No tienes citas aún</h3>
                      <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                        Estás a un paso de comenzar tu transformación. Solicita tu primera sesión y nosotros nos encargamos del resto.
                      </p>
                      <PremiumButton
                        variant="cta"
                        icon={<ArrowRight className="w-4 h-4" />}
                        iconPosition="right"
                        onClick={() => setPortalView('new-appointment')}
                      >
                        Solicitar Primera Cita
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
                            <GlassCard className="p-6 cursor-pointer rounded-2xl hover:border-accent/40 group transition-all duration-300 hover:shadow-glow" onClick={() => {
                              setSelectedAppointment(appointment.id);
                              setPortalView('appointment-detail');
                            }}>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-emerald/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Calendar className="w-6 h-6 text-accent" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-ivory text-lg group-hover:text-accent transition-colors">
                                      {serviceLabels[appointment.serviceType] || appointment.serviceType}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
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
                                <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-obsidian/50', status.color)}>
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
                </div>
              </div>
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

                  <h1 className="text-3xl font-bold text-ivory mb-3 text-center">Solicitar Nueva Cita</h1>
                  <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto text-center">
                    Completa el formulario para solicitar tu cita. Recuerda que el horario final será confirmado por Sandra.
                  </p>

                  <div className="max-w-3xl mx-auto space-y-8 mt-8">
                    {/* Service Type */}
                    <GlassCard className="p-8 rounded-2xl">
                      <h3 className="text-xl font-bold text-ivory mb-6 flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald/20 text-accent text-sm">1</span>
                        Tipo de Servicio
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {serviceTypes.map((service) => (
                          <button
                            key={service.id}
                            onClick={() => setFormData({ ...formData, serviceType: service.id })}
                            className={cn(
                              'p-5 rounded-xl border transition-all text-left group hover:shadow-glow',
                              formData.serviceType === service.id
                                ? 'bg-emerald/20 border-accent shadow-emerald-glow'
                                : 'bg-muted/30 border-border hover:border-accent/40'
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                'w-12 h-12 rounded-lg flex items-center justify-center transition-colors',
                                formData.serviceType === service.id ? 'bg-accent/20' : 'bg-obsidian/50 group-hover:bg-accent/10'
                              )}>
                                <service.icon className={cn(
                                  'w-6 h-6',
                                  formData.serviceType === service.id ? 'text-accent' : 'text-muted-foreground group-hover:text-accent'
                                )} />
                              </div>
                              <span className={cn(
                                'font-semibold text-lg transition-colors',
                                formData.serviceType === service.id ? 'text-ivory' : 'text-muted-foreground group-hover:text-ivory'
                              )}>
                                {service.title}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </GlassCard>

                    {/* Duration */}
                    <GlassCard className="p-8 rounded-2xl">
                      <h3 className="text-xl font-bold text-ivory mb-6 flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald/20 text-accent text-sm">2</span>
                        Duración
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        {durations.map((dur) => (
                          <button
                            key={dur.value}
                            onClick={() => setFormData({ ...formData, duration: dur.value })}
                            className={cn(
                              'p-5 rounded-xl border transition-all text-center group hover:shadow-glow',
                              formData.duration === dur.value
                                ? 'bg-emerald/20 border-accent shadow-emerald-glow'
                                : 'bg-muted/30 border-border hover:border-accent/40'
                            )}
                          >
                            <Clock className={cn(
                              'w-6 h-6 mx-auto mb-3 transition-colors',
                              formData.duration === dur.value ? 'text-accent' : 'text-muted-foreground group-hover:text-accent'
                            )} />
                            <div className={cn(
                              'font-bold text-lg mb-1 transition-colors',
                              formData.duration === dur.value ? 'text-ivory' : 'text-muted-foreground group-hover:text-ivory'
                            )}>{dur.label}</div>
                            <div className="text-xs text-muted-foreground">{dur.desc}</div>
                          </button>
                        ))}
                      </div>
                    </GlassCard>

                    {/* Time Slots — Calendario Interactivo */}
                    <GlassCard className="p-8 rounded-2xl">
                      <h3 className="text-xl font-bold text-ivory mb-2 flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald/20 text-accent text-sm">3</span>
                        Franja Horaria
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6 ml-11">
                        Elige la franja que prefieras. Sandra confirmará la disponibilidad.
                      </p>

                      <div className="ml-11">
                        <InteractiveCalendar
                          selectedSlot={formData.preferredSlot}
                          onSelectSlot={handleSelectSlot}
                          onClearSlot={handleClearSlot}
                        />
                      </div>
                    </GlassCard>

                    {/* Reason */}
                    <GlassCard className="p-8 rounded-2xl">
                      <h3 className="text-xl font-bold text-ivory mb-6 flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald/20 text-accent text-sm">4</span>
                        Comentario (opcional)
                      </h3>
                      <div className="ml-11">
                        <textarea
                          value={formData.reason}
                          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                          rows={4}
                          className="w-full px-5 py-4 rounded-xl bg-obsidian border border-border text-ivory placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none"
                          placeholder="Cuéntanos sobre tus objetivos o cualquier lesión que tengas..."
                        />
                      </div>
                    </GlassCard>

                    {/* Submit */}
                    <div className="flex gap-4 pt-4">
                      <PremiumButton
                        variant="ghost"
                        onClick={() => setPortalView('dashboard')}
                        className="flex-1 text-lg py-6"
                      >
                        Cancelar
                      </PremiumButton>
                      <PremiumButton
                        variant="cta"
                        onClick={handleSubmitAppointment}
                        disabled={!formData.serviceType || !formData.preferredSlot}
                        icon={<CheckCircle className="w-5 h-5" />}
                        className="flex-1 text-lg py-6"
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

                    <GlassCard className="p-8 rounded-2xl max-w-3xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                          <h1 className="text-3xl font-bold text-ivory mb-2">Detalle de la Cita</h1>
                          <p className="text-muted-foreground">Revisa el estado y los detalles de tu solicitud.</p>
                        </div>
                        <span className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border bg-obsidian/50', status.color)}>
                          <StatusIcon className="w-5 h-5" />
                          {status.label}
                        </span>
                      </div>

                      <div className="space-y-8">
                        {/* Status Message */}
                        <div className="p-5 rounded-xl bg-emerald/10 border border-emerald/20 flex gap-4 items-start">
                          <div className="mt-0.5">
                            <StatusIcon className={cn('w-5 h-5', status.color.split(' ')[0])} />
                          </div>
                          <div>
                            <p className="font-semibold text-ivory mb-1">Estado actual: {status.label}</p>
                            <p className="text-muted-foreground text-sm">{status.description}</p>
                          </div>
                        </div>

                        {/* Service & Duration */}
                        <div className="grid sm:grid-cols-2 gap-6 p-6 rounded-xl bg-muted/5 border border-border/50">
                          <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4" />
                              Servicio
                            </p>
                            <p className="text-ivory font-semibold text-lg">{serviceLabels[appointment.serviceType]}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4" />
                              Duración
                            </p>
                            <p className="text-ivory font-semibold text-lg">{durations.find(d => d.value === appointment.duration)?.label}</p>
                          </div>
                        </div>

                        {/* Time Slots */}
                        <div>
                          <h3 className="text-lg font-bold text-ivory mb-4">Franja propuesta</h3>
                          <div className="grid gap-3">
                            {appointment.preferredSlots.map((slot, index) => (
                              <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-obsidian border border-border">
                                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-medium text-sm">
                                  {index + 1}
                                </div>
                                <p className="text-ivory font-medium">
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
                          <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <h3 className="text-lg font-bold text-blue-400 mb-2 flex items-center gap-2">
                              <CheckCircle className="w-5 h-5" />
                              Alternativa propuesta por Sandra
                            </h3>
                            <p className="text-ivory font-medium">
                              {new Date(appointment.alternativeSlot.date).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })} a las {appointment.alternativeSlot.time}
                            </p>
                          </div>
                        )}

                        {appointment.status === 'approved' && (appointment.approvedSlot || appointment.assignedTrainer || appointment.sessionType) && (
                          <div className="p-5 rounded-xl bg-emerald/10 border border-emerald/20">
                            <h3 className="text-lg font-bold text-emerald-light mb-3 flex items-center gap-2">
                              <CheckCircle className="w-5 h-5" />
                              Cita confirmada
                            </h3>
                            <div className="space-y-2">
                              {appointment.approvedSlot && (
                                <p className="text-ivory font-medium">
                                  {new Date(appointment.approvedSlot.date).toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                  })} a las {appointment.approvedSlot.time}
                                </p>
                              )}
                              {appointment.assignedTrainer && (
                                <p className="text-muted-foreground text-sm">
                                  Entrenador/a: <span className="text-ivory font-medium">{appointment.assignedTrainer}</span>
                                </p>
                              )}
                              {appointment.sessionType && (
                                <p className="text-muted-foreground text-sm">
                                  Tipo de sesión: <span className="text-ivory font-medium capitalize">{appointment.sessionType}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {appointment.reason && (
                          <div>
                            <h3 className="text-lg font-bold text-ivory mb-3">Tu comentario</h3>
                            <div className="p-5 rounded-xl bg-obsidian border border-border">
                              <p className="text-muted-foreground leading-relaxed">{appointment.reason}</p>
                            </div>
                          </div>
                        )}

                        <div className="pt-6 border-t border-border flex justify-between items-center">
                          <p className="text-xs text-muted-foreground">
                            ID: {appointment.id?.slice(0, 8)}...
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Solicitada el {new Date(appointment.createdAt).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
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
