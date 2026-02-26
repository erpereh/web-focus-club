import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
    UserProfile,
    Service,
    Appointment,
    Testimonial,
    CMSContent,
    SandraData,
    CentroData,
    TimeSlot,
} from '@/types';

// ============================================
// USUARIOS
// ============================================

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
    await setDoc(doc(db, 'users', profile.uid), profile);
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    await updateDoc(doc(db, 'users', uid), data);
}

export async function getUsers(): Promise<UserProfile[]> {
    const snap = await getDocs(
        query(collection(db, 'users'))
    );
    return snap.docs.map((d) => d.data() as UserProfile);
}

// ============================================
// CITAS (APPOINTMENTS)
// ============================================

export async function getAppointments(): Promise<Appointment[]> {
    const snap = await getDocs(
        query(collection(db, 'appointments'), orderBy('createdAt', 'desc'))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
}

export async function getAppointmentsByUser(uid: string): Promise<Appointment[]> {
    const snap = await getDocs(
        query(
            collection(db, 'appointments'),
            where('userId', '==', uid),
            orderBy('createdAt', 'desc')
        )
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
}

export async function addAppointment(
    data: Omit<Appointment, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    const docRef = await addDoc(collection(db, 'appointments'), {
        ...data,
        status: 'pending',
        createdAt: new Date().toISOString(),
    });
    return docRef.id;
}

export async function updateAppointmentStatus(
    id: string,
    status: Appointment['status'],
    alternativeSlot?: TimeSlot
): Promise<void> {
    const update: Record<string, unknown> = {
        status,
        updatedAt: new Date().toISOString(),
    };
    if (alternativeSlot) update.alternativeSlot = alternativeSlot;
    await updateDoc(doc(db, 'appointments', id), update);
}

export async function deleteAppointment(id: string): Promise<void> {
    await deleteDoc(doc(db, 'appointments', id));
}

// ============================================
// SERVICIOS
// ============================================

export async function getServices(): Promise<Service[]> {
    const snap = await getDocs(
        query(collection(db, 'services'), orderBy('order', 'asc'))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Service));
}

export async function addService(data: Omit<Service, 'id'>): Promise<void> {
    await addDoc(collection(db, 'services'), data);
}

export async function updateService(id: string, data: Partial<Service>): Promise<void> {
    await updateDoc(doc(db, 'services', id), data);
}

export async function deleteService(id: string): Promise<void> {
    await deleteDoc(doc(db, 'services', id));
}

// ============================================
// TESTIMONIOS
// ============================================

export async function getTestimonials(): Promise<Testimonial[]> {
    const snap = await getDocs(collection(db, 'testimonials'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Testimonial));
}

export async function getApprovedTestimonials(): Promise<Testimonial[]> {
    const snap = await getDocs(
        query(collection(db, 'testimonials'), where('approved', '==', true))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Testimonial));
}

export async function addTestimonial(
    data: Omit<Testimonial, 'id' | 'approved'>
): Promise<void> {
    await addDoc(collection(db, 'testimonials'), { ...data, approved: false });
}

export async function updateTestimonial(
    id: string,
    data: Partial<Testimonial>
): Promise<void> {
    await updateDoc(doc(db, 'testimonials', id), data);
}

export async function deleteTestimonial(id: string): Promise<void> {
    await deleteDoc(doc(db, 'testimonials', id));
}

export async function approveTestimonial(id: string): Promise<void> {
    await updateDoc(doc(db, 'testimonials', id), { approved: true });
}

// ============================================
// CMS / CONTENIDO DEL SITIO
// ============================================

const SITE_CONTENT_DOC = 'main';

export async function getSiteContent(): Promise<CMSContent | null> {
    const snap = await getDoc(doc(db, 'site_content', SITE_CONTENT_DOC));
    return snap.exists() ? (snap.data() as CMSContent) : null;
}

export async function updateSiteContent(data: Partial<CMSContent>): Promise<void> {
    await updateDoc(doc(db, 'site_content', SITE_CONTENT_DOC), data);
}

export async function updateSandraData(data: Partial<SandraData>): Promise<void> {
    const current = await getSiteContent();
    if (!current) return;
    await updateDoc(doc(db, 'site_content', SITE_CONTENT_DOC), {
        sandra: { ...current.sandra, ...data },
    });
}

export async function updateCentroData(data: Partial<CentroData>): Promise<void> {
    const current = await getSiteContent();
    if (!current) return;
    await updateDoc(doc(db, 'site_content', SITE_CONTENT_DOC), {
        centro: { ...current.centro, ...data },
    });
}

// ============================================
// ACTIVITY LOGS (TRAZABILIDAD)
// ============================================

export interface ActivityLog {
    action: string;
    adminEmail: string;
    details?: string;
    timestamp: string;
}

export async function addActivityLog(log: Omit<ActivityLog, 'timestamp'>): Promise<void> {
    await addDoc(collection(db, 'activity_logs'), {
        ...log,
        timestamp: new Date().toISOString(),
    });
}
