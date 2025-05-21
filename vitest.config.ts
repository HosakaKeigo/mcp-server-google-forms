import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // Optional: to use Vitest globals like describe, it, expect without importing
    environment: 'node', // Since this is a Node.js server project
  },
});
