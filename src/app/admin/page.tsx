'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  LayoutDashboard,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  LogOut,
  ChevronRight,
  User,
  Mail,
  Phone,
  CalendarClock,
  Check,
  RefreshCw,
  Trash2,
  Edit3,
  Save,
  ArrowLeft,
  BarChart3,
  Users,
  TrendingUp,
  AlertCircle,
  Plus,
  Star,
  Image as ImageIcon,
  Award,
  Trophy,
  MapPin,
  Globe,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { PremiumButton } from '@/components/ui/premium-button';
import { useAuth } from '@/contexts/AuthContext';
import type { TimeSlot, Service, Testimonial, Appointment, CMSContent } from '@/types';
import {
  getAppointments,
  updateAppointmentStatus as updateAppointmentStatusFS,
  deleteAppointment as deleteAppointmentFS,
  getServices,
  addService as addServiceFS,
  updateService as updateServiceFS,
  deleteService as deleteServiceFS,
  getTestimonials,
  addTestimonial as addTestimonialFS,
  updateTestimonial as updateTestimonialFS,
  deleteTestimonial as deleteTestimonialFS,
  approveTestimonial as approveTestimonialFS,
  getSiteContent,
  updateSiteContent,
  updateSandraData as updateSandraDataFS,
  updateCentroData as updateCentroDataFS,
} from '@/lib/firestore';
import { cn } from '@/lib/utils';

type TabType = 'dashboard' | 'appointments' | 'services' | 'testimonials' | 'cms-sandra' | 'cms-centro' | 'cms-contacto';
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'alternative';

const statusConfig = {
  pending: {
    label: 'Pendiente',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: Clock,
  },
  approved: {
    label: 'Aprobada',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rechazada',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: XCircle,
  },
  alternative: {
    label: 'Alternativa',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: RefreshCw,
  },
};

const serviceLabels: Record<string, string> = {
  training: 'Entrenamiento Personal',
  competition: 'Preparación para Competición',
  nutrition: 'Nutrición y Recomposición',
  assessment: 'Valoración Inicial',
};

const durationLabels: Record<string, string> = {
  '30': '30 minutos',
  '60': '60 minutos',
  '90': '90 minutos',
};

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '16:00', '17:00', '18:00', '19:00', '20:00',
];

export default function AdminPage() {
  const { user, userProfile, loading: authLoading, login, logout, isAdmin } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [cmsContent, setCmsContent] = useState<CMSContent | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showAlternativeModal, setShowAlternativeModal] = useState(false);
  const [alternativeSlot, setAlternativeSlot] = useState<TimeSlot>({ date: '', time: '' });
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  // CMS Edit States
  const [editedContent, setEditedContent] = useState<CMSContent | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [newService, setNewService] = useState<Omit<Service, 'id'>>({
    title: '',
    description: '',
    duration: '',
    price: '',
    features: [],
    order: 0,
  });
  const [newTestimonial, setNewTestimonial] = useState<Omit<Testimonial, 'id' | 'approved'>>({
    name: '',
    role: '',
    content: '',
    rating: 5,
  });

  // Autenticación admin
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Cargar datos desde Firestore
  const refreshData = async () => {
    const [appts, svcs, tests, cms] = await Promise.all([
      getAppointments(),
      getServices(),
      getTestimonials(),
      getSiteContent(),
    ]);
    setAppointments(appts);
    setServices(svcs);
    setTestimonials(tests);
    if (cms) {
      setCmsContent(cms);
      setEditedContent(cms);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      refreshData().catch(console.error);
    }
  }, [isAdmin]);

  // Stats
  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    approved: appointments.filter((a) => a.status === 'approved').length,
    rejected: appointments.filter((a) => a.status === 'rejected').length,
    alternative: appointments.filter((a) => a.status === 'alternative').length,
    services: services.length,
    testimonials: testimonials.filter(t => t.approved).length,
  };

  // Filtrar citas
  const filteredAppointments = statusFilter === 'all'
    ? appointments
    : appointments.filter((a) => a.status === statusFilter);

  // Manejar inicio de sesión admin con Firebase Auth
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    const result = await login(loginForm.email, loginForm.password);
    if (!result.success) {
      setLoginError(result.message);
    }
    setLoginLoading(false);
  };

  // Manejar actualización de estado
  const handleStatusUpdate = async (id: string, status: 'pending' | 'approved' | 'rejected' | 'alternative', altSlot?: TimeSlot) => {
    await updateAppointmentStatusFS(id, status, altSlot);
    await refreshData();
    setShowAlternativeModal(false);
    setAlternativeSlot({ date: '', time: '' });
    setSelectedAppointmentId(null);
  };

  // Manejar guardado de CMS
  const handleSaveCMS = async () => {
    if (!editedContent) return;
    await updateSiteContent(editedContent);
    await refreshData();
    alert('✅ Cambios guardados correctamente');
  };

  // Manejar guardado de Sandra
  const handleSaveSandra = async () => {
    if (!editedContent) return;
    await updateSandraDataFS(editedContent.sandra);
    await refreshData();
    alert('✅ Datos de Sandra actualizados');
  };

  // Manejar guardado del Centro
  const handleSaveCentro = async () => {
    if (!editedContent) return;
    await updateCentroDataFS(editedContent.centro);
    await refreshData();
    alert('✅ Datos del Centro actualizados');
  };

  // Manejar guardado de servicio
  const handleSaveService = async () => {
    if (editingService) {
      if (editingService.id.startsWith('new-')) {
        await addServiceFS({
          title: editingService.title,
          description: editingService.description,
          duration: editingService.duration,
          price: editingService.price,
          features: editingService.features,
          order: services.length + 1,
        });
      } else {
        await updateServiceFS(editingService.id, editingService);
      }
      await refreshData();
      setEditingService(null);
    }
  };

  // Manejar guardado de testimonio
  const handleSaveTestimonial = async () => {
    if (editingTestimonial) {
      if (editingTestimonial.id.startsWith('new-')) {
        await addTestimonialFS({
          name: editingTestimonial.name,
          role: editingTestimonial.role,
          content: editingTestimonial.content,
          rating: editingTestimonial.rating,
        });
      } else {
        await updateTestimonialFS(editingTestimonial.id, editingTestimonial);
      }
      await refreshData();
      setEditingTestimonial(null);
    }
  };

  // Login screen — si no está autenticado o no es admin
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian">
        <div className="text-ivory">Cargando...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-obsidian">
        <motion.div
          className="max-w-md w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald to-accent mx-auto mb-4 flex items-center justify-center">
                <LayoutDashboard className="w-8 h-8 text-obsidian" />
              </div>
              <h1 className="text-2xl font-bold text-ivory mb-2">Panel de Administración</h1>
              <p className="text-muted-foreground text-sm">Focus Club Vallecas</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                  placeholder="admin@focusclub.es"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                  placeholder="Introduce la contraseña"
                />
              </div>
              {loginError && (
                <p className="text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {loginError}
                </p>
              )}
              <PremiumButton type="submit" variant="cta" className="w-full">
                Acceder
              </PremiumButton>
            </form>

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
  // MAIN ADMIN PANEL
  // ============================================

  return (
    <div className="min-h-screen bg-obsidian">
      {/* Header */}
      <header className="glass-dark border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald to-accent flex items-center justify-center">
                  <LayoutDashboard className="w-4 h-4 text-obsidian" />
                </div>
                <span className="font-bold text-ivory hidden sm:block">Focus Club Admin</span>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/">
                <PremiumButton variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                  <span className="hidden sm:inline">Ver web</span>
                </PremiumButton>
              </Link>
              <PremiumButton
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                icon={<LogOut className="w-4 h-4" />}
              >
                <span className="hidden sm:inline">Salir</span>
              </PremiumButton>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 px-3">Principal</p>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                activeTab === 'dashboard' ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:bg-muted hover:text-ivory'
              )}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('appointments')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                activeTab === 'appointments' ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:bg-muted hover:text-ivory'
              )}
            >
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Citas</span>
              {stats.pending > 0 && (
                <span className="ml-auto bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full">
                  {stats.pending}
                </span>
              )}
            </button>

            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-6 mb-3 px-3">Gestión</p>

            <button
              onClick={() => setActiveTab('services')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                activeTab === 'services' ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:bg-muted hover:text-ivory'
              )}
            >
              <Award className="w-5 h-5" />
              <span className="font-medium">Servicios</span>
              <span className="ml-auto text-xs text-muted-foreground">{stats.services}</span>
            </button>

            <button
              onClick={() => setActiveTab('testimonials')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                activeTab === 'testimonials' ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:bg-muted hover:text-ivory'
              )}
            >
              <Star className="w-5 h-5" />
              <span className="font-medium">Testimonios</span>
              <span className="ml-auto text-xs text-muted-foreground">{stats.testimonials}</span>
            </button>

            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-6 mb-3 px-3">CMS</p>

            <button
              onClick={() => setActiveTab('cms-sandra')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                activeTab === 'cms-sandra' ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:bg-muted hover:text-ivory'
              )}
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Sandra</span>
            </button>

            <button
              onClick={() => setActiveTab('cms-centro')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                activeTab === 'cms-centro' ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:bg-muted hover:text-ivory'
              )}
            >
              <MapPin className="w-5 h-5" />
              <span className="font-medium">El Centro</span>
            </button>

            <button
              onClick={() => setActiveTab('cms-contacto')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                activeTab === 'cms-contacto' ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:bg-muted hover:text-ivory'
              )}
            >
              <Globe className="w-5 h-5" />
              <span className="font-medium">Contacto & Hero</span>
            </button>
          </aside>

          {/* Main Content */}
          <main>
            <AnimatePresence mode="wait">
              {/* ============================================
                  DASHBOARD
                  ============================================ */}
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <h1 className="text-2xl font-bold text-ivory mb-6">Dashboard</h1>

                  {/* Stats Grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                      { label: 'Total Citas', value: stats.total, icon: Calendar, color: 'from-emerald to-forest-deep' },
                      { label: 'Pendientes', value: stats.pending, icon: Clock, color: 'from-yellow-600 to-yellow-800' },
                      { label: 'Aprobadas', value: stats.approved, icon: CheckCircle, color: 'from-green-600 to-green-800' },
                      { label: 'Servicios', value: stats.services, icon: Award, color: 'from-accent-dark to-accent' },
                    ].map((stat, index) => (
                      <GlassCard key={index} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                            <stat.icon className="w-6 h-6 text-white" />
                          </div>
                          <TrendingUp className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="text-3xl font-bold text-ivory mb-1">{stat.value}</div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                      </GlassCard>
                    ))}
                  </div>

                  {/* Recent Appointments */}
                  <GlassCard className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-ivory">Citas Recientes</h2>
                      <button
                        onClick={() => setActiveTab('appointments')}
                        className="text-accent text-sm hover:underline flex items-center gap-1"
                      >
                        Ver todas <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      {appointments.slice(0, 5).map((appointment) => {
                        const StatusIcon = statusConfig[appointment.status].icon;
                        return (
                          <div
                            key={appointment.id}
                            className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald to-accent flex items-center justify-center text-obsidian font-semibold">
                                {appointment.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-ivory">{appointment.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {serviceLabels[appointment.serviceType]} - {durationLabels[appointment.duration]}
                                </p>
                              </div>
                            </div>
                            <span className={cn('px-3 py-1 rounded-full text-xs font-medium border', statusConfig[appointment.status].color)}>
                              {statusConfig[appointment.status].label}
                            </span>
                          </div>
                        );
                      })}
                      {appointments.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No hay citas aún</p>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {/* ============================================
                  APPOINTMENTS
                  ============================================ */}
              {activeTab === 'appointments' && (
                <motion.div
                  key="appointments"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h1 className="text-2xl font-bold text-ivory">Gestión de Citas</h1>
                    <div className="flex flex-wrap gap-2">
                      {(['all', 'pending', 'approved', 'rejected', 'alternative'] as StatusFilter[]).map(
                        (filter) => (
                          <button
                            key={filter}
                            onClick={() => setStatusFilter(filter)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                              statusFilter === filter
                                ? 'bg-accent text-obsidian'
                                : 'bg-muted text-muted-foreground hover:text-ivory'
                            )}
                          >
                            {filter === 'all' ? 'Todas' : statusConfig[filter].label}
                            {filter === 'pending' && stats.pending > 0 && (
                              <span className="ml-1">({stats.pending})</span>
                            )}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {filteredAppointments.map((appointment) => {
                      const StatusIcon = statusConfig[appointment.status].icon;
                      return (
                        <motion.div
                          key={appointment.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <GlassCard className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                              <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald to-accent flex items-center justify-center text-obsidian font-bold text-lg">
                                    {appointment.name.charAt(0)}
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-ivory text-lg">{appointment.name}</h3>
                                    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border', statusConfig[appointment.status].color)}>
                                      <StatusIcon className="w-3 h-3" />
                                      {statusConfig[appointment.status].label}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Mail className="w-4 h-4 text-accent" />
                                    <a href={`mailto:${appointment.email}`} className="hover:text-accent transition-colors text-sm">
                                      {appointment.email}
                                    </a>
                                  </div>
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="w-4 h-4 text-accent" />
                                    <a href={`tel:${appointment.phone}`} className="hover:text-accent transition-colors text-sm">
                                      {appointment.phone}
                                    </a>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-accent" />
                                    <span className="text-ivory">{serviceLabels[appointment.serviceType]}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-accent" />
                                    <span className="text-ivory">{durationLabels[appointment.duration]}</span>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm text-muted-foreground mb-2">Franjas propuestas:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {appointment.preferredSlots.map((slot, index) => (
                                      <span
                                        key={index}
                                        className="px-3 py-1.5 rounded-lg bg-emerald/20 text-ivory text-sm"
                                      >
                                        {new Date(slot.date).toLocaleDateString('es-ES', {
                                          weekday: 'short',
                                          day: 'numeric',
                                          month: 'short',
                                        })} - {slot.time}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {appointment.reason && (
                                  <div className="p-3 rounded-lg bg-muted/30">
                                    <p className="text-xs text-muted-foreground mb-1">Comentario:</p>
                                    <p className="text-ivory text-sm">{appointment.reason}</p>
                                  </div>
                                )}

                                {appointment.alternativeSlot && (
                                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <p className="text-xs text-blue-400 mb-1">Alternativa propuesta:</p>
                                    <p className="text-ivory text-sm">
                                      {new Date(appointment.alternativeSlot.date).toLocaleDateString('es-ES', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                      })} - {appointment.alternativeSlot.time}
                                    </p>
                                  </div>
                                )}

                                <p className="text-xs text-muted-foreground">
                                  Enviado el {new Date(appointment.createdAt).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex flex-row lg:flex-col gap-2 lg:w-40">
                                {appointment.status === 'pending' && (
                                  <>
                                    <PremiumButton
                                      variant="cta"
                                      size="sm"
                                      icon={<Check className="w-4 h-4" />}
                                      onClick={() => handleStatusUpdate(appointment.id, 'approved')}
                                      className="flex-1 lg:flex-none"
                                    >
                                      Aprobar
                                    </PremiumButton>
                                    <PremiumButton
                                      variant="outline"
                                      size="sm"
                                      icon={<CalendarClock className="w-4 h-4" />}
                                      onClick={() => {
                                        setSelectedAppointmentId(appointment.id);
                                        setShowAlternativeModal(true);
                                      }}
                                      className="flex-1 lg:flex-none"
                                    >
                                      Alternativa
                                    </PremiumButton>
                                    <PremiumButton
                                      variant="ghost"
                                      size="sm"
                                      icon={<XCircle className="w-4 h-4" />}
                                      onClick={() => handleStatusUpdate(appointment.id, 'rejected')}
                                      className="flex-1 lg:flex-none text-destructive hover:bg-destructive/10"
                                    >
                                      Rechazar
                                    </PremiumButton>
                                  </>
                                )}
                                {(appointment.status === 'approved' || appointment.status === 'alternative') && (
                                  <PremiumButton
                                    variant="outline"
                                    size="sm"
                                    icon={<RefreshCw className="w-4 h-4" />}
                                    onClick={() => handleStatusUpdate(appointment.id, 'pending')}
                                    className="w-full"
                                  >
                                    Pendiente
                                  </PremiumButton>
                                )}
                                {appointment.status === 'rejected' && (
                                  <PremiumButton
                                    variant="outline"
                                    size="sm"
                                    icon={<RefreshCw className="w-4 h-4" />}
                                    onClick={() => handleStatusUpdate(appointment.id, 'pending')}
                                    className="w-full"
                                  >
                                    Reactivar
                                  </PremiumButton>
                                )}
                                <PremiumButton
                                  variant="ghost"
                                  size="sm"
                                  icon={<Trash2 className="w-4 h-4" />}
                                  onClick={async () => {
                                    if (confirm('¿Estás seguro de eliminar esta cita?')) {
                                      await deleteAppointmentFS(appointment.id);
                                      await refreshData();
                                    }
                                  }}
                                  className="w-full text-destructive hover:bg-destructive/10"
                                >
                                  Eliminar
                                </PremiumButton>
                              </div>
                            </div>
                          </GlassCard>
                        </motion.div>
                      );
                    })}
                    {filteredAppointments.length === 0 && (
                      <GlassCard className="p-12 text-center">
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold text-ivory mb-2">No hay citas</h3>
                        <p className="text-muted-foreground">
                          {statusFilter === 'all'
                            ? 'Aún no se han recibido solicitudes de cita'
                            : `No hay citas ${statusConfig[statusFilter as keyof typeof statusConfig]?.label.toLowerCase()}`}
                        </p>
                      </GlassCard>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ============================================
                  SERVICES
                  ============================================ */}
              {activeTab === 'services' && (
                <motion.div
                  key="services"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-ivory">Gestión de Servicios</h1>
                    <PremiumButton
                      variant="cta"
                      icon={<Plus className="w-4 h-4" />}
                      onClick={() => setEditingService({
                        id: `new-${Date.now()}`,
                        title: '',
                        description: '',
                        duration: '',
                        price: '',
                        features: [],
                        order: services.length + 1,
                      })}
                    >
                      Nuevo Servicio
                    </PremiumButton>
                  </div>

                  <div className="grid gap-4">
                    {services.map((service) => (
                      <GlassCard key={service.id} className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-ivory mb-1">{service.title}</h3>
                            <p className="text-muted-foreground text-sm mb-3">{service.description}</p>
                            <div className="flex flex-wrap gap-4 text-sm">
                              <span className="text-accent">{service.price}</span>
                              <span className="text-muted-foreground">Duración: {service.duration}</span>
                            </div>
                            {service.features && service.features.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {service.features.map((feature, i) => (
                                  <span key={i} className="px-2 py-1 text-xs bg-emerald/10 text-ivory rounded">
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <PremiumButton
                              variant="ghost"
                              size="sm"
                              icon={<Edit3 className="w-4 h-4" />}
                              onClick={() => setEditingService(service)}
                            >
                              Editar
                            </PremiumButton>
                            <PremiumButton
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 className="w-4 h-4" />}
                              onClick={async () => {
                                if (confirm('¿Eliminar este servicio?')) {
                                  await deleteServiceFS(service.id);
                                  await refreshData();
                                }
                              }}
                              className="text-destructive"
                            />
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ============================================
                  TESTIMONIALS
                  ============================================ */}
              {activeTab === 'testimonials' && (
                <motion.div
                  key="testimonials"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-ivory">Gestión de Testimonios</h1>
                    <PremiumButton
                      variant="cta"
                      icon={<Plus className="w-4 h-4" />}
                      onClick={() => setEditingTestimonial({
                        id: `new-${Date.now()}`,
                        name: '',
                        role: '',
                        content: '',
                        rating: 5,
                      })}
                    >
                      Nuevo Testimonio
                    </PremiumButton>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {testimonials.map((testimonial) => (
                      <GlassCard key={testimonial.id} className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-ivory">{testimonial.name}</h3>
                            <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                          </div>
                          <span className={cn(
                            'px-2 py-1 text-xs rounded',
                            testimonial.approved ? 'bg-emerald/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
                          )}>
                            {testimonial.approved ? 'Aprobado' : 'Pendiente'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mb-3">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn('w-4 h-4', i < testimonial.rating ? 'text-accent fill-accent' : 'text-muted-foreground')}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground italic mb-4">"{testimonial.content}"</p>
                        <div className="flex gap-2">
                          {!testimonial.approved && (
                            <PremiumButton
                              variant="outline"
                              size="sm"
                              icon={<Check className="w-3 h-3" />}
                              onClick={async () => { await approveTestimonialFS(testimonial.id); await refreshData(); }}
                            >
                              Aprobar
                            </PremiumButton>
                          )}
                          <PremiumButton
                            variant="ghost"
                            size="sm"
                            icon={<Edit3 className="w-3 h-3" />}
                            onClick={() => setEditingTestimonial(testimonial)}
                          />
                          <PremiumButton
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 className="w-3 h-3" />}
                            onClick={async () => {
                              if (confirm('¿Eliminar este testimonio?')) {
                                await deleteTestimonialFS(testimonial.id);
                                await refreshData();
                              }
                            }}
                            className="text-destructive"
                          />
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ============================================
                  CMS - SANDRA
                  ============================================ */}
              {activeTab === 'cms-sandra' && (
                <motion.div
                  key="cms-sandra"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-ivory">Editar Sandra Andújar</h1>
                    <PremiumButton variant="cta" icon={<Save className="w-4 h-4" />} onClick={handleSaveSandra}>
                      Guardar Cambios
                    </PremiumButton>
                  </div>

                  <div className="space-y-6">
                    {/* Basic Info */}
                    <GlassCard className="p-6">
                      <h2 className="text-lg font-semibold text-ivory mb-4">Información Básica</h2>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Nombre</label>
                          <input
                            type="text"
                            value={editedContent.sandra?.name || ''}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              sandra: { ...editedContent.sandra, name: e.target.value }
                            })}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Título</label>
                          <input
                            type="text"
                            value={editedContent.sandra?.title || ''}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              sandra: { ...editedContent.sandra, title: e.target.value }
                            })}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm text-muted-foreground mb-2">Biografía</label>
                        <textarea
                          value={editedContent.sandra?.bio || ''}
                          onChange={(e) => setEditedContent({
                            ...editedContent,
                            sandra: { ...editedContent.sandra, bio: e.target.value }
                          })}
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light resize-none"
                        />
                      </div>
                    </GlassCard>

                    {/* Achievements */}
                    <GlassCard className="p-6">
                      <h2 className="text-lg font-semibold text-ivory mb-4">Logros Destacados</h2>
                      <div className="space-y-3">
                        {(editedContent.sandra?.achievements || []).map((achievement, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={achievement}
                              onChange={(e) => {
                                const newAchievements = [...(editedContent.sandra?.achievements || [])];
                                newAchievements[index] = e.target.value;
                                setEditedContent({
                                  ...editedContent,
                                  sandra: { ...editedContent.sandra, achievements: newAchievements }
                                });
                              }}
                              className="flex-1 px-4 py-2 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                            />
                            <button
                              onClick={() => {
                                const newAchievements = (editedContent.sandra?.achievements || []).filter((_, i) => i !== index);
                                setEditedContent({
                                  ...editedContent,
                                  sandra: { ...editedContent.sandra, achievements: newAchievements }
                                });
                              }}
                              className="p-2 text-destructive hover:bg-destructive/10 rounded-xl"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <PremiumButton
                          variant="outline"
                          size="sm"
                          icon={<Plus className="w-4 h-4" />}
                          onClick={() => setEditedContent({
                            ...editedContent,
                            sandra: { ...editedContent.sandra, achievements: [...(editedContent.sandra?.achievements || []), ''] }
                          })}
                        >
                          Añadir Logro
                        </PremiumButton>
                      </div>
                    </GlassCard>

                    {/* Certifications */}
                    <GlassCard className="p-6">
                      <h2 className="text-lg font-semibold text-ivory mb-4">Certificaciones</h2>
                      <div className="space-y-3">
                        {(editedContent.sandra?.certifications || []).map((cert, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={cert}
                              onChange={(e) => {
                                const newCerts = [...(editedContent.sandra?.certifications || [])];
                                newCerts[index] = e.target.value;
                                setEditedContent({
                                  ...editedContent,
                                  sandra: { ...editedContent.sandra, certifications: newCerts }
                                });
                              }}
                              className="flex-1 px-4 py-2 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                            />
                            <button
                              onClick={() => {
                                const newCerts = (editedContent.sandra?.certifications || []).filter((_, i) => i !== index);
                                setEditedContent({
                                  ...editedContent,
                                  sandra: { ...editedContent.sandra, certifications: newCerts }
                                });
                              }}
                              className="p-2 text-destructive hover:bg-destructive/10 rounded-xl"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <PremiumButton
                          variant="outline"
                          size="sm"
                          icon={<Plus className="w-4 h-4" />}
                          onClick={() => setEditedContent({
                            ...editedContent,
                            sandra: { ...editedContent.sandra, certifications: [...(editedContent.sandra?.certifications || []), ''] }
                          })}
                        >
                          Añadir Certificación
                        </PremiumButton>
                      </div>
                    </GlassCard>

                    {/* Timeline */}
                    <GlassCard className="p-6">
                      <h2 className="text-lg font-semibold text-ivory mb-4">Timeline Profesional</h2>
                      <div className="space-y-4">
                        {(editedContent.sandra?.timeline || []).map((item, index) => (
                          <div key={index} className="p-4 rounded-xl bg-muted/30 border border-border">
                            <div className="grid sm:grid-cols-3 gap-3 mb-3">
                              <input
                                type="text"
                                value={item.year}
                                onChange={(e) => {
                                  const newTimeline = [...(editedContent.sandra?.timeline || [])];
                                  newTimeline[index] = { ...newTimeline[index], year: e.target.value };
                                  setEditedContent({
                                    ...editedContent,
                                    sandra: { ...editedContent.sandra, timeline: newTimeline }
                                  });
                                }}
                                placeholder="Año"
                                className="px-3 py-2 rounded-lg bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                              />
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => {
                                  const newTimeline = [...(editedContent.sandra?.timeline || [])];
                                  newTimeline[index] = { ...newTimeline[index], title: e.target.value };
                                  setEditedContent({
                                    ...editedContent,
                                    sandra: { ...editedContent.sandra, timeline: newTimeline }
                                  });
                                }}
                                placeholder="Título"
                                className="sm:col-span-2 px-3 py-2 rounded-lg bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                              />
                            </div>
                            <div className="flex gap-2">
                              <textarea
                                value={item.description}
                                onChange={(e) => {
                                  const newTimeline = [...(editedContent.sandra?.timeline || [])];
                                  newTimeline[index] = { ...newTimeline[index], description: e.target.value };
                                  setEditedContent({
                                    ...editedContent,
                                    sandra: { ...editedContent.sandra, timeline: newTimeline }
                                  });
                                }}
                                placeholder="Descripción"
                                rows={2}
                                className="flex-1 px-3 py-2 rounded-lg bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light resize-none"
                              />
                              <button
                                onClick={() => {
                                  const newTimeline = (editedContent.sandra?.timeline || []).filter((_, i) => i !== index);
                                  setEditedContent({
                                    ...editedContent,
                                    sandra: { ...editedContent.sandra, timeline: newTimeline }
                                  });
                                }}
                                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg h-fit"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <PremiumButton
                          variant="outline"
                          size="sm"
                          icon={<Plus className="w-4 h-4" />}
                          onClick={() => setEditedContent({
                            ...editedContent,
                            sandra: {
                              ...editedContent.sandra,
                              timeline: [...(editedContent.sandra?.timeline || []), { year: '', title: '', description: '' }]
                            }
                          })}
                        >
                          Añadir Año al Timeline
                        </PremiumButton>
                      </div>
                    </GlassCard>
                  </div>
                </motion.div>
              )}

              {/* ============================================
                  CMS - CENTRO
                  ============================================ */}
              {activeTab === 'cms-centro' && (
                <motion.div
                  key="cms-centro"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-ivory">Editar El Centro</h1>
                    <PremiumButton variant="cta" icon={<Save className="w-4 h-4" />} onClick={handleSaveCentro}>
                      Guardar Cambios
                    </PremiumButton>
                  </div>

                  <div className="space-y-6">
                    {/* Basic Info */}
                    <GlassCard className="p-6">
                      <h2 className="text-lg font-semibold text-ivory mb-4">Información del Centro</h2>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Título</label>
                          <input
                            type="text"
                            value={editedContent.centro?.title || ''}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              centro: { ...editedContent.centro, title: e.target.value }
                            })}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Subtítulo</label>
                          <input
                            type="text"
                            value={editedContent.centro?.subtitle || ''}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              centro: { ...editedContent.centro, subtitle: e.target.value }
                            })}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Descripción</label>
                          <textarea
                            value={editedContent.centro?.description || ''}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              centro: { ...editedContent.centro, description: e.target.value }
                            })}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light resize-none"
                          />
                        </div>
                      </div>
                    </GlassCard>

                    {/* Schedule */}
                    <GlassCard className="p-6">
                      <h2 className="text-lg font-semibold text-ivory mb-4">Horario</h2>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Lunes a Viernes</label>
                          <input
                            type="text"
                            value={editedContent.centro?.schedule?.weekdays || ''}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              centro: {
                                ...editedContent.centro,
                                schedule: { ...editedContent.centro.schedule, weekdays: e.target.value }
                              }
                            })}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                            placeholder="7:00 - 21:00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Sábados</label>
                          <input
                            type="text"
                            value={editedContent.centro?.schedule?.saturday || ''}
                            onChange={(e) => setEditedContent({
                              ...editedContent,
                              centro: {
                                ...editedContent.centro,
                                schedule: { ...editedContent.centro.schedule, saturday: e.target.value }
                              }
                            })}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                            placeholder="9:00 - 14:00"
                          />
                        </div>
                      </div>
                    </GlassCard>

                    {/* Features */}
                    <GlassCard className="p-6">
                      <h2 className="text-lg font-semibold text-ivory mb-4">Características</h2>
                      <div className="space-y-4">
                        {(editedContent.centro?.features || []).map((feature, index) => (
                          <div key={index} className="p-4 rounded-xl bg-muted/30 border border-border">
                            <div className="grid sm:grid-cols-3 gap-3">
                              <input
                                type="text"
                                value={feature.icon}
                                onChange={(e) => {
                                  const newFeatures = [...(editedContent.centro?.features || [])];
                                  newFeatures[index] = { ...newFeatures[index], icon: e.target.value };
                                  setEditedContent({
                                    ...editedContent,
                                    centro: { ...editedContent.centro, features: newFeatures }
                                  });
                                }}
                                placeholder="Icono (Sparkles, Shield, Zap, Users)"
                                className="px-3 py-2 rounded-lg bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                              />
                              <input
                                type="text"
                                value={feature.title}
                                onChange={(e) => {
                                  const newFeatures = [...(editedContent.centro?.features || [])];
                                  newFeatures[index] = { ...newFeatures[index], title: e.target.value };
                                  setEditedContent({
                                    ...editedContent,
                                    centro: { ...editedContent.centro, features: newFeatures }
                                  });
                                }}
                                placeholder="Título"
                                className="px-3 py-2 rounded-lg bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                              />
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={feature.description}
                                  onChange={(e) => {
                                    const newFeatures = [...(editedContent.centro?.features || [])];
                                    newFeatures[index] = { ...newFeatures[index], description: e.target.value };
                                    setEditedContent({
                                      ...editedContent,
                                      centro: { ...editedContent.centro, features: newFeatures }
                                    });
                                  }}
                                  placeholder="Descripción"
                                  className="flex-1 px-3 py-2 rounded-lg bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                                />
                                <button
                                  onClick={() => {
                                    const newFeatures = (editedContent.centro?.features || []).filter((_, i) => i !== index);
                                    setEditedContent({
                                      ...editedContent,
                                      centro: { ...editedContent.centro, features: newFeatures }
                                    });
                                  }}
                                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <PremiumButton
                          variant="outline"
                          size="sm"
                          icon={<Plus className="w-4 h-4" />}
                          onClick={() => setEditedContent({
                            ...editedContent,
                            centro: {
                              ...editedContent.centro,
                              features: [...(editedContent.centro?.features || []), { icon: '', title: '', description: '' }]
                            }
                          })}
                        >
                          Añadir Característica
                        </PremiumButton>
                      </div>
                    </GlassCard>
                  </div>
                </motion.div>
              )}

              {/* ============================================
                  CMS - CONTACTO & HERO
                  ============================================ */}
              {activeTab === 'cms-contacto' && (
                <motion.div
                  key="cms-contacto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-ivory">Contacto & Hero</h1>
                    <PremiumButton variant="cta" icon={<Save className="w-4 h-4" />} onClick={handleSaveCMS}>
                      Guardar Cambios
                    </PremiumButton>
                  </div>

                  <div className="space-y-6">
                    {/* Hero */}
                    <GlassCard className="p-6">
                      <h2 className="text-lg font-semibold text-ivory mb-4 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-accent" />
                        Sección Hero
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Título Principal</label>
                          <input
                            type="text"
                            value={editedContent.heroTitle}
                            onChange={(e) => setEditedContent({ ...editedContent, heroTitle: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Subtítulo</label>
                          <textarea
                            value={editedContent.heroSubtitle}
                            onChange={(e) => setEditedContent({ ...editedContent, heroSubtitle: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Texto Botón CTA</label>
                          <input
                            type="text"
                            value={editedContent.heroCTA}
                            onChange={(e) => setEditedContent({ ...editedContent, heroCTA: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                        </div>
                      </div>
                    </GlassCard>

                    {/* Services Section */}
                    <GlassCard className="p-6">
                      <h2 className="text-lg font-semibold text-ivory mb-4">Sección Servicios</h2>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Título</label>
                          <input
                            type="text"
                            value={editedContent.servicesTitle}
                            onChange={(e) => setEditedContent({ ...editedContent, servicesTitle: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Subtítulo</label>
                          <input
                            type="text"
                            value={editedContent.servicesSubtitle}
                            onChange={(e) => setEditedContent({ ...editedContent, servicesSubtitle: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                        </div>
                      </div>
                    </GlassCard>

                    {/* CTA Section */}
                    <GlassCard className="p-6">
                      <h2 className="text-lg font-semibold text-ivory mb-4">Sección CTA Final</h2>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Título</label>
                          <input
                            type="text"
                            value={editedContent.ctaTitle}
                            onChange={(e) => setEditedContent({ ...editedContent, ctaTitle: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Subtítulo</label>
                          <textarea
                            value={editedContent.ctaSubtitle}
                            onChange={(e) => setEditedContent({ ...editedContent, ctaSubtitle: e.target.value })}
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light resize-none"
                          />
                        </div>
                      </div>
                    </GlassCard>

                    {/* Contact Info */}
                    <GlassCard className="p-6">
                      <h2 className="text-lg font-semibold text-ivory mb-4 flex items-center gap-2">
                        <Phone className="w-5 h-5 text-accent" />
                        Información de Contacto
                      </h2>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Teléfono</label>
                          <input
                            type="text"
                            value={editedContent.phone}
                            onChange={(e) => setEditedContent({ ...editedContent, phone: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">WhatsApp</label>
                          <input
                            type="text"
                            value={editedContent.whatsapp}
                            onChange={(e) => setEditedContent({ ...editedContent, whatsapp: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Email</label>
                          <input
                            type="email"
                            value={editedContent.email}
                            onChange={(e) => setEditedContent({ ...editedContent, email: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Dirección</label>
                          <input
                            type="text"
                            value={editedContent.address}
                            onChange={(e) => setEditedContent({ ...editedContent, address: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                        </div>
                      </div>
                    </GlassCard>

                    {/* Social Media */}
                    <GlassCard className="p-6">
                      <h2 className="text-lg font-semibold text-ivory mb-4">Redes Sociales</h2>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Instagram</label>
                          <input
                            type="url"
                            value={editedContent.socialInstagram || ''}
                            onChange={(e) => setEditedContent({ ...editedContent, socialInstagram: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                            placeholder="https://instagram.com/..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Facebook</label>
                          <input
                            type="url"
                            value={editedContent.socialFacebook || ''}
                            onChange={(e) => setEditedContent({ ...editedContent, socialFacebook: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                            placeholder="https://facebook.com/..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Twitter</label>
                          <input
                            type="url"
                            value={editedContent.socialTwitter || ''}
                            onChange={(e) => setEditedContent({ ...editedContent, socialTwitter: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                            placeholder="https://twitter.com/..."
                          />
                        </div>
                      </div>
                    </GlassCard>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Alternative Slot Modal */}
      <AnimatePresence>
        {showAlternativeModal && selectedAppointmentId && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAlternativeModal(false)}
          >
            <motion.div
              className="glass-card p-6 max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-ivory mb-4">Proponer Alternativa</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Propón una nueva fecha y hora para esta cita.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Fecha</label>
                  <input
                    type="date"
                    value={alternativeSlot.date}
                    onChange={(e) => setAlternativeSlot({ ...alternativeSlot, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Hora</label>
                  <select
                    value={alternativeSlot.time}
                    onChange={(e) => setAlternativeSlot({ ...alternativeSlot, time: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                  >
                    <option value="">Selecciona hora</option>
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <PremiumButton
                  variant="ghost"
                  onClick={() => {
                    setShowAlternativeModal(false);
                    setAlternativeSlot({ date: '', time: '' });
                    setSelectedAppointmentId(null);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </PremiumButton>
                <PremiumButton
                  variant="cta"
                  onClick={() => {
                    if (alternativeSlot.date && alternativeSlot.time && selectedAppointmentId) {
                      handleStatusUpdate(selectedAppointmentId, 'alternative', alternativeSlot);
                    }
                  }}
                  disabled={!alternativeSlot.date || !alternativeSlot.time}
                  className="flex-1"
                >
                  Enviar Alternativa
                </PremiumButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Service Edit Modal */}
      <AnimatePresence>
        {editingService && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingService(null)}
          >
            <motion.div
              className="glass-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-ivory mb-6">
                {editingService.id.startsWith('new-') ? 'Nuevo Servicio' : 'Editar Servicio'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Título</label>
                  <input
                    type="text"
                    value={editingService.title}
                    onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Descripción</label>
                  <textarea
                    value={editingService.description}
                    onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Duración</label>
                    <input
                      type="text"
                      value={editingService.duration}
                      onChange={(e) => setEditingService({ ...editingService, duration: e.target.value })}
                      placeholder="60-90 min"
                      className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Precio</label>
                    <input
                      type="text"
                      value={editingService.price || ''}
                      onChange={(e) => setEditingService({ ...editingService, price: e.target.value })}
                      placeholder="Desde 60€"
                      className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <PremiumButton variant="ghost" onClick={() => setEditingService(null)} className="flex-1">
                  Cancelar
                </PremiumButton>
                <PremiumButton variant="cta" onClick={handleSaveService} className="flex-1">
                  Guardar
                </PremiumButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Testimonial Edit Modal */}
      <AnimatePresence>
        {editingTestimonial && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingTestimonial(null)}
          >
            <motion.div
              className="glass-card p-6 max-w-lg w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-ivory mb-6">
                {editingTestimonial.id.startsWith('new-') ? 'Nuevo Testimonio' : 'Editar Testimonio'}
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Nombre</label>
                    <input
                      type="text"
                      value={editingTestimonial.name}
                      onChange={(e) => setEditingTestimonial({ ...editingTestimonial, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Rol</label>
                    <input
                      type="text"
                      value={editingTestimonial.role}
                      onChange={(e) => setEditingTestimonial({ ...editingTestimonial, role: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Valoración</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setEditingTestimonial({ ...editingTestimonial, rating: star })}
                        className="p-2"
                      >
                        <Star className={cn('w-6 h-6', star <= editingTestimonial.rating ? 'text-accent fill-accent' : 'text-muted-foreground')} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Contenido</label>
                  <textarea
                    value={editingTestimonial.content}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, content: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <PremiumButton variant="ghost" onClick={() => setEditingTestimonial(null)} className="flex-1">
                  Cancelar
                </PremiumButton>
                <PremiumButton variant="cta" onClick={handleSaveTestimonial} className="flex-1">
                  Guardar
                </PremiumButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
