// ============================================
// TEST SETUP AND UTILITIES
// ============================================

// Load environment variables before anything else
import 'dotenv/config';

import { beforeEach } from 'vitest';
import { cleanDatabase } from './db-helpers';

// Reset database before each test
beforeEach(async () => {
  await cleanDatabase();
});
