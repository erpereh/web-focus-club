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
import { ImageUpload } from '@/components/ui/ImageUpload';
import { ContextualImageManager } from '@/components/ui/ContextualImageManager';
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
  getUsers,
  addActivityLog,
} from '@/lib/firestore';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/types';
// --- Galería Tab: fetches live from Cloudinary ---
interface CloudinaryResource {
  public_id: string;
  url: string;
  resource_type: 'image' | 'video';
  format: string;
  width: number;
  height: number;
  folder: string;
}

function GaleriaTab() {
  const [resources, setResources] = useState<CloudinaryResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/images?folder=Galeria');
      const data = await res.json();
      setResources(data.images || []);
    } catch (err) {
      console.error('Error fetching gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResources(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'Galeria');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        await fetchResources();
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const getVideoThumbnail = (url: string) => {
    // Cloudinary auto-generates video thumbnails by changing extension to .jpg
    return url.replace(/\.(mp4|mov|avi|webm)$/i, '.jpg');
  };

  return (
    <motion.div
      key="Galeria"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ivory">Galería Pública</h1>
        <div className="flex gap-3">
          <label className="cursor-pointer">
            <input type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
            <PremiumButton variant="cta" icon={<Plus className="w-4 h-4" />} onClick={() => { }}>
              {uploading ? 'Subiendo...' : 'Subir archivo'}
            </PremiumButton>
          </label>
          <PremiumButton variant="outline" icon={<RefreshCw className="w-4 h-4" />} onClick={fetchResources}>
            Actualizar
          </PremiumButton>
        </div>
      </div>

      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-ivory mb-2 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-accent" />
          Contenido de Cloudinary ({resources.length} archivos)
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Estos archivos se cargan en tiempo real desde Cloudinary. Sube nuevos o gestionalos desde el panel de Cloudinary.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-accent" />
            <span className="ml-3 text-muted-foreground">Cargando desde Cloudinary...</span>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay archivos en la carpeta Galería de Cloudinary</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {resources.map((resource) => (
              <div
                key={resource.public_id}
                className="relative group rounded-xl overflow-hidden border border-border aspect-square bg-muted/20"
              >
                {resource.resource_type === 'video' ? (
                  <>
                    <img
                      src={getVideoThumbnail(resource.url)}
                      alt={resource.public_id}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-obsidian/70 flex items-center justify-center border-2 border-white/30">
                        <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                      </div>
                    </div>
                  </>
                ) : (
                  <img
                    src={resource.url}
                    alt={resource.public_id}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-obsidian/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white truncate">{resource.public_id.split('/').pop()}</p>
                  <p className="text-[10px] text-white/60 uppercase">{resource.resource_type} · {resource.format}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}

type TabType = 'Inicio' | 'appointments' | 'clients' | 'services' | 'testimonials' | 'Sandra' | 'Centro' | 'Galeria' | 'Contacto';
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

  // Helper: check if a URL is a valid remote image (not a stale local path)
  const isValidImageUrl = (url?: string) => url && url.startsWith('http');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [cmsContent, setCmsContent] = useState<CMSContent | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>('Inicio');
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

  // Image Manager State
  const [activeImageManager, setActiveImageManager] = useState<{
    folder: string;
    currentUrl?: string;
    onSelect: (url: string) => void;
  } | null>(null);

  // Autenticación admin
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Cargar datos desde Firestore
  const refreshData = async () => {
    const [appts, svcs, tests, cms, usersList] = await Promise.all([
      getAppointments(),
      getServices(),
      getTestimonials(),
      getSiteContent(),
      getUsers(),
    ]);
    setAppointments(appts);
    setServices(svcs);
    setTestimonials(tests);
    setClients(usersList);
    if (cms) {
      setCmsContent(cms);
      setEditedContent(cms);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      // eslint-disable-next-line
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
    await addActivityLog({ action: `appointment_${status}`, adminEmail: user?.email || 'unknown', details: `Cita ID: ${id}` });
    await refreshData();
    setShowAlternativeModal(false);
    setAlternativeSlot({ date: '', time: '' });
    setSelectedAppointmentId(null);
  };

  // Manejar guardado de CMS
  const handleSaveCMS = async () => {
    if (!editedContent) return;
    await updateSiteContent(editedContent);
    await addActivityLog({ action: 'cms_contacto_updated', adminEmail: user?.email || 'unknown' });
    await refreshData();
    alert('✅ Cambios guardados correctamente');
  };

  // Manejar guardado de Sandra
  const handleSaveSandra = async () => {
    if (!editedContent) return;
    await updateSandraDataFS(editedContent.sandra);
    await addActivityLog({ action: 'cms_sandra_updated', adminEmail: user?.email || 'unknown' });
    await refreshData();
    alert('✅ Datos de Sandra actualizados');
  };

  // Manejar guardado del Centro
  const handleSaveCentro = async () => {
    if (!editedContent) return;
    await updateCentroDataFS(editedContent.centro);
    await addActivityLog({ action: 'cms_centro_updated', adminEmail: user?.email || 'unknown' });
    await refreshData();
    alert('✅ Datos del Centro actualizados');
  };

  // Manejar guardado de servicio
  const handleSaveService = async () => {
    if (editingService) {
      const isNew = editingService.id.startsWith('new-');
      if (isNew) {
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
      await addActivityLog({ action: isNew ? 'service_created' : 'service_updated', adminEmail: user?.email || 'unknown', details: editingService.title });
      await refreshData();
      setEditingService(null);
    }
  };

  // Manejar guardado de testimonio
  const handleSaveTestimonial = async () => {
    if (editingTestimonial) {
      const isNew = editingTestimonial.id.startsWith('new-');
      if (isNew) {
        await addTestimonialFS({
          name: editingTestimonial.name,
          role: editingTestimonial.role,
          content: editingTestimonial.content,
          rating: editingTestimonial.rating,
        });
      } else {
        await updateTestimonialFS(editingTestimonial.id, editingTestimonial);
      }
      await addActivityLog({ action: isNew ? 'testimonial_created' : 'testimonial_updated', adminEmail: user?.email || 'unknown', details: editingTestimonial.name });
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
              onClick={() => setActiveTab('Inicio')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                activeTab === 'Inicio'
                  ? 'bg-emerald/20 text-emerald border border-emerald/30 shadow-lg shadow-emerald/10'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-ivory'
              )}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('appointments')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                activeTab === 'appointments'
                  ? 'bg-emerald/20 text-emerald border border-emerald/30 shadow-lg shadow-emerald/10'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-ivory'
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

            <button
              onClick={() => setActiveTab('clients')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                activeTab === 'clients'
                  ? 'bg-emerald/20 text-emerald border border-emerald/30 shadow-lg shadow-emerald/10'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-ivory'
              )}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Clientes</span>
            </button>

            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-6 mb-3 px-3">Gestión</p>

            <button
              onClick={() => setActiveTab('services')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                activeTab === 'services'
                  ? 'bg-emerald/20 text-emerald border border-emerald/30 shadow-lg shadow-emerald/10'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-ivory'
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
                activeTab === 'testimonials'
                  ? 'bg-emerald/20 text-emerald border border-emerald/30 shadow-lg shadow-emerald/10'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-ivory'
              )}
            >
              <Star className="w-5 h-5" />
              <span className="font-medium">Testimonios</span>
              <span className="ml-auto text-xs text-muted-foreground">{stats.testimonials}</span>
            </button>

            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-6 mb-3 px-3">CMS</p>

            <button
              onClick={() => setActiveTab('Sandra')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                activeTab === 'Sandra'
                  ? 'bg-emerald/20 text-emerald border border-emerald/30 shadow-lg shadow-emerald/10'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-ivory'
              )}
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Sandra</span>
            </button>

            <button
              onClick={() => setActiveTab('Centro')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                activeTab === 'Centro'
                  ? 'bg-emerald/20 text-emerald border border-emerald/30 shadow-lg shadow-emerald/10'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-ivory'
              )}
            >
              <MapPin className="w-5 h-5" />
              <span className="font-medium">El Centro</span>
            </button>

            <button
              onClick={() => setActiveTab('Galeria')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                activeTab === 'Galeria'
                  ? 'bg-emerald/20 text-emerald border border-emerald/30 shadow-lg shadow-emerald/10'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-ivory'
              )}
            >
              <ImageIcon className="w-5 h-5" />
              <span className="font-medium">Galeria</span>
            </button>

            <button
              onClick={() => setActiveTab('Contacto')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                activeTab === 'Contacto'
                  ? 'bg-emerald/20 text-emerald border border-emerald/30 shadow-lg shadow-emerald/10'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-ivory'
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
              {activeTab === 'Inicio' && (
                <motion.div
                  key="Inicio"
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
                  CLIENTS
                  ============================================ */}
              {activeTab === 'clients' && (
                <motion.div
                  key="clients"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-ivory">Gestión de Clientes</h1>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      Total: <span className="text-ivory font-semibold">{clients.length}</span>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {clients.map((client) => (
                      <GlassCard key={client.uid} className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                              <User className="w-6 h-6 text-accent" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-ivory">{client.name}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="w-3.5 h-3.5" />
                                {client.email}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {client.phone}
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Unido el {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'Fecha desconocida'}
                            </div>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-tight",
                              client.role === 'admin' ? "bg-accent/20 text-accent border border-accent/30" : "bg-emerald/10 text-emerald-light border border-emerald/20"
                            )}>
                              {client.role === 'admin' ? 'Administrador' : 'Cliente'}
                            </span>
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                    {clients.length === 0 && (
                      <GlassCard className="p-12 text-center">
                        <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                        <p className="text-muted-foreground">No hay clientes registrados.</p>
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
                        approved: false,
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
              {activeTab === 'Sandra' && (
                <motion.div
                  key="Sandra"
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
                      <div className="mb-6">
                        <label className="block text-sm text-muted-foreground mb-2">Foto de Perfil</label>
                        {isValidImageUrl(editedContent?.sandra?.image) ? (
                          <img src={editedContent!.sandra!.image} alt="Sandra" className="w-32 h-32 object-cover rounded-xl mb-3 border border-border" />
                        ) : (
                          <div className="w-32 h-32 rounded-xl mb-3 border border-border bg-muted/30 flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-muted-foreground opacity-50" />
                          </div>
                        )}
                        <PremiumButton
                          variant="outline"
                          size="sm"
                          icon={<ImageIcon className="w-4 h-4" />}
                          onClick={() => setActiveImageManager({
                            folder: 'Sandra',
                            currentUrl: editedContent?.sandra?.image || undefined,
                            onSelect: (url) => setEditedContent(prev => prev?.sandra ? { ...prev, sandra: { ...prev.sandra, image: url } } as CMSContent : prev)
                          })}
                        >
                          Cambiar Foto de Perfil
                        </PremiumButton>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Nombre</label>
                          <input
                            type="text"
                            value={editedContent?.sandra?.name || ''}
                            onChange={(e) => {
                              setEditedContent((prev) => {
                                if (!prev?.sandra) return prev;
                                return {
                                  ...prev,
                                  sandra: { ...prev.sandra, name: e.target.value }
                                } as CMSContent;
                              });
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Título</label>
                          <input
                            type="text"
                            value={editedContent?.sandra?.title || ''}
                            onChange={(e) => {
                              setEditedContent((prev) => {
                                if (!prev?.sandra) return prev;
                                return {
                                  ...prev,
                                  sandra: { ...prev.sandra, title: e.target.value }
                                } as CMSContent;
                              });
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm text-muted-foreground mb-2">Biografía</label>
                        <textarea
                          value={editedContent?.sandra?.bio || ''}
                          onChange={(e) => {
                            setEditedContent((prev) => {
                              if (!prev?.sandra) return prev;
                              return {
                                ...prev,
                                sandra: { ...prev.sandra, bio: e.target.value }
                              } as CMSContent;
                            });
                          }}
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light resize-none"
                        />
                      </div>
                    </GlassCard>

                    {/* Achievements */}
                    <GlassCard className="p-6">
                      <h2 className="text-lg font-semibold text-ivory mb-4">Logros Destacados</h2>
                      <div className="space-y-3">
                        {(editedContent?.sandra?.achievements || []).map((achievement, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={achievement}
                              onChange={(e) => {
                                setEditedContent((prev) => {
                                  if (!prev?.sandra) return prev;
                                  const newAchievements = [...(prev.sandra.achievements || [])];
                                  newAchievements[index] = e.target.value;
                                  return {
                                    ...prev,
                                    sandra: { ...prev.sandra, achievements: newAchievements }
                                  } as CMSContent;
                                });
                              }}
                              className="flex-1 px-4 py-2 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                            />
                            <button
                              onClick={() => {
                                setEditedContent((prev) => {
                                  if (!prev?.sandra) return prev;
                                  const newAchievements = (prev.sandra.achievements || []).filter((_, i) => i !== index);
                                  return {
                                    ...prev,
                                    sandra: { ...prev.sandra, achievements: newAchievements }
                                  } as CMSContent;
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
                          onClick={() => setEditedContent((prev) => {
                            if (!prev?.sandra) return prev;
                            return {
                              ...prev,
                              sandra: { ...prev.sandra, achievements: [...(prev.sandra.achievements || []), ''] }
                            } as CMSContent;
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
                        {(editedContent?.sandra?.certifications || []).map((cert, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={cert}
                              onChange={(e) => {
                                setEditedContent((prev) => {
                                  if (!prev?.sandra) return prev;
                                  const newCerts = [...(prev.sandra.certifications || [])];
                                  newCerts[index] = e.target.value;
                                  return {
                                    ...prev,
                                    sandra: { ...prev.sandra, certifications: newCerts }
                                  } as CMSContent;
                                });
                              }}
                              className="flex-1 px-4 py-2 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                            />
                            <button
                              onClick={() => {
                                setEditedContent((prev) => {
                                  if (!prev?.sandra) return prev;
                                  const newCerts = (prev.sandra.certifications || []).filter((_, i) => i !== index);
                                  return {
                                    ...prev,
                                    sandra: { ...prev.sandra, certifications: newCerts }
                                  } as CMSContent;
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
                          onClick={() => setEditedContent((prev) => {
                            if (!prev?.sandra) return prev;
                            return {
                              ...prev,
                              sandra: { ...prev.sandra, certifications: [...(prev.sandra.certifications || []), ''] }
                            } as CMSContent;
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
                        {(editedContent?.sandra?.timeline || []).map((item, index) => (
                          <div key={index} className="p-4 rounded-xl bg-muted/30 border border-border">
                            <div className="grid sm:grid-cols-3 gap-3 mb-3">
                              <input
                                type="text"
                                value={item.year}
                                onChange={(e) => {
                                  setEditedContent((prev) => {
                                    if (!prev?.sandra) return prev;
                                    const newTimeline = [...(prev.sandra.timeline || [])];
                                    newTimeline[index] = { ...newTimeline[index], year: e.target.value };
                                    return {
                                      ...prev,
                                      sandra: { ...prev.sandra, timeline: newTimeline }
                                    } as CMSContent;
                                  });
                                }}
                                placeholder="Año"
                                className="px-3 py-2 rounded-lg bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                              />
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => {
                                  setEditedContent((prev) => {
                                    if (!prev?.sandra) return prev;
                                    const newTimeline = [...(prev.sandra.timeline || [])];
                                    newTimeline[index] = { ...newTimeline[index], title: e.target.value };
                                    return {
                                      ...prev,
                                      sandra: { ...prev.sandra, timeline: newTimeline }
                                    } as CMSContent;
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
                                  setEditedContent((prev) => {
                                    if (!prev?.sandra) return prev;
                                    const newTimeline = [...(prev.sandra.timeline || [])];
                                    newTimeline[index] = { ...newTimeline[index], description: e.target.value };
                                    return {
                                      ...prev,
                                      sandra: { ...prev.sandra, timeline: newTimeline }
                                    } as CMSContent;
                                  });
                                }}
                                placeholder="Descripción"
                                rows={2}
                                className="flex-1 px-3 py-2 rounded-lg bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light resize-none"
                              />
                              <button
                                onClick={() => {
                                  setEditedContent((prev) => {
                                    if (!prev?.sandra) return prev;
                                    const newTimeline = (prev.sandra.timeline || []).filter((_, i) => i !== index);
                                    return {
                                      ...prev,
                                      sandra: { ...prev.sandra, timeline: newTimeline }
                                    } as CMSContent;
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
                          onClick={() => setEditedContent((prev) => {
                            if (!prev?.sandra) return prev;
                            return {
                              ...prev,
                              sandra: {
                                ...prev.sandra,
                                timeline: [...(prev.sandra.timeline || []), { year: '', title: '', description: '' }]
                              }
                            } as CMSContent;
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
              {activeTab === 'Centro' && (
                <motion.div
                  key="Centro"
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
                            value={editedContent?.centro?.title || ''}
                            onChange={(e) => {
                              setEditedContent((prev) => {
                                if (!prev) return prev;
                                return {
                                  ...prev,
                                  centro: { ...prev.centro, title: e.target.value }
                                } as CMSContent;
                              });
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Subtítulo</label>
                          <input
                            type="text"
                            value={editedContent?.centro?.subtitle || ''}
                            onChange={(e) => {
                              setEditedContent((prev) => {
                                if (!prev) return prev;
                                return {
                                  ...prev,
                                  centro: { ...prev.centro, subtitle: e.target.value }
                                } as CMSContent;
                              });
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Descripción</label>
                          <textarea
                            value={editedContent?.centro?.description || ''}
                            onChange={(e) => {
                              setEditedContent((prev) => {
                                if (!prev) return prev;
                                return {
                                  ...prev,
                                  centro: { ...prev.centro, description: e.target.value }
                                } as CMSContent;
                              });
                            }}
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
                            value={editedContent?.centro?.schedule?.weekdays || ''}
                            onChange={(e) => {
                              setEditedContent((prev) => {
                                if (!prev?.centro) return prev;
                                return {
                                  ...prev,
                                  centro: {
                                    ...prev.centro,
                                    schedule: { ...prev.centro.schedule, weekdays: e.target.value }
                                  }
                                } as CMSContent;
                              });
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                            placeholder="7:00 - 21:00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Sábados</label>
                          <input
                            type="text"
                            value={editedContent?.centro?.schedule?.saturday || ''}
                            onChange={(e) => {
                              setEditedContent((prev) => {
                                if (!prev?.centro) return prev;
                                return {
                                  ...prev,
                                  centro: {
                                    ...prev.centro,
                                    schedule: { ...prev.centro.schedule, saturday: e.target.value }
                                  }
                                } as CMSContent;
                              });
                            }}
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
                        {(editedContent?.centro?.features || []).map((feature, index) => (
                          <div key={index} className="p-4 rounded-xl bg-muted/30 border border-border">
                            <div className="grid sm:grid-cols-3 gap-3">
                              <input
                                type="text"
                                value={feature.icon}
                                onChange={(e) => {
                                  setEditedContent((prev) => {
                                    if (!prev?.centro) return prev;
                                    const newFeatures = [...(prev.centro.features || [])];
                                    newFeatures[index] = { ...newFeatures[index], icon: e.target.value };
                                    return {
                                      ...prev,
                                      centro: { ...prev.centro, features: newFeatures }
                                    } as CMSContent;
                                  });
                                }}
                                placeholder="Icono (Sparkles, Shield, Zap, Users)"
                                className="px-3 py-2 rounded-lg bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                              />
                              <input
                                type="text"
                                value={feature.title}
                                onChange={(e) => {
                                  setEditedContent((prev) => {
                                    if (!prev?.centro) return prev;
                                    const newFeatures = [...(prev.centro.features || [])];
                                    newFeatures[index] = { ...newFeatures[index], title: e.target.value };
                                    return {
                                      ...prev,
                                      centro: { ...prev.centro, features: newFeatures }
                                    } as CMSContent;
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
                                    setEditedContent((prev) => {
                                      if (!prev?.centro) return prev;
                                      const newFeatures = [...(prev.centro.features || [])];
                                      newFeatures[index] = { ...newFeatures[index], description: e.target.value };
                                      return {
                                        ...prev,
                                        centro: { ...prev.centro, features: newFeatures }
                                      } as CMSContent;
                                    });
                                  }}
                                  placeholder="Descripción"
                                  className="flex-1 px-3 py-2 rounded-lg bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                                />
                                <button
                                  onClick={() => {
                                    setEditedContent((prev) => {
                                      if (!prev?.centro) return prev;
                                      const newFeatures = (prev.centro.features || []).filter((_, i) => i !== index);
                                      return {
                                        ...prev,
                                        centro: { ...prev.centro, features: newFeatures }
                                      } as CMSContent;
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
                          onClick={() => setEditedContent((prev) => {
                            if (!prev?.centro) return prev;
                            return {
                              ...prev,
                              centro: {
                                ...prev.centro,
                                features: [...(prev.centro.features || []), { icon: '', title: '', description: '' }]
                              }
                            } as CMSContent;
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
                  CMS - GALERÍA (Cloudinary-native)
                  ============================================ */}
              {activeTab === 'Galeria' && (
                <GaleriaTab />
              )}

              {/* ============================================
                  CMS - CONTACTO & HERO
                  ============================================ */}
              {activeTab === 'Contacto' && (
                <motion.div
                  key="Contacto"
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
                        <div className="mb-6">
                          <label className="block text-sm text-muted-foreground mb-2">Imagen de Fondo (Hero)</label>
                          {isValidImageUrl(editedContent?.heroImage) ? (
                            <img src={editedContent!.heroImage} alt="Hero" className="w-full max-w-sm h-32 object-cover rounded-xl mb-3 border border-border" />
                          ) : (
                            <div className="w-full max-w-sm h-32 rounded-xl mb-3 border border-border bg-muted/30 flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-muted-foreground opacity-50" />
                            </div>
                          )}
                          <PremiumButton
                            variant="outline"
                            size="sm"
                            icon={<ImageIcon className="w-4 h-4" />}
                            onClick={() => setActiveImageManager({
                              folder: 'Hero',
                              currentUrl: editedContent?.heroImage || undefined,
                              onSelect: (url) => setEditedContent(prev => prev ? { ...prev, heroImage: url } as CMSContent : prev)
                            })}
                          >
                            Cambiar Imagen Hero
                          </PremiumButton>
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Título Principal</label>
                          <input
                            type="text"
                            value={editedContent?.heroTitle || ''}
                            onChange={(e) => {
                              setEditedContent((prev) => {
                                if (!prev) return prev;
                                return { ...prev, heroTitle: e.target.value } as CMSContent;
                              });
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Subtítulo</label>
                          <textarea
                            value={editedContent?.heroSubtitle || ''}
                            onChange={(e) => {
                              setEditedContent((prev) => {
                                if (!prev) return prev;
                                return { ...prev, heroSubtitle: e.target.value } as CMSContent;
                              });
                            }}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Texto Botón CTA</label>
                          <input
                            type="text"
                            value={editedContent?.heroCTA || ''}
                            onChange={(e) => {
                              setEditedContent((prev) => {
                                if (!prev) return prev;
                                return { ...prev, heroCTA: e.target.value } as CMSContent;
                              });
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                        </div>
                      </div>
                    </GlassCard>

                    {/* About Section */}
                    <GlassCard className="p-6">
                      <h2 className="text-lg font-semibold text-ivory mb-4 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-accent" />
                        Sección Sobre Nosotros
                      </h2>
                      <div className="space-y-4">
                        <div className="mb-6">
                          <label className="block text-sm text-muted-foreground mb-2">Imagen Representativa</label>
                          {isValidImageUrl(editedContent?.aboutImage) ? (
                            <img src={editedContent!.aboutImage} alt="About" className="w-full max-w-sm h-32 object-cover rounded-xl mb-3 border border-border" />
                          ) : (
                            <div className="w-full max-w-sm h-32 rounded-xl mb-3 border border-border bg-muted/30 flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-muted-foreground opacity-50" />
                            </div>
                          )}
                          <PremiumButton
                            variant="outline"
                            size="sm"
                            icon={<ImageIcon className="w-4 h-4" />}
                            onClick={() => setActiveImageManager({
                              folder: 'Nosotros',
                              currentUrl: editedContent?.aboutImage || undefined,
                              onSelect: (url) => setEditedContent(prev => prev ? { ...prev, aboutImage: url } as CMSContent : prev)
                            })}
                          >
                            Cambiar Imagen
                          </PremiumButton>
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Título Sobre Nosotros</label>
                          <input
                            type="text"
                            value={editedContent?.aboutTitle || ''}
                            onChange={(e) => {
                              setEditedContent((prev) => {
                                if (!prev) return prev;
                                return { ...prev, aboutTitle: e.target.value } as CMSContent;
                              });
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Texto Principal</label>
                          <textarea
                            value={editedContent?.aboutText || ''}
                            onChange={(e) => {
                              setEditedContent((prev) => {
                                if (!prev) return prev;
                                return { ...prev, aboutText: e.target.value } as CMSContent;
                              });
                            }}
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light resize-none"
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
                            value={editedContent?.servicesTitle || ''}
                            onChange={(e) => {
                              setEditedContent((prev) => {
                                if (!prev) return prev;
                                return { ...prev, servicesTitle: e.target.value } as CMSContent;
                              });
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Subtítulo</label>
                          <input
                            type="text"
                            value={editedContent?.servicesSubtitle || ''}
                            onChange={(e) => {
                              setEditedContent((prev) => {
                                if (!prev) return prev;
                                return { ...prev, servicesSubtitle: e.target.value } as CMSContent;
                              });
                            }}
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
                            value={editedContent?.ctaTitle || ''}
                            onChange={(e) => {
                              setEditedContent((prev) => {
                                if (!prev) return prev;
                                return { ...prev, ctaTitle: e.target.value } as CMSContent;
                              });
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Texto</label>
                          <textarea
                            value={editedContent?.ctaSubtitle || ''}
                            onChange={(e) => {
                              setEditedContent((prev) => {
                                if (!prev) return prev;
                                return { ...prev, ctaSubtitle: e.target.value } as CMSContent;
                              });
                            }}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light resize-none"
                          />
                        </div>
                      </div>
                    </GlassCard>

                    {/* Contact Information */}
                    <GlassCard className="p-6">
                      <h2 className="text-lg font-semibold text-ivory mb-4">Información de Contacto</h2>
                      <div className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-muted-foreground mb-2 flex items-center gap-2">
                              <Phone className="w-4 h-4" /> Teléfono
                            </label>
                            <input
                              type="text"
                              value={editedContent?.phone || ''}
                              onChange={(e) => {
                                setEditedContent((prev) => {
                                  if (!prev) return prev;
                                  return {
                                    ...prev,
                                    phone: e.target.value
                                  } as CMSContent;
                                });
                              }}
                              className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-muted-foreground mb-2 flex items-center gap-2">
                              <Mail className="w-4 h-4" /> Email
                            </label>
                            <input
                              type="email"
                              value={editedContent?.email || ''}
                              onChange={(e) => {
                                setEditedContent((prev) => {
                                  if (!prev) return prev;
                                  return {
                                    ...prev,
                                    email: e.target.value
                                  } as CMSContent;
                                });
                              }}
                              className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Dirección
                          </label>
                          <textarea
                            value={editedContent?.address || ''}
                            onChange={(e) => {
                              setEditedContent((prev) => {
                                if (!prev) return prev;
                                return {
                                  ...prev,
                                  address: e.target.value
                                } as CMSContent;
                              });
                            }}
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light resize-none"
                          />
                        </div>
                      </div>
                    </GlassCard>

                    {/* Social Media */}
                    <GlassCard className="p-6">
                      <h2 className="text-lg font-semibold text-ivory mb-4">Redes Sociales</h2>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Instagram (URL)</label>
                          <input
                            type="url"
                            value={editedContent?.socialInstagram || ''}
                            onChange={(e) => {
                              setEditedContent((prev) => {
                                if (!prev) return prev;
                                return {
                                  ...prev,
                                  socialInstagram: e.target.value
                                } as CMSContent;
                              });
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                            placeholder="https://instagram.com/tu-usuario"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">WhatsApp (Número)</label>
                          <input
                            type="text"
                            value={editedContent?.whatsapp || ''}
                            onChange={(e) => {
                              setEditedContent((prev) => {
                                if (!prev) return prev;
                                return {
                                  ...prev,
                                  whatsapp: e.target.value
                                } as CMSContent;
                              });
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                            placeholder="+34600000000"
                          />
                        </div>
                      </div>
                    </GlassCard>
                  </div>
                </motion.div>
              )}


            </AnimatePresence>

            {/* Advanced Image Manager Modal - outside AnimatePresence mode="wait" */}
            <AnimatePresence>
              {activeImageManager && (
                <ContextualImageManager
                  defaultFolder={activeImageManager.folder}
                  currentUrl={activeImageManager.currentUrl}
                  onSelect={activeImageManager.onSelect}
                  onClose={() => setActiveImageManager(null)}
                />
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div >
  );
}