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
  Lock,
  CalendarOff,
  Dumbbell,
  FileText,
  Search,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { PremiumButton } from '@/components/ui/premium-button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { ContextualImageManager } from '@/components/ui/ContextualImageManager';
import { useAuth } from '@/contexts/AuthContext';
import type { TimeSlot, Service, Testimonial, Appointment, CMSContent, BlockedSlot, Trainer } from '@/types';
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
  getBlockedSlots,
  addBlockedSlot as addBlockedSlotFS,
  deleteBlockedSlot as deleteBlockedSlotFS,
  incrementSlotOccupancy,
  decrementSlotOccupancy,
  getTrainers,
  getActiveTrainers,
  addTrainer as addTrainerFS,
  deleteTrainer as deleteTrainerFS,
  getTrainerByUid,
  getAppointmentsByTrainer,
  updateTrainerNotes,
  updateUserProfile,
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

type TabType = 'Inicio' | 'appointments' | 'availability' | 'clients' | 'team' | 'services' | 'testimonials' | 'Sandra' | 'Centro' | 'Galeria' | 'Contacto';
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

  // Role checks
  const isTrainerRole = userProfile?.role === 'trainer';
  const canAccessAdmin = isAdmin || isTrainerRole;

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

  // Estado para aprobación con campos extra
  const [approvalData, setApprovalData] = useState<{ assignedTrainer: string; sessionType: string }>({
    assignedTrainer: '',
    sessionType: '',
  });
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Estado para horarios bloqueados
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [blockDate, setBlockDate] = useState('');
  const [blockStartTime, setBlockStartTime] = useState('');
  const [blockEndTime, setBlockEndTime] = useState('');
  const [blockReason, setBlockReason] = useState('');

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

  // Trainer management state
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [trainerProfile, setTrainerProfile] = useState<Trainer | null>(null);
  const [trainerAppointments, setTrainerAppointments] = useState<Appointment[]>([]);
  const [editingNotes, setEditingNotes] = useState<{ id: string; notes: string } | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);

  // Client search
  const [clientSearch, setClientSearch] = useState('');

  // Cargar datos desde Firestore
  const refreshData = async () => {
    const [appts, svcs, tests, cms, usersList, blocked, trainersList] = await Promise.all([
      getAppointments(),
      getServices(),
      getTestimonials(),
      getSiteContent(),
      getUsers(),
      getBlockedSlots(),
      getTrainers(),
    ]);
    setAppointments(appts);
    setServices(svcs);
    setTestimonials(tests);
    setClients(usersList);
    setBlockedSlots(blocked);
    setTrainers(trainersList);
    if (cms) {
      setCmsContent(cms);
      setEditedContent(cms);
    }
  };

  // Cargar datos específicos del entrenador
  const refreshTrainerData = async () => {
    if (!user) return;
    const tProfile = await getTrainerByUid(user.uid);
    setTrainerProfile(tProfile);
    if (tProfile) {
      const appts = await getAppointmentsByTrainer(tProfile.id);
      setTrainerAppointments(appts);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      // eslint-disable-next-line
      refreshData().catch(console.error);
    } else if (isTrainerRole) {
      // Trainers only load their own data
      refreshTrainerData().catch(console.error);
    }
  }, [isAdmin, isTrainerRole]);

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
  const handleStatusUpdate = async (
    id: string,
    status: 'pending' | 'approved' | 'rejected' | 'alternative',
    altSlot?: TimeSlot,
    extraFields?: { assignedTrainer?: string; sessionType?: string; approvedSlot?: TimeSlot }
  ) => {
    // Encontrar la cita actual para saber su estado previo
    const currentAppt = appointments.find(a => a.id === id);
    const prevStatus = currentAppt?.status;

    await updateAppointmentStatusFS(id, status, altSlot, extraFields);

    // Mantener slot_occupancy sincronizado
    // Si pasa a 'approved', incrementar el aforo de la franja aprobada
    if (status === 'approved') {
      const slot = extraFields?.approvedSlot || currentAppt?.preferredSlots?.[0];
      if (slot) {
        await incrementSlotOccupancy(slot.date, slot.time);
      }
    }
    // Si ESTABA aprobada y ahora cambia a otro estado, decrementar
    if (prevStatus === 'approved' && status !== 'approved') {
      const slot = currentAppt?.approvedSlot || currentAppt?.preferredSlots?.[0];
      if (slot) {
        await decrementSlotOccupancy(slot.date, slot.time);
      }
    }

    await addActivityLog({ action: `appointment_${status}`, adminEmail: user?.email || 'unknown', details: `Cita ID: ${id}` });
    await refreshData();
    setShowAlternativeModal(false);
    setShowApprovalModal(false);
    setAlternativeSlot({ date: '', time: '' });
    setApprovalData({ assignedTrainer: '', sessionType: '' });
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

  if (!user || !canAccessAdmin) {
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
  // TRAINER-ONLY VIEW (no sidebar, limited access)
  // ============================================
  if (isTrainerRole && !isAdmin) {
    const now = new Date();
    const upcomingAppts = trainerAppointments
      .filter(a => a.approvedSlot && new Date(a.approvedSlot.date + 'T' + a.approvedSlot.time) >= now)
      .sort((a, b) => {
        const da = new Date(a.approvedSlot!.date + 'T' + a.approvedSlot!.time);
        const db = new Date(b.approvedSlot!.date + 'T' + b.approvedSlot!.time);
        return da.getTime() - db.getTime();
      });
    const pastAppts = trainerAppointments
      .filter(a => a.approvedSlot && new Date(a.approvedSlot.date + 'T' + a.approvedSlot.time) < now)
      .sort((a, b) => {
        const da = new Date(a.approvedSlot!.date + 'T' + a.approvedSlot!.time);
        const db = new Date(b.approvedSlot!.date + 'T' + b.approvedSlot!.time);
        return db.getTime() - da.getTime();
      });

    const handleSaveNotes = async () => {
      if (!editingNotes) return;
      setSavingNotes(true);
      try {
        await updateTrainerNotes(editingNotes.id, editingNotes.notes);
        await refreshTrainerData();
        setEditingNotes(null);
      } catch (err) {
        console.error('Error saving notes:', err);
        alert('Error al guardar las notas.');
      }
      setSavingNotes(false);
    };

    const renderTrainerAppointmentCard = (appt: Appointment, isPast: boolean) => (
      <GlassCard key={appt.id} className={cn('p-5', isPast && 'opacity-70')}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald to-accent flex items-center justify-center text-obsidian font-bold">
                {appt.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-ivory">{appt.name}</h3>
                {appt.sessionType && (
                  <span className="px-2 py-0.5 rounded bg-emerald/20 text-emerald-light text-xs font-medium uppercase">
                    {appt.sessionType}
                  </span>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {appt.approvedSlot && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span className="text-ivory">
                    {new Date(appt.approvedSlot.date).toLocaleDateString('es-ES', {
                      weekday: 'long', day: 'numeric', month: 'long',
                    })}
                  </span>
                </div>
              )}
              {appt.approvedSlot && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4 text-accent" />
                  <span className="text-ivory">{appt.approvedSlot.time}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Award className="w-4 h-4 text-accent" />
                <span className="text-ivory">{serviceLabels[appt.serviceType] || appt.serviceType}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4 text-accent" />
                <span className="text-ivory">{durationLabels[appt.duration] || appt.duration + ' min'}</span>
              </div>
            </div>

            {/* Trainer Notes */}
            {editingNotes?.id === appt.id ? (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Notas del entrenador:</label>
                <textarea
                  value={editingNotes.notes}
                  onChange={(e) => setEditingNotes({ ...editingNotes, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border text-ivory text-sm focus:outline-none focus:border-emerald-light resize-none"
                  rows={3}
                  placeholder="Escribe tus notas sobre esta sesión..."
                />
                <div className="flex gap-2">
                  <PremiumButton
                    variant="cta"
                    size="sm"
                    icon={<Save className="w-3.5 h-3.5" />}
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                  >
                    {savingNotes ? 'Guardando...' : 'Guardar'}
                  </PremiumButton>
                  <PremiumButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingNotes(null)}
                  >
                    Cancelar
                  </PremiumButton>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                {appt.trainerNotes ? (
                  <div className="flex-1 p-2 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Tus notas:</p>
                    <p className="text-ivory text-sm">{appt.trainerNotes}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Sin notas</p>
                )}
                <button
                  onClick={() => setEditingNotes({ id: appt.id, notes: appt.trainerNotes || '' })}
                  className="text-accent hover:text-accent/80 transition-colors p-1"
                  title="Editar notas"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    );

    return (
      <div className="min-h-screen -mt-20 bg-obsidian">
        {/* Header */}
        <header className="glass-dark border-b border-border sticky top-0 z-40">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald to-accent flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-obsidian" />
                </div>
                <div>
                  <span className="font-bold text-ivory">Panel Entrenador</span>
                  {trainerProfile && (
                    <span className="text-xs text-muted-foreground ml-2">({trainerProfile.name})</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <PremiumButton
                  variant="ghost"
                  size="sm"
                  icon={<RefreshCw className="w-4 h-4" />}
                  onClick={() => refreshTrainerData()}
                >
                  <span className="hidden sm:inline">Actualizar</span>
                </PremiumButton>
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

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {!trainerProfile ? (
            <GlassCard className="p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
              <h2 className="text-xl font-bold text-ivory mb-2">Perfil no encontrado</h2>
              <p className="text-muted-foreground">
                Tu cuenta tiene rol de entrenador, pero no se ha encontrado un perfil en la colección de trainers.
                Contacta con la administradora.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-8">
              {/* Upcoming Appointments */}
              <div>
                <h2 className="text-xl font-bold text-ivory mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent" />
                  Próximos entrenamientos
                  {upcomingAppts.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">({upcomingAppts.length})</span>
                  )}
                </h2>
                {upcomingAppts.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppts.map(a => renderTrainerAppointmentCard(a, false))}
                  </div>
                ) : (
                  <GlassCard className="p-8 text-center">
                    <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                    <p className="text-muted-foreground">No tienes entrenamientos programados.</p>
                  </GlassCard>
                )}
              </div>

              {/* Past Appointments */}
              {pastAppts.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-ivory mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    Entrenamientos anteriores
                    <span className="text-sm font-normal text-muted-foreground">({pastAppts.length})</span>
                  </h2>
                  <div className="space-y-4">
                    {pastAppts.map(a => renderTrainerAppointmentCard(a, true))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN ADMIN PANEL
  // ============================================

  return (
    <div className="min-h-screen -mt-20 bg-obsidian">
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
              onClick={() => setActiveTab('availability')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                activeTab === 'availability'
                  ? 'bg-emerald/20 text-emerald border border-emerald/30 shadow-lg shadow-emerald/10'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-ivory'
              )}
            >
              <CalendarOff className="w-5 h-5" />
              <span className="font-medium">Disponibilidad</span>
              {blockedSlots.length > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">{blockedSlots.length}</span>
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

            <button
              onClick={() => setActiveTab('team')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                activeTab === 'team'
                  ? 'bg-emerald/20 text-emerald border border-emerald/30 shadow-lg shadow-emerald/10'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-ivory'
              )}
            >
              <Dumbbell className="w-5 h-5" />
              <span className="font-medium">Equipo</span>
              {trainers.length > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">{trainers.length}</span>
              )}
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
                            className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => {
                              setStatusFilter('all');
                              setActiveTab('appointments');
                              // Scroll to the appointment after tab switch
                              setTimeout(() => {
                                document.getElementById(`appt-${appointment.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 300);
                            }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald to-accent flex items-center justify-center text-obsidian font-semibold">
                                {appointment.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-ivory hover:text-accent transition-colors">{appointment.name}</p>
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
                          id={`appt-${appointment.id}`}
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

                                {appointment.status === 'approved' && (appointment.approvedSlot || appointment.assignedTrainer || appointment.sessionType) && (
                                  <div className="p-3 rounded-lg bg-emerald/10 border border-emerald/20">
                                    <p className="text-xs text-emerald-light mb-2 font-semibold">Detalles de aprobación:</p>
                                    <div className="flex flex-wrap gap-3 text-sm">
                                      {appointment.approvedSlot && (
                                        <span className="text-ivory">
                                          Franja: {new Date(appointment.approvedSlot.date).toLocaleDateString('es-ES', {
                                            weekday: 'short', day: 'numeric', month: 'short',
                                          })} - {appointment.approvedSlot.time}
                                        </span>
                                      )}
                                      {appointment.assignedTrainer && (
                                        <span className="text-ivory">
                                          Entrenador: <strong>{trainers.find(t => t.id === appointment.assignedTrainer)?.name || appointment.assignedTrainer}</strong>
                                        </span>
                                      )}
                                      {appointment.sessionType && (
                                        <span className="px-2 py-0.5 rounded bg-emerald/20 text-emerald-light text-xs font-medium uppercase">{appointment.sessionType}</span>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {appointment.trainerNotes && (
                                  <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                                    <p className="text-xs text-accent mb-1 font-semibold flex items-center gap-1">
                                      <FileText className="w-3.5 h-3.5" />
                                      Notas del entrenador:
                                    </p>
                                    <p className="text-ivory text-sm">{appointment.trainerNotes}</p>
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
                                      onClick={() => {
                                        setSelectedAppointmentId(appointment.id);
                                        setApprovalData({ assignedTrainer: '', sessionType: '' });
                                        setShowApprovalModal(true);
                                      }}
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

                  {/* Search bar */}
                  <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Buscar por nombre o email..."
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light placeholder:text-muted-foreground"
                    />
                  </div>

                  <div className="grid gap-4">
                    {clients
                      .filter((c) => {
                        if (!clientSearch.trim()) return true;
                        const q = clientSearch.toLowerCase();
                        return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
                      })
                      .map((client) => (
                      <GlassCard key={client.uid} className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center",
                              client.role === 'admin' ? "bg-accent/20" : client.role === 'trainer' ? "bg-emerald/20" : "bg-accent/20"
                            )}>
                              {client.role === 'trainer' ? (
                                <Dumbbell className="w-6 h-6 text-emerald" />
                              ) : (
                                <User className="w-6 h-6 text-accent" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-ivory">{client.name}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="w-3.5 h-3.5" />
                                {client.email}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {client.phone}
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Unido el {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'Fecha desconocida'}
                            </div>
                            {/* Role dropdown */}
                            <select
                              value={client.role}
                              onChange={async (e) => {
                                const newRole = e.target.value as 'admin' | 'trainer' | 'user';
                                const oldRole = client.role;
                                if (newRole === oldRole) return;
                                try {
                                  // Update user role in Firestore
                                  await updateUserProfile(client.uid, { role: newRole });
                                  // Auto-create trainer doc when promoting to trainer
                                  if (newRole === 'trainer' && oldRole !== 'trainer') {
                                    await addTrainerFS({ uid: client.uid, name: client.name, active: true });
                                  }
                                  // Auto-delete trainer doc when demoting from trainer
                                  if (oldRole === 'trainer' && newRole !== 'trainer') {
                                    const trainerDoc = await getTrainerByUid(client.uid);
                                    if (trainerDoc) {
                                      await deleteTrainerFS(trainerDoc.id);
                                    }
                                  }
                                  await refreshData();
                                } catch (err) {
                                  console.error('Error updating role:', err);
                                  alert('Error al cambiar el rol.');
                                }
                              }}
                              className={cn(
                                "px-2 py-1 rounded-lg text-xs font-medium uppercase tracking-tight border bg-input focus:outline-none focus:border-emerald-light cursor-pointer",
                                client.role === 'admin'
                                  ? "text-accent border-accent/30"
                                  : client.role === 'trainer'
                                    ? "text-emerald-light border-emerald/30"
                                    : "text-ivory border-border"
                              )}
                            >
                              <option value="user">Cliente</option>
                              <option value="trainer">Entrenador</option>
                              <option value="admin">Admin</option>
                            </select>
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
                  TEAM (Equipo)
                  ============================================ */}
              {activeTab === 'team' && (
                <motion.div
                  key="team"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-ivory">Equipo de Entrenadores</h1>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      Total: <span className="text-ivory font-semibold">{trainers.length}</span>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {trainers.map((trainer) => (
                      <GlassCard key={trainer.id} className="p-6">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald/20 flex items-center justify-center">
                              <Dumbbell className="w-6 h-6 text-emerald" />
                            </div>
                            <h3 className="font-semibold text-ivory">{trainer.name}</h3>
                          </div>
                          <PremiumButton
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 className="w-4 h-4" />}
                            onClick={async () => {
                              if (confirm(`¿Eliminar a ${trainer.name} del equipo?`)) {
                                await deleteTrainerFS(trainer.id);
                                await refreshData();
                              }
                            }}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            Eliminar
                          </PremiumButton>
                        </div>
                      </GlassCard>
                    ))}
                    {trainers.length === 0 && (
                      <GlassCard className="p-12 text-center">
                        <Dumbbell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                        <p className="text-muted-foreground mb-2">No hay entrenadores registrados.</p>
                        <p className="text-sm text-muted-foreground">
                          Ve a la pestaña <button onClick={() => setActiveTab('clients')} className="text-accent underline">Clientes</button> y cambia el rol de un usuario a &ldquo;Entrenador&rdquo;.
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

              {/* ============================================
                  AVAILABILITY (Blocked Slots)
                  ============================================ */}
              {activeTab === 'availability' && (
                <motion.div
                  key="availability"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-ivory">Gestión de Disponibilidad</h1>
                    <p className="text-sm text-muted-foreground">
                      {blockedSlots.length} franja{blockedSlots.length !== 1 ? 's' : ''} bloqueada{blockedSlots.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Blocking calendar */}
                  <GlassCard className="p-6 mb-6">
                    <h2 className="text-lg font-semibold text-ivory mb-4 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-accent" />
                      Bloquear Disponibilidad
                    </h2>

                    <div className="grid sm:grid-cols-2 gap-6">
                      {/* Left: Date picker + visual calendar */}
                      <div>
                        <label className="block text-sm text-muted-foreground mb-2">Fecha</label>
                        <input
                          type="date"
                          value={blockDate}
                          onChange={(e) => setBlockDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light mb-4"
                        />

                        {/* Visual day grid showing which slots are blocked */}
                        {blockDate && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">
                              Estado del día {new Date(blockDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}:
                            </p>
                            <div className="grid grid-cols-4 gap-2">
                              {timeSlots.map((t) => {
                                const isBlocked = blockedSlots.some(s => s.date === blockDate && s.time === t);
                                return (
                                  <div
                                    key={t}
                                    className={cn(
                                      'px-2 py-1.5 rounded-lg text-xs text-center font-medium border',
                                      isBlocked
                                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                        : 'bg-emerald/10 text-emerald-light border-emerald/20'
                                    )}
                                  >
                                    {t} {isBlocked ? '✕' : '✓'}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Range selector + actions */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm text-muted-foreground mb-2">Hora inicio</label>
                            <select
                              value={blockStartTime}
                              onChange={(e) => setBlockStartTime(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                            >
                              <option value="">Desde</option>
                              {timeSlots.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-muted-foreground mb-2">Hora fin</label>
                            <select
                              value={blockEndTime}
                              onChange={(e) => setBlockEndTime(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                            >
                              <option value="">Hasta</option>
                              {timeSlots
                                .filter((t) => !blockStartTime || t >= blockStartTime)
                                .map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Motivo (opcional)</label>
                          <input
                            type="text"
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                            placeholder="Ej: Vacaciones, evento..."
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          />
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                          <PremiumButton
                            variant="cta"
                            icon={<Lock className="w-4 h-4" />}
                            onClick={async () => {
                              if (!blockDate || !blockStartTime || !blockEndTime) {
                                alert('Selecciona fecha, hora de inicio y hora de fin.');
                                return;
                              }
                              const slotsToBlock = timeSlots.filter(t => t >= blockStartTime && t <= blockEndTime);
                              const existing = blockedSlots.filter(s => s.date === blockDate).map(s => s.time);
                              const newSlots = slotsToBlock.filter(t => !existing.includes(t));
                              if (newSlots.length === 0) {
                                alert('Todas las franjas de ese rango ya están bloqueadas.');
                                return;
                              }
                              for (const time of newSlots) {
                                await addBlockedSlotFS({
                                  date: blockDate,
                                  time,
                                  reason: blockReason || undefined,
                                  createdBy: user?.uid || 'unknown',
                                });
                              }
                              await addActivityLog({
                                action: 'blocked_slot_added',
                                adminEmail: user?.email || 'unknown',
                                details: `${blockDate} ${blockStartTime}-${blockEndTime} (${newSlots.length} franjas)`,
                              });
                              setBlockStartTime('');
                              setBlockEndTime('');
                              setBlockReason('');
                              await refreshData();
                            }}
                            className="w-full"
                          >
                            Bloquear rango ({blockStartTime && blockEndTime
                              ? `${timeSlots.filter(t => t >= blockStartTime && t <= blockEndTime).length} franjas`
                              : '...'})
                          </PremiumButton>

                          <PremiumButton
                            variant="outline"
                            icon={<CalendarOff className="w-4 h-4" />}
                            onClick={async () => {
                              if (!blockDate) {
                                alert('Selecciona una fecha primero.');
                                return;
                              }
                              const existing = blockedSlots.filter(s => s.date === blockDate).map(s => s.time);
                              const newSlots = timeSlots.filter(t => !existing.includes(t));
                              if (newSlots.length === 0) {
                                alert('Ese día ya está completamente bloqueado.');
                                return;
                              }
                              if (!confirm(`¿Bloquear todo el día ${new Date(blockDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}? (${newSlots.length} franjas)`)) return;
                              for (const time of newSlots) {
                                await addBlockedSlotFS({
                                  date: blockDate,
                                  time,
                                  reason: blockReason || 'Día completo bloqueado',
                                  createdBy: user?.uid || 'unknown',
                                });
                              }
                              await addActivityLog({
                                action: 'blocked_slot_added',
                                adminEmail: user?.email || 'unknown',
                                details: `${blockDate} día completo (${newSlots.length} franjas)`,
                              });
                              setBlockReason('');
                              await refreshData();
                            }}
                            className="w-full"
                          >
                            Bloquear día completo
                          </PremiumButton>
                        </div>
                      </div>
                    </div>
                  </GlassCard>

                  {/* List of blocked slots grouped by date */}
                  <div className="space-y-3">
                    {blockedSlots.length === 0 ? (
                      <GlassCard className="p-12 text-center">
                        <CalendarOff className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold text-ivory mb-2">Sin franjas bloqueadas</h3>
                        <p className="text-muted-foreground">
                          Todas las franjas horarias están disponibles para reservar.
                        </p>
                      </GlassCard>
                    ) : (
                      (() => {
                        // Group by date
                        const grouped: Record<string, BlockedSlot[]> = {};
                        blockedSlots
                          .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
                          .forEach((slot) => {
                            if (!grouped[slot.date]) grouped[slot.date] = [];
                            grouped[slot.date].push(slot);
                          });
                        return Object.entries(grouped).map(([date, slots]) => {
                          const slotDate = new Date(date + 'T00:00:00');
                          const isPast = slotDate < new Date(new Date().toDateString());
                          return (
                            <GlassCard key={date} className={cn('p-5', isPast && 'opacity-50')}>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    'w-10 h-10 rounded-lg flex items-center justify-center',
                                    isPast ? 'bg-muted/30' : 'bg-red-500/20'
                                  )}>
                                    <Lock className={cn('w-5 h-5', isPast ? 'text-muted-foreground' : 'text-red-400')} />
                                  </div>
                                  <div>
                                    <p className="text-ivory font-medium">
                                      {slotDate.toLocaleDateString('es-ES', {
                                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                                      })}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{slots.length} franja{slots.length !== 1 ? 's' : ''} bloqueada{slots.length !== 1 ? 's' : ''}</p>
                                  </div>
                                </div>
                                <PremiumButton
                                  variant="ghost"
                                  size="sm"
                                  icon={<Trash2 className="w-4 h-4" />}
                                  onClick={async () => {
                                    if (confirm(`¿Desbloquear todas las franjas del ${slotDate.toLocaleDateString('es-ES')}?`)) {
                                      for (const s of slots) {
                                        await deleteBlockedSlotFS(s.id);
                                      }
                                      await addActivityLog({
                                        action: 'blocked_slot_removed',
                                        adminEmail: user?.email || 'unknown',
                                        details: `${date} (${slots.length} franjas)`,
                                      });
                                      await refreshData();
                                    }
                                  }}
                                  className="text-destructive hover:bg-destructive/10"
                                >
                                  Desbloquear día
                                </PremiumButton>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {slots.map((slot) => (
                                  <button
                                    key={slot.id}
                                    onClick={async () => {
                                      if (confirm(`¿Desbloquear ${slot.time}?`)) {
                                        await deleteBlockedSlotFS(slot.id);
                                        await addActivityLog({
                                          action: 'blocked_slot_removed',
                                          adminEmail: user?.email || 'unknown',
                                          details: `${slot.date} ${slot.time}`,
                                        });
                                        await refreshData();
                                      }
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-sm hover:bg-red-500/30 transition-colors flex items-center gap-1.5"
                                    title={slot.reason || 'Sin motivo'}
                                  >
                                    {slot.time}
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                ))}
                              </div>
                              {slots[0]?.reason && (
                                <p className="text-xs text-muted-foreground mt-2">Motivo: {slots[0].reason}</p>
                              )}
                            </GlassCard>
                          );
                        });
                      })()
                    )}
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

            {/* ============================================
                APPROVAL MODAL
                ============================================ */}
            <AnimatePresence>
              {showApprovalModal && selectedAppointmentId && (
                <motion.div
                  key="approval-modal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                  onClick={() => setShowApprovalModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg"
                  >
                    <GlassCard className="p-6">
                      <h2 className="text-xl font-bold text-ivory mb-1">Aprobar Cita</h2>
                      <p className="text-sm text-muted-foreground mb-6">
                        Asigna entrenador y tipo de sesión antes de confirmar. Ambos campos son opcionales.
                      </p>

                      {/* Pick one of the client's preferred slots as approved slot */}
                      {(() => {
                        const appt = appointments.find(a => a.id === selectedAppointmentId);
                        if (!appt) return null;
                        return (
                          <div className="mb-4">
                            <label className="block text-sm text-muted-foreground mb-2">Franja confirmada</label>
                            <div className="flex flex-wrap gap-2">
                              {appt.preferredSlots.map((slot, idx) => {
                                const isSelected = approvalData.assignedTrainer === '__slot__' + idx.toString();
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setApprovalData(prev => ({
                                      ...prev,
                                      assignedTrainer: prev.assignedTrainer === '__slot__' + idx.toString()
                                        ? prev.assignedTrainer
                                        : prev.assignedTrainer,
                                    }))}
                                    className={cn(
                                      'px-3 py-1.5 rounded-lg text-sm transition-colors',
                                      'bg-emerald/20 text-ivory'
                                    )}
                                  >
                                    {new Date(slot.date).toLocaleDateString('es-ES', {
                                      weekday: 'short',
                                      day: 'numeric',
                                      month: 'short',
                                    })} - {slot.time}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      <div className="space-y-4 mb-6">
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Entrenador asignado</label>
                          <select
                            value={approvalData.assignedTrainer}
                            onChange={(e) => setApprovalData({ ...approvalData, assignedTrainer: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          >
                            <option value="">Sin asignar</option>
                            {trainers.filter(t => t.active).map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Tipo de sesión</label>
                          <select
                            value={approvalData.sessionType}
                            onChange={(e) => setApprovalData({ ...approvalData, sessionType: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-ivory focus:outline-none focus:border-emerald-light"
                          >
                            <option value="">Sin especificar</option>
                            <option value="individual">Individual</option>
                            <option value="duo">Dúo</option>
                            <option value="assessment">Valoración</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end">
                        <PremiumButton
                          variant="ghost"
                          onClick={() => {
                            setShowApprovalModal(false);
                            setSelectedAppointmentId(null);
                            setApprovalData({ assignedTrainer: '', sessionType: '' });
                          }}
                        >
                          Cancelar
                        </PremiumButton>
                        <PremiumButton
                          variant="cta"
                          icon={<Check className="w-4 h-4" />}
                          onClick={() => {
                            const extra: { assignedTrainer?: string; sessionType?: string; approvedSlot?: TimeSlot } = {};
                            if (approvalData.assignedTrainer) extra.assignedTrainer = approvalData.assignedTrainer;
                            if (approvalData.sessionType) extra.sessionType = approvalData.sessionType;
                            // Use the first preferred slot as the approved slot by default
                            const appt = appointments.find(a => a.id === selectedAppointmentId);
                            if (appt && appt.preferredSlots.length > 0) {
                              extra.approvedSlot = appt.preferredSlots[0];
                            }
                            handleStatusUpdate(selectedAppointmentId, 'approved', undefined, extra);
                          }}
                        >
                          Confirmar Aprobación
                        </PremiumButton>
                      </div>
                    </GlassCard>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ============================================
                ALTERNATIVE SLOT MODAL
                ============================================ */}
            <AnimatePresence>
              {showAlternativeModal && selectedAppointmentId && (
                <motion.div
                  key="alternative-modal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                  onClick={() => {
                    setShowAlternativeModal(false);
                    setSelectedAppointmentId(null);
                    setAlternativeSlot({ date: '', time: '' });
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg"
                  >
                    <GlassCard className="p-6">
                      <h2 className="text-xl font-bold text-ivory mb-1">Proponer Alternativa</h2>
                      <p className="text-sm text-muted-foreground mb-6">
                        Selecciona una fecha y hora alternativa para esta cita.
                      </p>

                      <div className="space-y-4 mb-6">
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
                            <option value="">Seleccionar hora</option>
                            {timeSlots.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end">
                        <PremiumButton
                          variant="ghost"
                          onClick={() => {
                            setShowAlternativeModal(false);
                            setSelectedAppointmentId(null);
                            setAlternativeSlot({ date: '', time: '' });
                          }}
                        >
                          Cancelar
                        </PremiumButton>
                        <PremiumButton
                          variant="cta"
                          icon={<CalendarClock className="w-4 h-4" />}
                          onClick={() => {
                            if (!alternativeSlot.date || !alternativeSlot.time) {
                              alert('Selecciona fecha y hora para la alternativa.');
                              return;
                            }
                            handleStatusUpdate(selectedAppointmentId, 'alternative', alternativeSlot);
                          }}
                        >
                          Enviar Alternativa
                        </PremiumButton>
                      </div>
                    </GlassCard>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div >
  );
}