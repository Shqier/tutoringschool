// ============================================
// CONTACTS TYPES
// ============================================

export interface Contact {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  title?: string | null;
  notes?: string | null;
  orgId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { activities: number };
}

export interface ContactWithActivities extends Contact {
  activities: ContactActivity[];
}

export interface ContactActivity {
  id: string;
  type: 'note' | 'call' | 'email' | 'meeting';
  title: string;
  notes?: string | null;
  contactId?: string | null;
  dealId?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  createdById?: string | null;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactInput {
  fullName: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  notes?: string;
}

export interface UpdateContactInput {
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  title?: string | null;
  notes?: string | null;
}

export interface ContactsResponse {
  data: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}
