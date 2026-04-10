// ============================================
// DEAL MANAGEMENT TYPES
// ============================================

export interface PipelineStage {
  id: string;
  pipelineId: string;
  name: string;
  color: string;
  order: number;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string | null;
  orgId: string;
  isDefault: boolean;
  stages: PipelineStage[];
  _count?: { deals: number };
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  title: string;
  value?: number | null;
  currency: string;
  ownerId?: string | null;
  ownerName?: string | null;
  pipelineId: string;
  stageId: string;
  orgId: string;
  notes?: string | null;
  closedAt?: string | null;
  expectedClose?: string | null;
  stageHistory: Array<{ stageId: string; stageName: string; movedAt: string }>;
  stage?: PipelineStage;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDealInput {
  title: string;
  value?: number;
  currency?: string;
  ownerName?: string;
  pipelineId: string;
  stageId: string;
  notes?: string;
  expectedClose?: string;
}

export interface UpdateDealInput {
  title?: string;
  value?: number | null;
  currency?: string;
  ownerName?: string | null;
  stageId?: string;
  notes?: string | null;
  expectedClose?: string | null;
}
