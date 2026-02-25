import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { jsonResponse, errorResponse, requireRole } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, errorResponse: authError } = requireRole(request, 'staff');
    if (!authorized) return authError;

    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.toLowerCase();

    if (!query || query.length < 2) {
      return jsonResponse({ results: [] });
    }

    const [teachers, students, groups, rooms, lessons] = await Promise.all([
      prisma.teacher.findMany({
        where: {
          orgId: user.orgId,
          OR: [
            { fullName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 3,
        select: { id: true, fullName: true, email: true, status: true },
      }),
      prisma.student.findMany({
        where: {
          orgId: user.orgId,
          OR: [
            { fullName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 3,
        select: { id: true, fullName: true, email: true, status: true },
      }),
      prisma.group.findMany({
        where: {
          orgId: user.orgId,
          name: { contains: query, mode: 'insensitive' },
        },
        take: 3,
        select: { id: true, name: true },
      }),
      prisma.room.findMany({
        where: {
          orgId: user.orgId,
          name: { contains: query, mode: 'insensitive' },
        },
        take: 3,
        select: { id: true, name: true, status: true },
      }),
      prisma.lesson.findMany({
        where: {
          orgId: user.orgId,
          title: { contains: query, mode: 'insensitive' },
        },
        take: 3,
        orderBy: { startAt: 'desc' },
        select: { id: true, title: true, startAt: true, status: true },
      }),
    ]);

    const results = [
      ...teachers.map(t => ({ type: 'teacher' as const, id: t.id, title: t.fullName, subtitle: t.email, href: `/teachers/${t.id}` })),
      ...students.map(s => ({ type: 'student' as const, id: s.id, title: s.fullName, subtitle: s.email, href: `/students/${s.id}` })),
      ...groups.map(g => ({ type: 'group' as const, id: g.id, title: g.name, subtitle: 'Group', href: `/groups/${g.id}` })),
      ...rooms.map(r => ({ type: 'room' as const, id: r.id, title: r.name, subtitle: `Room - ${r.status}`, href: `/rooms/${r.id}` })),
      ...lessons.map(l => ({ type: 'lesson' as const, id: l.id, title: l.title, subtitle: new Date(l.startAt).toLocaleDateString(), href: `/lessons/${l.id}` })),
    ];

    return jsonResponse({ results });
  } catch (error) {
    console.error('GET /api/search error:', error);
    return errorResponse('INTERNAL_ERROR', 'Search failed', 500);
  }
}
