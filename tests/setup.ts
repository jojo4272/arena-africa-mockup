import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach, vi } from 'vitest';

// Mock environment variables for tests
beforeAll(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/arena_test';
  process.env.AUTH_SECRET = 'test-secret-key-32-chars-long!!!';
  process.env.NODE_ENV = 'test';

  // Mock database connection for unit tests
  vi.mock('@/db', () => ({
    db: {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
    },
  }));
});

afterEach(() => {
  // Clear any mocks between tests
});

afterAll(() => {
  // Cleanup after all tests
});
