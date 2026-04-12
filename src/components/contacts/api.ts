// ============================================
// CONTACTS API CLIENT
// ============================================

import type {
  Contact,
  ContactWithActivities,
  ContactsResponse,
  CreateContactInput,
  UpdateContactInput,
} from './types';

const API_BASE = '/api';

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'x-user-role': 'admin',
  'x-user-id': 'user_001',
  'x-org-id': 'org_busala_default',
};

async function request<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...init,
    headers: { ...DEFAULT_HEADERS, ...(init?.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Request failed');
  return data;
}

export async function getContacts(params?: {
  q?: string;
  company?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}): Promise<ContactsResponse> {
  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.company) search.set('company', params.company);
  if (params?.sortBy) search.set('sortBy', params.sortBy);
  if (params?.sortOrder) search.set('sortOrder', params.sortOrder);
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return request<ContactsResponse>(`/contacts${qs ? `?${qs}` : ''}`);
}

export async function getContact(id: string): Promise<ContactWithActivities> {
  return request<ContactWithActivities>(`/contacts/${id}`);
}

export async function createContact(input: CreateContactInput): Promise<Contact> {
  return request<Contact>('/contacts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateContact(id: string, input: UpdateContactInput): Promise<Contact> {
  return request<Contact>(`/contacts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteContact(id: string): Promise<void> {
  await request(`/contacts/${id}`, { method: 'DELETE' });
}
