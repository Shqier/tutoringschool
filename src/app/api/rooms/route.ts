// ============================================
// BUSALA API: ROOMS LIST & CREATE
// ============================================

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { seedDatabase } from '@/lib/db/seed-prisma';
import { createRoomSchema } from '@/lib/validators/schemas';
import {
  jsonResponse,
  errorResponse,
  validationErrorResponse,
  paginatedResponse,
  getPaginationFromUrl,
  requireRole,
} from '@/lib/api-utils';

// Ensure database is seeded
seedDatabase();

/**
 * GET /api/rooms
 * List all rooms with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const url = new URL(request.url);
    const { page, limit } = getPaginationFromUrl(url);

    // Filtering
    const statusFilter = url.searchParams.get('status');
    const floorFilter = url.searchParams.get('floor');
    const searchQuery = url.searchParams.get('search')?.toLowerCase();

    // Build where clause
    const where: Record<string, unknown> = { orgId: user.orgId };

    if (statusFilter && statusFilter !== 'all') {
      where.status = statusFilter;
    }

    if (floorFilter) {
      where.floor = floorFilter;
    }

    if (searchQuery) {
      where.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { equipment: { hasSome: [searchQuery] } },
      ];
    }

    // Get total count
    const total = await prisma.room.count({ where });

    // Get paginated rooms
    const rooms = await prisma.room.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return jsonResponse(paginatedResponse(rooms, page, limit, total));
  } catch (error) {
    console.error('GET /api/rooms error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch rooms', 500);
  }
}

/**
 * POST /api/rooms
 * Create a new room
 */
export async function POST(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'manager');
    if (!authorized) return authError;

    const body = await request.json();
    const parsed = createRoomSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { name, capacity, status, floor, equipment } = parsed.data;

    // Check for duplicate name
    const existing = await prisma.room.findFirst({
      where: { name, orgId: user.orgId },
    });

    if (existing) {
      return errorResponse('DUPLICATE_NAME', 'A room with this name already exists', 409);
    }

    const room = await prisma.room.create({
      data: {
        name,
        capacity,
        status,
        floor,
        equipment,
        orgId: user.orgId,
      },
    });

    return jsonResponse(room, 201);
  } catch (error) {
    console.error('POST /api/rooms error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to create room', 500);
  }
}
