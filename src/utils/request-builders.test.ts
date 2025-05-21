import { describe, it, expect } from 'vitest';
import { buildDeleteItemRequest } from './request-builders.js';
import type { DeleteItemRequestParams } from '../types/request-types.js';

describe('buildDeleteItemRequest', () => {
  it('should correctly construct the deleteItem request object for a given index', () => {
    const params: DeleteItemRequestParams = { index: 2 };
    const expectedRequest = {
      deleteItem: {
        location: {
          index: 2,
        },
      },
    };
    expect(buildDeleteItemRequest(params)).toEqual(expectedRequest);
  });

  it('should correctly construct the deleteItem request object for index 0', () => {
    const params: DeleteItemRequestParams = { index: 0 };
    const expectedRequest = {
      deleteItem: {
        location: {
          index: 0,
        },
      },
    };
    expect(buildDeleteItemRequest(params)).toEqual(expectedRequest);
  });

  // Since the function is simple and TypeScript handles type checking for `index`,
  // extensive testing for invalid `index` types (e.g., undefined, string) within this unit test
  // is less critical as those would be compile-time errors.
  // If the function were to include runtime validation (e.g., for negative indices if they are invalid),
  // then additional tests for those cases would be warranted.
  // Based on the current implementation, it directly uses the provided index.
});
