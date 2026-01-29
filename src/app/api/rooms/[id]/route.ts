// ============================================
// BUSALA API: ROOM BY ID
// ============================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { seedDatabase } from '@/lib/db/seed-prisma';
import { updateRoomSchema } from '@/lib/validators/schemas';
import {
  jsonResponse,
  errorResponse,
  validationErrorResponse,
  requireRole,
} from '@/lib/api-utils';

// Ensure database is seeded
seedDatabase();

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/rooms/[id]
 * Get a single room by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const { id } = await params;
    const room = await prisma.room.findUnique({ where: { id } });

    if (!room) {
      return errorResponse('NOT_FOUND', 'Room not found', 404);
    }

    return jsonResponse(room);
  } catch (error) {
    console.error('GET /api/rooms/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch room', 500);
  }
}

/**
 * PATCH /api/rooms/[id]
 * Update a room
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'manager');
    if (!authorized) return authError;

    const { id } = await params;
    const existing = await prisma.room.findUnique({ where: { id } });

    if (!existing) {
      return errorResponse('NOT_FOUND', 'Room not found', 404);
    }

    if (existing.orgId !== user.orgId) {
      return errorResponse('FORBIDDEN', 'Cannot update room from another organization', 403);
    }

    const body = await request.json();
    const parsed = updateRoomSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    // Check for duplicate name if name is being updated
    if (parsed.data.name && parsed.data.name !== existing.name) {
      const duplicate = await prisma.room.findFirst({
        where: {
          name: parsed.data.name,
          orgId: user.orgId,
          id: { not: id },
        },
      });

      if (duplicate) {
        return errorResponse('DUPLICATE_NAME', 'A room with this name already exists', 409);
      }
    }

    const updated = await prisma.room.update({
      where: { id },
      data: parsed.data,
    });

    return jsonResponse(updated);
  } catch (error) {
    console.error('PATCH /api/rooms/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to update room', 500);
  }
}

/**
 * DELETE /api/rooms/[id]
 * Set room to maintenance status (soft delete)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'admin');
    if (!authorized) return authError;

    const { id } = await params;
    const existing = await prisma.room.findUnique({ where: { id } });

    if (!existing) {
      return errorResponse('NOT_FOUND', 'Room not found', 404);
    }

    if (existing.orgId !== user.orgId) {
      return errorResponse('FORBIDDEN', 'Cannot delete room from another organization', 403);
    }

    // Soft delete by setting status to maintenance
    const updated = await prisma.room.update({
      where: { id },
      data: { status: 'maintenance' },
    });

    return jsonResponse({ success: true, room: updated });
  } catch (error) {
    console.error('DELETE /api/rooms/[id] error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to archive room', 500);
  }
}
