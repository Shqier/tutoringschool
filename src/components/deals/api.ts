// ============================================
// DEAL MANAGEMENT API CLIENT
// ============================================

import type { Pipeline, Deal, CreateDealInput, UpdateDealInput } from './types';

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

// ---- Pipelines ----

export async function getPipelines(): Promise<{ data: Pipeline[] }> {
  return request<{ data: Pipeline[] }>('/pipelines');
}

export async function createPipeline(body: {
  name: string;
  description?: string;
  isDefault?: boolean;
  stages?: Array<{ name: string; color?: string; order: number }>;
}): Promise<Pipeline> {
  return request<Pipeline>('/pipelines', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updatePipelineStages(
  pipelineId: string,
  stages: Array<{ id?: string; name: string; color?: string; order: number }>
): Promise<{ data: Pipeline['stages'] }> {
  return request(`/pipelines/${pipelineId}/stages`, {
    method: 'PUT',
    body: JSON.stringify(stages),
  });
}

// ---- Deals ----

export async function getDeals(pipelineId: string): Promise<{ data: Deal[]; pagination: unknown }> {
  return request<{ data: Deal[]; pagination: unknown }>(`/deals?pipelineId=${pipelineId}&limit=200`);
}

export async function createDeal(input: CreateDealInput): Promise<Deal> {
  return request<Deal>('/deals', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateDeal(id: string, input: UpdateDealInput): Promise<Deal> {
  return request<Deal>(`/deals/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export async function deleteDeal(id: string): Promise<void> {
  await request(`/deals/${id}`, { method: 'DELETE' });
}
