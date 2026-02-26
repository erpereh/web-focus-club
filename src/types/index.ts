// ============================================
// TIPOS COMPARTIDOS — Focus Club Vallecas
// ============================================

export interface UserProfile {
    uid: string;
    email: string;
    name: string;
    phone: string;
    role: 'admin' | 'user';
    createdAt: string;
}

export interface Service {
    id: string;
    title: string;
    description: string;
    duration: string;
    price?: string;
    image?: string;
    features?: string[];
    order?: number;
}

export interface TimeSlot {
    date: string;
    time: string;
}

export interface Appointment {
    id: string;
    userId: string;
    name: string;
    email: string;
    phone: string;
    serviceType: string;
    duration: '30' | '60' | '90';
    preferredSlots: TimeSlot[];
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'alternative';
    alternativeSlot?: TimeSlot;
    createdAt: string;
    updatedAt?: string;
}

export interface Testimonial {
    id: string;
    name: string;
    role: string;
    content: string;
    rating: number;
    image?: string;
    approved: boolean;
}

export interface SandraData {
    name: string;
    title: string;
    subtitle: string;
    bio: string;
    experience: string;
    achievements: string[];
    certifications: string[];
    timeline: {
        year: string;
        title: string;
        description: string;
    }[];
    image: string;
}

export interface CentroData {
    title: string;
    subtitle: string;
    description: string;
    features: {
        icon: string;
        title: string;
        description: string;
    }[];
    gallery: string[];
    schedule: {
        weekdays: string;
        saturday: string;
    };
}

export interface CMSContent {
    heroTitle: string;
    heroSubtitle: string;
    heroCTA: string;
    heroImage: string;

    aboutTitle: string;
    aboutText: string;
    aboutImage: string;

    sandra: SandraData;
    centro: CentroData;

    servicesTitle: string;
    servicesSubtitle: string;

    testimonialsTitle: string;

    ctaTitle: string;
    ctaSubtitle: string;

    footerText: string;
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    socialInstagram: string;
    socialFacebook: string;
    socialTwitter: string;
}
