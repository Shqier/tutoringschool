import { removeAuthCookie } from '@/lib/auth';
import { jsonResponse } from '@/lib/api-utils';

export async function POST() {
  await removeAuthCookie();
  return jsonResponse({ success: true });
}
