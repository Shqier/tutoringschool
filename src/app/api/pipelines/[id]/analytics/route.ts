// ============================================
// BUSALA API: PIPELINE ANALYTICS
// ============================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { jsonResponse, errorResponse, requireRole } from '@/lib/api-utils';

type StageHistoryEntry = { stageId: string; stageName: string; movedAt: string };

/**
 * GET /api/pipelines/[id]/analytics
 * Compute pipeline analytics: totals, win rate, per-stage stats with avg time in stage.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id } = await params;

    // Validate pipeline belongs to org
    const pipeline = await prisma.pipeline.findFirst({
      where: { id, orgId: user.orgId },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
    if (!pipeline) return errorResponse('NOT_FOUND', 'Pipeline not found', 404);

    // Fetch all deals for this pipeline
    const deals = await prisma.deal.findMany({
      where: { pipelineId: id, orgId: user.orgId },
      select: {
        id: true,
        value: true,
        stageId: true,
        closedAt: true,
        stageHistory: true,
        updatedAt: true,
      },
    });

    const totalDeals = deals.length;
    const closedDeals = deals.filter((d) => d.closedAt !== null).length;
    const winRate = totalDeals > 0 ? closedDeals / totalDeals : 0;

    const dealValues = deals.filter((d) => d.value !== null).map((d) => d.value as number);
    const totalValue = dealValues.reduce((sum, v) => sum + v, 0);
    const avgDealSize = dealValues.length > 0 ? totalValue / dealValues.length : 0;

    // Build per-stage accumulators
    const stageMap = new Map<
      string,
      { dealCount: number; totalValue: number; totalDaysInStage: number; daysCount: number }
    >();
    for (const stage of pipeline.stages) {
      stageMap.set(stage.id, { dealCount: 0, totalValue: 0, totalDaysInStage: 0, daysCount: 0 });
    }

    const now = Date.now();

    for (const deal of deals) {
      // Count and value per current stage
      const acc = stageMap.get(deal.stageId);
      if (acc) {
        acc.dealCount += 1;
        if (deal.value !== null) acc.totalValue += deal.value;
      }

      // Compute time spent in each stage from stageHistory
      const history = (deal.stageHistory as StageHistoryEntry[]) ?? [];
      for (let i = 0; i < history.length; i++) {
        const entry = history[i];
        const entryStageAcc = stageMap.get(entry.stageId);
        if (!entryStageAcc) continue;

        const start = new Date(entry.movedAt).getTime();
        const end =
          i + 1 < history.length
            ? new Date(history[i + 1].movedAt).getTime()
            : now;

        const daysInStage = Math.max(0, (end - start) / (1000 * 60 * 60 * 24));
        entryStageAcc.totalDaysInStage += daysInStage;
        entryStageAcc.daysCount += 1;
      }
    }

    const byStage = pipeline.stages.map((stage) => {
      const acc = stageMap.get(stage.id) ?? { dealCount: 0, totalValue: 0, totalDaysInStage: 0, daysCount: 0 };
      return {
        stageId: stage.id,
        stageName: stage.name,
        color: stage.color,
        dealCount: acc.dealCount,
        totalValue: acc.totalValue,
        avgTimeInStage: acc.daysCount > 0 ? parseFloat((acc.totalDaysInStage / acc.daysCount).toFixed(2)) : 0,
      };
    });

    return jsonResponse({
      totalDeals,
      totalValue,
      avgDealSize: parseFloat(avgDealSize.toFixed(2)),
      winRate: parseFloat(winRate.toFixed(4)),
      byStage,
    });
  } catch (error) {
    console.error('GET /api/pipelines/[id]/analytics error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to compute pipeline analytics', 500);
  }
}
